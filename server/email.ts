/**
 * Helper d'envoi d'emails via SMTP (nodemailer).
 * Utilise jessica.henrion@jerouville.be comme compte d'envoi.
 */
import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Transporteur SMTP — configuré via variables d'environnement
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.office365.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "jessica.henrion@jerouville.be";
  const pass = process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false, ciphers: 'SSLv3' },
  });
}

/**
 * Envoie un email via SMTP nodemailer.
 */
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpPass) {
    console.log(`[Email DEV] To: ${opts.to} | Subject: ${opts.subject}`);
    console.log(`[Email DEV] Body: ${opts.text || opts.html.substring(0, 200)}`);
    return true;
  }

  try {
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || '"JL Versage" <jlversage@jerouville.be>';
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[Email] Envoyé à ${opts.to} — ${opts.subject}`);
    return true;
  } catch (err) {
    console.error("[Email] Erreur d'envoi:", err);
    return false;
  }
}

// ─── Bloc conditions d'acceptation (réutilisé dans plusieurs emails) ──────────

const BLOC_CONDITIONS_HTML = `
  <p><strong>Rappel des conditions d'acceptation :</strong></p>
  <ul style="margin:8px 0;padding-left:20px;line-height:1.8">
    <li>Le <strong>bon de transport Walterre</strong> devra être envoyé et présenté à chaque passage. Tout camion sans bon valide sera refusé sans dérogation.</li>
    <li><strong>Uniquement terres de classe 1 et 2</strong> conformément à la réglementation Walterre.</li>
    <li>Seront <strong>systématiquement refusés</strong> les chargements présentant :
      <ul style="margin:4px 0;padding-left:20px">
        <li>Déchets plastiques</li>
        <li>Briquaillons</li>
        <li>Odeur suspecte</li>
        <li>Couleur anormale</li>
        <li>Matériaux mélangés</li>
        <li>Humidité anormale ou boues douteuses</li>
      </ul>
    </li>
    <li>La facturation est basée sur le <strong>tonnage réellement accepté</strong>.</li>
  </ul>
`;

const BLOC_CONDITIONS_TEXT = `
Conditions d'acceptation :
- Bon de transport Walterre obligatoire à chaque passage
- Uniquement terres de classe 1 et 2
- Refus systématique : déchets plastiques, briquaillons, odeur suspecte, couleur anormale, matériaux mélangés, humidité anormale ou boues douteuses
- Facturation sur tonnage réellement accepté
`;

// ─── Templates d'emails ───────────────────────────────────────────────────────

// Email 1 — Refus automatique : classe incompatible
export function emailRefusClasse(societeNom: string, societeEmail: string, classe: number) {
  return {
    to: societeEmail,
    subject: "JL Versage — Demande de prix refusée",
    html: `
      <p>Bonjour,</p>
      <p>Nous avons bien reçu votre demande de versage pour la société <strong>${societeNom}</strong>.</p>
      <p>Malheureusement, nous ne pouvons pas donner suite à votre demande car la classe de terre déclarée (<strong>Classe ${classe}</strong>) est incompatible avec les conditions d'acceptation de notre site verseur.</p>
      <p>Notre site accepte uniquement les terres de <strong>classe 1 et 2</strong> conformément à la réglementation Walterre.</p>
      <p>Si votre chantier concerne des terres de classe 1 ou 2, n'hésitez pas à nous recontacter afin que nous puissions traiter votre demande.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Bonjour,\n\nNous ne pouvons pas donner suite à votre demande. La classe ${classe} est incompatible avec notre site (classes 1 et 2 uniquement).\n\nSi votre chantier concerne des terres de classe 1 ou 2, n'hésitez pas à nous recontacter.\n\nCordialement,\nJL Versage`,
  };
}

// Email 2 — Refus capacité : planning complet
export function emailRefusCapacite(
  societeNom: string,
  societeEmail: string,
  periodeDebut: string,
  periodeFin: string,
  commentaire?: string,
) {
  return {
    to: societeEmail,
    subject: "JL Versage — Demande de versage refusée — Planning complet",
    html: `
      <p>Bonjour,</p>
      <p>Nous avons bien reçu votre demande de versage pour la société <strong>${societeNom}</strong>.</p>
      <p>Malheureusement, nous ne pouvons pas donner suite à votre demande car notre planning de versage est complet sur la période demandée (<strong>${periodeDebut} – ${periodeFin}</strong>).</p>
      ${commentaire ? `<p><strong>Précision :</strong> ${commentaire}</p>` : ''}
      <p>N'hésitez pas à nous recontacter si d'autres dates sont possibles pour vous, nous ferons notre possible pour trouver un créneau disponible.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Bonjour,\n\nNotre planning de versage est complet sur la période ${periodeDebut} – ${periodeFin}.\n${commentaire ? `\n${commentaire}\n` : ''}\nN'hésitez pas à nous recontacter si d'autres dates sont possibles pour vous.\n\nCordialement,\nJL Versage`,
  };
}

// Email 3 — Offre de prix standard (finances saines)
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
      <table style="border-collapse:collapse;width:100%;max-width:500px;margin-bottom:16px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:40%">Prix à la tonne</td><td style="padding:8px;border:1px solid #ddd"><strong>9,00 €/T</strong></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Réduction volume</td><td style="padding:8px;border:1px solid #ddd">8,50 €/T si volume annuel &gt; 10 000 T<br>8,00 €/T si volume annuel &gt; 20 000 T</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Période</td><td style="padding:8px;border:1px solid #ddd">${periodeDebut} au ${periodeFin}</td></tr>
      </table>
      ${BLOC_CONDITIONS_HTML}
      <p>Pour confirmer cette offre, veuillez répondre à cet email ou contacter notre équipe.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Offre de prix JL Versage\n\nPrix : 9,00 €/T\nRéduction : 8,50 €/T > 10 000 T/an | 8,00 €/T > 20 000 T/an\nPériode : ${periodeDebut} au ${periodeFin}\n${BLOC_CONDITIONS_TEXT}\nCordialement,\nJL Versage`,
  };
}

// Email 4 — Offre de prix avec paiement au comptant (finances non saines)
export function emailOffrePrixComptant(
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
      <table style="border-collapse:collapse;width:100%;max-width:500px;margin-bottom:16px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:40%">Prix à la tonne</td><td style="padding:8px;border:1px solid #ddd"><strong>9,00 €/T</strong></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Réduction volume</td><td style="padding:8px;border:1px solid #ddd">8,50 €/T si volume annuel &gt; 10 000 T<br>8,00 €/T si volume annuel &gt; 20 000 T</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Période</td><td style="padding:8px;border:1px solid #ddd">${periodeDebut} au ${periodeFin}</td></tr>
      </table>
      <p style="background:#fef3c7;padding:12px;border-left:4px solid #f59e0b;margin-bottom:16px">
        <strong>Condition de paiement particulière :</strong> Le paiement sera exigé <strong>au comptant avant de décharger sur le site</strong>. Le chauffeur devra s'acquitter du montant correspondant au tonnage chargé avant toute décharge.
      </p>
      ${BLOC_CONDITIONS_HTML}
      <p>Pour confirmer cette offre, veuillez répondre à cet email ou contacter notre équipe.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Offre de prix JL Versage\n\nPrix : 9,00 €/T\nRéduction : 8,50 €/T > 10 000 T/an | 8,00 €/T > 20 000 T/an\nPériode : ${periodeDebut} au ${periodeFin}\n\nATTENTION : Paiement exigé au comptant AVANT de décharger sur le site.\n${BLOC_CONDITIONS_TEXT}\nCordialement,\nJL Versage`,
  };
}

// Email 5 — Autorisation à livrer
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
      <table style="border-collapse:collapse;width:100%;max-width:500px;margin-bottom:16px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:40%">Référence Walterre</td><td style="padding:8px;border:1px solid #ddd">${referenceWalterre}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Site verseur</td><td style="padding:8px;border:1px solid #ddd">${siteNom}</td></tr>
      </table>
      ${BLOC_CONDITIONS_HTML}
      <p>Pour toute question, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Chantier autorisé à livrer au site de Transinne.\nRéférence Walterre : ${referenceWalterre}\n${BLOC_CONDITIONS_TEXT}`,
  };
}

// Email 6 — Refus après validation admin (motif manuel)
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
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Dossier refusé.\nMotif : ${motif}\n\nPour toute question, contactez-nous.\n\nCordialement,\nJL Versage`,
  };
}

// Email 7 — Volume déclaré atteint
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
      <p>À partir de maintenant, aucun nouveau camion ne pourra être accepté pour ce chantier.</p>
      <p>Si vous souhaitez continuer les apports, vous devrez nous soumettre un <strong>nouveau bon de transport Walterre</strong> pour un volume supplémentaire. Contactez-nous pour la marche à suivre.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Volume atteint pour le chantier ${referenceWalterre}. Tonnage accepté : ${tonnageAccepte.toFixed(2)} T.\n\nPour continuer les apports, un nouveau bon de transport Walterre est nécessaire.\n\nCordialement,\nJL Versage`,
  };
}

// Email 8 — Conditions d'accès transporteur
export function emailConditionsAccesTransporteur(
  transporteurNom: string,
  transporteurEmail: string,
) {
  return {
    to: transporteurEmail,
    subject: "JL Versage — Conditions d'accès au site de versage",
    html: `
      <p>Bonjour,</p>
      <p>Nous avons bien enregistré votre société <strong>${transporteurNom}</strong> comme transporteur autorisé sur notre site de versage de Transinne.</p>
      <p>Veuillez prendre connaissance des conditions d'accès ci-dessous :</p>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr style="background:#2d6a4f;color:#fff">
          <td colspan="2" style="padding:10px;font-weight:bold">Conditions d'accès — Site de versage JL Versage (Transinne)</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:40%">Documents obligatoires</td>
          <td style="padding:8px;border:1px solid #ddd">Chaque camion doit présenter un <strong>bon de transport Walterre valide</strong> à l'arrivée. Sans bon valide, le camion sera refusé sans dérogation.</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Horaires d'accès</td>
          <td style="padding:8px;border:1px solid #ddd">Lundi au vendredi : 07h00 – 16h00<br><strong>Dernier dépôt autorisé à 15h45</strong><br>Fermé le samedi et les jours fériés</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Classe de terres acceptées</td>
          <td style="padding:8px;border:1px solid #ddd"><strong>Classe 1 et 2 uniquement</strong> (conformément à la réglementation Walterre)</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Référence chantier</td>
          <td style="padding:8px;border:1px solid #ddd">Le chauffeur doit communiquer la référence du chantier à l'arrivée.</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Contrôle visuel</td>
          <td style="padding:8px;border:1px solid #ddd">Tout chargement suspect peut être refusé après contrôle visuel par le préposé de site.</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Paiement</td>
          <td style="padding:8px;border:1px solid #ddd">Selon les conditions convenues avec le gestionnaire du chantier. En cas de finances non saines, le paiement peut être réclamé au chauffeur à chaque versage.</td>
        </tr>
      </table>
      <p style="background:#ffebee;padding:12px;border-left:4px solid #f44336;margin-top:16px">
        <strong>Seront systématiquement refusés</strong> les chargements présentant : déchets plastiques, briquaillons, odeur suspecte, couleur anormale, matériaux mélangés, humidité anormale ou boues douteuses.
      </p>
      <p style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107;margin-top:8px">
        <strong>Important :</strong> Le non-respect de ces conditions entraîne le refus immédiat du chargement. En cas de doute, contactez-nous avant de vous déplacer.
      </p>
      <p>Pour toute question, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Bonjour ${transporteurNom},\n\nConditions d'accès au site de versage JL Versage (Transinne) :\n- Bon de transport Walterre valide obligatoire\n- Horaires : lun-ven 07h-16h (dernier dépôt à 15h45) — fermé le samedi\n- Classes 1 et 2 uniquement\n- Référence chantier à communiquer à l'arrivée\n- Refus systématique : déchets plastiques, briquaillons, odeur suspecte, couleur anormale, matériaux mélangés, humidité anormale ou boues douteuses\n\nCordialement,\nJL Versage`,
  };
}

// Email interne — Nouvel utilisateur connecté (alerte admin)
export function emailNouvelUtilisateur(
  adminEmail: string,
  userName: string | null,
  userEmail: string | null,
) {
  return {
    to: adminEmail,
    subject: "JL Versage — Nouvel utilisateur connecté",
    html: `
      <p>Bonjour,</p>
      <p>Un nouvel utilisateur vient de se connecter à l'application <strong>JL Versage</strong> pour la première fois.</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nom</td><td style="padding:8px;border:1px solid #ddd">${userName ?? 'Non renseigné'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${userEmail ?? 'Non renseigné'}</td></tr>
      </table>
      <p style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107">
        Cet utilisateur est en attente d'un rôle. Connectez-vous à l'application et allez dans l'onglet <strong>Utilisateurs</strong> pour lui attribuer le rôle Gestionnaire ou Préposé.
      </p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne</p>
    `,
    text: `Nouvel utilisateur : ${userName ?? 'Inconnu'} (${userEmail ?? 'email inconnu'}).\n\nConnectez-vous à l'application pour lui attribuer un rôle.`,
  };
}

// Email — Création d'un compte utilisateur
export function emailNouvelUtilisateurCreation(
  userEmail: string,
  userName: string,
  appRole: string,
) {
  const roleLabel = appRole === 'gestionnaire' ? 'Gestionnaire' : 'Préposé';
  return {
    to: userEmail,
    subject: "JL Versage — Votre accès à l'application",
    html: `
      <p>Bonjour ${userName},</p>
      <p>Un compte vous a été créé sur l'application <strong>JL Versage</strong> avec le rôle <strong>${roleLabel}</strong>.</p>
      <p>Pour accéder à l'application :</p>
      <ol>
        <li>Téléchargez l'application <strong>Expo Go</strong> sur votre téléphone</li>
        <li>Ou ouvrez l'application dans votre navigateur</li>
        <li>Connectez-vous avec votre compte Manus (email : ${userEmail})</li>
      </ol>
      <p>Votre accès est immédiatement actif.</p>
      <p>Cordialement,<br><strong>JL Versage</strong><br>Site de Transinne<br>jlversage@erouville.be</p>
    `,
    text: `Bonjour ${userName},\n\nUn compte ${roleLabel} vous a été créé sur l'application JL Versage.\n\nConnectez-vous avec votre compte Manus (email : ${userEmail}).`,
  };
}
