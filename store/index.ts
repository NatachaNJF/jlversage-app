import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chantier, PassageCamion, Incident, ProfilUtilisateur } from '@/types';

const KEYS = {
  CHANTIERS: 'sv_chantiers',
  PASSAGES: 'sv_passages',
  INCIDENTS: 'sv_incidents',
  PROFIL: 'sv_profil',
};

// --- Utilitaires ---
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function now(): string {
  return new Date().toISOString();
}

// --- Chantiers ---
export async function getChantiers(): Promise<Chantier[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHANTIERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChantiers(chantiers: Chantier[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHANTIERS, JSON.stringify(chantiers));
}

export async function createChantier(data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'>): Promise<Chantier> {
  const chantiers = await getChantiers();
  const nouveau: Chantier = {
    ...data,
    id: generateId(),
    tonnageAccepte: 0,
    tonnageRefuse: 0,
    dateCreation: now(),
    dateMaj: now(),
  };
  chantiers.unshift(nouveau);
  await saveChantiers(chantiers);
  return nouveau;
}

export async function updateChantier(id: string, updates: Partial<Chantier>): Promise<Chantier | null> {
  const chantiers = await getChantiers();
  const idx = chantiers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  chantiers[idx] = { ...chantiers[idx], ...updates, dateMaj: now() };
  await saveChantiers(chantiers);
  return chantiers[idx];
}

export async function getChantierById(id: string): Promise<Chantier | null> {
  const chantiers = await getChantiers();
  return chantiers.find(c => c.id === id) ?? null;
}

// --- Passages camion ---
export async function getPassages(): Promise<PassageCamion[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PASSAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePassages(passages: PassageCamion[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PASSAGES, JSON.stringify(passages));
}

export async function createPassage(data: Omit<PassageCamion, 'id'>): Promise<PassageCamion> {
  const passages = await getPassages();
  const nouveau: PassageCamion = { ...data, id: generateId() };
  passages.unshift(nouveau);
  await savePassages(passages);

  // Mettre à jour les tonnages du chantier
  const chantiers = await getChantiers();
  const idx = chantiers.findIndex(c => c.id === data.chantierId);
  if (idx !== -1) {
    if (data.accepte) {
      chantiers[idx].tonnageAccepte = (chantiers[idx].tonnageAccepte || 0) + data.tonnage;
      // Vérifier si volume atteint
      if (chantiers[idx].tonnageAccepte >= (chantiers[idx].volumeDeclare || chantiers[idx].volumeEstime)) {
        chantiers[idx].statut = 'volume_atteint';
      } else if (chantiers[idx].statut === 'autorise') {
        chantiers[idx].statut = 'en_cours';
      }
    } else {
      chantiers[idx].tonnageRefuse = (chantiers[idx].tonnageRefuse || 0) + data.tonnage;
    }
    chantiers[idx].dateMaj = now();
    await saveChantiers(chantiers);
  }

  return nouveau;
}

export async function getPassagesByChantier(chantierId: string): Promise<PassageCamion[]> {
  const passages = await getPassages();
  return passages.filter(p => p.chantierId === chantierId);
}

export async function getPassagesJour(date?: string): Promise<PassageCamion[]> {
  const passages = await getPassages();
  const jour = date ?? new Date().toISOString().split('T')[0];
  return passages.filter(p => p.date.startsWith(jour));
}

// --- Incidents ---
export async function getIncidents(): Promise<Incident[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.INCIDENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveIncidents(incidents: Incident[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.INCIDENTS, JSON.stringify(incidents));
}

export async function createIncident(data: Omit<Incident, 'id'>): Promise<Incident> {
  const incidents = await getIncidents();
  const nouveau: Incident = { ...data, id: generateId() };
  incidents.unshift(nouveau);
  await saveIncidents(incidents);
  return nouveau;
}

export async function updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
  const incidents = await getIncidents();
  const idx = incidents.findIndex(i => i.id === id);
  if (idx !== -1) {
    incidents[idx] = { ...incidents[idx], ...updates };
    await saveIncidents(incidents);
  }
}

// --- Profil ---
export async function getProfil(): Promise<ProfilUtilisateur> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFIL);
    return raw ? JSON.parse(raw) : { nom: 'Utilisateur', role: 'gestionnaire', siteNom: 'Site de Transinne' };
  } catch {
    return { nom: 'Utilisateur', role: 'gestionnaire', siteNom: 'Site de Transinne' };
  }
}

export async function saveProfil(profil: ProfilUtilisateur): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFIL, JSON.stringify(profil));
}

// --- Données de démonstration ---
export async function initDemoData(): Promise<void> {
  const chantiers = await getChantiers();
  if (chantiers.length > 0) return; // Déjà initialisé

  const demoChantiers: Chantier[] = [
    {
      id: 'demo1',
      statut: 'en_cours',
      societe: {
        nom: 'Terrassements Dupont SA',
        adresse: 'Rue de la Terre 12, 5000 Namur',
        tva: 'BE0123456789',
        mail: 'contact@dupont-terrassements.be',
        personneContact: 'Jean Dupont',
        telephone: '+32 81 23 45 67',
      },
      localisationChantier: 'Avenue du Roi Albert, Namur',
      contactChantier: 'Pierre Martin',
      telephoneChantier: '+32 478 12 34 56',
      volumeEstime: 5000,
      classe: 2,
      periodeDebut: '2026-02-01',
      periodeFin: '2026-06-30',
      prixTonne: 8.5,
      conditionsAcceptation: 'Terres conformes Walterre obligatoires. Refus en cas de non-conformité.',
      confirmationClient: true,
      dateConfirmation: '2026-01-25',
      referenceWalterre: 'WAL-2026-0142',
      certificatQualite: true,
      rapportAnalyse: true,
      volumeDeclare: 4800,
      regimeApplicable: 'Régime II',
      transporteurs: ['Transport Lecomte', 'Camions Renard'],
      validationClasse: true,
      validationCertificat: true,
      validationRapport: true,
      validationRegime: true,
      validationVolume: true,
      dateAutorisation: '2026-01-28',
      tonnageAccepte: 1250,
      tonnageRefuse: 80,
      dateCreation: '2026-01-15',
      dateMaj: '2026-02-20',
    },
    {
      id: 'demo2',
      statut: 'autorise',
      societe: {
        nom: 'Construction Lejeune SPRL',
        adresse: 'Chaussée de Liège 45, 5100 Jambes',
        tva: 'BE0987654321',
        mail: 'info@lejeune-construction.be',
        personneContact: 'Marie Lejeune',
        telephone: '+32 81 56 78 90',
      },
      localisationChantier: 'Rue des Artisans, Dinant',
      contactChantier: 'Thomas Lejeune',
      telephoneChantier: '+32 479 98 76 54',
      volumeEstime: 2000,
      classe: 1,
      periodeDebut: '2026-03-01',
      periodeFin: '2026-05-31',
      prixTonne: 9.0,
      conditionsAcceptation: 'Terres conformes Walterre obligatoires.',
      confirmationClient: true,
      dateConfirmation: '2026-02-10',
      referenceWalterre: 'WAL-2026-0198',
      certificatQualite: true,
      rapportAnalyse: true,
      volumeDeclare: 1800,
      regimeApplicable: 'Régime I',
      transporteurs: ['Transport Bodart'],
      validationClasse: true,
      validationCertificat: true,
      validationRapport: true,
      validationRegime: true,
      validationVolume: true,
      dateAutorisation: '2026-02-15',
      tonnageAccepte: 0,
      tonnageRefuse: 0,
      dateCreation: '2026-02-01',
      dateMaj: '2026-02-15',
    },
    {
      id: 'demo3',
      statut: 'validation_admin',
      societe: {
        nom: 'Génie Civil Mertens',
        adresse: 'Avenue de la Gare 8, 6900 Marche-en-Famenne',
        tva: 'BE0456789123',
        mail: 'mertens@genie-civil.be',
        personneContact: 'André Mertens',
        telephone: '+32 84 31 22 11',
      },
      localisationChantier: 'Zone industrielle, Marche-en-Famenne',
      contactChantier: 'André Mertens',
      telephoneChantier: '+32 84 31 22 11',
      volumeEstime: 8000,
      classe: 2,
      periodeDebut: '2026-04-01',
      periodeFin: '2026-09-30',
      prixTonne: 8.0,
      conditionsAcceptation: 'Terres conformes Walterre obligatoires.',
      confirmationClient: true,
      dateConfirmation: '2026-02-18',
      referenceWalterre: 'WAL-2026-0221',
      certificatQualite: true,
      rapportAnalyse: false,
      volumeDeclare: 7500,
      regimeApplicable: 'Régime II',
      transporteurs: ['Transport Collignon', 'Camions Piron'],
      validationClasse: true,
      validationCertificat: true,
      validationRapport: false,
      validationRegime: true,
      validationVolume: true,
      tonnageAccepte: 0,
      tonnageRefuse: 0,
      dateCreation: '2026-02-10',
      dateMaj: '2026-02-22',
    },
  ];

  await saveChantiers(demoChantiers);

  const demoPassages: PassageCamion[] = [
    {
      id: 'p1',
      chantierId: 'demo1',
      chantierNom: 'Terrassements Dupont SA — Namur',
      date: new Date().toISOString().split('T')[0],
      heure: '08:15',
      plaque: '1-ABC-234',
      transporteur: 'Transport Lecomte',
      referenceChantier: 'WAL-2026-0142',
      tonnage: 24.5,
      accepte: true,
      bonWalterreOk: true,
      referenceOk: true,
      plaqueOk: true,
      correspondanceOk: true,
      controleVisuelOk: true,
      operateurNom: 'Marc Thiry',
    },
    {
      id: 'p2',
      chantierId: 'demo1',
      chantierNom: 'Terrassements Dupont SA — Namur',
      date: new Date().toISOString().split('T')[0],
      heure: '10:42',
      plaque: '1-XYZ-567',
      transporteur: 'Camions Renard',
      referenceChantier: 'WAL-2026-0142',
      tonnage: 18.0,
      accepte: false,
      motifRefus: 'gravats',
      bonWalterreOk: true,
      referenceOk: true,
      plaqueOk: true,
      correspondanceOk: true,
      controleVisuelOk: false,
      anomalies: ['gravats'],
      operateurNom: 'Marc Thiry',
    },
  ];

  await savePassages(demoPassages);
}
