export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  tags: string;
  author: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl: string | null;
  organizer: string;
  capacity: number | null;
  registrationUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContentType = 'news' | 'blog' | 'shop' | 'agenda';

export interface ApiResponse<T> {
  items: T[];
  total: number;
}

export interface ApiSingleResponse {
  id: string;
  [key: string]: unknown;
}
