function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-title">CMSHub</div>
            <p className="footer-text">
              A modern content management platform for news, blog posts, shops, and events. Built with React and Fastify.
            </p>
          </div>
          <div>
            <div className="footer-title">Content</div>
            <ul className="footer-links">
              <li><a href="/news">News</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/shops">Shops</a></li>
              <li><a href="/agenda">Agenda</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Admin</div>
            <ul className="footer-links">
              <li><a href="/admin">Dashboard</a></li>
              <li><a href="/admin/news">Manage News</a></li>
              <li><a href="/admin/blog">Manage Blog</a></li>
              <li><a href="/admin/shops">Manage Shops</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Connect</div>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} CMSHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
