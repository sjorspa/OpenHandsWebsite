import type { NewsArticle, BlogPost, Shop, AgendaItem, ApiResponse } from '../types';

const API_BASE = '/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...((options?.headers as Record<string, string>) || {}) },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return {} as T;
}

export const api = {
  // News
  getNews: (params?: { latest?: number; limit?: number; offset?: number }): Promise<ApiResponse<NewsArticle>> =>
    request(`${API_BASE}/news${new URLSearchParams(params as Record<string, string>).toString() ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getNewsArticle: (id: string): Promise<NewsArticle> =>
    request(`${API_BASE}/news/${id}`),

  createNews: (data: Partial<NewsArticle>): Promise<NewsArticle> =>
    request(`${API_BASE}/news`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNews: (id: string, data: Partial<NewsArticle>): Promise<NewsArticle> =>
    request(`${API_BASE}/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNews: (id: string): Promise<void> =>
    request(`${API_BASE}/news/${id}`, { method: 'DELETE' }),

  // Blog
  getBlog: (params?: { latest?: number; limit?: number; offset?: number }): Promise<ApiResponse<BlogPost>> =>
    request(`${API_BASE}/blog${new URLSearchParams(params as Record<string, string>).toString() ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getBlogPost: (id: string): Promise<BlogPost> =>
    request(`${API_BASE}/blog/${id}`),

  createBlog: (data: Partial<BlogPost>): Promise<BlogPost> =>
    request(`${API_BASE}/blog`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBlog: (id: string, data: Partial<BlogPost>): Promise<BlogPost> =>
    request(`${API_BASE}/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBlog: (id: string): Promise<void> =>
    request(`${API_BASE}/blog/${id}`, { method: 'DELETE' }),

  // Shops
  getShops: (params?: { featured?: number; random?: number; limit?: number; offset?: number }): Promise<ApiResponse<Shop>> =>
    request(`${API_BASE}/shops${new URLSearchParams(params as Record<string, string>).toString() ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getShop: (id: string): Promise<Shop> =>
    request(`${API_BASE}/shops/${id}`),

  getFeaturedShops: (count?: number): Promise<ApiResponse<Shop>> =>
    request(`${API_BASE}/shops?featured=${count || 6}`),

  getRandomShops: (count?: number): Promise<ApiResponse<Shop>> =>
    request(`${API_BASE}/shops?random=${count || 4}`),

  createShop: (data: Partial<Shop>): Promise<Shop> =>
    request(`${API_BASE}/shops`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateShop: (id: string, data: Partial<Shop>): Promise<Shop> =>
    request(`${API_BASE}/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteShop: (id: string): Promise<void> =>
    request(`${API_BASE}/shops/${id}`, { method: 'DELETE' }),

  // Agenda
  getAgenda: (params?: { upcoming?: number; limit?: number; offset?: number }): Promise<ApiResponse<AgendaItem>> =>
    request(`${API_BASE}/agenda${new URLSearchParams(params as Record<string, string>).toString() ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`),

  getAgendaItem: (id: string): Promise<AgendaItem> =>
    request(`${API_BASE}/agenda/${id}`),

  getUpcomingAgenda: (count?: number): Promise<ApiResponse<AgendaItem>> =>
    request(`${API_BASE}/agenda?upcoming=${count || 5}`),

  createAgenda: (data: Partial<AgendaItem>): Promise<AgendaItem> =>
    request(`${API_BASE}/agenda`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAgenda: (id: string, data: Partial<AgendaItem>): Promise<AgendaItem> =>
    request(`${API_BASE}/agenda/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAgenda: (id: string): Promise<void> =>
    request(`${API_BASE}/agenda/${id}`, { method: 'DELETE' }),
};
