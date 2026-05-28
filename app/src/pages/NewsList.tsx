import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncate(text: string, length: number): string {
  return text.replace(/<[^>]*>/g, '').slice(0, length).trim() + (text.length > length ? '...' : '');
}

function NewsList() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNews({ limit: 50 }).then(r => {
      setArticles(r.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>News</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <div className="empty-state-text">No news articles yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {articles.map(article => (
              <Link key={article.id} to={`/news/${article.slug}`} className="card" style={{ display: 'flex', gap: '24px', padding: '24px' }}>
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    style={{ width: '280px', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                    loading="lazy"
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>{article.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                    {truncate(article.content, 200)}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <span>{article.author}</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default NewsList;
