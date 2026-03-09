/**
 * Utilitaires de date pour le fuseau Europe/Brussels (UTC+1 / UTC+2 en été)
 * Évite les décalages UTC qui causent des erreurs de date sur le tableau de bord
 */

/**
 * Retourne la date locale actuelle au format YYYY-MM-DD (fuseau Brussels)
 */
export function getTodayBrussels(): string {
  return new Date().toLocaleDateString('fr-BE', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/').reverse().join('-');
  // toLocaleDateString fr-BE retourne DD/MM/YYYY → on inverse en YYYY-MM-DD
}

/**
 * Retourne l'heure locale actuelle au format HH:MM (fuseau Brussels)
 */
export function getNowTimeBrussels(): string {
  return new Date().toLocaleTimeString('fr-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Retourne la date et l'heure actuelles en Brussels
 */
export function getNowBrussels(): { date: string; heure: string } {
  return {
    date: getTodayBrussels(),
    heure: getNowTimeBrussels(),
  };
}

/**
 * Formate une date YYYY-MM-DD en format lisible français
 */
export function formatDateFr(dateStr: string, options?: { withWeekday?: boolean }): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-BE', {
    weekday: options?.withWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Retourne la date d'il y a N jours au format YYYY-MM-DD (Brussels)
 */
export function getDaysAgoBrussels(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('fr-BE', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/').reverse().join('-');
}
