import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import NewsList from './pages/NewsList';
import NewsDetail from './pages/NewsDetail';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import ShopsList from './pages/ShopsList';
import ShopDetail from './pages/ShopDetail';
import AgendaList from './pages/AgendaList';
import AgendaDetail from './pages/AgendaDetail';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<NewsList />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/shops" element={<ShopsList />} />
            <Route path="/shops/:id" element={<ShopDetail />} />
            <Route path="/agenda" element={<AgendaList />} />
            <Route path="/agenda/:id" element={<AgendaDetail />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
