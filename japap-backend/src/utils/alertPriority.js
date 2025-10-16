/**
 * Utilitaires pour calculer le statut de priorité des alertes
 * Basé sur le temps écoulé et la configuration de la catégorie
 */

/**
 * Calculer le statut de priorité d'une alerte
 *
 * @param {Object} alert - L'alerte avec { id, status, createdAt, categoryAlert }
 * @param {Object} categoryAlert - La catégorie avec { expirationHours }
 * @returns {string} - 'active', 'expired', 'resolved'
 */
function calculatePriorityStatus(alert, categoryAlert) {
  // Si l'alerte est manuellement résolue/archivée
  if (['resolved', 'archived', 'closed', 'rejected'].includes(alert.status)) {
    return 'resolved';
  }

  // Si la catégorie n'a pas d'expiration (null = disparitions)
  if (categoryAlert && categoryAlert.expirationHours === null) {
    return 'active'; // Toujours prioritaire jusqu'à résolution manuelle
  }

  // Si pas de catégorie liée, considérer comme active
  if (!categoryAlert || !categoryAlert.expirationHours) {
    return 'active';
  }

  // Calculer le temps écoulé depuis la création
  const now = new Date();
  const createdAt = new Date(alert.createdAt);
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  // Comparer avec la durée d'expiration
  if (hoursSinceCreation > categoryAlert.expirationHours) {
    return 'expired'; // Dépriorisée mais toujours visible
  }

  return 'active'; // Prioritaire
}

/**
 * Calculer le temps restant avant expiration
 *
 * @param {Object} alert
 * @param {Object} categoryAlert
 * @returns {number|null} - Heures restantes, ou null si pas d'expiration
 */
function calculateTimeRemaining(alert, categoryAlert) {
  // Si pas d'expiration automatique
  if (!categoryAlert || categoryAlert.expirationHours === null) {
    return null;
  }

  // Si déjà résolu
  if (['resolved', 'archived', 'closed'].includes(alert.status)) {
    return 0;
  }

  const now = new Date();
  const createdAt = new Date(alert.createdAt);
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  const hoursRemaining = categoryAlert.expirationHours - hoursSinceCreation;

  return Math.max(0, hoursRemaining);
}

/**
 * Obtenir un label humain pour le statut de priorité
 *
 * @param {string} priorityStatus - 'active', 'expired', 'resolved'
 * @returns {string}
 */
function getPriorityStatusLabel(priorityStatus) {
  const labels = {
    active: 'Active',
    expired: 'Expirée',
    resolved: 'Résolue'
  };
  return labels[priorityStatus] || 'Inconnu';
}

/**
 * Obtenir une couleur pour le badge du statut
 *
 * @param {string} priorityStatus
 * @returns {string} - Code couleur hexadécimal
 */
function getPriorityStatusColor(priorityStatus) {
  const colors = {
    active: '#16a34a',   // Vert
    expired: '#9ca3af',  // Gris
    resolved: '#3b82f6'  // Bleu
  };
  return colors[priorityStatus] || '#6b7280';
}

/**
 * Enrichir une alerte avec son priorityStatus
 *
 * @param {Object} alert - Alerte avec categoryAlert inclus
 * @returns {Object} - Alerte enrichie avec priorityStatus, timeRemaining, etc.
 */
function enrichAlertWithPriorityStatus(alert) {
  if (!alert) return null;

  const priorityStatus = calculatePriorityStatus(alert, alert.categoryAlert);
  const timeRemaining = calculateTimeRemaining(alert, alert.categoryAlert);

  return {
    ...alert,
    priorityStatus,
    priorityStatusLabel: getPriorityStatusLabel(priorityStatus),
    priorityStatusColor: getPriorityStatusColor(priorityStatus),
    timeRemaining,
    isExpired: priorityStatus === 'expired',
    isActive: priorityStatus === 'active',
    isResolved: priorityStatus === 'resolved'
  };
}

/**
 * Trier les alertes par priorité
 * Active > Expired > Resolved
 * Puis par date de création (plus récentes en premier)
 *
 * @param {Array} alerts - Liste d'alertes enrichies
 * @returns {Array} - Alertes triées
 */
function sortAlertsByPriority(alerts) {
  const priorityOrder = {
    active: 1,
    expired: 2,
    resolved: 3
  };

  return alerts.sort((a, b) => {
    // Trier d'abord par priorityStatus
    const priorityDiff = priorityOrder[a.priorityStatus] - priorityOrder[b.priorityStatus];
    if (priorityDiff !== 0) return priorityDiff;

    // Si même priorityStatus, trier par date (plus récentes d'abord)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

module.exports = {
  calculatePriorityStatus,
  calculateTimeRemaining,
  getPriorityStatusLabel,
  getPriorityStatusColor,
  enrichAlertWithPriorityStatus,
  sortAlertsByPriority
};
