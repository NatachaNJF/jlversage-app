import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import {
  emailAutorisation,
  emailNouvelUtilisateurCreation,
  emailOffrePrix,
  emailRefusClasse,
  emailRefusValidation,
  emailVolumeAtteint,
  sendEmail,
} from "./email";

const phoneBeRegex = /^(\+32|0)[1-9][0-9]{7,8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const societeSchema = z.object({
  societeNom: z.string().min(1, "Nom société requis"),
  societeAdresse: z.string().min(1, "Adresse requise"),
  societeTva: z.string().min(1, "TVA requise"),
  societeMail: z.string().regex(emailRegex, "Email invalide"),
  societeContact: z.string().min(1, "Contact requis"),
  societeTelephone: z.string().regex(phoneBeRegex, "Téléphone belge invalide"),
});

const chantierBaseSchema = societeSchema.extend({
  localisationChantier: z.string().min(1, "Localisation requise"),
  contactChantier: z.string().min(1, "Contact chantier requis"),
  telephoneChantier: z.string().regex(phoneBeRegex, "Téléphone belge invalide"),
  volumeEstime: z.number().positive("Volume doit être positif"),
  classe: z.number().int().min(1).max(5),
  periodeDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide"),
  periodeFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide"),
  notes: z.string().optional(),
});

const gestionnaireOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.appRole !== "gestionnaire" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        // Chercher l'utilisateur par email
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
        }
        // Vérifier le mot de passe
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
        }
        // Créer la session JWT
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        // Retourner le token dans la réponse pour les clients natifs (mobile)
        return {
          success: true,
          mustChangePassword: user.mustChangePassword ?? false,
          token: sessionToken,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
            loginMethod: user.loginMethod,
            role: user.role,
            appRole: user.appRole,
            lastSignedIn: user.lastSignedIn,
          },
        };
      }),
    changePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Minimum 8 caractères") }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Compte sans mot de passe" });
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel incorrect" });
        const hash = await bcrypt.hash(input.newPassword, 12);
        await db.updateUserPassword(ctx.user.id, hash, false);
        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      const isGestionnaire = ctx.user.appRole === "gestionnaire";
      if (!isAdmin && !isGestionnaire) throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
      return db.getAllUsers();
    }),
    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), appRole: z.enum(["gestionnaire", "prepose"]) }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "admin";
        const isGestionnaire = ctx.user.appRole === "gestionnaire";
        if (!isAdmin && !isGestionnaire) throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
        await db.updateUserAppRole(input.userId, input.appRole);
        return { success: true };
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nom requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Minimum 8 caractères"),
        appRole: z.enum(["gestionnaire", "prepose"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "admin";
        const isGestionnaire = ctx.user.appRole === "gestionnaire";
        if (!isAdmin && !isGestionnaire) throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
        // Vérifier si l'email existe déjà
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Un utilisateur avec cet email existe déjà" });
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(input.password, 12);
        // Créer l'utilisateur avec un openId local
        const openId = `local:${input.email.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
        await db.createLocalUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          appRole: input.appRole,
          role: "user",
          mustChangePassword: true,
        });
        // Envoyer un email de bienvenue
        try {
          const emailOpts = emailNouvelUtilisateurCreation(input.email, input.name, input.appRole);
          await sendEmail(emailOpts);
        } catch (err) {
          console.warn("[Users] Email de bienvenue non envoyé:", err);
        }
        return { success: true };
      }),
    resetPassword: protectedProcedure
      .input(z.object({ userId: z.number(), newPassword: z.string().min(8, "Minimum 8 caractères") }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "admin";
        const isGestionnaire = ctx.user.appRole === "gestionnaire";
        if (!isAdmin && !isGestionnaire) throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
        const hash = await bcrypt.hash(input.newPassword, 12);
        await db.updateUserPassword(input.userId, hash, true);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "admin";
        const isGestionnaire = ctx.user.appRole === "gestionnaire";
        if (!isAdmin && !isGestionnaire) throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux gestionnaires" });
        // Si l'utilisateur supprime son propre compte admin, vérifier qu'il n'est pas le seul admin
        if (input.userId === ctx.user.id && isAdmin) {
          const allUsers = await db.getAllUsers();
          const adminCount = allUsers.filter((u: any) => u.role === 'admin').length;
          if (adminCount <= 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de supprimer le seul compte administrateur" });
        }
        await db.deleteUser(input.userId);
        return { success: true };
      }),
  }),

  chantiers: router({
    list: protectedProcedure.query(() => db.getAllChantiers()),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const c = await db.getChantierById(input.id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        return c;
      }),
    create: gestionnaireOnly
      .input(chantierBaseSchema)
      .mutation(async ({ ctx, input }) => {
        if (input.classe > 2) {
          const id = await db.createChantier({ ...input, statut: "refuse", createdByUserId: ctx.user.id });
          await sendEmail(emailRefusClasse(input.societeNom, input.societeMail, input.classe));
          return { id, refused: true, reason: "classe_incompatible" };
        }
        const id = await db.createChantier({ ...input, statut: "demande", createdByUserId: ctx.user.id });
        return { id, refused: false };
      }),
    update: gestionnaireOnly
      .input(z.object({
        id: z.number(),
        data: chantierBaseSchema.partial().extend({
          statut: z.enum(["demande", "analyse", "offre_envoyee", "documents_demandes", "validation_admin", "autorise", "en_cours", "volume_atteint", "cloture", "refuse"]).optional(),
        })
      }))
      .mutation(async ({ input }) => {
        await db.updateChantier(input.id, input.data);
        return { success: true };
      }),
    envoyerOffre: gestionnaireOnly
      .input(z.object({ id: z.number(), prixTonne: z.number().positive(), conditionsAcceptation: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const chantier = await db.getChantierById(input.id);
        if (!chantier) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateChantier(input.id, { prixTonne: input.prixTonne.toString(), conditionsAcceptation: input.conditionsAcceptation, statut: "offre_envoyee" });
        await sendEmail(emailOffrePrix(chantier.societeNom, chantier.societeMail, input.prixTonne, input.conditionsAcceptation, chantier.periodeDebut, chantier.periodeFin));
        return { success: true };
      }),
    confirmerAccordClient: gestionnaireOnly
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateChantier(input.id, { confirmationClient: true, dateConfirmation: new Date().toISOString().split("T")[0], statut: "documents_demandes" });
        return { success: true };
      }),
    saisirDocuments: gestionnaireOnly
      .input(z.object({ id: z.number(), referenceWalterre: z.string().min(1), certificatQualite: z.boolean(), rapportAnalyse: z.boolean(), volumeDeclare: z.number().positive(), regimeApplicable: z.string().min(1), transporteurs: z.array(z.string()).min(1) }))
      .mutation(async ({ input }) => {
        await db.updateChantier(input.id, { referenceWalterre: input.referenceWalterre, certificatQualite: input.certificatQualite, rapportAnalyse: input.rapportAnalyse, volumeDeclare: input.volumeDeclare, regimeApplicable: input.regimeApplicable, transporteurs: JSON.stringify(input.transporteurs), statut: "validation_admin" });
        return { success: true };
      }),
    validerAdmin: gestionnaireOnly
      .input(z.object({ id: z.number(), validationClasse: z.boolean(), validationCertificat: z.boolean(), validationRapport: z.boolean(), validationRegime: z.boolean(), validationVolume: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateChantier(input.id, { validationClasse: input.validationClasse, validationCertificat: input.validationCertificat, validationRapport: input.validationRapport, validationRegime: input.validationRegime, validationVolume: input.validationVolume });
        return { success: true };
      }),
    autoriser: gestionnaireOnly
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const chantier = await db.getChantierById(input.id);
        if (!chantier) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateChantier(input.id, { statut: "autorise", dateAutorisation: new Date().toISOString().split("T")[0] });
        if (chantier.referenceWalterre) {
          await sendEmail(emailAutorisation(chantier.societeNom, chantier.societeMail, chantier.referenceWalterre, "Site de Transinne"));
        }
        return { success: true };
      }),
    refuserAdmin: gestionnaireOnly
      .input(z.object({ id: z.number(), motif: z.string().min(10, "Motif requis (min 10 caractères)") }))
      .mutation(async ({ input }) => {
        const chantier = await db.getChantierById(input.id);
        if (!chantier) throw new TRPCError({ code: "NOT_FOUND" });
        await db.updateChantier(input.id, { statut: "refuse", motifRefusAdmin: input.motif, dateRefus: new Date().toISOString().split("T")[0] });
        await sendEmail(emailRefusValidation(chantier.societeNom, chantier.societeMail, input.motif));
        return { success: true };
      }),
    cloturer: gestionnaireOnly
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateChantier(input.id, { statut: "cloture" });
        return { success: true };
      }),
  }),

  passages: router({
    list: protectedProcedure.query(() => db.getAllPassages()),
    listByDate: protectedProcedure.input(z.object({ date: z.string() })).query(({ input }) => db.getPassagesByDate(input.date)),
    listByChantier: protectedProcedure.input(z.object({ chantierId: z.number() })).query(({ input }) => db.getPassagesByChantier(input.chantierId)),
    listByPeriod: protectedProcedure.input(z.object({ dateDebut: z.string(), dateFin: z.string() })).query(({ input }) => db.getPassagesByPeriod(input.dateDebut, input.dateFin)),
    create: protectedProcedure
      .input(z.object({
        chantierId: z.number(), chantierNom: z.string(), date: z.string(), heure: z.string(),
        plaque: z.string().min(1), transporteur: z.string().min(1), referenceChantier: z.string().min(1),
        tonnage: z.number().positive(), accepte: z.boolean(),
        motifRefus: z.string().optional(), motifRefusDetail: z.string().optional(), photoUrl: z.string().optional(),
        bonWalterreOk: z.boolean().optional(), referenceOk: z.boolean().optional(), plaqueOk: z.boolean().optional(), correspondanceOk: z.boolean().optional(),
        controleVisuelOk: z.boolean().optional(), anomalies: z.array(z.string()).optional(), operateurNom: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const chantier = await db.getChantierById(input.chantierId);
        if (!chantier) throw new TRPCError({ code: "NOT_FOUND", message: "Chantier introuvable" });
        const statutsAutorisés = ["autorise", "en_cours", "volume_atteint"] as const;
        if (!statutsAutorisés.includes(chantier.statut as any)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Ce chantier n'est pas autorisé à recevoir des livraisons" });
        }
        if ((chantier.statut as string) === "volume_atteint") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Volume déclaré atteint — aucun nouveau camion accepté" });
        }
        if (input.accepte) {
          const volumeRef = Number(chantier.volumeDeclare) || Number(chantier.volumeEstime);
          const tonnageActuel = Number(chantier.tonnageAccepte) || 0;
          const volumeRestant = volumeRef - tonnageActuel;
          if (volumeRestant > 0 && input.tonnage > volumeRestant) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Tonnage dépasse le volume restant autorisé (${volumeRestant.toFixed(2)} T restants)` });
          }
        }
        const id = await db.createPassage({ ...input, anomalies: input.anomalies ? JSON.stringify(input.anomalies) : null, operateurId: ctx.user.id, operateurNom: input.operateurNom || ctx.user.name || "Inconnu" });
        const chantierMaj = await db.getChantierById(input.chantierId);
        if (chantierMaj?.statut === "volume_atteint") {
          await sendEmail(emailVolumeAtteint(chantierMaj.societeNom, chantierMaj.societeMail, chantierMaj.referenceWalterre || "N/A", Number(chantierMaj.tonnageAccepte)));
        }
        return { id };
      }),
  }),

  incidents: router({
    list: protectedProcedure.query(() => db.getAllIncidents()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const inc = await db.getIncidentById(input.id);
      if (!inc) throw new TRPCError({ code: "NOT_FOUND" });
      return inc;
    }),
    create: protectedProcedure
      .input(z.object({ type: z.enum(["camion_refuse", "suspicion_post_deversement", "autre"]), chantierId: z.number(), chantierNom: z.string(), passageId: z.number().optional(), date: z.string(), description: z.string().min(1), photoUrl: z.string().optional(), zoneIsolee: z.boolean().optional(), clientInforme: z.boolean().optional(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createIncident({ ...input, statut: "ouvert", historiqueActions: JSON.stringify([{ date: new Date().toISOString(), action: "Incident créé", par: ctx.user.name || "Inconnu" }]), createdByUserId: ctx.user.id });
        return { id };
      }),
    updateStatut: protectedProcedure
      .input(z.object({ id: z.number(), statut: z.enum(["ouvert", "en_cours", "resolu"]), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const incident = await db.getIncidentById(input.id);
        if (!incident) throw new TRPCError({ code: "NOT_FOUND" });
        const historique = incident.historiqueActions ? JSON.parse(incident.historiqueActions) : [];
        historique.push({ date: new Date().toISOString(), action: `Statut → ${input.statut}`, par: ctx.user.name || "Inconnu", notes: input.notes });
        const updates: Record<string, unknown> = { statut: input.statut, historiqueActions: JSON.stringify(historique) };
        if (input.statut === "resolu") { updates.dateResolution = new Date().toISOString().split("T")[0]; updates.resoluParUserId = ctx.user.id; updates.resoluParNom = ctx.user.name || "Inconnu"; updates.notesResolution = input.notes; }
        await db.updateIncident(input.id, updates as any);
        return { success: true };
      }),
  }),

  stats: router({
    jour: protectedProcedure.input(z.object({ date: z.string() })).query(({ input }) => db.getStatsJour(input.date)),
    facturation: gestionnaireOnly
      .input(z.object({ chantierId: z.number(), dateDebut: z.string(), dateFin: z.string() }))
      .query(async ({ input }) => {
        const [chantier, passagesData] = await Promise.all([db.getChantierById(input.chantierId), db.getFacturationChantier(input.chantierId, input.dateDebut, input.dateFin)]);
        if (!chantier) throw new TRPCError({ code: "NOT_FOUND" });
        const totalTonnage = passagesData.reduce((s, p) => s + p.tonnage, 0);
        const prixTonne = Number(chantier.prixTonne) || 0;
        return { chantier, passages: passagesData, totalTonnage, prixTonne, montantTotal: totalTonnage * prixTonne };
      }),
  }),
});

export type AppRouter = typeof appRouter;
