import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import bcrypt from "bcryptjs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import * as db from "../db";

// __dirname is available natively in CJS format (esbuild --format=cjs)

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function seedAdminUser() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@jlversage.be";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "JLVersage2026!";
  try {
    const existing = await db.getUserByEmail(ADMIN_EMAIL);
    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const openId = `local:admin_${Date.now()}`;
      await db.createLocalUser({
        openId,
        name: "Administrateur JL Versage",
        email: ADMIN_EMAIL,
        passwordHash,
        appRole: "gestionnaire",
        role: "admin",
        mustChangePassword: false,
      });
      console.log(`[Admin] Compte administrateur créé : ${ADMIN_EMAIL}`);
      console.log(`[Admin] Mot de passe par défaut : ${ADMIN_PASSWORD}`);
      console.log(`[Admin] IMPORTANT : Changez ce mot de passe après la première connexion !`);
    }
  } catch (err) {
    console.error("[Admin] Erreur lors de la création du compte admin:", err);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Serve Expo web static files in production
  const webDistPath = path.resolve(__dirname, "..", "web-dist");
  const fs = await import("fs");
  if (fs.existsSync(webDistPath)) {
    console.log(`[web] Serving static files from ${webDistPath}`);
    app.use(express.static(webDistPath));
    // SPA fallback: serve index.html for all non-API routes
    app.get("*", (_req, res) => {
      const indexPath = path.join(webDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Not found");
      }
    });
  } else {
    console.log("[web] No web-dist folder found, serving API only");
    app.get("/", (_req, res) => {
      res.json({ status: "API only", message: "JL Versage Backend API is running. Web app not deployed." });
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`[api] server listening on port ${port}`);
    // Créer le compte admin par défaut si nécessaire
    await seedAdminUser();
  });
}

startServer().catch(console.error);
