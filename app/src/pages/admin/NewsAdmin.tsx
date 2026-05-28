import { useState, useEffect } from 'react';
import type { NewsArticle } from '../../types';
import { api } from '../../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function NewsAdmin() {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', excerpt: '', imageUrl: '', author: 'Admin', publishedAt: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState<string | null>(null);

  const loadItems = () => {
    api.getNews({ limit: 100 })
      .then(r => { setItems(r.items); setLoading(false); })
      .catch(() => { setLoading(false); setError('Failed to load news articles'); });
  };

  useEffect(() => { loadItems(); }, []);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      setError('Title, slug, and content are required');
      return;
    }
    try {
      const data = { ...formData, publishedAt: new Date(formData.publishedAt).toISOString() };
      if (editingId) {
        await api.updateNews(editingId, data);
      } else {
        await api.createNews(data);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', slug: '', content: '', excerpt: '', imageUrl: '', author: 'Admin', publishedAt: new Date().toISOString().split('T')[0] });
      setError(null);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try {
      await api.deleteNews(id);
      loadItems();
    } catch { setError('Delete failed'); }
  };

  const handleEdit = (item: NewsArticle) => {
    setEditingId(item.id);
    setFormData({ title: item.title, slug: item.slug, content: item.content, excerpt: item.excerpt || '', imageUrl: item.imageUrl || '', author: item.author, publishedAt: item.publishedAt.split('T')[0] });
    setShowForm(true);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>News Articles</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{items.length} articles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', slug: '', content: '', excerpt: '', imageUrl: '', author: 'Admin', publishedAt: new Date().toISOString().split('T')[0] }); setError(null); }}>
          + New Article
        </button>
      </div>

      {error && <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#c00' }}>{error}</div>}

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Edit Article' : 'New Article'}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input className="input" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <input className="input" placeholder="Slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
            <input className="input" placeholder="Excerpt" value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} />
            <input className="input" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
            <input className="input" placeholder="Author" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
            <input className="input" type="date" value={formData.publishedAt} onChange={e => setFormData({ ...formData, publishedAt: e.target.value })} />
            <textarea className="input" rows={6} placeholder="Content" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Slug</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Published</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{item.title}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{item.slug}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{formatDate(item.publishedAt)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(item)} style={{ marginRight: '8px' }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NewsAdmin;
