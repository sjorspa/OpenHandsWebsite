import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { NewsArticle } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getNewsArticle(slug).then(setArticle).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!article) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1>Article Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>The news article you're looking for doesn't exist.</p>
          <Link to="/news" className="btn btn-primary">Back to News</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-sm">
        <Link to="/news" style={{ marginBottom: '24px', display: 'inline-block' }} className="btn btn-ghost">← Back to News</Link>

        <div className="detail-header">
          <h1 className="detail-title">{article.title}</h1>
          <div className="detail-meta">
            <span>By {article.author}</span>
            <span>•</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>

        {article.imageUrl && (
          <img src={article.imageUrl} alt={article.title} className="detail-image" />
        )}

        <div
          className="detail-content"
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
        />
      </div>
    </section>
  );
}

export default NewsDetail;
