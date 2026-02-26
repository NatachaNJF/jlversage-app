import {
  boolean,
  decimal,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // "user" = compte créé, "admin" = propriétaire du projet
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Rôle métier attribué par l'admin : gestionnaire ou préposé
  appRole: mysqlEnum("appRole", ["gestionnaire", "prepose"]).default("gestionnaire"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Chantiers ────────────────────────────────────────────────────────────────
export const chantiers = mysqlTable("chantiers", {
  id: int("id").autoincrement().primaryKey(),
  statut: mysqlEnum("statut", [
    "demande",
    "analyse",
    "offre_envoyee",
    "documents_demandes",
    "validation_admin",
    "autorise",
    "en_cours",
    "volume_atteint",
    "cloture",
    "refuse",
  ])
    .default("demande")
    .notNull(),

  // Société cliente
  societeNom: varchar("societeNom", { length: 255 }).notNull(),
  societeAdresse: text("societeAdresse").notNull(),
  societeTva: varchar("societeTva", { length: 30 }).notNull(),
  societeMail: varchar("societeMail", { length: 320 }).notNull(),
  societeContact: varchar("societeContact", { length: 255 }).notNull(),
  societeTelephone: varchar("societeTelephone", { length: 30 }).notNull(),

  // Chantier
  localisationChantier: text("localisationChantier").notNull(),
  contactChantier: varchar("contactChantier", { length: 255 }).notNull(),
  telephoneChantier: varchar("telephoneChantier", { length: 30 }).notNull(),
  volumeEstime: float("volumeEstime").notNull(),
  classe: int("classe").notNull(), // 1-5
  periodeDebut: varchar("periodeDebut", { length: 10 }).notNull(), // YYYY-MM-DD
  periodeFin: varchar("periodeFin", { length: 10 }).notNull(),

  // Offre de prix
  prixTonne: decimal("prixTonne", { precision: 10, scale: 2 }),
  conditionsAcceptation: text("conditionsAcceptation"),
  confirmationClient: boolean("confirmationClient").default(false),
  dateConfirmation: varchar("dateConfirmation", { length: 10 }),

  // Documents Walterre
  referenceWalterre: varchar("referenceWalterre", { length: 100 }),
  certificatQualite: boolean("certificatQualite").default(false),
  rapportAnalyse: boolean("rapportAnalyse").default(false),
  volumeDeclare: float("volumeDeclare"),
  regimeApplicable: varchar("regimeApplicable", { length: 100 }),
  transporteurs: text("transporteurs"), // JSON array stringifié

  // Validation admin
  validationClasse: boolean("validationClasse").default(false),
  validationCertificat: boolean("validationCertificat").default(false),
  validationRapport: boolean("validationRapport").default(false),
  validationRegime: boolean("validationRegime").default(false),
  validationVolume: boolean("validationVolume").default(false),
  dateAutorisation: varchar("dateAutorisation", { length: 10 }),

  // Refus
  motifRefusAdmin: text("motifRefusAdmin"),
  dateRefus: varchar("dateRefus", { length: 10 }),

  // Suivi tonnages
  tonnageAccepte: float("tonnageAccepte").default(0).notNull(),
  tonnageRefuse: float("tonnageRefuse").default(0).notNull(),

  // Méta
  notes: text("notes"),
  createdByUserId: int("createdByUserId"),
  dateCreation: timestamp("dateCreation").defaultNow().notNull(),
  dateMaj: timestamp("dateMaj").defaultNow().onUpdateNow().notNull(),
});

export type Chantier = typeof chantiers.$inferSelect;
export type InsertChantier = typeof chantiers.$inferInsert;

// ─── Passages camion ──────────────────────────────────────────────────────────
export const passages = mysqlTable("passages", {
  id: int("id").autoincrement().primaryKey(),
  chantierId: int("chantierId").notNull(),
  chantierNom: varchar("chantierNom", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  heure: varchar("heure", { length: 5 }).notNull(), // HH:MM
  plaque: varchar("plaque", { length: 20 }).notNull(),
  transporteur: varchar("transporteur", { length: 255 }).notNull(),
  referenceChantier: varchar("referenceChantier", { length: 100 }).notNull(),
  tonnage: float("tonnage").notNull(),
  accepte: boolean("accepte").notNull(),
  motifRefus: varchar("motifRefus", { length: 50 }),
  motifRefusDetail: text("motifRefusDetail"),
  photoUrl: text("photoUrl"),
  // Contrôle admin
  bonWalterreOk: boolean("bonWalterreOk"),
  referenceOk: boolean("referenceOk"),
  plaqueOk: boolean("plaqueOk"),
  correspondanceOk: boolean("correspondanceOk"),
  // Contrôle visuel
  controleVisuelOk: boolean("controleVisuelOk"),
  anomalies: text("anomalies"), // JSON array
  // Opérateur
  operateurId: int("operateurId"),
  operateurNom: varchar("operateurNom", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Passage = typeof passages.$inferSelect;
export type InsertPassage = typeof passages.$inferInsert;

// ─── Incidents ────────────────────────────────────────────────────────────────
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["camion_refuse", "suspicion_post_deversement", "autre"]).notNull(),
  statut: mysqlEnum("statut", ["ouvert", "en_cours", "resolu"]).default("ouvert").notNull(),
  chantierId: int("chantierId").notNull(),
  chantierNom: varchar("chantierNom", { length: 255 }).notNull(),
  passageId: int("passageId"),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description").notNull(),
  photoUrl: text("photoUrl"),
  zoneIsolee: boolean("zoneIsolee").default(false),
  clientInforme: boolean("clientInforme").default(false),
  // Résolution
  dateResolution: varchar("dateResolution", { length: 10 }),
  resoluParUserId: int("resoluParUserId"),
  resoluParNom: varchar("resoluParNom", { length: 255 }),
  notesResolution: text("notesResolution"),
  // Historique actions (JSON)
  historiqueActions: text("historiqueActions"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
