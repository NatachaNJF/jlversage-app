import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chantier, PassageCamion, Incident, ProfilUtilisateur } from '@/types';
import {
  getChantiers, saveChantiers, createChantier, updateChantier, getChantierById,
  getPassages, createPassage, getPassagesByChantier, getPassagesJour,
  getIncidents, createIncident, updateIncident,
  getProfil, saveProfil,
  initDemoData,
} from '@/store';

interface AppContextValue {
  profil: ProfilUtilisateur;
  setProfil: (p: ProfilUtilisateur) => Promise<void>;
  chantiers: Chantier[];
  passages: PassageCamion[];
  incidents: Incident[];
  refreshChantiers: () => Promise<void>;
  refreshPassages: () => Promise<void>;
  refreshIncidents: () => Promise<void>;
  ajouterChantier: (data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'>) => Promise<Chantier>;
  modifierChantier: (id: string, updates: Partial<Chantier>) => Promise<void>;
  ajouterPassage: (data: Omit<PassageCamion, 'id'>) => Promise<PassageCamion>;
  ajouterIncident: (data: Omit<Incident, 'id'>) => Promise<Incident>;
  modifierIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profil, setProfilState] = useState<ProfilUtilisateur>({
    nom: 'Utilisateur',
    role: 'gestionnaire',
    siteNom: 'Site de Transinne',
  });
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [passages, setPassages] = useState<PassageCamion[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initDemoData();
      const [p, c, pa, inc] = await Promise.all([
        getProfil(),
        getChantiers(),
        getPassages(),
        getIncidents(),
      ]);
      setProfilState(p);
      setChantiers(c);
      setPassages(pa);
      setIncidents(inc);
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshChantiers = useCallback(async () => {
    const c = await getChantiers();
    setChantiers(c);
  }, []);

  const refreshPassages = useCallback(async () => {
    const p = await getPassages();
    setPassages(p);
  }, []);

  const refreshIncidents = useCallback(async () => {
    const i = await getIncidents();
    setIncidents(i);
  }, []);

  const setProfil = useCallback(async (p: ProfilUtilisateur) => {
    await saveProfil(p);
    setProfilState(p);
  }, []);

  const ajouterChantier = useCallback(async (data: Omit<Chantier, 'id' | 'dateCreation' | 'dateMaj' | 'tonnageAccepte' | 'tonnageRefuse'>) => {
    const nouveau = await createChantier(data);
    await refreshChantiers();
    return nouveau;
  }, [refreshChantiers]);

  const modifierChantier = useCallback(async (id: string, updates: Partial<Chantier>) => {
    await updateChantier(id, updates);
    await refreshChantiers();
  }, [refreshChantiers]);

  const ajouterPassage = useCallback(async (data: Omit<PassageCamion, 'id'>) => {
    const nouveau = await createPassage(data);
    await refreshPassages();
    await refreshChantiers();
    return nouveau;
  }, [refreshPassages, refreshChantiers]);

  const ajouterIncident = useCallback(async (data: Omit<Incident, 'id'>) => {
    const nouveau = await createIncident(data);
    await refreshIncidents();
    return nouveau;
  }, [refreshIncidents]);

  const modifierIncident = useCallback(async (id: string, updates: Partial<Incident>) => {
    await updateIncident(id, updates);
    await refreshIncidents();
  }, [refreshIncidents]);

  return (
    <AppContext.Provider value={{
      profil, setProfil,
      chantiers, passages, incidents,
      refreshChantiers, refreshPassages, refreshIncidents,
      ajouterChantier, modifierChantier,
      ajouterPassage,
      ajouterIncident, modifierIncident,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
