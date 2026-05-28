import { NavLink } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">
          CMS<span>Hub</span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/news" className="nav-link" end={false}>
            News
          </NavLink>
          <NavLink to="/blog" className="nav-link" end={false}>
            Blog
          </NavLink>
          <NavLink to="/shops" className="nav-link" end={false}>
            Shops
          </NavLink>
          <NavLink to="/agenda" className="nav-link" end={false}>
            Agenda
          </NavLink>
          <NavLink to="/admin" className="nav-link nav-link-admin">
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
