import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Shop } from '../types';
import { api } from '../services/api';

function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShops({ limit: 100 }).then(r => {
      setShops(r.items);
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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Local Shops</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            {shops.length} shop{shops.length !== 1 ? 's' : ''} to discover
          </p>
        </div>

        {shops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <div className="empty-state-text">No shops listed yet.</div>
          </div>
        ) : (
          <div className="grid grid-4">
            {shops.map(shop => (
              <Link key={shop.id} to={`/shops/${shop.id}`} className="card">
                {shop.imageUrl && (
                  <img src={shop.imageUrl} alt={shop.name} className="card-img" loading="lazy" />
                )}
                <div className="card-body">
                  <h3 className="card-title">{shop.name}</h3>
                  <p className="card-text">{shop.description.slice(0, 100)}...</p>
                  <div className="card-meta">
                    {shop.address && <span>📍 {shop.address}</span>}
                  </div>
                  {shop.featured && (
                    <span className="badge badge-warning" style={{ marginTop: '8px' }}>Featured</span>
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

export default ShopsList;
