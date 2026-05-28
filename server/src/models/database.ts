import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  slug: string;
  id: string;
  name: string;
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
  slug: string;
  id: string;
  title: string;
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

export class DatabaseConnection {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        image_url TEXT,
        author TEXT NOT NULL DEFAULT 'Admin',
        published_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        slug TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        image_url TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        author TEXT NOT NULL DEFAULT 'Admin',
        published_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        slug TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        address TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        website TEXT,
        latitude REAL,
        longitude REAL,
        featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        slug TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agenda_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        organizer TEXT NOT NULL DEFAULT '',
        capacity INTEGER,
        registration_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        slug TEXT UNIQUE NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_shops_featured ON shops(featured);
      CREATE INDEX IF NOT EXISTS idx_agenda_dates ON agenda_items(start_date);
    `);

    // Migrate existing tables to add slug column if missing
    this.migrateSlugColumns();
  }

  private migrateSlugColumns(): void {
    // Migrate shops table
    const shopsColumns = this.db.prepare("PRAGMA table_info(shops)").all() as { name: string }[];
    if (!shopsColumns.some((c) => c.name === 'slug')) {
      this.db.exec('ALTER TABLE shops ADD COLUMN slug TEXT DEFAULT ""');
      // Populate slug for existing shops
      const allShops = this.db.prepare('SELECT id, name FROM shops WHERE slug = ""').all() as { id: string; name: string }[];
      for (const shop of allShops) {
        const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        this.db.prepare('UPDATE shops SET slug = ? WHERE id = ?').run(slug, shop.id);
      }
      this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug)');
    }

    // Migrate agenda_items table
    const agendaColumns = this.db.prepare("PRAGMA table_info(agenda_items)").all() as { name: string }[];
    if (!agendaColumns.some((c) => c.name === 'slug')) {
      this.db.exec('ALTER TABLE agenda_items ADD COLUMN slug TEXT DEFAULT ""');
      // Populate slug for existing agenda items
      const allItems = this.db.prepare('SELECT id, title FROM agenda_items WHERE slug = ""').all() as { id: string; title: string }[];
      for (const item of allItems) {
        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        this.db.prepare('UPDATE agenda_items SET slug = ? WHERE id = ?').run(slug, item.id);
      }
      this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_agenda_items_slug ON agenda_items(slug)');
    }
  }

  // News Article methods
  createNewsArticle(data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>): NewsArticle {
    const stmt = this.db.prepare(`
      INSERT INTO news_articles (id, title, slug, content, excerpt, image_url, author, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const article: NewsArticle = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    stmt.run(
      article.id, article.title, article.slug, article.content,
      article.excerpt, article.imageUrl, article.author, article.publishedAt
    );
    return article;
  }

  getNewsArticle(id: string): NewsArticle | undefined {
    const stmt = this.db.prepare('SELECT * FROM news_articles WHERE id = ?');
    return stmt.get(id) as NewsArticle | undefined;
  }

  getNewsArticles(opts?: { limit?: number; offset?: number }): NewsArticle[] {
    const stmt = this.db.prepare(
      'SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ? OFFSET ?'
    );
    return stmt.all(opts?.limit ?? 50, opts?.offset ?? 0) as NewsArticle[];
  }

  getLatestNewsArticles(count: number = 5): NewsArticle[] {
    const stmt = this.db.prepare(
      'SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ?'
    );
    return stmt.all(count) as NewsArticle[];
  }

  updateNewsArticle(id: string, data: Partial<NewsArticle>): NewsArticle | undefined {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    const fields = ['title', 'slug', 'content', 'excerpt', 'imageUrl', 'author', 'publishedAt'] as const;
    for (const field of fields) {
      const key = field === 'imageUrl' ? 'image_url' : field;
      if (data[field] !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(data[field]);
      }
    }
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    const stmt = this.db.prepare(`UPDATE news_articles SET ${setClauses.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getNewsArticle(id);
  }

  deleteNewsArticle(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM news_articles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getNewsArticleBySlug(slug: string): NewsArticle | undefined {
    const stmt = this.db.prepare('SELECT * FROM news_articles WHERE slug = ?');
    return stmt.get(slug) as NewsArticle | undefined;
  }

  searchNewsArticles(query: string): NewsArticle[] {
    const stmt = this.db.prepare(
      'SELECT * FROM news_articles WHERE title LIKE ? OR content LIKE ? ORDER BY published_at DESC'
    );
    return stmt.all(`%${query}%`, `%${query}%`) as NewsArticle[];
  }

  // Blog Post methods
  createBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): BlogPost {
    const stmt = this.db.prepare(`
      INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, tags, author, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const post: BlogPost = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    stmt.run(
      post.id, post.title, post.slug, post.content, post.excerpt,
      post.imageUrl, post.tags, post.author, post.publishedAt
    );
    return post;
  }

  getBlogPost(id: string): BlogPost | undefined {
    const stmt = this.db.prepare('SELECT * FROM blog_posts WHERE id = ?');
    return stmt.get(id) as BlogPost | undefined;
  }

  getBlogPosts(opts?: { limit?: number; offset?: number }): BlogPost[] {
    const stmt = this.db.prepare(
      'SELECT * FROM blog_posts ORDER BY published_at DESC LIMIT ? OFFSET ?'
    );
    return stmt.all(opts?.limit ?? 50, opts?.offset ?? 0) as BlogPost[];
  }

  getLatestBlogPosts(count: number = 5): BlogPost[] {
    const stmt = this.db.prepare(
      'SELECT * FROM blog_posts ORDER BY published_at DESC LIMIT ?'
    );
    return stmt.all(count) as BlogPost[];
  }

  updateBlogPost(id: string, data: Partial<BlogPost>): BlogPost | undefined {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    const fields = ['title', 'slug', 'content', 'excerpt', 'imageUrl', 'tags', 'author', 'publishedAt'] as const;
    for (const field of fields) {
      const key = field === 'imageUrl' ? 'image_url' : field;
      if (data[field] !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(data[field]);
      }
    }
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    const stmt = this.db.prepare(`UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getBlogPost(id);
  }

  deleteBlogPost(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM blog_posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getBlogPostBySlug(slug: string): BlogPost | undefined {
    const stmt = this.db.prepare('SELECT * FROM blog_posts WHERE slug = ?');
    return stmt.get(slug) as BlogPost | undefined;
  }

  searchBlogPosts(query: string): BlogPost[] {
    const stmt = this.db.prepare(
      'SELECT * FROM blog_posts WHERE title LIKE ? OR content LIKE ? ORDER BY published_at DESC'
    );
    return stmt.all(`%${query}%`, `%${query}%`) as BlogPost[];
  }

  // Shop methods
  createShop(data: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Shop {
    const stmt = this.db.prepare(`
      INSERT INTO shops (id, name, description, slug, image_url, address, phone, email, website, latitude, longitude, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const shop: Shop = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    stmt.run(
      shop.id, shop.name, shop.description, shop.slug, shop.imageUrl,
      shop.address, shop.phone, shop.email, shop.website,
      shop.latitude, shop.longitude, shop.featured ? 1 : 0
    );
    return shop;
  }

  getShopBySlug(slug: string): Shop | undefined {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE slug = ?');
    return stmt.get(slug) as Shop | undefined;
  }

  getShop(id: string): Shop | undefined {
    const stmt = this.db.prepare('SELECT * FROM shops WHERE id = ?');
    const row = stmt.get(id) as Shop | undefined;
    if (row) {
      row.featured = !!row.featured;
    }
    return row;
  }

  getShops(opts?: { limit?: number; offset?: number; featured?: boolean }): Shop[] {
    let sql = 'SELECT * FROM shops';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts?.featured !== undefined) {
      conditions.push('featured = ?');
      params.push(opts.featured ? 1 : 0);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(opts?.limit ?? 50, opts?.offset ?? 0);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Shop[];
    return rows.map(r => ({ ...r, featured: !!r.featured }));
  }

  getFeaturedShops(count: number = 6): Shop[] {
    const stmt = this.db.prepare(
      'SELECT * FROM shops WHERE featured = 1 ORDER BY RANDOM() LIMIT ?'
    );
    const rows = stmt.all(count) as Shop[];
    return rows.map(r => ({ ...r, featured: !!r.featured }));
  }

  getRandomShops(count: number = 4): Shop[] {
    const stmt = this.db.prepare(
      'SELECT * FROM shops ORDER BY RANDOM() LIMIT ?'
    );
    const rows = stmt.all(count) as Shop[];
    return rows.map(r => ({ ...r, featured: !!r.featured }));
  }

  updateShop(id: string, data: Partial<Shop>): Shop | undefined {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    const fields = ['name', 'description', 'imageUrl', 'address', 'phone', 'email', 'website', 'latitude', 'longitude', 'featured'] as const;
    for (const field of fields) {
      const key = field === 'imageUrl' ? 'image_url' : field;
      if (data[field] !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(field === 'featured' ? (data[field] ? 1 : 0) : data[field]);
      }
    }
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    const stmt = this.db.prepare(`UPDATE shops SET ${setClauses.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getShop(id);
  }

  deleteShop(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM shops WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  searchShops(query: string): Shop[] {
    const stmt = this.db.prepare(
      'SELECT * FROM shops WHERE name LIKE ? OR description LIKE ? OR address LIKE ? ORDER BY name'
    );
    const rows = stmt.all(`%${query}%`, `%${query}%`, `%${query}%`) as Shop[];
    return rows.map(r => ({ ...r, featured: !!r.featured }));
  }

  // Agenda Item methods
  createAgendaItem(data: Omit<AgendaItem, 'id' | 'createdAt' | 'updatedAt'>): AgendaItem {
    const stmt = this.db.prepare(`
      INSERT INTO agenda_items (id, title, slug, description, start_date, end_date, location, image_url, organizer, capacity, registration_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const item: AgendaItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    stmt.run(
      item.id, item.title, item.slug, item.description, item.startDate, item.endDate,
      item.location, item.imageUrl, item.organizer, item.capacity, item.registrationUrl
    );
    return item;
  }

  getAgendaItemBySlug(slug: string): AgendaItem | undefined {
    const stmt = this.db.prepare('SELECT * FROM agenda_items WHERE slug = ?');
    return stmt.get(slug) as AgendaItem | undefined;
  }

  getAgendaItem(id: string): AgendaItem | undefined {
    const stmt = this.db.prepare('SELECT * FROM agenda_items WHERE id = ?');
    return stmt.get(id) as AgendaItem | undefined;
  }

  getAgendaItems(opts?: { limit?: number; offset?: number; upcoming?: boolean }): AgendaItem[] {
    let sql = 'SELECT * FROM agenda_items';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts?.upcoming) {
      conditions.push('end_date >= ?');
      params.push(new Date().toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY start_date ASC LIMIT ? OFFSET ?';
    params.push(opts?.limit ?? 50, opts?.offset ?? 0);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as AgendaItem[];
  }

  getUpcomingAgendaItems(count: number = 5): AgendaItem[] {
    const stmt = this.db.prepare(
      `SELECT * FROM agenda_items
       WHERE end_date >= ?
       ORDER BY start_date ASC
       LIMIT ?`
    );
    return stmt.all(new Date().toISOString(), count) as AgendaItem[];
  }

  updateAgendaItem(id: string, data: Partial<AgendaItem>): AgendaItem | undefined {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    const fields = ['title', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'organizer', 'capacity', 'registrationUrl'] as const;
    for (const field of fields) {
      const key = field === 'imageUrl' ? 'image_url' : field;
      if (data[field] !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(data[field]);
      }
    }
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    const stmt = this.db.prepare(`UPDATE agenda_items SET ${setClauses.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getAgendaItem(id);
  }

  deleteAgendaItem(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM agenda_items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  searchAgendaItems(query: string): AgendaItem[] {
    const stmt = this.db.prepare(
      'SELECT * FROM agenda_items WHERE title LIKE ? OR description LIKE ? OR location LIKE ? ORDER BY start_date'
    );
    return stmt.all(`%${query}%`, `%${query}%`, `%${query}%`) as AgendaItem[];
  }

  // Count methods
  getNewsArticleCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM news_articles');
    return (stmt.get() as { count: number }).count;
  }

  getBlogPostCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM blog_posts');
    return (stmt.get() as { count: number }).count;
  }

  getShopCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM shops');
    return (stmt.get() as { count: number }).count;
  }

  getAgendaItemCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM agenda_items');
    return (stmt.get() as { count: number }).count;
  }

  // Seed sample data
  seedSampleData(): void {
    const newsCount = this.getNewsArticleCount();
    if (newsCount > 0) return; // Already seeded

    const now = new Date();

    // Sample News Articles
    const newsArticles = [
      {
        title: 'City Launches New Digital Transformation Initiative',
        slug: 'city-digital-transformation-2025',
        content: 'The city council has approved a comprehensive digital transformation plan that will modernize public services, improve citizen engagement, and streamline government operations. The initiative includes investments in cloud infrastructure, mobile applications, and data analytics platforms.\n\nKey components of the plan include:\n\n1. Digital citizen portal for online services\n2. Mobile app for real-time updates\n3. AI-powered customer service chatbot\n4. Open data platform for transparency\n5. Cybersecurity enhancement program\n\nThe project is expected to be completed over the next 18 months with a budget of $50 million.',
        excerpt: 'City council approves $50M digital transformation plan to modernize public services and improve citizen engagement through technology.',
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
        author: 'Sarah Johnson',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Local Tech Startup Raises $20M in Series A Funding',
        slug: 'startup-series-a-funding-2025',
        content: 'A promising local technology startup has successfully closed a $20 million Series A funding round, led by a prominent venture capital firm. The company, which develops AI-powered solutions for small businesses, plans to use the funding to expand its team and grow its product offerings.\n\nThe startup was founded three years ago by a team of engineers from leading tech companies. Their platform helps small businesses automate customer interactions, manage inventory, and analyze sales data.\n\n"We are thrilled to partner with these investors who share our vision of empowering small businesses with enterprise-grade technology," said the CEO.',
        excerpt: 'AI-powered small business platform secures major funding round to expand operations and grow the team.',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop',
        author: 'Michael Chen',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Annual Community Festival Returns This Summer',
        slug: 'community-festival-summer-2025',
        content: 'The beloved annual Community Festival is back for its 25th anniversary! The three-day event will feature live music, local food vendors, art exhibitions, and activities for the whole family.\n\nThis year\'s festival will take place at Central Park and will feature over 100 local vendors, 20 live performances, and a special anniversary celebration.\n\nHighlights include:\n- Main stage with local and regional bands\n- Food court featuring 50+ local restaurants\n- Children\'s activity zone\n- Art marketplace\n- Fireworks finale on Saturday night\n\nAdmission is free and the event is open to the public.',
        excerpt: 'The 25th annual Community Festival returns with 100+ vendors, 20 live performances, and free admission.',
        imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
        author: 'Emily Rodriguez',
        publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'New Public Transit Line to Connect Downtown with Suburbs',
        slug: 'new-transit-line-2025',
        content: 'Transportation authorities have announced the construction of a new light rail line that will connect downtown with several suburban communities. The 12-mile route will include 15 stations and is expected to serve over 30,000 daily commuters.\n\nThe project has been in planning for over five years and finally received federal funding approval last year. Construction is expected to begin next spring with an anticipated completion date of 2028.\n\n"This transit line will transform how people commute in our region," said the Transportation Director. "It will reduce traffic congestion, lower carbon emissions, and provide reliable transportation options for thousands of residents."',
        excerpt: 'New 12-mile light rail line will connect downtown with suburbs, serving 30,000 daily commuters by 2028.',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
        author: 'David Park',
        publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Tech Conference 2025 Announces Star-Studded Speaker Lineup',
        slug: 'tech-conference-2025-speakers',
        content: 'The annual Technology Innovation Conference has revealed its impressive lineup of speakers for this year\'s event. Industry leaders from top technology companies will share insights on AI, cloud computing, cybersecurity, and the future of tech.\n\nThe two-day conference will take place at the Convention Center and will feature:\n- Keynote speeches from industry pioneers\n- Technical workshops and hands-on sessions\n- Networking events and meetups\n- Startup pitch competition\n- Career fair with top tech employers\n\nEarly bird tickets are available at a discounted price until the end of the month.',
        excerpt: 'Annual Tech Conference reveals impressive speaker lineup with industry leaders from top tech companies.',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
        author: 'Lisa Wang',
        publishedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const article of newsArticles) {
      this.createNewsArticle(article);
    }

    // Sample Blog Posts
    const blogPosts = [
      {
        title: 'Getting Started with Modern Web Development in 2025',
        slug: 'modern-web-development-2025',
        content: 'Web development has evolved significantly over the past year. Here\'s a comprehensive guide to getting started with the latest tools and frameworks.\n\n## Choosing the Right Stack\n\nThe modern web development landscape offers many excellent options:\n\n### Frontend Frameworks\n- React with Next.js for full-stack applications\n- Vue 3 with Nuxt for progressive frameworks\n- SvelteKit for lightweight, fast applications\n\n### Backend Options\n- Node.js with Express or Fastify\n- Python with FastAPI\n- Go for high-performance services\n\n### Database Choices\n- PostgreSQL for relational data\n- MongoDB for document storage\n- Redis for caching and sessions\n\n## Development Best Practices\n\n1. Use TypeScript for type safety\n2. Implement proper testing strategies\n3. Follow accessibility guidelines\n4. Optimize for performance from the start\n5. Use version control effectively',
        excerpt: 'A comprehensive guide to modern web development tools, frameworks, and best practices for 2025.',
        imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
        tags: 'web development, programming, tutorial',
        author: 'Alex Thompson',
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'The Future of Artificial Intelligence: Trends to Watch',
        slug: 'ai-future-trends-2025',
        content: 'Artificial intelligence continues to reshape every industry. Here are the key trends that will define AI in 2025 and beyond.\n\n## 1. Multimodal AI Systems\n\nAI models are becoming increasingly multimodal, capable of understanding and generating text, images, audio, and video simultaneously.\n\n## 2. Edge AI\n\nRunning AI models locally on devices rather than in the cloud is becoming more practical with improved hardware efficiency.\n\n## 3. AI Ethics and Governance\n\nAs AI becomes more powerful, there\'s growing emphasis on responsible development, transparency, and accountability.\n\n## 4. AI-Powered Development Tools\n\nDeveloper tools are being transformed by AI, from code completion to automated testing and deployment.\n\n## 5. Industry-Specific AI Solutions\n\nVertical AI solutions tailored for healthcare, finance, education, and other industries are gaining traction.\n\nStay informed and adapt to these trends to stay ahead in the rapidly evolving AI landscape.',
        excerpt: 'Exploring the key AI trends shaping 2025: multimodal systems, edge AI, ethics, and industry-specific solutions.',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        tags: 'AI, technology, trends',
        author: 'Dr. Rachel Kim',
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Building Resilient Applications with Microservices Architecture',
        slug: 'microservices-architecture-guide',
        content: 'Microservices architecture has become the go-to approach for building scalable, resilient applications. Here\'s everything you need to know.\n\n## Why Microservices?\n\nMonolithic applications become difficult to scale and maintain as they grow. Microservices address these challenges by breaking applications into smaller, independent services.\n\n## Key Principles\n\n1. **Single Responsibility**: Each service handles one business capability\n2. **Decentralized Data Management**: Services manage their own data\n3. **Failure Isolation**: Failures in one service don\'t cascade\n4. **Independent Deployment**: Services can be deployed independently\n5. **API-First Design**: Clear, well-documented interfaces\n\n## Getting Started\n\n- Start with a clear domain model\n- Define service boundaries carefully\n- Implement proper monitoring and logging\n- Use containerization for consistency\n- Plan for service discovery and communication\n\n## Common Pitfalls\n\n- Over-engineering from the start\n- Ignoring network reliability\n- Poor service boundaries\n- Inadequate monitoring',
        excerpt: 'A practical guide to microservices architecture: principles, getting started, and common pitfalls to avoid.',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
        tags: 'architecture, microservices, software engineering',
        author: 'James Wilson',
        publishedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Sustainable Living: Tips for Eco-Friendly Urban Life',
        slug: 'sustainable-urban-living-tips',
        content: 'Living sustainably in an urban environment is more achievable than you might think. Here are practical tips for reducing your environmental impact.\n\n## Energy Efficiency\n\n- Switch to LED lighting throughout your home\n- Use smart thermostats to optimize heating and cooling\n- Choose energy-efficient appliances\n- Unplug devices when not in use\n\n## Sustainable Transportation\n\n- Use public transit whenever possible\n- Consider cycling for short distances\n- Carpool when driving is necessary\n- Explore electric or hybrid vehicle options\n\n## Food and Shopping\n\n- Shop at local farmers markets\n- Reduce meat consumption\n- Buy in bulk to reduce packaging\n- Support businesses with sustainable practices\n\n## Waste Reduction\n\n- Compost organic waste\n- Recycle properly\n- Avoid single-use plastics\n- Donate or sell items instead of throwing them away\n\nEvery small step makes a difference. Start with one or two changes and build from there.',
        excerpt: 'Practical tips for sustainable urban living: energy efficiency, eco-friendly transportation, and waste reduction.',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
        tags: 'sustainability, lifestyle, environment',
        author: 'Maria Garcia',
        publishedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const post of blogPosts) {
      this.createBlogPost(post);
    }

    // Sample Shops
    const shops = [
      {
        name: 'The Artisan Bakery',
        slug: 'artisan-bakery',
        description: 'Artisanal breads, pastries, and custom cakes made with locally sourced ingredients. Famous for our sourdough and croissants.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=400&fit=crop',
        address: '123 Main Street, Downtown',
        phone: '(555) 123-4567',
        email: 'hello@artisanbakery.com',
        website: 'https://artisanbakery.example.com',
        latitude: 40.7128,
        longitude: -74.006,
        featured: true,
      },
      {
        name: 'TechHub Electronics',
        slug: 'techhub-electronics',
        description: 'Your one-stop shop for the latest electronics, gadgets, and tech accessories. Expert staff and competitive prices.',
        imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=400&fit=crop',
        address: '456 Tech Boulevard, Innovation District',
        phone: '(555) 234-5678',
        email: 'info@techhub.com',
        website: 'https://techhub.example.com',
        latitude: 40.7138,
        longitude: -74.007,
        featured: true,
      },
      {
        name: 'Green Leaf Bookstore',
        slug: 'green-leaf-bookstore',
        description: 'A charming independent bookstore with a curated selection of fiction, non-fiction, and children\'s books. Hosts regular author events.',
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=400&fit=crop',
        address: '789 Oak Avenue, Book Quarter',
        phone: '(555) 345-6789',
        email: 'books@greenleaf.com',
        website: null,
        latitude: 40.7148,
        longitude: -74.008,
        featured: false,
      },
      {
        name: 'Urban Fitness Studio',
        slug: 'urban-fitness-studio',
        description: 'Modern fitness studio offering personal training, group classes, yoga, and nutrition coaching. State-of-the-art equipment.',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
        address: '321 Fitness Lane, Health District',
        phone: '(555) 456-7890',
        email: 'train@urbanfitness.com',
        website: 'https://urbanfitness.example.com',
        latitude: 40.7158,
        longitude: -74.009,
        featured: true,
      },
      {
        name: 'Vintage Treasures',
        slug: 'vintage-treasures',
        description: 'Curated collection of vintage and antique items including furniture, decor, jewelry, and collectibles from the 1920s to 1980s.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
        address: '555 Vintage Way, Antique Row',
        phone: '(555) 567-8901',
        email: 'hello@vintagetreasures.com',
        website: null,
        latitude: 40.7168,
        longitude: -74.01,
        featured: false,
      },
      {
        name: 'Floral Designs',
        slug: 'floral-designs',
        description: 'Custom floral arrangements for weddings, events, and everyday occasions. Fresh flowers sourced from local growers.',
        imageUrl: 'https://images.unsplash.com/photo-148753081117c-20942f1a3ef1?w=800&h=400&fit=crop',
        address: '888 Garden Road, Flower District',
        phone: '(555) 678-9012',
        email: 'flowers@floraldesigns.com',
        website: 'https://floraldesigns.example.com',
        latitude: 40.7178,
        longitude: -74.011,
        featured: true,
      },
      {
        name: 'Coffee House Central',
        slug: 'coffee-house-central',
        description: 'Specialty coffee roasters serving single-origin espresso, pour-overs, and artisanal coffee-based beverages in a cozy atmosphere.',
        imageUrl: 'https://images.unsplash.com/photo-1501339841348-30c45808eb01?w=800&h=400&fit=crop',
        address: '222 Coffee Street, Downtown',
        phone: '(555) 789-0123',
        email: 'hello@coffeehousecentral.com',
        website: 'https://coffeehousecentral.example.com',
        latitude: 40.7188,
        longitude: -74.012,
        featured: false,
      },
      {
        name: 'The Book Nook Café',
        slug: 'the-book-nook-cafe',
        description: 'A unique combination bookstore and café where you can browse books while enjoying artisan coffee and homemade pastries.',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop',
        address: '100 Reading Lane, Book Quarter',
        phone: '(555) 890-1234',
        email: 'cafe@booknook.com',
        website: null,
        latitude: 40.7198,
        longitude: -74.013,
        featured: false,
      },
    ];

    for (const shop of shops) {
      this.createShop(shop);
    }

    // Sample Agenda Items
    const agendaItems = [
      {
        title: 'Spring Music Festival',
        slug: 'spring-music-festival',
        description: 'A three-day outdoor music festival featuring local and regional bands across multiple stages. Food vendors, art installations, and camping available.',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Central Park Amphitheater',
        imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
        organizer: 'City Arts Council',
        capacity: 5000,
        registrationUrl: 'https://springmusicfest.example.com',
      },
      {
        title: 'Tech Innovation Summit 2025',
        slug: 'tech-innovation-summit-2025',
        description: 'Join industry leaders for a day of keynotes, panels, and workshops on the latest trends in technology, AI, and digital transformation.',
        startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 46 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Convention Center, Hall A',
        imageUrl: 'https://images.unsplash.com/photo-1505373877721-60d0a3e17a6b?w=800&h=400&fit=crop',
        organizer: 'Tech Innovation Alliance',
        capacity: 2000,
        registrationUrl: 'https://techsummit.example.com',
      },
      {
        title: 'Community Farmers Market',
        slug: 'community-farmers-market',
        description: 'Weekly farmers market featuring fresh produce, artisan foods, handmade crafts, and live music. Every Saturday morning year-round.',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Town Square',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-38db36933a83?w=800&h=400&fit=crop',
        organizer: 'Community Association',
        capacity: null,
        registrationUrl: null,
      },
      {
        title: 'Charity Marathon for Education',
        slug: 'charity-marathon-education',
        description: 'Annual charity marathon with 5K, 10K, and full marathon options. All proceeds support local education programs and scholarships.',
        startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'City Hall to Riverside Park',
        imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aa85e0a0b4c?w=800&h=400&fit=crop',
        organizer: 'Education Foundation',
        capacity: 3000,
        registrationUrl: 'https://charitymarathon.example.com',
      },
      {
        title: 'Art & Crafts Workshop Series',
        slug: 'art-crafts-workshop-series',
        description: 'Monthly workshop series covering pottery, painting, weaving, and other traditional crafts. All skill levels welcome. Materials provided.',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Community Arts Center',
        imageUrl: 'https://images.unsplash.com/photo-1465846731037-0ee90160f64c?w=800&h=400&fit=crop',
        organizer: 'Community Arts Center',
        capacity: 30,
        registrationUrl: 'https://artsworkshop.example.com',
      },
    ];

    for (const item of agendaItems) {
      this.createAgendaItem(item);
    }
  }

  getSeedStatus(): { newsCount: number; blogCount: number; shopCount: number; agendaCount: number } {
    return {
      newsCount: this.getNewsArticleCount(),
      blogCount: this.getBlogPostCount(),
      shopCount: this.getShopCount(),
      agendaCount: this.getAgendaItemCount(),
    };
  }
}
