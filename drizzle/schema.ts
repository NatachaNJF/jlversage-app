import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const appRoleEnum = pgEnum("appRole", ["gestionnaire", "prepose"]);
export const statutChantierEnum = pgEnum("statut_chantier", [
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
]);
export const incidentTypeEnum = pgEnum("incident_type", [
  "camion_refuse",
  "suspicion_post_deversement",
  "autre",
]);
export const incidentStatutEnum = pgEnum("incident_statut", ["ouvert", "en_cours", "resolu"]);
export const demandePrixStatutEnum = pgEnum("demande_prix_statut", [
  "nouvelle",
  "en_cours",
  "repondue",
  "refusee",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // "user" = compte créé, "admin" = propriétaire du projet
  role: roleEnum("role").default("user").notNull(),
  // Rôle métier attribué par l'admin : gestionnaire ou préposé
  appRole: appRoleEnum("appRole").default("gestionnaire"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Auth locale (email + mot de passe)
  passwordHash: varchar("passwordHash", { length: 255 }),
  mustChangePassword: boolean("mustChangePassword").default(false),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Chantiers ────────────────────────────────────────────────────────────────
export const chantiers = pgTable("chantiers", {
  id: serial("id").primaryKey(),
  statut: statutChantierEnum("statut").default("demande").notNull(),

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
  volumeEstime: doublePrecision("volumeEstime").notNull(),
  classe: integer("classe").notNull(), // 1-5
  siteVersage: varchar("siteVersage", { length: 255 }), // site de versage (ex: Transinne)
  periodeDebut: varchar("periodeDebut", { length: 10 }).notNull(), // YYYY-MM-DD
  periodeFin: varchar("periodeFin", { length: 10 }).notNull(),

  // Offre de prix
  prixTonne: numeric("prixTonne", { precision: 10, scale: 2 }),
  conditionsAcceptation: text("conditionsAcceptation"),
  confirmationClient: boolean("confirmationClient").default(false),
  dateConfirmation: varchar("dateConfirmation", { length: 10 }),

  // Documents Walterre
  referenceWalterre: varchar("referenceWalterre", { length: 100 }),
  certificatQualite: boolean("certificatQualite").default(false),
  rapportAnalyse: boolean("rapportAnalyse").default(false),
  bonCommandeSigne: boolean("bonCommandeSigne").default(false),
  volumeDeclare: doublePrecision("volumeDeclare"),
  regimeApplicable: varchar("regimeApplicable", { length: 100 }),
  transporteurs: text("transporteurs"), // JSON array stringifié
  planningVersages: text("planningVersages"), // JSON array [{date, tonnagePrev, notes}]

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
  tonnageAccepte: doublePrecision("tonnageAccepte").default(0).notNull(),
  tonnageRefuse: doublePrecision("tonnageRefuse").default(0).notNull(),

  // Méta
  notes: text("notes"),
  createdByUserId: integer("createdByUserId"),
  dateCreation: timestamp("dateCreation").defaultNow().notNull(),
  dateMaj: timestamp("dateMaj").defaultNow().notNull(),
});

export type Chantier = typeof chantiers.$inferSelect;
export type InsertChantier = typeof chantiers.$inferInsert;

// ─── Passages camion ──────────────────────────────────────────────────────────
export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  chantierId: integer("chantierId").notNull(),
  chantierNom: varchar("chantierNom", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  heure: varchar("heure", { length: 5 }).notNull(), // HH:MM
  plaque: varchar("plaque", { length: 20 }).notNull(),
  transporteur: varchar("transporteur", { length: 255 }).notNull(),
  referenceChantier: varchar("referenceChantier", { length: 100 }).notNull(),
  tonnage: doublePrecision("tonnage").notNull(),
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
  operateurId: integer("operateurId"),
  operateurNom: varchar("operateurNom", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Passage = typeof passages.$inferSelect;
export type InsertPassage = typeof passages.$inferInsert;

// ─── Incidents ────────────────────────────────────────────────────────────────
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  type: incidentTypeEnum("type").notNull(),
  statut: incidentStatutEnum("statut").default("ouvert").notNull(),
  chantierId: integer("chantierId").notNull(),
  chantierNom: varchar("chantierNom", { length: 255 }).notNull(),
  passageId: integer("passageId"),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description").notNull(),
  photoUrl: text("photoUrl"),
  zoneIsolee: boolean("zoneIsolee").default(false),
  clientInforme: boolean("clientInforme").default(false),
  // Résolution
  dateResolution: varchar("dateResolution", { length: 10 }),
  resoluParUserId: integer("resoluParUserId"),
  resoluParNom: varchar("resoluParNom", { length: 255 }),
  notesResolution: text("notesResolution"),
  // Historique actions (JSON)
  historiqueActions: text("historiqueActions"),
  notes: text("notes"),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// ─── Demandes de prix (formulaire site web) ───────────────────────────────────
export const demandesPrix = pgTable("demandesPrix", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telephone: varchar("telephone", { length: 50 }).notNull(),
  typeChantier: varchar("typeChantier", { length: 100 }).notNull(),
  classesTerres: varchar("classesTerres", { length: 100 }).notNull(),
  volumeEstime: integer("volumeEstime").notNull(),
  localisation: varchar("localisation", { length: 255 }),
  dateDebut: varchar("dateDebut", { length: 20 }),
  message: text("message"),
  statut: demandePrixStatutEnum("statut").default("nouvelle").notNull(),
  reponse: text("reponse"),
  reponduParNom: varchar("reponduParNom", { length: 255 }),
  reponduAt: timestamp("reponduAt"),
  source: varchar("source", { length: 100 }).default("site-jlversage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DemandePrix = typeof demandesPrix.$inferSelect;
export type InsertDemandePrix = typeof demandesPrix.$inferInsert;

// ─── Transporteurs ────────────────────────────────────────────────────────────
export const transporteurs = pgTable("transporteurs", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  telephone: varchar("telephone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  actif: boolean("actif").default(true).notNull(),
  mailConditionsEnvoye: boolean("mailConditionsEnvoye").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transporteur = typeof transporteurs.$inferSelect;
export type InsertTransporteur = typeof transporteurs.$inferInsert;

// ─── Fermetures / Congés ────────────────────────────────────────────
export const fermetures = pgTable("fermetures", {
  id: serial("id").primaryKey(),
  dateDebut: varchar("dateDebut", { length: 10 }).notNull(), // YYYY-MM-DD
  dateFin: varchar("dateFin", { length: 10 }).notNull(),     // YYYY-MM-DD (= dateDebut si 1 jour)
  motif: varchar("motif", { length: 255 }).notNull(),        // ex: "Congés d'été", "Jour férié", "Maintenance"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Fermeture = typeof fermetures.$inferSelect;
export type InsertFermeture = typeof fermetures.$inferInsert;
