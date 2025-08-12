// Configuration de l'API pour communiquer avec japap-backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Interfaces communes
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interfaces du Dashboard
export interface DashboardStats {
  activeAlerts: number;
  expiredAlerts: number;
  pendingAlerts: number;
  averageValidationTime: number; // en minutes
  completedToday: number;
  delayedJobs: number;
  technicians: number;
}

export interface AlertCategory {
  category: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TopZone {
  id: string;
  name: string;
  alertCount: number;
  lastActivity: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface TopUser {
  id: string;
  name: string;
  phone: string;
  reputationScore: number;
  alertCount: number;
  lastSignal: string;
}

export interface RecentActivity {
  id: string;
  jobId: string;
  service: string;
  technician: string;
  eta: string;
  status: 'validated' | 'pending' | 'moderation' | 'false_alarm';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Interfaces des Alertes
export interface Alert {
  id: string;
  ref_alert_id: string;
  category: string;
  title: string;
  displayTitle: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'pending' | 'expired' | 'false';
  description: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  user?: { // User peut être null pour une alerte manuelle
    id: string;
    phone: string;
    reputationScore: number;
  };
  confirmations?: number; // Confirmations peut être null
  mediaUrl?: string;
  createdAt: string;
  expiresAt?: string;
  source: 'app' | 'whatsapp' | 'telegram' | 'web';
}

export type AlertCreationData = Omit<Alert, 'id' | 'createdAt' | 'user' | 'confirmations' | 'ref_alert_id' | 'displayTitle'> & {
  title: string; // Rendre le titre obligatoire à la création
};


export interface AlertsApiResponse {
  alerts: Alert[];
  pagination: Pagination;
}

export interface AlertsFilters {
  status?: string;
  category?: string;
  severity?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export type BulkAction = "validate" | "reject" | "archive";

// Fonctions API (génériques)
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${getToken()}` // TODO: Implémenter la gestion du token
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Une erreur est survenue',
      };
    }
    
    // Si le backend retourne une réponse avec une clé `data`
    const result = await response.json();
    if(result.hasOwnProperty('data') || result.hasOwnProperty('success')) {
       return result;
    }

    // Si le backend retourne directement l'objet
    return { success: true, data: result };

  } catch (error) {
    return {
      success: false,
      error: (error instanceof Error) ? error.message : 'Erreur de connexion',
    };
  }
}

// Fonctions API pour les Alertes
export async function fetchAlerts(filters: AlertsFilters = {}): Promise<ApiResponse<AlertsApiResponse>> {
    // ... (le code mocké reste pour l'instant)
    return fetchApi<AlertsApiResponse>(`${API_BASE_URL}/api/alerts`);
}

export async function createManualAlert(data: AlertCreationData): Promise<ApiResponse<Alert>> {
  return fetchApi<Alert>(`${API_BASE_URL}/api/alerts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function performBulkAction(action: BulkAction, alertIds: string[]): Promise<ApiResponse<{ count: number }>> {
  // Simuler une action en lot
  console.log(`Performing bulk action '${action}' on alerts:`, alertIds);
  return Promise.resolve({ success: true, message: `Action '${action}' effectuée sur ${alertIds.length} alertes.`, data: { count: alertIds.length } });
}

// Fonction utilitaire pour gérer les erreurs d'API (inchangée)
export function handleApiError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Une erreur inattendue s\'est produite';
}
