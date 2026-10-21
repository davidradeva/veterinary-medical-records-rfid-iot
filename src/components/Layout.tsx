import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUserRound, ScanLine, Stethoscope, Users, LogOut, PawPrint, WalletCards, ReceiptText, ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

const menus = [
  { to: '/front-office', label: 'Front Office', icon: Users, roles: ['front-office'] },
  { to: '/rfid-scan', label: 'RFID', icon: ScanLine, roles: ['front-office'] },
  { to: '/doctor', label: 'Dokter', icon: Stethoscope, roles: ['doctor'] },
  { to: '/pharmacy', label: 'Akuntansi', icon: ClipboardList, roles: ['front-office'] },
  { to: '/payments', label: 'Pembayaran', icon: WalletCards, roles: ['front-office'] },
  { to: '/debts', label: 'Hutang', icon: ReceiptText, roles: ['front-office'] },
];

export const Layout = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = sessionStorage.getItem('staff_role') ?? '';
  const staffName = sessionStorage.getItem('staff_name') ?? 'Staf Klinik';
  const allowedMenus = menus.filter((menu) => menu.roles.includes(role));

  const doLogout = () => {
    sessionStorage.removeItem('staff_role');
    sessionStorage.removeItem('staff_name');
    navigate('/staff-login');
  };

  return (
    <div className="staff-page-shell">
      <div className="staff-container">
        <header className="staff-navbar">
          <div className="staff-brand">
            <span className="staff-brand-icon"><PawPrint size={18} /></span>
            <div>
              <strong>Hug Me By Vet</strong>
              <span>Sistem Internal Klinik Hewan</span>
            </div>
          </div>
          <nav className="staff-nav-links">
            {allowedMenus.map((menu) => {
              const Icon = menu.icon;
              const active = location.pathname === menu.to;
              return (
                <Link key={menu.to} to={menu.to} className={`staff-nav-link ${active ? 'active' : ''}`}>
                  <Icon size={16} />
                  <span>{menu.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="staff-user-box">
            <div className="staff-user-pill">
              <CircleUserRound size={18} />
              <div>
                <strong>{staffName}</strong>
                <span>{role === 'doctor' ? 'Dokter' : 'Front Office'}</span>
              </div>
            </div>
            <button type="button" className="staff-logout-btn" onClick={doLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <section className="staff-heading-card">
          <div>
            <p className="staff-kicker">Dashboard Internal</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </section>

        <main>{children}</main>
      </div>
    </div>
  );
};
