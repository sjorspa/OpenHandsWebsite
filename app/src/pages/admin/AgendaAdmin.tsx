import { useState, useEffect } from 'react';
import type { AgendaItem } from '../../types';
import { api } from '../../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function AgendaAdmin() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', organizer: '', capacity: '', registrationUrl: '' });
  const [error, setError] = useState<string | null>(null);

  const loadItems = () => {
    api.getAgenda({ limit: 100 })
      .then(r => { setItems(r.items); setLoading(false); })
      .catch(() => { setLoading(false); setError('Failed to load agenda items'); });
  };

  useEffect(() => { loadItems(); }, []);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate) {
      setError('Title, description, start date, and end date are required');
      return;
    }
    try {
      const data: any = { ...formData };
      if (typeof data.imageUrl === 'string' && data.imageUrl && !data.imageUrl.trim()) data.imageUrl = null;
      if (typeof data.registrationUrl === 'string' && data.registrationUrl && !data.registrationUrl.trim()) data.registrationUrl = null;
      const capacityVal = formData.capacity;
      if (capacityVal && capacityVal.trim()) {
        data.capacity = parseInt(capacityVal, 10) || null;
      } else {
        data.capacity = null;
      }
      if (editingId) {
        await api.updateAgenda(editingId, data);
      } else {
        await api.createAgenda(data);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', organizer: '', capacity: '', registrationUrl: '' });
      setError(null);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.deleteAgenda(id);
      loadItems();
    } catch { setError('Delete failed'); }
  };

  const handleEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    setFormData({ title: item.title, description: item.description, startDate: item.startDate.split('T')[0], endDate: item.endDate.split('T')[0], location: item.location, imageUrl: item.imageUrl || '', organizer: item.organizer, capacity: item.capacity?.toString() || '', registrationUrl: item.registrationUrl || '' });
    setShowForm(true);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Agenda Items</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{items.length} events</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', organizer: '', capacity: '', registrationUrl: '' }); setError(null); }}>
          + New Event
        </button>
      </div>

      {error && <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#c00' }}>{error}</div>}

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Edit Event' : 'New Event'}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input className="input" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input className="input" type="date" placeholder="Start Date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              <input className="input" type="date" placeholder="End Date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <input className="input" placeholder="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <input className="input" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
            <input className="input" placeholder="Organizer" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input className="input" placeholder="Capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
              <input className="input" placeholder="Registration URL" value={formData.registrationUrl} onChange={e => setFormData({ ...formData, registrationUrl: e.target.value })} />
            </div>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Dates</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Organizer</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px' }}>{item.title}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                  {formatDate(item.startDate)}{item.startDate !== item.endDate ? ` - ${formatDate(item.endDate)}` : ''}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{item.location}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{item.organizer}</td>
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

export default AgendaAdmin;
