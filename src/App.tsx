import { Navigate, Route, Routes } from 'react-router-dom';
import { FrontOfficePage } from './modules/front-office/FrontOfficePage';
import { RfidPage } from './pages/RfidPage';
import { DoctorPage } from './modules/doctor/DoctorPage';
import { PharmacyPage } from './pages/PharmacyPage';
import { PaymentPage } from './pages/PaymentPage';
import { DebtPage } from './pages/DebtPage';
import { StaffLoginPage } from './modules/staff-login/StaffLoginPage';
import { PublicHomePage, SejarahPage, VisiMisiPage, KerjasamaPage, DokterStaffPage, FasilitasPage, AlurLayananPage, PelayananPage, LokasiPage, ArtikelPage, KontakPage } from './pages/PublicPages';

const Guard = ({ allow, children }: { allow: string; children: JSX.Element }) => {
  const role = sessionStorage.getItem('staff_role');
  return role === allow ? children : <Navigate to="/staff-login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/profil/sejarah" element={<SejarahPage />} />
      <Route path="/profil/visi-misi" element={<VisiMisiPage />} />
      <Route path="/profil/kerjasama" element={<KerjasamaPage />} />
      <Route path="/profil/dokter-staf" element={<DokterStaffPage />} />
      <Route path="/fasilitas" element={<FasilitasPage />} />
      <Route path="/alur-layanan" element={<AlurLayananPage />} />
      <Route path="/pelayanan" element={<PelayananPage />} />
      <Route path="/lokasi" element={<LokasiPage />} />
      <Route path="/artikel" element={<ArtikelPage />} />
      <Route path="/kontak" element={<KontakPage />} />
      <Route path="/staff-login" element={<StaffLoginPage />} />
      <Route path="/front-office" element={<Guard allow="front-office"><FrontOfficePage /></Guard>} />
      <Route path="/rfid-scan" element={<Guard allow="front-office"><RfidPage /></Guard>} />
      <Route path="/doctor" element={<Guard allow="doctor"><DoctorPage /></Guard>} />
      <Route path="/pharmacy" element={<Guard allow="front-office"><PharmacyPage /></Guard>} />
      <Route path="/payments" element={<Guard allow="front-office"><PaymentPage /></Guard>} />
      <Route path="/debts" element={<Guard allow="front-office"><DebtPage /></Guard>} />
    </Routes>
  );
}
