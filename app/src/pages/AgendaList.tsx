import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AgendaItem } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

function AgendaList() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filter === 'upcoming') {
      api.getUpcomingAgenda(50).then(r => {
        setItems(r.items);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      api.getAgenda({ limit: 100 }).then(r => {
        setItems(r.items);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [filter]);

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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Agenda</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            {items.length} event{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Events
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">No events found.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map(item => (
              <Link key={item.id} to={`/agenda/${item.slug}`} className="card" style={{ display: 'flex', gap: '24px', padding: '20px', alignItems: 'center' }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                    loading="lazy"
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{item.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                    {item.description.slice(0, 120)}...
                  </p>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span>📅 {formatDate(item.startDate)}{item.startDate !== item.endDate ? ` - ${formatDate(item.endDate)}` : ''}</span>
                    {item.location && <span>📍 {item.location}</span>}
                    {item.organizer && <span>👤 {item.organizer}</span>}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    {isUpcoming(item.startDate) && <span className="badge badge-success">Upcoming</span>}
                    {!isUpcoming(item.startDate) && <span className="badge badge-primary">Past</span>}
                    {item.capacity && <span className="badge badge-warning">{item.capacity} spots</span>}
                    {item.registrationUrl && (
                      <a href={item.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }}>
                        Register
                      </a>
                    )}
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

export default AgendaList;
