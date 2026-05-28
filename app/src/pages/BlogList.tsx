import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../types';
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

function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlog({ limit: 50 }).then(r => {
      setPosts(r.items);
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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Blog</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-text">No blog posts yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="card" style={{ display: 'flex', gap: '24px', padding: '24px' }}>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    style={{ width: '280px', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                    loading="lazy"
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>{post.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                    {truncate(post.content, 200)}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  {post.tags && (
                    <div style={{ marginTop: '12px' }}>
                      {post.tags.split(',').map((tag, i) => (
                        <span key={i} className="card-tag" style={{ marginRight: '6px' }}>{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BlogList;
