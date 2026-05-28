import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import NewsAdmin from './admin/NewsAdmin';
import BlogAdmin from './admin/BlogAdmin';
import ShopsAdmin from './admin/ShopsAdmin';
import AgendaAdmin from './admin/AgendaAdmin';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/news', label: 'News Articles', icon: '📰' },
  { path: '/admin/blog', label: 'Blog Posts', icon: '✍️' },
  { path: '/admin/shops', label: 'Shops', icon: '🏪' },
  { path: '/admin/agenda', label: 'Agenda', icon: '📅' },
];

function Admin() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>CMS Admin</h2>
        </div>
        <nav>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                color: isActive(item.path) ? 'white' : '#a0a0b0',
                textDecoration: 'none',
                backgroundColor: isActive(item.path) ? '#16213e' : 'transparent',
                borderRight: isActive(item.path) ? '3px solid #4ecca3' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = '#16213e';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0a0b0';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', backgroundColor: '#f5f5f5', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/news" replace />} />
          <Route path="/news/*" element={<NewsAdmin />} />
          <Route path="/blog/*" element={<BlogAdmin />} />
          <Route path="/shops/*" element={<ShopsAdmin />} />
          <Route path="/agenda/*" element={<AgendaAdmin />} />
          <Route path="*" element={<Navigate to="/admin/news" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default Admin;
