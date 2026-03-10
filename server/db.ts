import { and, desc, eq, gte, lte, count } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  chantiers,
  incidents,
  InsertChantier,
  InsertIncident,
  InsertPassage,
  InsertTransporteur,
  InsertUser,
  Passage,
  passages,
  transporteurs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { emailNouvelUtilisateur, sendEmail } from "./email";

let _db: any | null = null;
let _isMysql = false;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = process.env.DATABASE_URL;
      if (url.startsWith("mysql://") || url.startsWith("mysql2://")) {
        _isMysql = true;
        const conn = await mysql.createConnection(url.replace(/^mysql2?:\/\//, "mysql://"));
        _db = drizzleMysql(conn);
      } else {
        _isMysql = false;
        _db = drizzlePg(url);
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function insertAndGetId(table: any, data: any): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (_isMysql) {
    const result: any = await db.insert(table).values(data);
    return result[0].insertId;
  } else {
    const result = await db.insert(table).values(data).returning({ id: (table as any).id });
    return result[0].id;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const existing = await getUserByOpenId(user.openId);
  const isExistingAdmin = existing?.role === "admin";
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

  if (!isExistingAdmin) {
    if (isFirstUser || user.openId === ENV.ownerOpenId) {
      values.role = "admin";
    } else if (!existing) {
      values.role = "user";
    }
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  if (existing) {
    await db.update(users).set(updateSet as Partial<InsertUser>).where(eq(users.openId, user.openId));
  } else {
    await db.insert(users).values(values);
  }

  if (!existing && !isFirstUser) {
    try {
      const adminUsers = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
      const admin = adminUsers[0];
      if (admin?.email) {
        const emailOpts = emailNouvelUtilisateur(admin.email, user.name ?? null, user.email ?? null);
        await sendEmail(emailOpts);
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

export async function updateUserPassword(userId: number, passwordHash: string, mustChangePassword = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, mustChangePassword }).where(eq(users.id, userId));
}

export async function createLocalUser(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  appRole: "gestionnaire" | "prepose";
  role?: "user" | "admin";
  mustChangePassword?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(users, {
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    appRole: data.appRole,
    role: data.role ?? "user",
    mustChangePassword: data.mustChangePassword ?? true,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });
}

export async function updateUser(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
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
  return insertAndGetId(chantiers, data);
}

export async function updateChantier(id: number, data: Partial<InsertChantier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chantiers).set(data).where(eq(chantiers.id, id));
}

export async function deleteChantier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Supprimer d'abord les passages et incidents liés
  await db.delete(passages).where(eq(passages.chantierId, id));
  await db.delete(incidents).where(eq(incidents.chantierId, id));
  await db.delete(chantiers).where(eq(chantiers.id, id));
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
  const id = await insertAndGetId(passages, data);
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
  return insertAndGetId(incidents, data);
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
    acceptes: rows.filter((r: Passage) => r.accepte).length,
    refuses: rows.filter((r: Passage) => !r.accepte).length,
    tonnageAccepte: rows.filter((r: Passage) => r.accepte).reduce((s: number, r: Passage) => s + r.tonnage, 0),
  };
}

export async function getFacturationChantier(chantierId: number, dateDebut: string, dateFin: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passages).where(
    and(eq(passages.chantierId, chantierId), eq(passages.accepte, true), gte(passages.date, dateDebut), lte(passages.date, dateFin))
  ).orderBy(passages.date);
}

// ─── Transporteurs ────────────────────────────────────────────────────────────

export async function getAllTransporteurs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transporteurs).where(eq(transporteurs.actif, true)).orderBy(transporteurs.nom);
}

export async function createTransporteur(data: InsertTransporteur) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return insertAndGetId(transporteurs, data);
}

export async function updateTransporteur(id: number, data: Partial<InsertTransporteur>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transporteurs).set({ ...data, updatedAt: new Date() }).where(eq(transporteurs.id, id));
}

export async function deleteTransporteur(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete : marquer comme inactif
  await db.update(transporteurs).set({ actif: false, updatedAt: new Date() }).where(eq(transporteurs.id, id));
}
