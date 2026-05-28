import Fastify from 'fastify';
import cors from "@fastify/cors";
import { DatabaseConnection } from './models/database.js';
import { newsRoutes, blogRoutes, shopRoutes, agendaRoutes } from './routes/index.js';

const app = Fastify({
  logger: true,
  disableRequestLogging: false,
});

// CORS configuration
await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
});

// Create database connection (SQLite file)
const dbPath = process.env.DB_PATH || './data/cms.db';
const db = new DatabaseConnection(dbPath);

// Seed sample data if empty
const seedStatus = db.getSeedStatus();
if (seedStatus.newsCount === 0) {
  db.seedSampleData();
}

// Health check endpoint
app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.getSeedStatus(),
  };
});

// API v1 routes
const apiV1 = '/api/v1';

// News routes
app.register(async (instance) => {
  instance.get('/', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    if (query.latest) {
      const count = typeof query.latest === 'string' ? parseInt(query.latest, 10) || 5 : 5;
      const articles = db.getLatestNewsArticles(count);
      return reply.send({ items: articles, total: db.getNewsArticleCount() });
    }
    const items = db.getNewsArticles({ limit: 50, offset: 0 });
    return reply.send({ items, total: db.getNewsArticleCount() });
  });

  instance.get('/search', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    const results = db.searchNewsArticles(q);
    return reply.send({ items: results, total: results.length });
  });

  instance.get('/:id', (req, reply) => {
    const article = db.getNewsArticle(req.params as any);
    if (!article) return reply.code(404).send({ error: 'News article not found' });
    return reply.send(article);
  });

  instance.post('/', (req, reply) => {
    const body = req.body as any;
    const title = (body.title || '').toString().trim();
    const content = (body.content || '').toString();
    if (!title) return reply.code(400).send({ error: 'Title is required' });
    if (!content) return reply.code(400).send({ error: 'Content is required' });
    const article = db.createNewsArticle({
      title,
      slug: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim() || Date.now().toString(),
      content,
      excerpt: (body.excerpt || '').toString().trim() || content.slice(0, 200),
      imageUrl: body.imageUrl || null,
      author: (body.author || 'Admin').toString().trim(),
      publishedAt: body.publishedAt || new Date().toISOString(),
    });
    return reply.code(201).send(article);
  });

  instance.put('/:id', (req, reply) => {
    const existing = db.getNewsArticle(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'News article not found' });
    const body = req.body as any;
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.toString().trim();
    if (body.content !== undefined) updateData.content = body.content.toString();
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt.toString();
    if (body.author !== undefined) updateData.author = body.author.toString();
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    const article = db.updateNewsArticle(req.params as any, updateData);
    return reply.send(article);
  });

  instance.delete('/:id', (req, reply) => {
    const existing = db.getNewsArticle(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'News article not found' });
    db.deleteNewsArticle(req.params as any);
    return reply.code(204).send();
  });
}, { prefix: `${apiV1}/news` });

// Blog routes
app.register(async (instance) => {
  instance.get('/', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    if (query.latest) {
      const count = typeof query.latest === 'string' ? parseInt(query.latest, 10) || 5 : 5;
      const posts = db.getLatestBlogPosts(count);
      return reply.send({ items: posts, total: db.getBlogPostCount() });
    }
    const items = db.getBlogPosts({ limit: 50, offset: 0 });
    return reply.send({ items, total: db.getBlogPostCount() });
  });

  instance.get('/search', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    const results = db.searchBlogPosts(q);
    return reply.send({ items: results, total: results.length });
  });

  instance.get('/:id', (req, reply) => {
    const post = db.getBlogPost(req.params as any);
    if (!post) return reply.code(404).send({ error: 'Blog post not found' });
    return reply.send(post);
  });

  instance.post('/', (req, reply) => {
    const body = req.body as any;
    const title = (body.title || '').toString().trim();
    const content = (body.content || '').toString();
    if (!title) return reply.code(400).send({ error: 'Title is required' });
    if (!content) return reply.code(400).send({ error: 'Content is required' });
    const post = db.createBlogPost({
      title,
      slug: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim() || Date.now().toString(),
      content,
      excerpt: (body.excerpt || '').toString().trim() || content.slice(0, 200),
      imageUrl: body.imageUrl || null,
      tags: (body.tags || '[]').toString(),
      author: (body.author || 'Admin').toString().trim(),
      publishedAt: body.publishedAt || new Date().toISOString(),
    });
    return reply.code(201).send(post);
  });

  instance.put('/:id', (req, reply) => {
    const existing = db.getBlogPost(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Blog post not found' });
    const body = req.body as any;
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.toString().trim();
    if (body.content !== undefined) updateData.content = body.content.toString();
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt.toString();
    if (body.tags !== undefined) updateData.tags = body.tags.toString();
    if (body.author !== undefined) updateData.author = body.author.toString();
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    const post = db.updateBlogPost(req.params as any, updateData);
    return reply.send(post);
  });

  instance.delete('/:id', (req, reply) => {
    const existing = db.getBlogPost(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Blog post not found' });
    db.deleteBlogPost(req.params as any);
    return reply.code(204).send();
  });
}, { prefix: `${apiV1}/blog` });

// Shop routes
app.register(async (instance) => {
  instance.get('/', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    if (query.featured) {
      const count = typeof query.featured === 'string' ? parseInt(query.featured, 10) || 6 : 6;
      const shops = db.getFeaturedShops(count);
      return reply.send({ items: shops, total: shops.length });
    }
    if (query.random) {
      const count = typeof query.random === 'string' ? parseInt(query.random, 10) || 4 : 4;
      const shops = db.getRandomShops(count);
      return reply.send({ items: shops, total: shops.length });
    }
    const items = db.getShops({ limit: 50, offset: 0 });
    return reply.send({ items, total: db.getShopCount() });
  });

  instance.get('/search', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    const results = db.searchShops(q);
    return reply.send({ items: results, total: results.length });
  });

  instance.get('/:id', (req, reply) => {
    const shop = db.getShop(req.params as any);
    if (!shop) return reply.code(404).send({ error: 'Shop not found' });
    return reply.send(shop);
  });

  instance.post('/', (req, reply) => {
    const body = req.body as any;
    const name = (body.name || '').toString().trim();
    const description = (body.description || '').toString();
    if (!name) return reply.code(400).send({ error: 'Name is required' });
    if (!description) return reply.code(400).send({ error: 'Description is required' });
    const shop = db.createShop({
      name,
      description,
      imageUrl: body.imageUrl || null,
      address: (body.address || '').toString().trim(),
      phone: (body.phone || '').toString().trim(),
      email: (body.email || '').toString().trim(),
      website: body.website || null,
      latitude: body.latitude !== undefined ? parseFloat(String(body.latitude)) : null,
      longitude: body.longitude !== undefined ? parseFloat(String(body.longitude)) : null,
      featured: body.featured === true,
    });
    return reply.code(201).send(shop);
  });

  instance.put('/:id', (req, reply) => {
    const existing = db.getShop(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Shop not found' });
    const body = req.body as any;
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.toString().trim();
    if (body.description !== undefined) updateData.description = body.description.toString();
    if (body.address !== undefined) updateData.address = body.address.toString();
    if (body.phone !== undefined) updateData.phone = body.phone.toString();
    if (body.email !== undefined) updateData.email = body.email.toString();
    if (body.website !== undefined) updateData.website = body.website || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.featured !== undefined) updateData.featured = body.featured === true;
    if (body.latitude !== undefined) updateData.latitude = parseFloat(String(body.latitude));
    if (body.longitude !== undefined) updateData.longitude = parseFloat(String(body.longitude));
    const shop = db.updateShop(req.params as any, updateData);
    return reply.send(shop);
  });

  instance.delete('/:id', (req, reply) => {
    const existing = db.getShop(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Shop not found' });
    db.deleteShop(req.params as any);
    return reply.code(204).send();
  });
}, { prefix: `${apiV1}/shops` });

// Agenda routes
app.register(async (instance) => {
  instance.get('/', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    if (query.upcoming) {
      const count = typeof query.upcoming === 'string' ? parseInt(query.upcoming, 10) || 5 : 5;
      const items = db.getUpcomingAgendaItems(count);
      return reply.send({ items, total: items.length });
    }
    const allItems = db.getAgendaItems({ limit: 50, offset: 0 });
    return reply.send({ items: allItems, total: db.getAgendaItemCount() });
  });

  instance.get('/search', (req, reply) => {
    const query = req.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    const results = db.searchAgendaItems(q);
    return reply.send({ items: results, total: results.length });
  });

  instance.get('/:id', (req, reply) => {
    const item = db.getAgendaItem(req.params as any);
    if (!item) return reply.code(404).send({ error: 'Agenda item not found' });
    return reply.send(item);
  });

  instance.post('/', (req, reply) => {
    const body = req.body as any;
    const title = (body.title || '').toString().trim();
    const description = (body.description || '').toString();
    const startDate = body.startDate || '';
    const endDate = body.endDate || '';
    if (!title) return reply.code(400).send({ error: 'Title is required' });
    if (!description) return reply.code(400).send({ error: 'Description is required' });
    if (!startDate) return reply.code(400).send({ error: 'Start date is required' });
    if (!endDate) return reply.code(400).send({ error: 'End date is required' });
    const item = db.createAgendaItem({
      title,
      description,
      startDate,
      endDate,
      location: (body.location || '').toString().trim(),
      imageUrl: body.imageUrl || null,
      organizer: (body.organizer || '').toString().trim(),
      capacity: body.capacity !== undefined ? parseInt(String(body.capacity), 10) || null : null,
      registrationUrl: body.registrationUrl || null,
    });
    return reply.code(201).send(item);
  });

  instance.put('/:id', (req, reply) => {
    const existing = db.getAgendaItem(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Agenda item not found' });
    const body = req.body as any;
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.toString().trim();
    if (body.description !== undefined) updateData.description = body.description.toString();
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.location !== undefined) updateData.location = body.location.toString();
    if (body.organizer !== undefined) updateData.organizer = body.organizer.toString();
    if (body.registrationUrl !== undefined) updateData.registrationUrl = body.registrationUrl || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.capacity !== undefined) updateData.capacity = parseInt(String(body.capacity), 10) || null;
    const item = db.updateAgendaItem(req.params as any, updateData);
    return reply.send(item);
  });

  instance.delete('/:id', (req, reply) => {
    const existing = db.getAgendaItem(req.params as any);
    if (!existing) return reply.code(404).send({ error: 'Agenda item not found' });
    db.deleteAgendaItem(req.params as any);
    return reply.code(204).send();
  });
}, { prefix: `${apiV1}/agenda` });

// Global error handler
app.setErrorHandler((error: Error, _request, reply) => {
  app.log.error(error);
  reply.status(500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`CMS API server running on http://localhost:${port}`);
    console.log(`API docs available at http://localhost:${port}/api/v1`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await app.close();
  process.exit(0);
});

export default app;
