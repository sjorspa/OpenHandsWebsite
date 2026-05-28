import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { AgendaItem } from '../types';
import { api } from '../services/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

function AgendaDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<AgendaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAgendaItem(id)
      .then(setItem)
      .catch(() => setError('Failed to load agenda item'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-text">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">Agenda item not found.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <Link to="/agenda" className="back-link" style={{ marginBottom: '24px', display: 'inline-block' }}>
          ← Back to Agenda
        </Link>

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}
          />
        )}

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {isUpcoming(item.startDate) && <span className="badge badge-success">Upcoming</span>}
            {!isUpcoming(item.startDate) && <span className="badge badge-primary">Past</span>}
            {item.capacity && <span className="badge badge-warning">{item.capacity} spots available</span>}
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>
            {item.title}
          </h1>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
            <span>📅 {formatDate(item.startDate)}{item.startDate !== item.endDate ? ` - ${formatDate(item.endDate)}` : ''}</span>
            {item.location && <span>📍 {item.location}</span>}
            {item.organizer && <span>👤 {item.organizer}</span>}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>About This Event</h2>
            <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {item.description}
            </div>
          </div>

          {item.registrationUrl && (
            <a
              href={item.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', padding: '14px 32px' }}
            >
              Register Now
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default AgendaDetail;
