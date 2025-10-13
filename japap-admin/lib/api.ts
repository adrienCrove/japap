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
  hasNext?: boolean;
  hasPrev?: boolean;
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
  search?: string;
  status?: string;
  category?: string;
  severity?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export type BulkAction = "validate" | "reject" | "archive";

// Interfaces des Utilisateurs
export interface UserData {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'blocked';
  reputationScore: number;
  location?: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  birthDate?: string;
  notes?: string;
  createdAt: string;
}

export type UserCreationData = Omit<UserData, 'id' | 'createdAt'>;

// Gestion du token JWT
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('japap_admin_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('japap_admin_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('japap_admin_token');
}

// Fonctions API (génériques)
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
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
    const queryParams = new URLSearchParams();

    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.severity && filters.severity !== 'all') queryParams.append('severity', filters.severity);
    if (filters.source && filters.source !== 'all') queryParams.append('source', filters.source);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const url = `${API_BASE_URL}/api/alerts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return fetchApi<AlertsApiResponse>(url);
}

export async function createManualAlert(data: AlertCreationData): Promise<ApiResponse<Alert>> {
  return fetchApi<Alert>(`${API_BASE_URL}/api/alerts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAlert(id: string, data: Partial<Alert>): Promise<ApiResponse<Alert>> {
  return fetchApi<Alert>(`${API_BASE_URL}/api/alerts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function performBulkAction(action: BulkAction, alertIds: string[]): Promise<ApiResponse<{ count: number }>> {
  // Simuler une action en lot
  console.log(`Performing bulk action '${action}' on alerts:`, alertIds);
  return Promise.resolve({ success: true, message: `Action '${action}' effectuée sur ${alertIds.length} alertes.`, data: { count: alertIds.length } });
}

// Fonctions API pour les Utilisateurs
export async function createUser(data: UserCreationData): Promise<ApiResponse<UserData>> {
  return fetchApi<UserData>(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: Partial<UserData>): Promise<ApiResponse<UserData>> {
  return fetchApi<UserData>(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchUsers(filters?: { role?: string; status?: string; search?: string }): Promise<ApiResponse<UserData[]>> {
  const queryParams = new URLSearchParams();

  if (filters?.role && filters.role !== 'all') queryParams.append('role', filters.role);
  if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status);
  if (filters?.search) queryParams.append('search', filters.search);

  const url = `${API_BASE_URL}/api/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return fetchApi<UserData[]>(url);
}

export async function fetchUserDetails(userId: string): Promise<ApiResponse<any>> {
  return fetchApi<any>(`${API_BASE_URL}/api/users/${userId}`);
}

// PATCH /api/users/:id/status - Changer le statut d'un utilisateur
export async function updateUserStatus(userId: string, status: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la mise à jour du statut'
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error updating user status:', error);
    return {
      success: false,
      error: handleApiError(error)
    };
  }
}

// PUT /api/users/:id - Mettre à jour le rôle d'un utilisateur
export async function updateUserRole(userId: string, role: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la mise à jour du rôle'
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      error: handleApiError(error)
    };
  }
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

// Fonctions d'authentification
export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone: string;
    role: 'user' | 'moderator' | 'admin';
  };
  error?: string;
  message?: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la connexion'
      };
    }

    // Sauvegarder le token
    if (data.token) {
      setToken(data.token);
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
      message: data.message
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      success: false,
      error: handleApiError(error)
    };
  }
}

export function logout(): void {
  removeToken();
}

export async function getCurrentUser(): Promise<ApiResponse<any>> {
  const token = getToken();
  if (!token) {
    return {
      success: false,
      error: 'Non authentifié'
    };
  }

  // Décoder le token JWT pour récupérer les informations utilisateur
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      success: true,
      data: {
        userId: payload.userId,
        phone: payload.phone,
        role: payload.role,
        email: payload.email
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Token invalide'
    };
  }
}

// Fonction pour mettre à jour le mot de passe
export async function updateUserPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`${API_BASE_URL}/api/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
  });
}
