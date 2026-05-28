import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle, BlogPost, Shop, AgendaItem } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncate(text: string, length: number): string {
  return text.replace(/<[^>]*>/g, '').slice(0, length).trim() + (text.length > length ? '...' : '');
}

function Home() {
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [latestBlog, setLatestBlog] = useState<BlogPost[]>([]);
  const [randomShops, setRandomShops] = useState<Shop[]>([]);
  const [upcomingAgenda, setUpcomingAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getNews({ latest: 3 }).then(r => setLatestNews(r.items)).catch(() => []),
      api.getBlog({ latest: 3 }).then(r => setLatestBlog(r.items)).catch(() => []),
      api.getRandomShops(4).then(r => setRandomShops(r.items)).catch(() => []),
      api.getUpcomingAgenda(3).then(r => setUpcomingAgenda(r.items)).catch(() => []),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Welcome to CMSHub</h1>
          <p>Your modern platform for discovering the latest news, insightful blog posts, local shops, and upcoming events.</p>
          <div className="hero-buttons">
            <Link to="/news" className="btn btn-primary">Read News</Link>
            <Link to="/shops" className="btn btn-secondary">Explore Shops</Link>
            <Link to="/agenda" className="btn btn-secondary">View Events</Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Latest News</h2>
                <p className="section-subtitle">Stay updated with the latest stories</p>
              </div>
              <Link to="/news" className="btn btn-ghost">View All →</Link>
            </div>
            <div className="grid grid-3">
              {latestNews.map(article => (
                <Link key={article.id} to={`/news/${article.slug}`} className="card">
                  {article.imageUrl && (
                    <img src={article.imageUrl} alt={article.title} className="card-img" loading="lazy" />
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{article.title}</h3>
                    <p className="card-text">{truncate(article.content, 120)}</p>
                    <div className="card-meta">
                      <span>{article.author}</span>
                      <span>•</span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {latestBlog.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Latest Blog Posts</h2>
                <p className="section-subtitle">Insights and perspectives from our writers</p>
              </div>
              <Link to="/blog" className="btn btn-ghost">View All →</Link>
            </div>
            <div className="grid grid-3">
              {latestBlog.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="card">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.title} className="card-img" loading="lazy" />
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-text">{truncate(post.content, 120)}</p>
                    <div className="card-meta">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    {post.tags && (
                      <div style={{ marginTop: '8px' }}>
                        {post.tags.split(',').map((tag, i) => (
                          <span key={i} className="card-tag" style={{ marginRight: '6px' }}>{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Shops */}
      {randomShops.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Discover Local Shops</h2>
                <p className="section-subtitle">Support your local businesses</p>
              </div>
              <Link to="/shops" className="btn btn-ghost">View All →</Link>
            </div>
            <div className="grid grid-4">
              {randomShops.map(shop => (
                <Link key={shop.id} to={`/shops/${shop.id}`} className="card">
                  {shop.imageUrl && (
                    <img src={shop.imageUrl} alt={shop.name} className="card-img" loading="lazy" />
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{shop.name}</h3>
                    <p className="card-text">{truncate(shop.description, 100)}</p>
                    <div className="card-meta">
                      {shop.address && <span>📍 {shop.address}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Agenda */}
      {upcomingAgenda.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Upcoming Events</h2>
                <p className="section-subtitle">Don't miss out on what's happening</p>
              </div>
              <Link to="/agenda" className="btn btn-ghost">View All →</Link>
            </div>
            <div className="grid grid-3">
              {upcomingAgenda.map(item => (
                <Link key={item.id} to={`/agenda/${item.id}`} className="card">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="card-img" loading="lazy" />
                  )}
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-text">{truncate(item.description, 100)}</p>
                    <div className="card-meta">
                      <span>📅 {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {item.location && <span>📍 {item.location}</span>}
                    </div>
                    {item.capacity && (
                      <div style={{ marginTop: '8px' }}>
                        <span className="badge badge-primary">{item.capacity} spots</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Home;
