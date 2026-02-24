import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
const storage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete storage[key]; }),
    clear: vi.fn(async () => { Object.keys(storage).forEach(k => delete storage[k]); }),
  },
}));

import {
  createChantier, getChantiers, updateChantier,
  createPassage, getPassages,
  createIncident, getIncidents, updateIncident,
  getProfil, saveProfil,
} from '../store';
import { Chantier, PassageCamion, Incident } from '../types';

beforeEach(async () => {
  Object.keys(storage).forEach(k => delete storage[k]);
});

describe('Chantiers', () => {
  it('crée un nouveau chantier avec les champs requis', async () => {
    const data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'demande',
      societe: {
        nom: 'Test SA',
        adresse: 'Rue Test 1',
        tva: 'BE0123456789',
        mail: 'test@test.be',
        personneContact: 'Jean Test',
        telephone: '+32 81 00 00 00',
      },
      localisationChantier: 'Namur',
      contactChantier: 'Jean Test',
      telephoneChantier: '+32 478 00 00 00',
      volumeEstime: 1000,
      classe: 2,
      periodeDebut: '2026-03-01',
      periodeFin: '2026-06-30',
    };
    const chantier = await createChantier(data);
    expect(chantier.id).toBeTruthy();
    expect(chantier.tonnageAccepte).toBe(0);
    expect(chantier.tonnageRefuse).toBe(0);
    expect(chantier.statut).toBe('demande');
    expect(chantier.societe.nom).toBe('Test SA');
  });

  it('récupère la liste des chantiers', async () => {
    const data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'demande',
      societe: { nom: 'A', adresse: '', tva: '', mail: '', personneContact: '', telephone: '' },
      localisationChantier: '', contactChantier: '', telephoneChantier: '',
      volumeEstime: 500, classe: 1, periodeDebut: '2026-01-01', periodeFin: '2026-12-31',
    };
    await createChantier(data);
    await createChantier({ ...data, societe: { ...data.societe, nom: 'B' } });
    const chantiers = await getChantiers();
    expect(chantiers.length).toBe(2);
  });

  it('met à jour le statut d\'un chantier', async () => {
    const data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'demande',
      societe: { nom: 'Test', adresse: '', tva: '', mail: '', personneContact: '', telephone: '' },
      localisationChantier: '', contactChantier: '', telephoneChantier: '',
      volumeEstime: 500, classe: 1, periodeDebut: '2026-01-01', periodeFin: '2026-12-31',
    };
    const chantier = await createChantier(data);
    await updateChantier(chantier.id, { statut: 'autorise', dateAutorisation: new Date().toISOString() });
    const chantiers = await getChantiers();
    const updated = chantiers.find(c => c.id === chantier.id);
    expect(updated?.statut).toBe('autorise');
    expect(updated?.dateAutorisation).toBeTruthy();
  });
});

describe('Passages camion', () => {
  it('crée un passage accepté et met à jour le tonnage du chantier', async () => {
    // Créer un chantier d'abord
    const chantierData: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'autorise',
      societe: { nom: 'Test', adresse: '', tva: '', mail: '', personneContact: '', telephone: '' },
      localisationChantier: '', contactChantier: '', telephoneChantier: '',
      volumeEstime: 1000, classe: 1, periodeDebut: '2026-01-01', periodeFin: '2026-12-31',
    };
    const chantier = await createChantier(chantierData);

    const passageData: Omit<PassageCamion, 'id'> = {
      chantierId: chantier.id,
      chantierNom: 'Test',
      date: '2026-02-24',
      heure: '09:00',
      plaque: '1-ABC-234',
      transporteur: 'Transport X',
      referenceChantier: 'WAL-2026-001',
      tonnage: 25.5,
      accepte: true,
      bonWalterreOk: true,
      referenceOk: true,
      plaqueOk: true,
      correspondanceOk: true,
    };
    const passage = await createPassage(passageData);
    expect(passage.id).toBeTruthy();
    expect(passage.tonnage).toBe(25.5);

    const chantiers = await getChantiers();
    const updated = chantiers.find(c => c.id === chantier.id);
    expect(updated?.tonnageAccepte).toBe(25.5);
    expect(updated?.statut).toBe('en_cours');
  });

  it('crée un passage refusé sans modifier le tonnage accepté', async () => {
    const chantierData: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'autorise',
      societe: { nom: 'Test', adresse: '', tva: '', mail: '', personneContact: '', telephone: '' },
      localisationChantier: '', contactChantier: '', telephoneChantier: '',
      volumeEstime: 1000, classe: 1, periodeDebut: '2026-01-01', periodeFin: '2026-12-31',
    };
    const chantier = await createChantier(chantierData);

    await createPassage({
      chantierId: chantier.id,
      chantierNom: 'Test',
      date: '2026-02-24',
      heure: '10:00',
      plaque: '1-XYZ-567',
      transporteur: 'Transport Y',
      referenceChantier: 'WAL-2026-001',
      tonnage: 0,
      accepte: false,
      motifRefus: 'gravats',
    });

    const chantiers = await getChantiers();
    const updated = chantiers.find(c => c.id === chantier.id);
    expect(updated?.tonnageAccepte).toBe(0);
    expect(updated?.statut).toBe('autorise'); // Pas changé
  });

  it('passe en volume_atteint quand le tonnage dépasse le volume déclaré', async () => {
    const chantierData: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'> = {
      statut: 'autorise',
      societe: { nom: 'Test', adresse: '', tva: '', mail: '', personneContact: '', telephone: '' },
      localisationChantier: '', contactChantier: '', telephoneChantier: '',
      volumeEstime: 100, volumeDeclare: 100, classe: 1, periodeDebut: '2026-01-01', periodeFin: '2026-12-31',
    };
    const chantier = await createChantier(chantierData);

    await createPassage({
      chantierId: chantier.id, chantierNom: 'Test',
      date: '2026-02-24', heure: '09:00',
      plaque: '1-ABC-234', transporteur: 'X', referenceChantier: 'WAL',
      tonnage: 100, accepte: true,
    });

    const chantiers = await getChantiers();
    const updated = chantiers.find(c => c.id === chantier.id);
    expect(updated?.statut).toBe('volume_atteint');
  });
});

describe('Incidents', () => {
  it('crée un incident et le récupère', async () => {
    const data: Omit<Incident, 'id'> = {
      type: 'camion_refuse',
      chantierId: 'test1',
      chantierNom: 'Test Chantier',
      date: new Date().toISOString(),
      description: 'Camion refusé pour gravats',
      clientInforme: false,
      resolu: false,
    };
    const incident = await createIncident(data);
    expect(incident.id).toBeTruthy();
    expect(incident.type).toBe('camion_refuse');

    const incidents = await getIncidents();
    expect(incidents.length).toBe(1);
    expect(incidents[0].description).toBe('Camion refusé pour gravats');
  });

  it('marque un incident comme résolu', async () => {
    const incident = await createIncident({
      type: 'autre',
      chantierId: 'test1',
      chantierNom: 'Test',
      date: new Date().toISOString(),
      description: 'Test incident',
      clientInforme: false,
      resolu: false,
    });

    await updateIncident(incident.id, { resolu: true, dateResolution: new Date().toISOString() });
    const incidents = await getIncidents();
    expect(incidents[0].resolu).toBe(true);
    expect(incidents[0].dateResolution).toBeTruthy();
  });
});

describe('Profil utilisateur', () => {
  it('retourne le profil par défaut si aucun profil sauvegardé', async () => {
    const profil = await getProfil();
    expect(profil.nom).toBe('Utilisateur');
    expect(profil.role).toBe('gestionnaire');
  });

  it('sauvegarde et récupère un profil', async () => {
    await saveProfil({ nom: 'Natacha', role: 'gestionnaire', siteNom: 'Site de Transinne' });
    const profil = await getProfil();
    expect(profil.nom).toBe('Natacha');
    expect(profil.siteNom).toBe('Site de Transinne');
  });
});
