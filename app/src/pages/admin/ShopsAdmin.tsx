import { useState, useEffect } from 'react';
import type { Shop } from '../../types';
import { api } from '../../services/api';

function ShopsAdmin() {
  const [items, setItems] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '', address: '', phone: '', email: '', website: '', latitude: '', longitude: '', featured: false });
  const [error, setError] = useState<string | null>(null);

  const loadItems = () => {
    api.getShops({ limit: 100 })
      .then(r => { setItems(r.items); setLoading(false); })
      .catch(() => { setLoading(false); setError('Failed to load shops'); });
  };

  useEffect(() => { loadItems(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Name and address are required');
      return;
    }
    try {
      const data: Partial<Shop> = { ...formData, latitude: formData.latitude ? parseFloat(formData.latitude) : null, longitude: formData.longitude ? parseFloat(formData.longitude) : null };
      if (data.website && !data.website.trim()) data.website = null;
      if (data.imageUrl && !data.imageUrl.trim()) data.imageUrl = null;
      if (editingId) {
        await api.updateShop(editingId, data);
      } else {
        await api.createShop(data);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', imageUrl: '', address: '', phone: '', email: '', website: '', latitude: '', longitude: '', featured: false });
      setError(null);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shop?')) return;
    try {
      await api.deleteShop(id);
      loadItems();
    } catch { setError('Delete failed'); }
  };

  const handleEdit = (item: Shop) => {
    setEditingId(item.id);
    setFormData({ name: item.name, description: item.description, imageUrl: item.imageUrl || '', address: item.address, phone: item.phone, email: item.email, website: item.website || '', latitude: item.latitude?.toString() || '', longitude: item.longitude?.toString() || '', featured: item.featured });
    setShowForm(true);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Shops</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{items.length} shops</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', imageUrl: '', address: '', phone: '', email: '', website: '', latitude: '', longitude: '', featured: false }); setError(null); }}>
          + New Shop
        </button>
      </div>

      {error && <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#c00' }}>{error}</div>}

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Edit Shop' : 'New Shop'}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input className="input" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            <input className="input" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
            <input className="input" placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            <input className="input" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <input className="input" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input className="input" placeholder="Website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input className="input" placeholder="Latitude" type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} />
              <input className="input" placeholder="Longitude" type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} />
              Featured
            </label>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Phone</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Featured</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{item.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{item.address}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{item.phone}</td>
                <td style={{ padding: '12px 16px' }}>
                  {item.featured ? <span className="badge badge-success">Yes</span> : <span className="badge badge-secondary">No</span>}
                </td>
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

export default ShopsAdmin;
