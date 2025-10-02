// Types communs pour la carte et les alertes

export type AlertSeverity = 'faible' | 'moyen' | 'elevé' | 'critique';
export type AlertStatus = 'active' | 'pending' | 'resolved';

export interface MapAlert {
  id: string;
  category: string;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  title: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
  confirmations: number;
}

export interface Zone {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: number[][];
  radius?: number;
  categories: string[];
  channels: string[];
  moderators: string[];
  alertCount: number;
  lastActivity: string;
  active: boolean;
}
