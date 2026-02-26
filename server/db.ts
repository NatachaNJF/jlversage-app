import { and, desc, eq, gte, lte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chantiers,
  incidents,
  InsertChantier,
  InsertIncident,
  InsertPassage,
  InsertUser,
  passages,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { emailNouvelUtilisateur, sendEmail } from "./email";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  // Vérifier si l'utilisateur existe déjà
  const existing = await getUserByOpenId(user.openId);

  // Si l'utilisateur existe déjà et est admin, NE JAMAIS écraser son rôle
  const isExistingAdmin = existing?.role === "admin";

  // Si aucun utilisateur n'existe encore dans la base, ce premier utilisateur devient admin
  const isFirstUser = !existing && (await countUsers()) === 0;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  // Attribution du rôle système :
  // - Si l'utilisateur est déjà admin → ne pas toucher au rôle
  // - Si c'est le premier utilisateur → admin automatiquement
  // - Sinon → rôle "user" par défaut
  if (!isExistingAdmin) {
    if (isFirstUser || user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      // Ne pas mettre dans updateSet pour ne pas écraser si déjà admin
    } else if (!existing) {
      values.role = "user";
    }
    // Si l'utilisateur existe et n'est pas admin, ne pas changer son rôle système
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

  // Notifier l'admin par email si c'est un nouvel utilisateur (pas le premier = admin)
  if (!existing && !isFirstUser) {
    try {
      const adminUsers = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
      const admin = adminUsers[0];
      if (admin?.email) {
        const emailOpts = emailNouvelUtilisateur(admin.email, user.name ?? null, user.email ?? null);
        await sendEmail(emailOpts);
        console.log(`[DB] Email de notification envoyé à l'admin (${admin.email}) pour le nouvel utilisateur`);
      }
    } catch (err) {
      console.warn("[DB] Impossible d'envoyer l'email de notification admin:", err);
    }
  }
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count(users.id) }).from(users);
  return result[0]?.count ?? 0;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserAppRole(userId: number, appRole: "gestionnaire" | "prepose") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ appRole }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

// ─── Chantiers ────────────────────────────────────────────────────────────────

export async function getAllChantiers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chantiers).orderBy(desc(chantiers.dateMaj));
}

export async function getChantierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chantiers).where(eq(chantiers.id, id)).limit(1);
  return result[0];
}

export async function createChantier(data: InsertChantier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chantiers).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateChantier(id: number, data: Partial<InsertChantier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chantiers).set(data).where(eq(chantiers.id, id));
}

// ─── Passages ─────────────────────────────────────────────────────────────────

export async function getAllPassages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).orderBy(desc(passages.createdAt));
}

export async function getPassagesByChantier(chantierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).where(eq(passages.chantierId, chantierId)).orderBy(desc(passages.createdAt));
}

export async function getPassagesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).where(eq(passages.date, date)).orderBy(desc(passages.createdAt));
}

export async function getPassagesByPeriod(dateDebut: string, dateFin: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).where(and(gte(passages.date, dateDebut), lte(passages.date, dateFin))).orderBy(desc(passages.date));
}

export async function createPassage(data: InsertPassage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(passages).values(data);
  const id = (result[0] as any).insertId as number;
  // Mettre à jour les tonnages du chantier
  const chantier = await getChantierById(data.chantierId);
  if (chantier) {
    const updates: Partial<InsertChantier> = {};
    if (data.accepte) {
      const newTonnage = (Number(chantier.tonnageAccepte) || 0) + data.tonnage;
      updates.tonnageAccepte = newTonnage;
      const volumeRef = Number(chantier.volumeDeclare) || Number(chantier.volumeEstime);
      if (newTonnage >= volumeRef) {
        updates.statut = "volume_atteint";
      } else if (chantier.statut === "autorise") {
        updates.statut = "en_cours";
      }
    } else {
      updates.tonnageRefuse = (Number(chantier.tonnageRefuse) || 0) + data.tonnage;
    }
    await updateChantier(data.chantierId, updates);
  }
  return id;
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export async function getAllIncidents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incidents).orderBy(desc(incidents.createdAt));
}

export async function getIncidentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  return result[0];
}

export async function createIncident(data: InsertIncident) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(incidents).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateIncident(id: number, data: Partial<InsertIncident>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(incidents).set(data).where(eq(incidents.id, id));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStatsJour(date: string) {
  const db = await getDb();
  if (!db) return { totalCamions: 0, acceptes: 0, refuses: 0, tonnageAccepte: 0 };
  const rows = await db.select().from(passages).where(eq(passages.date, date));
  return {
    totalCamions: rows.length,
    acceptes: rows.filter((r) => r.accepte).length,
    refuses: rows.filter((r) => !r.accepte).length,
    tonnageAccepte: rows.filter((r) => r.accepte).reduce((s, r) => s + r.tonnage, 0),
  };
}

export async function getFacturationChantier(chantierId: number, dateDebut: string, dateFin: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).where(
    and(eq(passages.chantierId, chantierId), eq(passages.accepte, true), gte(passages.date, dateDebut), lte(passages.date, dateFin))
  ).orderBy(passages.date);
}
