// Types partagés pour l'application SiteVerseur

export type ChantierStatut =
  | 'demande'
  | 'analyse'
  | 'offre_envoyee'
  | 'documents_demandes'
  | 'validation_admin'
  | 'autorise'
  | 'en_cours'
  | 'volume_atteint'
  | 'cloture';

export type ClasseTerre = 1 | 2 | 3 | 4 | 5;

export interface SocieteCliente {
  nom: string;
  adresse: string;
  tva: string;
  mail: string;
  personneContact: string;
  telephone: string;
}

export interface Chantier {
  id: string;
  statut: ChantierStatut;
  societe: SocieteCliente;
  localisationChantier: string;
  contactChantier: string;
  telephoneChantier: string;
  volumeEstime: number; // en tonnes
  classe: ClasseTerre;
  periodeDebut: string; // ISO date
  periodeFin: string; // ISO date
  // Offre
  prixTonne?: number;
  conditionsAcceptation?: string;
  confirmationClient?: boolean;
  dateConfirmation?: string;
  // Documents Walterre
  referenceWalterre?: string;
  certificatQualite?: boolean;
  rapportAnalyse?: boolean;
  volumeDeclare?: number;
  regimeApplicable?: string;
  transporteurs?: string[];
  // Validation admin
  validationClasse?: boolean;
  validationCertificat?: boolean;
  validationRapport?: boolean;
  validationRegime?: boolean;
  validationVolume?: boolean;
  dateAutorisation?: string;
  // Suivi
  tonnageAccepte: number;
  tonnageRefuse: number;
  dateCreation: string;
  dateMaj: string;
  notes?: string;
}

export type MotifRefus =
  | 'dechets'
  | 'gravats'
  | 'plastique'
  | 'odeur_suspecte'
  | 'melange_douteux'
  | 'couleur_anormale'
  | 'bon_walterre_manquant'
  | 'reference_incorrecte'
  | 'chantier_non_autorise'
  | 'volume_depasse'
  | 'autre';

export interface PassageCamion {
  id: string;
  chantierId: string;
  chantierNom: string;
  date: string; // ISO date
  heure: string; // HH:MM
  plaque: string;
  transporteur: string;
  referenceChantier: string;
  tonnage: number;
  accepte: boolean;
  motifRefus?: MotifRefus;
  motifRefusDetail?: string;
  photoUri?: string;
  // Contrôle visuel
  controleVisuelOk?: boolean;
  anomalies?: string[];
  // Contrôle admin
  bonWalterreOk?: boolean;
  referenceOk?: boolean;
  plaqueOk?: boolean;
  correspondanceOk?: boolean;
  operateurId?: string;
  operateurNom?: string;
}

export type IncidentType =
  | 'camion_refuse'
  | 'suspicion_post_deversement'
  | 'autre';

export interface Incident {
  id: string;
  type: IncidentType;
  chantierId: string;
  chantierNom: string;
  passageCamionId?: string;
  date: string;
  description: string;
  photoUri?: string;
  zoneIsolee?: boolean;
  clientInforme?: boolean;
  resolu?: boolean;
  dateResolution?: string;
  notes?: string;
}

export type RoleProfil = 'gestionnaire' | 'prepose';

export interface ProfilUtilisateur {
  nom: string;
  role: RoleProfil;
  siteNom: string;
}

export interface StatistiquesJour {
  date: string;
  totalCamions: number;
  camionsAcceptes: number;
  camionsRefuses: number;
  tonnageAccepte: number;
  tonnageRefuse: number;
}

export const MOTIF_REFUS_LABELS: Record<MotifRefus, string> = {
  dechets: 'Déchets présents',
  gravats: 'Gravats',
  plastique: 'Plastique',
  odeur_suspecte: 'Odeur suspecte',
  melange_douteux: 'Mélange douteux',
  couleur_anormale: 'Couleur anormale',
  bon_walterre_manquant: 'Bon Walterre manquant',
  reference_incorrecte: 'Référence incorrecte',
  chantier_non_autorise: 'Chantier non autorisé',
  volume_depasse: 'Volume déclaré dépassé',
  autre: 'Autre motif',
};

export const STATUT_LABELS: Record<ChantierStatut, string> = {
  demande: 'Demande reçue',
  analyse: 'Analyse interne',
  offre_envoyee: 'Offre envoyée',
  documents_demandes: 'Documents demandés',
  validation_admin: 'Validation en cours',
  autorise: 'Autorisé',
  en_cours: 'En cours',
  volume_atteint: 'Volume atteint',
  cloture: 'Clôturé',
};

export const STATUT_COLORS: Record<ChantierStatut, string> = {
  demande: '#D97706',
  analyse: '#D97706',
  offre_envoyee: '#2563EB',
  documents_demandes: '#7C3AED',
  validation_admin: '#0891B2',
  autorise: '#16A34A',
  en_cours: '#16A34A',
  volume_atteint: '#DC2626',
  cloture: '#6B7280',
};
