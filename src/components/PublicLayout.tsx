import { ChevronDown, Menu, MessageCircleMore, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const isProfilePath = (path: string) => path.startsWith('/profil');

export const PublicLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const waUrl = 'https://wa.me/6281234567890?text=Halo%20Hug%20Me%20By%20Vet,%20saya%20ingin%20bertanya%20tentang%20layanan%20klinik.';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(isProfilePath(location.pathname));

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(isProfilePath(location.pathname));
  }, [location.pathname]);

  return (
    <div className="public-site-wrap">
      <nav className="public-navbar v2 public-navbar-responsive">
        <div className="public-navbar-top">
          <Link to="/" className="public-brand">🐾 Hug Me By Vet</Link>
          <button
            type="button"
            className="public-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`public-menu v2 ${mobileMenuOpen ? 'open' : ''}`}>
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">Home</Link>
          <div className={`menu-dropdown ${isProfilePath(location.pathname) ? 'active' : ''} ${profileOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="menu-trigger"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
            >
              Profil <ChevronDown size={16} className={`menu-chevron ${profileOpen ? 'open' : ''}`} />
            </button>
            <div className="menu-panel">
              <Link to="/profil/sejarah">Latar Belakang dan Sejarah</Link>
              <Link to="/profil/visi-misi">Visi dan Misi</Link>
              <Link to="/profil/kerjasama">Kerjasama</Link>
              <Link to="/profil/dokter-staf">Dokter dan Staf</Link>
            </div>
          </div>
          <Link to="/fasilitas">Fasilitas</Link>
          <Link to="/alur-layanan">Alur Layanan</Link>
          <Link to="/pelayanan">Pelayanan</Link>
          <Link to="/lokasi">Lokasi</Link>
          <Link to="/artikel">Artikel</Link>
        </div>
      </nav>
      {children}
      <a className="floating-wa" href={waUrl} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp klinik">
        <span className="floating-wa-bubble">Chat dengan Klinik</span>
        <span className="floating-wa-icon"><MessageCircleMore size={24} /></span>
      </a>
    </div>
  );
};
