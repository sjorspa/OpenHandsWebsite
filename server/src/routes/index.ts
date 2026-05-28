import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseConnection, NewsArticle, BlogPost, Shop, AgendaItem } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

// Slugify utility
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Pagination helper
function parsePagination(query: Record<string, string | string[] | undefined>) {
  const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) || 50 : 50;
  const offset = typeof query.offset === 'string' ? parseInt(query.offset, 10) || 0 : 0;
  return { limit: Math.min(limit, 100), offset: Math.max(offset, 0) };
}

// News Article Routes
export async function newsRoutes(fastify: FastifyInstance, _opts: unknown, db: DatabaseConnection): Promise<void> {
  // GET /api/v1/news - list all or latest news
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const pagination = parsePagination(query);

    // Check for 'latest' parameter
    if (query.latest) {
      const count = typeof query.latest === 'string' ? parseInt(query.latest, 10) || 5 : 5;
      const articles = db.getLatestNewsArticles(count);
      return reply.send({ items: articles, total: db.getNewsArticleCount() });
    }

    const items = db.getNewsArticles(pagination);
    return reply.send({ items, total: db.getNewsArticleCount() });
  });

  // GET /api/v1/news/search - search news
  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) {
      return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    }
    const results = db.searchNewsArticles(q);
    return reply.send({ items: results, total: results.length });
  });

  // GET /api/v1/news/:id - get single news article
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const article = db.getNewsArticle(id);
    if (!article) {
      return reply.code(404).send({ error: 'News article not found' });
    }
    return reply.send(article);
  });

  // GET /api/v1/news/slug/:slug - get news article by slug
  fastify.get('/slug/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const article = db.getNewsArticleBySlug(slug);
    if (!article) {
      return reply.code(404).send({ error: 'News article not found' });
    }
    return reply.send(article);
  });

  // POST /api/v1/news - create news article
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    // Validation
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : 'Admin';
    const publishedAt = typeof body.publishedAt === 'string' ? body.publishedAt : new Date().toISOString();
    const imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : null;

    if (!title) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    if (!content) {
      return reply.code(400).send({ error: 'Content is required' });
    }

    const slug = slugify(title) || uuidv4().slice(0, 8);

    const article = db.createNewsArticle({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200),
      imageUrl,
      author,
      publishedAt,
    });

    return reply.code(201).send(article);
  });

  // PUT /api/v1/news/:id - update news article
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const existing = db.getNewsArticle(id);
    if (!existing) {
      return reply.code(404).send({ error: 'News article not found' });
    }

    const updateData: Partial<NewsArticle> = {};
    if (body.title !== undefined) updateData.title = typeof body.title === 'string' ? body.title.trim() : existing.title;
    if (body.content !== undefined) updateData.content = typeof body.content === 'string' ? body.content : existing.content;
    if (body.excerpt !== undefined) updateData.excerpt = typeof body.excerpt === 'string' ? body.excerpt : existing.excerpt;
    if (body.author !== undefined) updateData.author = typeof body.author === 'string' ? body.author : existing.author;
    if (body.publishedAt !== undefined) updateData.publishedAt = typeof body.publishedAt === 'string' ? body.publishedAt : existing.publishedAt;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : existing.imageUrl;

    if (body.slug !== undefined && typeof body.slug === 'string') {
      updateData.slug = body.slug.trim();
    } else {
      updateData.slug = slugify(updateData.title || existing.title) || existing.slug;
    }

    const article = db.updateNewsArticle(id, updateData);
    return reply.send(article);
  });

  // DELETE /api/v1/news/:id - delete news article
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = db.getNewsArticle(id);
    if (!existing) {
      return reply.code(404).send({ error: 'News article not found' });
    }
    db.deleteNewsArticle(id);
    return reply.code(204).send();
  });
}

// Blog Post Routes
export async function blogRoutes(fastify: FastifyInstance, _opts: unknown, db: DatabaseConnection): Promise<void> {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const pagination = parsePagination(query);

    if (query.latest) {
      const count = typeof query.latest === 'string' ? parseInt(query.latest, 10) || 5 : 5;
      const posts = db.getLatestBlogPosts(count);
      return reply.send({ items: posts, total: db.getBlogPostCount() });
    }

    const items = db.getBlogPosts(pagination);
    return reply.send({ items, total: db.getBlogPostCount() });
  });

  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) {
      return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    }
    const results = db.searchBlogPosts(q);
    return reply.send({ items: results, total: results.length });
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const post = db.getBlogPost(id);
    if (!post) {
      return reply.code(404).send({ error: 'Blog post not found' });
    }
    return reply.send(post);
  });

  fastify.get('/slug/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const post = db.getBlogPostBySlug(slug);
    if (!post) {
      return reply.code(404).send({ error: 'Blog post not found' });
    }
    return reply.send(post);
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : 'Admin';
    const tags = typeof body.tags === 'string' ? body.tags : '';
    const publishedAt = typeof body.publishedAt === 'string' ? body.publishedAt : new Date().toISOString();
    const imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : null;

    if (!title) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    if (!content) {
      return reply.code(400).send({ error: 'Content is required' });
    }

    const slug = slugify(title) || uuidv4().slice(0, 8);

    const post = db.createBlogPost({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200),
      imageUrl,
      tags: tags || '[]',
      author,
      publishedAt,
    });

    return reply.code(201).send(post);
  });

  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const existing = db.getBlogPost(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Blog post not found' });
    }

    const updateData: Partial<BlogPost> = {};
    if (body.title !== undefined) updateData.title = typeof body.title === 'string' ? body.title.trim() : existing.title;
    if (body.content !== undefined) updateData.content = typeof body.content === 'string' ? body.content : existing.content;
    if (body.excerpt !== undefined) updateData.excerpt = typeof body.excerpt === 'string' ? body.excerpt : existing.excerpt;
    if (body.author !== undefined) updateData.author = typeof body.author === 'string' ? body.author : existing.author;
    if (body.tags !== undefined) updateData.tags = typeof body.tags === 'string' ? body.tags : existing.tags;
    if (body.publishedAt !== undefined) updateData.publishedAt = typeof body.publishedAt === 'string' ? body.publishedAt : existing.publishedAt;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : existing.imageUrl;

    if (body.slug !== undefined && typeof body.slug === 'string') {
      updateData.slug = body.slug.trim();
    } else {
      updateData.slug = slugify(updateData.title || existing.title) || existing.slug;
    }

    const post = db.updateBlogPost(id, updateData);
    return reply.send(post);
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = db.getBlogPost(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Blog post not found' });
    }
    db.deleteBlogPost(id);
    return reply.code(204).send();
  });
}

// Shop Routes
export async function shopRoutes(fastify: FastifyInstance, _opts: unknown, db: DatabaseConnection): Promise<void> {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const pagination = parsePagination(query);

    // Featured shops endpoint
    if (query.featured) {
      const count = typeof query.featured === 'string' ? parseInt(query.featured, 10) || 6 : 6;
      const shops = db.getFeaturedShops(count);
      return reply.send({ items: shops, total: shops.length });
    }

    // Random shops endpoint
    if (query.random) {
      const count = typeof query.random === 'string' ? parseInt(query.random, 10) || 4 : 4;
      const shops = db.getRandomShops(count);
      return reply.send({ items: shops, total: shops.length });
    }

    const items = db.getShops(pagination);
    return reply.send({ items, total: db.getShopCount() });
  });

  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) {
      return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    }
    const results = db.searchShops(q);
    return reply.send({ items: results, total: results.length });
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const shop = db.getShop(id);
    if (!shop) {
      return reply.code(404).send({ error: 'Shop not found' });
    }
    return reply.send(shop);
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const website = body.website ? (typeof body.website === 'string' ? body.website : null) : null;
    const imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : null;
    const featured = body.featured === true;
    const latitude = body.latitude !== undefined ? parseFloat(String(body.latitude)) : null;
    const longitude = body.longitude !== undefined ? parseFloat(String(body.longitude)) : null;

    if (!name) {
      return reply.code(400).send({ error: 'Name is required' });
    }
    if (!description) {
      return reply.code(400).send({ error: 'Description is required' });
    }

    const shopSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const shop = db.createShop({
      name,
      description,
      imageUrl,
      address,
      phone,
      email,
      website,
      latitude,
      longitude,
      featured,
      slug: shopSlug,
    });

    return reply.code(201).send(shop);
  });

  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const existing = db.getShop(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Shop not found' });
    }

    const updateData: Partial<Shop> = {};
    if (body.name !== undefined) updateData.name = typeof body.name === 'string' ? body.name.trim() : existing.name;
    if (body.description !== undefined) updateData.description = typeof body.description === 'string' ? body.description : existing.description;
    if (body.address !== undefined) updateData.address = typeof body.address === 'string' ? body.address : existing.address;
    if (body.phone !== undefined) updateData.phone = typeof body.phone === 'string' ? body.phone : existing.phone;
    if (body.email !== undefined) updateData.email = typeof body.email === 'string' ? body.email : existing.email;
    if (body.website !== undefined) updateData.website = body.website ? (typeof body.website === 'string' ? body.website : null) : existing.website;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : existing.imageUrl;
    if (body.featured !== undefined) updateData.featured = body.featured === true;
    if (body.latitude !== undefined) updateData.latitude = parseFloat(String(body.latitude));
    if (body.longitude !== undefined) updateData.longitude = parseFloat(String(body.longitude));

    const shop = db.updateShop(id, updateData);
    return reply.send(shop);
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = db.getShop(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Shop not found' });
    }
    db.deleteShop(id);
    return reply.code(204).send();
  });
}

// Agenda Item Routes
export async function agendaRoutes(fastify: FastifyInstance, _opts: unknown, db: DatabaseConnection): Promise<void> {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const pagination = parsePagination(query);

    // Upcoming items endpoint
    if (query.upcoming) {
      const count = typeof query.upcoming === 'string' ? parseInt(query.upcoming, 10) || 5 : 5;
      const items = db.getUpcomingAgendaItems(count);
      return reply.send({ items, total: items.length });
    }

    const allItems = db.getAgendaItems(pagination);
    return reply.send({ items: allItems, total: db.getAgendaItemCount() });
  });

  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;
    const q = typeof query.q === 'string' ? query.q : '';
    if (!q) {
      return reply.code(400).send({ error: 'Search query parameter "q" is required' });
    }
    const results = db.searchAgendaItems(q);
    return reply.send({ items: results, total: results.length });
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const item = db.getAgendaItem(id);
    if (!item) {
      return reply.code(404).send({ error: 'Agenda item not found' });
    }
    return reply.send(item);
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description : '';
    const startDate = typeof body.startDate === 'string' ? body.startDate : '';
    const endDate = typeof body.endDate === 'string' ? body.endDate : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const organizer = typeof body.organizer === 'string' ? body.organizer.trim() : '';
    const registrationUrl = body.registrationUrl ? (typeof body.registrationUrl === 'string' ? body.registrationUrl : null) : null;
    const imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : null;
    const capacity = body.capacity !== undefined ? parseInt(String(body.capacity), 10) : null;

    if (!title) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    if (!description) {
      return reply.code(400).send({ error: 'Description is required' });
    }
    if (!startDate) {
      return reply.code(400).send({ error: 'Start date is required' });
    }
    if (!endDate) {
      return reply.code(400).send({ error: 'End date is required' });
    }

    const itemSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const item = db.createAgendaItem({
      title,
      description,
      startDate,
      endDate,
      location,
      imageUrl,
      organizer,
      capacity,
      registrationUrl,
      slug: itemSlug,
    });

    return reply.code(201).send(item);
  });

  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const existing = db.getAgendaItem(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Agenda item not found' });
    }

    const updateData: Partial<AgendaItem> = {};
    if (body.title !== undefined) updateData.title = typeof body.title === 'string' ? body.title.trim() : existing.title;
    if (body.description !== undefined) updateData.description = typeof body.description === 'string' ? body.description : existing.description;
    if (body.startDate !== undefined) updateData.startDate = typeof body.startDate === 'string' ? body.startDate : existing.startDate;
    if (body.endDate !== undefined) updateData.endDate = typeof body.endDate === 'string' ? body.endDate : existing.endDate;
    if (body.location !== undefined) updateData.location = typeof body.location === 'string' ? body.location : existing.location;
    if (body.organizer !== undefined) updateData.organizer = typeof body.organizer === 'string' ? body.organizer : existing.organizer;
    if (body.registrationUrl !== undefined) updateData.registrationUrl = body.registrationUrl ? (typeof body.registrationUrl === 'string' ? body.registrationUrl : null) : existing.registrationUrl;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? (typeof body.imageUrl === 'string' ? body.imageUrl : null) : existing.imageUrl;
    if (body.capacity !== undefined) updateData.capacity = parseInt(String(body.capacity), 10) || null;

    const item = db.updateAgendaItem(id, updateData);
    return reply.send(item);
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = db.getAgendaItem(id);
    if (!existing) {
      return reply.code(404).send({ error: 'Agenda item not found' });
    }
    db.deleteAgendaItem(id);
    return reply.code(204).send();
  });
}
