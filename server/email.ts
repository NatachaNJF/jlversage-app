/**
 * Helper d'envoi d'emails via l'API LLM/Forge intégrée.
 * Utilise notifyOwner pour les alertes internes.
 * Pour les emails clients, utilise fetch vers un service SMTP ou l'API intégrée.
 */
import { notifyOwner } from "./_core/notification";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email via l'API Forge intégrée (si disponible) ou log en dev.
 */
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log(`[Email DEV] To: ${opts.to} | Subject: ${opts.subject}`);
    console.log(`[Email DEV] Body: ${opts.text || opts.html}`);
    return true;
  }

  try {
    const url = `${apiUrl.replace(/\/+$/, "")}/v1/email/send`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      console.warn(`[Email] Send failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}

// ─── Templates d'emails ───────────────────────────────────────────────────────

export function emailRefusClasse(societeNom: string, societeEmail: string, classe: number) {
  return {
    to: societeEmail,
    subject: "JL Versage — Demande de prix refusée",
    html: `
      <p>Bonjour,</p>
      <p>Nous avons bien reçu votre demande de versage pour la société <strong>${societeNom}</strong>.</p>
      <p>Malheureusement, nous ne pouvons pas donner suite à votre demande car la classe de terre déclarée (<strong>Classe ${classe}</strong>) est incompatible avec les conditions d'acceptation de notre site verseur.</p>
      <p>Notre site accepte uniquement les terres de <strong>classe 1 et 2</strong> conformément à la réglementation Walterre.</p>
      <p>Nous restons disponibles pour toute question.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Bonjour,\n\nNous ne pouvons pas donner suite à votre demande. La classe ${classe} est incompatible avec notre site (classes 1 et 2 uniquement).\n\nCordialement,\nJL Versage`,
  };
}

export function emailOffrePrix(
  societeNom: string,
  societeEmail: string,
  prixTonne: number,
  conditions: string,
  periodeDebut: string,
  periodeFin: string,
) {
  return {
    to: societeEmail,
    subject: "JL Versage — Offre de prix pour versage de terres",
    html: `
      <p>Bonjour,</p>
      <p>Suite à votre demande, nous avons le plaisir de vous soumettre notre offre de prix pour le versage de terres sur notre site de Transinne.</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Prix à la tonne</td><td style="padding:8px;border:1px solid #ddd"><strong>${prixTonne.toFixed(2)} €/T</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Période</td><td style="padding:8px;border:1px solid #ddd">${periodeDebut} au ${periodeFin}</td></tr>
      </table>
      <p><strong>Conditions d'acceptation :</strong><br>${conditions}</p>
      <p style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107">
        <strong>Important :</strong> Terres conformes Walterre obligatoires. Tout camion non conforme sera refusé sans dérogation. La facturation est basée sur le tonnage réellement accepté.
      </p>
      <p>Pour confirmer cette offre, veuillez répondre à cet email ou contacter notre équipe.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Offre de prix JL Versage\n\nPrix : ${prixTonne.toFixed(2)} €/T\nPériode : ${periodeDebut} au ${periodeFin}\nConditions : ${conditions}\n\nTerres conformes Walterre obligatoires.`,
  };
}

export function emailAutorisation(
  societeNom: string,
  societeEmail: string,
  referenceWalterre: string,
  siteNom: string,
) {
  return {
    to: societeEmail,
    subject: "JL Versage — Chantier autorisé à livrer",
    html: `
      <p>Bonjour,</p>
      <p>Nous avons le plaisir de vous informer que votre dossier a été validé et que votre chantier est désormais <strong>autorisé à livrer</strong> sur notre site.</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Référence Walterre</td><td style="padding:8px;border:1px solid #ddd">${referenceWalterre}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Site verseur</td><td style="padding:8px;border:1px solid #ddd">${siteNom}</td></tr>
      </table>
      <p style="background:#d4edda;padding:12px;border-left:4px solid #28a745">
        Chantier autorisé à livrer au site de Transinne.
      </p>
      <p>Rappel : chaque camion doit présenter son bon Walterre à l'arrivée. Tout camion sans bon valide sera refusé.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Chantier autorisé à livrer au site de Transinne.\nRéférence Walterre : ${referenceWalterre}`,
  };
}

export function emailRefusValidation(
  societeNom: string,
  societeEmail: string,
  motif: string,
) {
  return {
    to: societeEmail,
    subject: "JL Versage — Dossier refusé après validation",
    html: `
      <p>Bonjour,</p>
      <p>Après examen de votre dossier, nous sommes dans l'obligation de refuser votre demande de versage.</p>
      <p><strong>Motif du refus :</strong><br>${motif}</p>
      <p>Pour toute question ou pour soumettre un dossier corrigé, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Dossier refusé.\nMotif : ${motif}`,
  };
}

export function emailVolumeAtteint(
  societeNom: string,
  societeEmail: string,
  referenceWalterre: string,
  tonnageAccepte: number,
) {
  return {
    to: societeEmail,
    subject: "JL Versage — Volume déclaré atteint",
    html: `
      <p>Bonjour,</p>
      <p>Nous vous informons que le volume déclaré pour votre chantier (réf. <strong>${referenceWalterre}</strong>) a été atteint.</p>
      <p>Tonnage total accepté : <strong>${tonnageAccepte.toFixed(2)} T</strong></p>
      <p>À partir de maintenant, aucun nouveau camion ne pourra être accepté pour ce chantier. Si vous souhaitez continuer les apports, veuillez nous contacter pour une extension de volume.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Volume atteint pour le chantier ${referenceWalterre}. Tonnage accepté : ${tonnageAccepte.toFixed(2)} T.`,
  };
}
