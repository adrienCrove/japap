import { AUTH_ENDPOINTS, ALERTS_ENDPOINTS } from '@/config/api';

export interface CheckUserResponse {
  success: boolean;
  exists: boolean;
  needsPassword: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
}

export interface RegisterData {
  email?: string;
  phone: string;
  password: string;
  fullname: string;
  address?: string;
  interests: string[];
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
}

// Types pour les alertes
export interface AlertLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Alert {
  id: string;
  ref_alert_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'resolved' | 'rejected';
  title: string;
  displayTitle: string;
  description: string;
  location: AlertLocation;
  mediaUrl?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
}

export interface AlertsResponse {
  success: boolean;
  data?: {
    alerts: Alert[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

export interface GetAlertsParams {
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
  status?: string;
}

/**
 * Vérifie si un utilisateur existe avec cet email ou téléphone
 */
export async function checkUser(emailOrPhone: string): Promise<CheckUserResponse> {
  try {
    const response = await fetch(AUTH_ENDPOINTS.CHECK_USER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrPhone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la vérification');
    }

    return data;
  } catch (error: any) {
    console.error('Error checking user:', error);
    return {
      success: false,
      exists: false,
      needsPassword: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Connexion avec email/téléphone et mot de passe
 */
export async function login(emailOrPhone: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrPhone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion');
    }

    return data;
  } catch (error: any) {
    console.error('Error logging in:', error);
    return {
      success: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Créer un nouveau compte utilisateur
 */
export async function register(userData: RegisterData): Promise<RegisterResponse> {
  try {
    const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du compte');
    }

    return data;
  } catch (error: any) {
    console.error('Error registering:', error);
    return {
      success: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Récupérer toutes les alertes avec filtres
 */
export async function getAllAlerts(params?: GetAlertsParams): Promise<AlertsResponse> {
  try {
    // Construire les query params
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.status) queryParams.append('status', params.status);

    const url = `${ALERTS_ENDPOINTS.GET_ALL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération des alertes');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return {
      success: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}

/**
 * Récupérer une alerte par son ID
 */
export async function getAlertById(id: string): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const response = await fetch(ALERTS_ENDPOINTS.GET_BY_ID(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération de l\'alerte');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching alert:', error);
    return {
      success: false,
      error: error.message || 'Erreur de connexion au serveur',
    };
  }
}
