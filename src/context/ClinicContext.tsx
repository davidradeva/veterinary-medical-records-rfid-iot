import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FinanceEntry, InventoryTransaction, Medicine, Patient, VisitRecord, ChargeItem } from '../types';
import { clinicApi } from '../api/clinicApi';

const ClinicContext = createContext<{
  patients: Patient[];
  visits: VisitRecord[];
  medicines: Medicine[];
  inventoryTransactions: InventoryTransaction[];
  financeEntries: FinanceEntry[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'customerNumber'>, visitMeta: { poli: string; doctor: string; complaint?: string }, sendToDoctor?: boolean) => void;
  updatePatient: (patientId: string, updates: Partial<Patient>) => void;
  createVisitForExistingPatient: (patientId: string, visitMeta: { poli: string; doctor: string; complaint?: string }) => void;
  getPendingVisits: () => VisitRecord[];
  getCompletedVisits: () => VisitRecord[];
  updateVisit: (visitId: string, updates: Partial<VisitRecord>) => void;
  getPatientById: (patientId: string) => Patient | undefined;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Medicine | undefined;
  deleteMedicine: (medicineId: string) => void;
  addInventoryTransaction: (payload: Omit<InventoryTransaction, 'id' | 'medicineName' | 'total' | 'createdAt'>) => void;
  addFinanceEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void;
  deletePatient: (patientId: string) => void;
  deleteVisit: (visitId: string) => void;
}>({
  patients: [],
  visits: [],
  medicines: [],
  inventoryTransactions: [],
  financeEntries: [],
  addPatient: () => undefined,
  updatePatient: () => undefined,
  createVisitForExistingPatient: () => undefined,
  getPendingVisits: () => [],
  getCompletedVisits: () => [],
  updateVisit: () => undefined,
  getPatientById: () => undefined,
  addMedicine: () => undefined,
  deleteMedicine: () => undefined,
  addInventoryTransaction: () => undefined,
  addFinanceEntry: () => undefined,
  deletePatient: () => undefined,
  deleteVisit: () => undefined,
});

const defaultMedicines: Medicine[] = [
  { id: 'm1', name: 'Amoxicillin 500mg', stock: 120, unit: 'Tablet', price: 3500, category: 'Antibiotik Oral' },
  { id: 'm2', name: 'Doxycycline 100mg', stock: 95, unit: 'Tablet', price: 4500, category: 'Antibiotik Oral' },
  { id: 'm3', name: 'Metronidazole 500mg', stock: 80, unit: 'Tablet', price: 4000, category: 'Antibiotik Oral' },
  { id: 'm4', name: 'Prednisone 5mg', stock: 90, unit: 'Tablet', price: 3000, category: 'Anti Inflamasi' },
  { id: 'm5', name: 'Meloxicam 7.5mg', stock: 75, unit: 'Tablet', price: 5000, category: 'Analgesik' },
  { id: 'm6', name: 'Vitamin B Complex', stock: 150, unit: 'Tablet', price: 2500, category: 'Vitamin' },
  { id: 'm7', name: 'Albendazole 200mg', stock: 85, unit: 'Tablet', price: 3000, category: 'Antiparasit Oral' },
  { id: 'm8', name: 'Antiparasit Spot On', stock: 45, unit: 'Pipet', price: 65000, category: 'Antiparasit Topikal' },
  { id: 'm9', name: 'Shampoo Antijamur', stock: 34, unit: 'Botol', price: 58000, category: 'Obat Oles' },
  { id: 'm10', name: 'Salep Luka Kulit', stock: 62, unit: 'Tube', price: 42000, category: 'Obat Oles' },
  { id: 'm11', name: 'Ear Cleaner', stock: 40, unit: 'Botol', price: 38000, category: 'Perawatan Telinga' },
  { id: 'm12', name: 'Eye Drop Lubricant', stock: 28, unit: 'Botol', price: 47000, category: 'Perawatan Mata' },
  { id: 'm13', name: 'Ceftriaxone Injection', stock: 50, unit: 'Vial', price: 24000, category: 'Obat Suntik' },
  { id: 'm14', name: 'Dexamethasone Injection', stock: 55, unit: 'Ampul', price: 18000, category: 'Obat Suntik' },
  { id: 'm15', name: 'Vitamin K Injection', stock: 36, unit: 'Ampul', price: 21000, category: 'Obat Suntik' },
  { id: 'm16', name: 'Ringer Lactate', stock: 70, unit: 'Botol', price: 32000, category: 'Cairan Infus' },
  { id: 'm17', name: 'NaCl 0.9%', stock: 88, unit: 'Botol', price: 27000, category: 'Cairan Infus' },
  { id: 'm18', name: 'Rabies Vaccine', stock: 30, unit: 'Vial', price: 145000, category: 'Vaksin' },
  { id: 'm19', name: 'Tricat Vaccine', stock: 24, unit: 'Vial', price: 165000, category: 'Vaksin' },
  { id: 'm20', name: 'Dental Gel', stock: 22, unit: 'Tube', price: 52000, category: 'Perawatan Gigi' },
  { id: 'm21', name: 'Probiotik Sachet', stock: 58, unit: 'Sachet', price: 9000, category: 'Pencernaan' },
  { id: 'm22', name: 'Recovery Diet Can', stock: 40, unit: 'Kaleng', price: 35000, category: 'Nutrisi Terapi' },
  { id: 'm23', name: 'Obat Tetes Kulit', stock: 18, unit: 'Botol', price: 49000, category: 'Obat Oles' },
  { id: 'm24', name: 'Pain Relief Injection', stock: 26, unit: 'Ampul', price: 26000, category: 'Obat Suntik' },
];

const now = new Date();
const isoDaysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

const seedPatients: Patient[] = [
  {
    id: 'p1', customerNumber: 'REG-0001', rfidUid: 'RFID-1201', ownerName: 'Rina Setiawati', address: 'Jl. Mawar No. 11', rtRw: '001/004', village: 'Margahayu', district: 'Bekasi Timur', city: 'Kota Bekasi', province: 'Jawa Barat', phoneNumber: '081234567801', secondaryPhone: '081234567890', email: 'rina@example.com', socialMedia: '@rinasetiawati', animalName: 'Mochi', animalType: 'Kucing', breed: 'Domestic', gender: 'Betina', birthDate: '2023-05-12', ageText: '1 tahun 11 bulan', createdAt: isoDaysAgo(250)
  },
  {
    id: 'p2', customerNumber: 'REG-0002', rfidUid: 'RFID-1202', ownerName: 'Rina Setiawati', address: 'Jl. Mawar No. 11', rtRw: '001/004', village: 'Margahayu', district: 'Bekasi Timur', city: 'Kota Bekasi', province: 'Jawa Barat', phoneNumber: '081234567801', secondaryPhone: '081234567890', email: 'rina@example.com', socialMedia: '@rinasetiawati', animalName: 'Bolu', animalType: 'Kucing', breed: 'Persia', gender: 'Jantan', birthDate: '2022-08-21', ageText: '2 tahun 8 bulan', createdAt: isoDaysAgo(180)
  },
  {
    id: 'p3', customerNumber: 'REG-0003', rfidUid: 'RFID-1203', ownerName: 'Andi Pratama', address: 'Jl. Kenanga No. 5', rtRw: '002/003', village: 'Pekayon Jaya', district: 'Bekasi Selatan', city: 'Kota Bekasi', province: 'Jawa Barat', phoneNumber: '081245670123', secondaryPhone: '', email: 'andi@example.com', socialMedia: '@andipratama', animalName: 'Bruno', animalType: 'Anjing', breed: 'Shih Tzu', gender: 'Jantan', birthDate: '2021-02-10', ageText: '4 tahun 2 bulan', createdAt: isoDaysAgo(300)
  },
  {
    id: 'p4', customerNumber: 'REG-0004', rfidUid: 'RFID-1204', ownerName: 'Salsa Maharani', address: 'Jl. Melati No. 22', rtRw: '005/006', village: 'Jati Padang', district: 'Pasar Minggu', city: 'Jakarta Selatan', province: 'DKI Jakarta', phoneNumber: '082112340987', secondaryPhone: '', email: 'salsa@example.com', socialMedia: '@salsamaharani', animalName: 'Coco', animalType: 'Kelinci', breed: 'Anggora', gender: 'Betina', birthDate: '2024-01-15', ageText: '1 tahun 3 bulan', createdAt: isoDaysAgo(120)
  },
  {
    id: 'p5', customerNumber: 'REG-0005', rfidUid: 'RFID-1205', ownerName: 'Dimas Rahman', address: 'Jl. Flamboyan No. 3', rtRw: '003/005', village: 'Duren Jaya', district: 'Bekasi Timur', city: 'Kota Bekasi', province: 'Jawa Barat', phoneNumber: '081355550222', secondaryPhone: '081355550223', email: 'dimas@example.com', socialMedia: '@dimasrahman', animalName: 'Luna', animalType: 'Kucing', breed: 'Anggora', gender: 'Betina', birthDate: '2022-11-03', ageText: '2 tahun 5 bulan', createdAt: isoDaysAgo(140)
  },
  {
    id: 'p6', customerNumber: 'REG-0006', rfidUid: 'RFID-1206', ownerName: 'Dimas Rahman', address: 'Jl. Flamboyan No. 3', rtRw: '003/005', village: 'Duren Jaya', district: 'Bekasi Timur', city: 'Kota Bekasi', province: 'Jawa Barat', phoneNumber: '081355550222', secondaryPhone: '081355550223', email: 'dimas@example.com', socialMedia: '@dimasrahman', animalName: 'Taro', animalType: 'Anjing', breed: 'Pomeranian', gender: 'Jantan', birthDate: '2021-06-28', ageText: '3 tahun 9 bulan', createdAt: isoDaysAgo(210)
  },
  {
    id: 'p7', customerNumber: 'REG-0007', rfidUid: 'RFID-1207', ownerName: 'Nadia Putri', address: 'Jl. Sakura No. 9', rtRw: '007/002', village: 'Melawai', district: 'Kebayoran Baru', city: 'Jakarta Selatan', province: 'DKI Jakarta', phoneNumber: '081298760045', secondaryPhone: '', email: 'nadia@example.com', socialMedia: '@nadiaputri', animalName: 'Piko', animalType: 'Burung', breed: 'Lovebird', gender: 'Jantan', birthDate: '2023-09-17', ageText: '1 tahun 7 bulan', createdAt: isoDaysAgo(100)
  },
  {
    id: 'p8', customerNumber: 'REG-0008', rfidUid: 'RFID-1208', ownerName: 'Nadia Putri', address: 'Jl. Sakura No. 9', rtRw: '007/002', village: 'Melawai', district: 'Kebayoran Baru', city: 'Jakarta Selatan', province: 'DKI Jakarta', phoneNumber: '081298760045', secondaryPhone: '', email: 'nadia@example.com', socialMedia: '@nadiaputri', animalName: 'Nori', animalType: 'Hamster', breed: 'Syrian', gender: 'Betina', birthDate: '2024-02-07', ageText: '1 tahun 2 bulan', createdAt: isoDaysAgo(80)
  },
  {
    id: 'p9', customerNumber: 'REG-0009', rfidUid: 'RFID-1209', ownerName: 'Galih Saputra', address: 'Jl. Cemara No. 17', rtRw: '008/001', village: 'Pejaten Barat', district: 'Pasar Minggu', city: 'Jakarta Selatan', province: 'DKI Jakarta', phoneNumber: '081333224466', secondaryPhone: '081333224467', email: 'galih@example.com', socialMedia: '@galihsaputra', animalName: 'Oyen', animalType: 'Kucing', breed: 'Mix', gender: 'Jantan', birthDate: '2020-12-24', ageText: '4 tahun 3 bulan', createdAt: isoDaysAgo(330)
  },
  {
    id: 'p10', customerNumber: 'REG-0010', rfidUid: 'RFID-1210', ownerName: 'Galih Saputra', address: 'Jl. Cemara No. 17', rtRw: '008/001', village: 'Pejaten Barat', district: 'Pasar Minggu', city: 'Jakarta Selatan', province: 'DKI Jakarta', phoneNumber: '081333224466', secondaryPhone: '081333224467', email: 'galih@example.com', socialMedia: '@galihsaputra', animalName: 'Milo', animalType: 'Kura-kura', breed: 'Brazil', gender: 'Jantan', birthDate: '2019-10-13', ageText: '5 tahun 6 bulan', createdAt: isoDaysAgo(400)
  },
];

const seedVisits: VisitRecord[] = [
  { id: 'v1', patientId: 'p1', visitDate: isoDaysAgo(90), poli: 'Dermatologi', doctor: 'Dr. C', status: 'completed', weight: '3.1 kg', temperature: '', examResult: '', labResult: '', complaint: 'Kulit kemerahan dan sering menggaruk.', diagnosis: 'Dermatitis ringan', medicalAction: 'Pembersihan area kulit dan evaluasi jamur.', recommendations: 'Kontrol 7 hari dan pantau area lesi.', medicineItems: [{ medicineId: 'm9', name: 'Shampoo Antijamur', price: 58000, quantity: 1 }, { medicineId: 'm10', name: 'Salep Luka Kulit', price: 42000, quantity: 1 }] },
  { id: 'v2', patientId: 'p1', visitDate: isoDaysAgo(20), poli: 'Umum', doctor: 'Dr. B', status: 'completed', weight: '3.2 kg', temperature: '', examResult: '', labResult: '', complaint: 'Kontrol nafsu makan dan muntah ringan.', diagnosis: 'Gangguan pencernaan ringan', medicalAction: 'Pemeriksaan umum dan edukasi pola makan.', recommendations: 'Makan porsi kecil lebih sering.', medicineItems: [{ medicineId: 'm21', name: 'Probiotik Sachet', price: 9000, quantity: 4 }] },
  { id: 'v3', patientId: 'p2', visitDate: isoDaysAgo(35), poli: 'Gigi & Mulut', doctor: 'Dr. B', status: 'completed', weight: '4.8 kg', temperature: '', examResult: '', labResult: '', complaint: 'Mulut berbau dan karang gigi ringan.', diagnosis: 'Tartar ringan', medicalAction: 'Pembersihan rongga mulut dan edukasi.', recommendations: 'Kontrol kebersihan mulut di rumah.', medicineItems: [{ medicineId: 'm20', name: 'Dental Gel', price: 52000, quantity: 1 }] },
  { id: 'v4', patientId: 'p3', visitDate: isoDaysAgo(50), poli: 'Bedah', doctor: 'Dr. A', status: 'completed', weight: '6.4 kg', temperature: '', examResult: '', labResult: '', complaint: 'Kontrol pasca operasi jaringan lunak.', diagnosis: 'Proses penyembuhan baik', medicalAction: 'Pembersihan luka dan evaluasi jahitan.', recommendations: 'Gunakan collar dan kontrol ulang.', medicineItems: [{ medicineId: 'm1', name: 'Amoxicillin 500mg', price: 3500, quantity: 6 }, { medicineId: 'm5', name: 'Meloxicam 7.5mg', price: 5000, quantity: 3 }] },
  { id: 'v5', patientId: 'p5', visitDate: isoDaysAgo(12), poli: 'Vaksinasi', doctor: 'Dr. B', status: 'completed', weight: '3.6 kg', temperature: '', examResult: '', labResult: '', complaint: 'Datang untuk vaksin rutin tahunan.', diagnosis: 'Pasien fit untuk vaksinasi', medicalAction: 'Pemeriksaan umum dan pemberian vaksin.', recommendations: 'Observasi 24 jam pertama setelah vaksin.', medicineItems: [{ medicineId: 'm19', name: 'Tricat Vaccine', price: 165000, quantity: 1 }] },
  { id: 'v6', patientId: 'p6', visitDate: isoDaysAgo(7), poli: 'Konsultasi Nutrisi', doctor: 'Dr. B', status: 'pending', weight: '', complaint: '', temperature: '', examResult: '', labResult: '', diagnosis: '', medicalAction: '', recommendations: '', medicineItems: [], totalCost: 0 },
  { id: 'v7', patientId: 'p8', visitDate: isoDaysAgo(2), poli: 'Laboratorium', doctor: 'Dr. C', status: 'pending', weight: '', complaint: '', temperature: '', examResult: '', labResult: '', diagnosis: '', medicalAction: '', recommendations: '', medicineItems: [], totalCost: 0 },
  { id: 'v8', patientId: 'p9', visitDate: isoDaysAgo(1), poli: 'Rawat Inap', doctor: 'Dr. A', status: 'pending', weight: '', complaint: '', temperature: '', examResult: '', labResult: '', diagnosis: '', medicalAction: '', recommendations: '', medicineItems: [], totalCost: 0 },
];

const seedInventory: InventoryTransaction[] = [
  { id: 'it1', medicineId: 'm1', medicineName: 'Amoxicillin 500mg', type: 'masuk', quantity: 40, unitPrice: 3200, total: 128000, note: 'Restock antibiotik awal bulan', createdAt: isoDaysAgo(25) },
  { id: 'it2', medicineId: 'm18', medicineName: 'Rabies Vaccine', type: 'masuk', quantity: 10, unitPrice: 130000, total: 1300000, note: 'Pengadaan vaksin rabies', createdAt: isoDaysAgo(20) },
  { id: 'it3', medicineId: 'm9', medicineName: 'Shampoo Antijamur', type: 'keluar', quantity: 2, unitPrice: 58000, total: 116000, note: 'Keluar untuk pasien poli kulit', createdAt: isoDaysAgo(18) },
  { id: 'it4', medicineId: 'm16', medicineName: 'Ringer Lactate', type: 'masuk', quantity: 12, unitPrice: 30000, total: 360000, note: 'Tambah stok infus', createdAt: isoDaysAgo(12) },
  { id: 'it5', medicineId: 'm21', medicineName: 'Probiotik Sachet', type: 'keluar', quantity: 6, unitPrice: 9000, total: 54000, note: 'Terapi pencernaan pasien rawat jalan', createdAt: isoDaysAgo(6) },
];

const seedFinance: FinanceEntry[] = [
  { id: 'f1', type: 'pengeluaran', category: 'Pembelian Obat', title: 'Belanja stok antibiotik dan vaksin', amount: 1428000, note: 'Supplier bulanan', createdAt: isoDaysAgo(25) },
  { id: 'f2', type: 'pemasukan', category: 'Layanan Klinik', title: 'Konsultasi umum dan tindakan', amount: 850000, note: 'Kas harian', createdAt: isoDaysAgo(18) },
  { id: 'f3', type: 'pemasukan', category: 'Penjualan Obat', title: 'Penjualan obat poli kulit', amount: 116000, note: 'Shampoo + salep', createdAt: isoDaysAgo(18) },
  { id: 'f4', type: 'pengeluaran', category: 'Operasional Lain', title: 'Pembelian alat habis pakai', amount: 275000, note: 'Syringe, sarung tangan, kasa', createdAt: isoDaysAgo(10) },
  { id: 'f5', type: 'pemasukan', category: 'Penjualan Obat', title: 'Probiotik dan vitamin', amount: 164000, note: 'Kas farmasi', createdAt: isoDaysAgo(5) },
];

const getStorage = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const generateRegNo = (items: Patient[]) => `REG-${String(items.length + 1).padStart(4, '0')}`;
const randomUid = (count: number) => `RFID-${String(1300 + count).padStart(4, '0')}`;

export const ClinicProvider = ({ children }: { children: React.ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(() => getStorage('clinic_patients_v23', seedPatients));
  const [visits, setVisits] = useState<VisitRecord[]>(() => getStorage('clinic_visits_v23', seedVisits));
  const [medicines, setMedicines] = useState<Medicine[]>(() => getStorage('clinic_medicines_v23', defaultMedicines));
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => getStorage('clinic_inventory_v23', seedInventory));
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>(() => getStorage('clinic_finance_v23', seedFinance));
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    clinicApi.loadState()
      .then((remote) => {
        if (!active) return;
        setDatabaseConnected(true);
        if (remote) {
          setPatients(remote.patients || []);
          setVisits(remote.visits || []);
          setMedicines(remote.medicines || []);
          setInventoryTransactions(remote.inventoryTransactions || []);
          setFinanceEntries(remote.financeEntries || []);
          if (remote.masterServices) localStorage.setItem('clinic_master_services_v30', JSON.stringify(remote.masterServices));
          if (remote.masterActions) {
            localStorage.setItem('clinic_master_actions_v61', JSON.stringify(remote.masterActions));
            localStorage.setItem('clinic_master_actions_v30', JSON.stringify(remote.masterActions));
          }
          if (remote.masterLabs) {
            localStorage.setItem('clinic_master_lab_v61', JSON.stringify(remote.masterLabs));
            localStorage.setItem('clinic_master_lab_v30', JSON.stringify(remote.masterLabs));
          }
          if (remote.masterPoli) localStorage.setItem('clinic_master_poli_v30', JSON.stringify(remote.masterPoli));
        }
      })
      .catch(() => {
        // Saat development lokal Vite tanpa PHP, aplikasi tetap berjalan memakai localStorage.
        // Saat di cPanel dengan folder api aktif, data akan otomatis memakai MySQL.
        setDatabaseConnected(false);
      })
      .finally(() => {
        if (active) setDatabaseReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => { localStorage.setItem('clinic_patients_v23', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinic_visits_v23', JSON.stringify(visits)); }, [visits]);
  useEffect(() => { localStorage.setItem('clinic_medicines_v23', JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { localStorage.setItem('clinic_inventory_v23', JSON.stringify(inventoryTransactions)); }, [inventoryTransactions]);
  useEffect(() => { localStorage.setItem('clinic_finance_v23', JSON.stringify(financeEntries)); }, [financeEntries]);

  useEffect(() => {
    if (!databaseReady || !databaseConnected) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      clinicApi.saveState({ patients, visits, medicines, inventoryTransactions, financeEntries })
        .catch((error) => console.warn('Sinkronisasi database gagal:', error));
    }, 600);
    return () => window.clearTimeout(saveTimer.current);
  }, [databaseReady, databaseConnected, patients, visits, medicines, inventoryTransactions, financeEntries]);

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === 'clinic_patients_v23' && event.newValue) setPatients(JSON.parse(event.newValue));
      if (event.key === 'clinic_visits_v23' && event.newValue) setVisits(JSON.parse(event.newValue));
      if (event.key === 'clinic_medicines_v23' && event.newValue) setMedicines(JSON.parse(event.newValue));
      if (event.key === 'clinic_inventory_v23' && event.newValue) setInventoryTransactions(JSON.parse(event.newValue));
      if (event.key === 'clinic_finance_v23' && event.newValue) setFinanceEntries(JSON.parse(event.newValue));
    };
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const createVisit = (patientId: string, poli: string, doctor: string, complaint = '') => {
    const visit: VisitRecord = {
      id: crypto.randomUUID(),
      patientId,
      visitDate: new Date().toISOString(),
      poli,
      doctor,
      status: 'pending',
      complaint,
      weight: '',
      temperature: '',
      examResult: '',
      labResult: '',
      diagnosis: '',
      medicalAction: '',
      recommendations: '',
      medicineItems: [],
      totalCost: 0,
      paymentStatus: 'Menunggu Pembayaran',
      additionalCharges: [],
      discountPercent: 0,
    };
    setVisits((prev) => [visit, ...prev]);
    if (databaseConnected) {
      clinicApi.saveVisit(visit).catch((error) => console.warn('Gagal menyimpan kunjungan ke database:', error));
    }
  };

  const addPatient = (patient: Omit<Patient, 'id' | 'createdAt' | 'customerNumber'>, visitMeta: { poli: string; doctor: string; complaint?: string }, sendToDoctor = false) => {
    const newPatient: Patient = {
      ...patient,
      id: crypto.randomUUID(),
      customerNumber: generateRegNo(patients),
      rfidUid: patient.rfidUid || randomUid(patients.length + 1),
      createdAt: new Date().toISOString(),
    };
    setPatients((prev) => [newPatient, ...prev]);
    if (databaseConnected) {
      clinicApi.savePatient(newPatient).catch((error) => console.warn('Gagal menyimpan pasien ke database:', error));
    }
    if (sendToDoctor) createVisit(newPatient.id, visitMeta.poli, visitMeta.doctor, (visitMeta as any).complaint || '');
  };

  const updatePatient = (patientId: string, updates: Partial<Patient>) => {
    setPatients((prev) => {
      const next = prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p));
      const updatedPatient = next.find((p) => p.id === patientId);
      if (updatedPatient && databaseConnected) {
        clinicApi.savePatient(updatedPatient).catch((error) => console.warn('Gagal memperbarui pasien di database:', error));
      }
      return next;
    });
  };

  const createVisitForExistingPatient = (patientId: string, visitMeta: { poli: string; doctor: string; complaint?: string }) => createVisit(patientId, visitMeta.poli, visitMeta.doctor, visitMeta.complaint || '');
  const getPendingVisits = () => visits.filter((v) => v.status === 'pending');
  const getCompletedVisits = () => visits.filter((v) => v.status === 'completed');

  const updateVisit = (visitId: string, updates: Partial<VisitRecord>) => {
    const current = visits.find((v) => v.id === visitId);
    const shouldConsumeMedicine = Boolean(
      current
      && updates.medicineItems
      && (
        (current.status !== 'completed' && updates.status === 'completed')
        || ((current.billingStatus || '') !== 'siap_bayar' && updates.billingStatus === 'siap_bayar')
      )
    );
    if (current && shouldConsumeMedicine && updates.medicineItems) {
      setMedicines((prev) => prev.map((med) => {
        const used = updates.medicineItems?.find((item) => item.medicineId === med.id);
        return used ? { ...med, stock: Math.max(0, med.stock - used.quantity) } : med;
      }));
      const createdAt = new Date().toISOString();
      const medTx = updates.medicineItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          id: crypto.randomUUID(),
          medicineId: item.medicineId,
          medicineName: item.name,
          type: 'keluar' as const,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price,
          note: `Obat keluar dari billing FO / kunjungan ${current.poli}`,
          createdAt,
        }));
      if (medTx.length) {
        setInventoryTransactions((prev) => [...medTx, ...prev]);
        const extraCharges = (updates.additionalCharges || []) as ChargeItem[];
        setFinanceEntries((prev) => [
          ...medTx.map((tx) => ({
            id: crypto.randomUUID(),
            type: 'pemasukan' as const,
            category: 'Penjualan Obat' as const,
            title: `Penjualan ${tx.medicineName}`,
            amount: tx.total,
            note: tx.note,
            createdAt: tx.createdAt,
          })),
          ...extraCharges.filter((item) => item.price > 0).map((item) => ({
            id: crypto.randomUUID(),
            type: 'pemasukan' as const,
            category: 'Layanan Klinik' as const,
            title: item.name,
            amount: item.price,
            note: `Tindakan/jasa tambahan dari Front Office`,
            createdAt,
          })),
          ...prev,
        ]);
      }
    }
    const normalizedUpdates: Partial<VisitRecord> = current && current.status !== 'completed' && updates.status === 'completed'
      ? { ...updates, paymentStatus: 'Menunggu Pembayaran' }
      : updates;
    setVisits((prev) => {
      const next = prev.map((v) => (v.id === visitId ? { ...v, ...normalizedUpdates } : v));
      const updatedVisit = next.find((v) => v.id === visitId);
      if (updatedVisit && databaseConnected) {
        clinicApi.saveVisit(updatedVisit).catch((error) => console.warn('Gagal memperbarui kunjungan di database:', error));
      }
      return next;
    });
  };

  const getPatientById = (patientId: string) => patients.find((p) => p.id === patientId);
  const addMedicine = (medicine: Omit<Medicine, 'id'>) => {
    const created = { ...medicine, id: crypto.randomUUID() };
    setMedicines((prev) => [created, ...prev]);
    if (databaseConnected) {
      clinicApi.saveMedicine(created).catch((error) => console.warn('Gagal menyimpan obat ke database:', error));
    }
    return created;
  };

  const deleteMedicine = (medicineId: string) => {
    const target = medicines.find((m) => m.id === medicineId);
    if (!target) return;

    const createdAt = new Date().toISOString();
    const quantityOut = Math.max(0, Number(target.stock || 0));
    const unitPrice = Math.max(0, Number(target.price || 0));
    const total = quantityOut * unitPrice;

    const inventoryTransaction: InventoryTransaction = {
      id: crypto.randomUUID(),
      medicineId: target.id,
      medicineName: target.name,
      type: 'keluar',
      quantity: quantityOut,
      unitPrice,
      total,
      note: 'Obat dihapus dari master stok obat',
      createdAt,
    };

    const financeEntry: FinanceEntry = {
      id: crypto.randomUUID(),
      type: 'pengeluaran',
      category: 'Operasional Lain',
      title: "Penghapusan stok " + target.name,
      amount: total,
      note: 'Pengeluaran karena obat dihapus dari master stok',
      createdAt,
    };

    setInventoryTransactions((prev) => [inventoryTransaction, ...prev]);
    if (total > 0) setFinanceEntries((prev) => [financeEntry, ...prev]);
    setMedicines((prev) => prev.filter((m) => m.id !== medicineId));

    if (databaseConnected) {
      clinicApi.saveInventoryTransaction(inventoryTransaction).catch((error) => console.warn('Gagal mencatat pengeluaran stok obat ke database:', error));
      if (total > 0) clinicApi.saveFinanceEntry(financeEntry).catch((error) => console.warn('Gagal mencatat pengeluaran keuangan obat ke database:', error));
      clinicApi.deleteMedicine(medicineId).catch((error) => console.warn('Gagal menghapus obat di database:', error));
    }
  };

  const addInventoryTransaction = (payload: Omit<InventoryTransaction, 'id' | 'medicineName' | 'total' | 'createdAt'>) => {
    const medicine = medicines.find((item) => item.id === payload.medicineId);
    if (!medicine) return;
    const createdAt = new Date().toISOString();
    const total = payload.quantity * payload.unitPrice;
    const nextStock = payload.type === 'masuk' ? medicine.stock + payload.quantity : Math.max(0, medicine.stock - payload.quantity);
    const updatedMedicine: Medicine = { ...medicine, stock: nextStock };
    const transaction: InventoryTransaction = {
      id: crypto.randomUUID(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      type: payload.type,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total,
      note: payload.note,
      createdAt,
    };
    const financeEntry: FinanceEntry = {
      id: crypto.randomUUID(),
      type: payload.type === 'masuk' ? 'pengeluaran' : 'pemasukan',
      category: payload.type === 'masuk' ? 'Pembelian Obat' : 'Penjualan Obat',
      title: `${payload.type === 'masuk' ? 'Pembelian' : 'Pengeluaran'} ${medicine.name}`,
      amount: total,
      note: payload.note,
      createdAt,
    };
    setMedicines((prev) => prev.map((item) => (item.id === medicine.id ? updatedMedicine : item)));
    setInventoryTransactions((prev) => [transaction, ...prev]);
    setFinanceEntries((prev) => [financeEntry, ...prev]);
    if (databaseConnected) {
      clinicApi.saveMedicine(updatedMedicine).catch((error) => console.warn('Gagal memperbarui stok obat di database:', error));
      clinicApi.saveInventoryTransaction(transaction).catch((error) => console.warn('Gagal menyimpan transaksi stok ke database:', error));
      clinicApi.saveFinanceEntry(financeEntry).catch((error) => console.warn('Gagal menyimpan catatan keuangan obat ke database:', error));
    }
  };

  const addFinanceEntry = (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => {
    const created: FinanceEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setFinanceEntries((prev) => [created, ...prev]);
    if (databaseConnected) {
      clinicApi.saveFinanceEntry(created).catch((error) => console.warn('Gagal menyimpan catatan keuangan ke database:', error));
    }
  };

  const deletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    setVisits((prev) => prev.filter((v) => v.patientId !== patientId));
    if (databaseConnected) {
      clinicApi.deletePatient(patientId).catch((error) => console.warn('Gagal menghapus pasien di database:', error));
    }
  };
  const deleteVisit = (visitId: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
    if (databaseConnected) {
      clinicApi.deleteVisit(visitId).catch((error) => console.warn('Gagal menghapus kunjungan di database:', error));
    }
  };

  const value = useMemo(() => ({
    patients,
    visits,
    medicines,
    inventoryTransactions,
    financeEntries,
    addPatient,
    updatePatient,
    createVisitForExistingPatient,
    getPendingVisits,
    getCompletedVisits,
    updateVisit,
    getPatientById,
    addMedicine,
    deleteMedicine,
    addInventoryTransaction,
    addFinanceEntry,
    deletePatient,
    deleteVisit,
  }), [patients, visits, medicines, inventoryTransactions, financeEntries, databaseConnected]);

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) throw new Error('useClinic must be used within ClinicProvider');
  return context;
};
