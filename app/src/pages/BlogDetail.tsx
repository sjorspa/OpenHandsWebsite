import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BlogPost } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getBlogPost(slug).then(setPost).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!post) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1>Post Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-sm">
        <Link to="/blog" style={{ marginBottom: '24px', display: 'inline-block' }} className="btn btn-ghost">← Back to Blog</Link>

        <div className="detail-header">
          <h1 className="detail-title">{post.title}</h1>
          <div className="detail-meta">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          {post.tags && (
            <div style={{ marginTop: '16px' }}>
              {post.tags.split(',').map((tag, i) => (
                <span key={i} className="card-tag" style={{ marginRight: '6px' }}>{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>

        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="detail-image" />
        )}

        <div
          className="detail-content"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
        />
      </div>
    </section>
  );
}

export default BlogDetail;
