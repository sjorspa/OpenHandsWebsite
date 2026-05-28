import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Shop } from '../types';
import { api } from '../services/api';

function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getShop(id).then(setShop).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!shop) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1>Shop Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>The shop you're looking for doesn't exist.</p>
          <Link to="/shops" className="btn btn-primary">Back to Shops</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-sm">
        <Link to="/shops" style={{ marginBottom: '24px', display: 'inline-block' }} className="btn btn-ghost">← Back to Shops</Link>

        <div className="detail-header">
          <h1 className="detail-title">{shop.name}</h1>
          {shop.featured && <span className="badge badge-warning">Featured Shop</span>}
        </div>

        {shop.imageUrl && (
          <img src={shop.imageUrl} alt={shop.name} className="detail-image" />
        )}

        <div className="detail-content" style={{ marginBottom: '32px' }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{shop.description}</p>
        </div>

        <div style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>ADDRESS</div>
            <div>{shop.address || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>PHONE</div>
            <div>{shop.phone || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>EMAIL</div>
            <div>{shop.email || 'N/A'}</div>
          </div>
          {shop.website && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>WEBSITE</div>
              <div><a href={shop.website} target="_blank" rel="noopener noreferrer">{shop.website}</a></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ShopDetail;
