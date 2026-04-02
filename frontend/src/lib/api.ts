/**
 * API Service Layer
 * Centralizes all backend interactions with the Django server.
 */

const IS_SERVER = typeof window === 'undefined';

// Nelle chiamate server-side (es. NextAuth), usiamo il nome del servizio Docker
// Nelle chiamate client-side (browser), usiamo l'URL pubblico.
const BASE_URL = IS_SERVER 
  ? (process.env.BACKEND_URL || "http://backend:8000")
  : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");

if (!BASE_URL && !IS_SERVER) {
  console.warn("ATTENZIONE: NEXT_PUBLIC_BACKEND_URL non definita nel .env");
}

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Core fetcher with integrated error handling and auth headers.
 */
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  
  const defaultHeaders: Record<string, string> = {};

  // Don't set Content-Type if it's FormData (browser will do it)
  if (!(body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    cache: 'no-store', // 🚀 Forza il fetch dinamico per filtri e paginazione
    body,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.detail || errorData.error || 'API Error',
      data: errorData,
    };
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

/**
 * Auth Services
 */
export const authService = {
  async register(data: any) {
    return apiFetch('/auth/registration/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async login(credentials: any) {
    return apiFetch('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async refresh(refreshToken: string) {
    return apiFetch<any>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }
};

/**
 * Document Services
 */
export const documentService = {
  async getAll(token: string, customUrl?: string, status?: string) {
    let url = customUrl || '/api/documents/';
    
    // 🛡️ Aggiungiamo lo status se presente (gestendo correttamente ? o &)
    if (status && status !== 'ALL') {
      const sep = url.includes('?') ? '&' : '?';
      // Evitiamo duplicazioni se lo status è già nel customUrl
      if (!url.includes('status=')) {
        url += `${sep}status=${status}`;
      }
    }
    
    return apiFetch<any>(url, { token });
  },

  async getAdminDocuments(token: string, userId: string, customUrl?: string, status?: string) {
    let url = customUrl || `/api/admin/documents/?user_id=${userId}`;
    
    if (status && status !== 'ALL') {
      const sep = url.includes('?') ? '&' : '?';
      if (!url.includes('status=')) {
        url += `${sep}status=${status}`;
      }
    }
    
    return apiFetch<any>(url, { token });
  },

  async getById(id: string, token: string) {
    return apiFetch<any>(`/api/documents/${id}/`, { token });
  },

  async delete(id: string, token: string) {
    return apiFetch(`/api/documents/${id}/`, {
      method: 'DELETE',
      token,
    });
  },

  async upload(formData: FormData, token: string) {
    return apiFetch<any>('/api/upload/', {
      method: 'POST',
      token,
      body: formData,
    });
  }
};

/**
 * Admin Services
 */
export const adminService = {
  async getUsers(token: string, customUrl?: string) {
    const url = customUrl || '/api/admin/users/';
    return apiFetch<any>(url, { token });
  },

  async deleteUser(id: number | string, token: string) {
    return apiFetch(`/api/admin/users/${id}/`, {
      method: 'DELETE',
      token,
    });
  }
};

export const api = {
  auth: authService,
  documents: documentService,
  admin: adminService,
};
