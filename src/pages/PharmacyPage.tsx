import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { useClinic } from '../context/ClinicContext';
import type { MasterPriceItem } from '../types';
import { clinicApi } from '../api/clinicApi';

const monthKey = (value: string) => value.slice(0, 7);
const monthLabel = (value: string) => new Date(`${value}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const dayKey = (value: string) => value.slice(0, 10);
const getTodayKey = () => dayKey(new Date().toISOString());
const getCurrentMonthKey = () => monthKey(new Date().toISOString());
const formatRupiahInput = (value: string | number) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('id-ID') : '';
};
const parseRupiahInput = (value: string) => Number(value.replace(/\D/g, '') || 0);
const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const defaultServices: MasterPriceItem[] = [
  { id: "svc1", name: "Administrasi", minPrice: 0 },
  { id: "svc2", name: "Benang Operasi", minPrice: 0 },
  { id: "svc3", name: "Biaya Penguburan Kucing", minPrice: 0 },
  { id: "svc4", name: "Cateter", minPrice: 0 },
  { id: "svc5", name: "Gloves paramedis", minPrice: 0 },
  { id: "svc6", name: "Housecall", minPrice: 0 },
  { id: "svc7", name: "Infus botol tambahan", minPrice: 0 },
  { id: "svc8", name: "Infus botol tambahan + Vitamin", minPrice: 0 },
  { id: "svc9", name: "Infus botol tambahan assering", minPrice: 0 },
  { id: "svc10", name: "Iv cath", minPrice: 0 },
  { id: "svc11", name: "Kassa", minPrice: 0 },
  { id: "svc12", name: "Kassa & Spray", minPrice: 0 },
  { id: "svc13", name: "Kassa box", minPrice: 0 },
  { id: "svc14", name: "Selang infus", minPrice: 0 },
  { id: "svc15", name: "Transport", minPrice: 0 },
  { id: "svc16", name: "Uang Muka Perawatan", minPrice: 0 },
  { id: "svc17", name: "Underpad", minPrice: 0 },
  { id: "svc18", name: "Underpad 1 bal", minPrice: 0 },
];
const defaultActions: MasterPriceItem[] = [
  { id: "act1", name: "Bedah Orthopedi", type: "tindakan", minPrice: 0 },
  { id: "act2", name: "Biopsi", type: "tindakan", minPrice: 0 },
  { id: "act3", name: "Dental Scaling - Cat", type: "tindakan", minPrice: 0 },
  { id: "act4", name: "Dental Scaling - Dog 1-5 kg", type: "tindakan", minPrice: 0 },
  { id: "act5", name: "Dental Scaling - Dog 5-10 kg", type: "tindakan", minPrice: 0 },
  { id: "act6", name: "Dental Scaling - Dog 10-15 kg", type: "tindakan", minPrice: 0 },
  { id: "act7", name: "Dental Scaling - Dog 15-20 kg", type: "tindakan", minPrice: 0 },
  { id: "act8", name: "EKG", type: "tindakan", minPrice: 0 },
  { id: "act9", name: "Endoscopy", type: "tindakan", minPrice: 0 },
  { id: "act10", name: "Infus Intraosseous", type: "tindakan", minPrice: 0 },
  { id: "act11", name: "Laser Therapy - 1x treatment", type: "tindakan", minPrice: 0 },
  { id: "act12", name: "Transfusi - Plasma 1x", type: "tindakan", minPrice: 0 },
  { id: "act13", name: "Tindakan Cystotomy", type: "tindakan", minPrice: 0 },
  { id: "act14", name: "Tindakan Entropion", type: "tindakan", minPrice: 0 },
  { id: "act15", name: "Tindakan Fistula / Fistulectomy", type: "tindakan", minPrice: 0 },
  { id: "act16", name: "Tindakan Prolaps Ani", type: "tindakan", minPrice: 0 },
  { id: "act17", name: "Tindakan Prolaps Uteri", type: "tindakan", minPrice: 0 },
  { id: "act18", name: "Tindakan Pyometra", type: "tindakan", minPrice: 0 },
  { id: "act19", name: "Tindakan Thoracocentesis", type: "tindakan", minPrice: 0 },
  { id: "act20", name: "Biaya Penitipan Extra tanggal 1-3", type: "tindakan", minPrice: 0 },
  { id: "act21", name: "Day Care", type: "tindakan", minPrice: 0 },
  { id: "act22", name: "Day Care Partus", type: "tindakan", minPrice: 0 },
  { id: "act23", name: "Deposit Rawat inap/Penitipan", type: "tindakan", minPrice: 0 },
  { id: "act24", name: "Penitipan sehat kucing /hari", type: "tindakan", minPrice: 0 },
  { id: "act25", name: "Rawat Inap FPV/CPV", type: "tindakan", minPrice: 0 },
  { id: "act26", name: "Rawat Inap Infeksius /hari", type: "tindakan", minPrice: 0 },
  { id: "act27", name: "Rawat Inap non-Inf /hari", type: "tindakan", minPrice: 0 },
  { id: "act28", name: "Visit Dokter hewan /hari", type: "tindakan", minPrice: 0 },
  { id: "act29", name: "Visit Dokter Lebaran hari 1-2", type: "tindakan", minPrice: 0 },
];
const defaultLabs: MasterPriceItem[] = [
  { id: "lab1", name: "Analgest Spray", type: "lab", minPrice: 0 },
  { id: "lab2", name: "Cek Darah Elektrolit", type: "lab", minPrice: 0 },
  { id: "lab3", name: "Cek Golongan Darah", type: "lab", minPrice: 0 },
  { id: "lab4", name: "Comprehensive plus 24", type: "lab", minPrice: 0 },
  { id: "lab5", name: "Day Care Anjing S/M", type: "lab", minPrice: 0 },
  { id: "lab6", name: "Day Care kucing A", type: "lab", minPrice: 0 },
  { id: "lab7", name: "Day Care kucing B", type: "lab", minPrice: 0 },
  { id: "lab8", name: "Diabetes Test 9", type: "lab", minPrice: 0 },
  { id: "lab9", name: "FIA FPV Ag Test", type: "lab", minPrice: 0 },
  { id: "lab10", name: "FIA Test CPV Ag", type: "lab", minPrice: 0 },
  { id: "lab11", name: "FIA Test Fpv Ab", type: "lab", minPrice: 0 },
  { id: "lab12", name: "Glucose test", type: "lab", minPrice: 0 },
  { id: "lab13", name: "Health Check 16", type: "lab", minPrice: 0 },
  { id: "lab14", name: "IDEXX SNAP FIV/FeLV Combo", type: "lab", minPrice: 0 },
  { id: "lab15", name: "IDEXX Snap FIV/FELV Rapid Test", type: "lab", minPrice: 0 },
  { id: "lab16", name: "IDEXX Snap IPL Rapid Test", type: "lab", minPrice: 0 },
  { id: "lab17", name: "IDEXX Snap Parvo Rapid Test", type: "lab", minPrice: 0 },
  { id: "lab18", name: "Kultur Media", type: "lab", minPrice: 0 },
  { id: "lab19", name: "Mikro test", type: "lab", minPrice: 0 },
  { id: "lab20", name: "Ocular FDT test", type: "lab", minPrice: 0 },
  { id: "lab21", name: "Paket Blood Screening", type: "lab", minPrice: 0 },
  { id: "lab22", name: "Paket FPV Test + Hematologi Test", type: "lab", minPrice: 0 },
  { id: "lab23", name: "Paket MCU 1", type: "lab", minPrice: 0 },
  { id: "lab24", name: "Paket MCU 2", type: "lab", minPrice: 0 },
  { id: "lab25", name: "Paket MCU 3", type: "lab", minPrice: 0 },
  { id: "lab26", name: "Paket MCU 4", type: "lab", minPrice: 0 },
  { id: "lab27", name: "Paket MCU-FIP", type: "lab", minPrice: 0 },
  { id: "lab28", name: "Paket MCU-PARV", type: "lab", minPrice: 0 },
  { id: "lab29", name: "Paket MCU-PREG", type: "lab", minPrice: 0 },
  { id: "lab30", name: "Paket MCU-URI", type: "lab", minPrice: 0 },
  { id: "lab31", name: "Pembersihan Lem A", type: "lab", minPrice: 0 },
  { id: "lab32", name: "Pembersihan Lem B", type: "lab", minPrice: 0 },
  { id: "lab33", name: "Pemeriksaan Anjing Besar >15kg", type: "lab", minPrice: 0 },
  { id: "lab34", name: "Pemeriksaan Anjing Kecil <5kg", type: "lab", minPrice: 0 },
  { id: "lab35", name: "Pemeriksaan anjing sedang 5-15kg", type: "lab", minPrice: 0 },
  { id: "lab36", name: "Pemeriksaan Kucing Anak", type: "lab", minPrice: 0 },
  { id: "lab37", name: "Pemeriksaan Kucing Dewasa", type: "lab", minPrice: 0 },
  { id: "lab38", name: "Pemeriksaan Kutu Jamur Ringworm A", type: "lab", minPrice: 0 },
  { id: "lab39", name: "Pemeriksaan Kutu Jamur Ringworm B", type: "lab", minPrice: 0 },
  { id: "lab40", name: "Pemeriksaan Kutu Jamur Ringworm C", type: "lab", minPrice: 0 },
  { id: "lab41", name: "Periksa Feses", type: "lab", minPrice: 0 },
  { id: "lab42", name: "Periksa Feses (Transit)", type: "lab", minPrice: 0 },
  { id: "lab43", name: "Periksa Kulit A", type: "lab", minPrice: 0 },
  { id: "lab44", name: "Periksa Kulit B", type: "lab", minPrice: 0 },
  { id: "lab45", name: "Periksa Kulit C", type: "lab", minPrice: 0 },
  { id: "lab46", name: "Periksa Kulit Kuku Rambut", type: "lab", minPrice: 0 },
  { id: "lab47", name: "Periksa Ulas Darah", type: "lab", minPrice: 0 },
  { id: "lab48", name: "Profile Chem 10CLIP", type: "lab", minPrice: 0 },
  { id: "lab49", name: "Rapid Test CDV", type: "lab", minPrice: 0 },
  { id: "lab50", name: "Rapid Test CDV + CPV", type: "lab", minPrice: 0 },
  { id: "lab51", name: "Rapid Test Ehrlicia Canis Ab", type: "lab", minPrice: 0 },
  { id: "lab52", name: "Rapid Test FCoV", type: "lab", minPrice: 0 },
  { id: "lab53", name: "Rapid Test Feline Corona Virus (FCoV...)", type: "lab", minPrice: 0 },
  { id: "lab54", name: "Rapid Test FIP + FCoV", type: "lab", minPrice: 0 },
  { id: "lab55", name: "Rapid Test FPV", type: "lab", minPrice: 0 },
  { id: "lab56", name: "Rapid Test Feline Panleukopenia Ag", type: "lab", minPrice: 0 },
  { id: "lab57", name: "Rapid Test FIV AB / FeLV AG", type: "lab", minPrice: 0 },
  { id: "lab58", name: "Rapid Test Giardiasis Ag", type: "lab", minPrice: 0 },
  { id: "lab59", name: "Rapid Test HWT Canine Heartworm Ag", type: "lab", minPrice: 0 },
  { id: "lab60", name: "Rapid Test Leptospira Ab", type: "lab", minPrice: 0 },
  { id: "lab61", name: "Rapid Test Parvovirus CPV Ag", type: "lab", minPrice: 0 },
  { id: "lab62", name: "Rapid Test PLATO (Toxo)", type: "lab", minPrice: 0 },
  { id: "lab63", name: "Rapid Test Toxoplasma Ag", type: "lab", minPrice: 0 },
  { id: "lab64", name: "Rapid Test Toxoplasma IgG / IgM", type: "lab", minPrice: 0 },
  { id: "lab65", name: "SGOT/SGPT Test", type: "lab", minPrice: 0 },
  { id: "lab66", name: "SUGAR LEVEL CHECK", type: "lab", minPrice: 0 },
  { id: "lab67", name: "ULTRASOUND 1", type: "lab", minPrice: 0 },
  { id: "lab68", name: "ULTRASOUND 2", type: "lab", minPrice: 0 },
  { id: "lab69", name: "Ultrasonografi", type: "lab", minPrice: 0 },
  { id: "lab70", name: "Ultrasonografi / USG A", type: "lab", minPrice: 0 },
  { id: "lab71", name: "Ultrasonografi / USG B", type: "lab", minPrice: 0 },
  { id: "lab72", name: "Ultrasonografi / USG C", type: "lab", minPrice: 0 },
  { id: "lab73", name: "Urinalisis", type: "lab", minPrice: 0 },
  { id: "lab74", name: "Urinalisis Lengkap", type: "lab", minPrice: 0 },
  { id: "lab75", name: "Urine Catheter A", type: "lab", minPrice: 0 },
  { id: "lab76", name: "Urine Catheter B", type: "lab", minPrice: 0 },
  { id: "lab77", name: "Urine Catheter C", type: "lab", minPrice: 0 },
  { id: "lab78", name: "Urine Catheter D", type: "lab", minPrice: 0 },
  { id: "lab79", name: "Vaksinasi + Vaksin Canigen DHA2PPI ...", type: "lab", minPrice: 0 },
  { id: "lab80", name: "Vaksinasi + Vaksin Canigen KC (Bat...)", type: "lab", minPrice: 0 },
  { id: "lab81", name: "Vaksinasi + Vaksin Feligen CRP ...", type: "lab", minPrice: 0 },
  { id: "lab82", name: "Vaksinasi + Vaksin Feloimun ...", type: "lab", minPrice: 0 },
  { id: "lab83", name: "Vaksinasi + Vaksin Rabisin ...", type: "lab", minPrice: 0 },
];
const defaultPoli: MasterPriceItem[] = [
  { id: "poli1", name: "Umum", minPrice: 0 },
  { id: "poli2", name: "Bedah", minPrice: 0 },
  { id: "poli3", name: "Dermatologi", minPrice: 0 },
  { id: "poli4", name: "Gigi & Mulut", minPrice: 0 },
  { id: "poli5", name: "Vaksinasi", minPrice: 0 },
  { id: "poli6", name: "Konsultasi Nutrisi", minPrice: 0 },
  { id: "poli7", name: "Rawat Inap", minPrice: 0 },
];

const defaultInpatients: MasterPriceItem[] = [
  { id: 'inp1', name: 'Rawat Inap Infeksius /hari', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp2', name: 'Rawat Inap non-Inf /hari', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp3', name: 'Rawat Inap FPV/CPV', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp4', name: 'Day Care', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp5', name: 'Day Care Partus', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp6', name: 'Biaya Penitipan Extra tanggal 1-3', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp7', name: 'Penitipan sehat kucing /hari', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp8', name: 'Visit Dokter hewan /hari', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
  { id: 'inp9', name: 'Visit Dokter Lebaran hari 1-2', type: 'rawat_inap', minPrice: 0, unit: 'hari' },
];


const getStorage = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const labNameSet = new Set(defaultLabs.map((item) => item.name.toLowerCase()));
const normalizeMasterRows = (rows: MasterPriceItem[], kind: 'tindakan' | 'lab') => rows.map((item) => ({ ...item, type: kind }));
const getMasterRows = (keys: string[], fallback: MasterPriceItem[], kind: 'tindakan' | 'lab') => {
  const byName = new Map<string, MasterPriceItem>();
  let foundStorage = false;
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    foundStorage = true;
    try {
      const rows = JSON.parse(raw) as MasterPriceItem[];
      if (!Array.isArray(rows)) continue;
      rows.forEach((item) => {
        if (!item?.name) return;
        const matchesKind = item.type ? (kind === 'tindakan' ? item.type === 'tindakan' : item.type !== 'tindakan') : (kind === 'lab' ? labNameSet.has(item.name.toLowerCase()) : !labNameSet.has(item.name.toLowerCase()));
        if (!matchesKind) return;
        const keyName = item.name.trim().toLowerCase();
        if (!byName.has(keyName)) byName.set(keyName, { ...item, type: kind });
      });
    } catch {
      // Abaikan storage rusak dan pakai fallback jika belum ada storage valid.
    }
  }
  if (foundStorage) return normalizeMasterRows(Array.from(byName.values()), kind);
  return fallback;
};

export const PharmacyPage = () => {
  const { patients, medicines, addMedicine, deleteMedicine, inventoryTransactions, financeEntries, addInventoryTransaction, addFinanceEntry, visits } = useClinic();
  const [tab, setTab] = useState<'akuntansi' | 'master'>('akuntansi');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [masterSearch, setMasterSearch] = useState({ service: '', action: '', lab: '', poli: '', inpatient: '' });
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [transactionFilterType, setTransactionFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [transactionFilterDay, setTransactionFilterDay] = useState(getTodayKey);
  const [financeFilterType, setFinanceFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [financeFilterDay, setFinanceFilterDay] = useState(getTodayKey);
  const [selectedMethodNote, setSelectedMethodNote] = useState<string>('');
  const [inventoryForm, setInventoryForm] = useState<{ medicineId: string; type: 'masuk' | 'keluar'; quantity: number; unitPrice: string; note: string; newName: string; newUnit: string; newCategory: string }>({ medicineId: medicines[0]?.id ?? '__new__', type: 'masuk', quantity: 1, unitPrice: formatRupiahInput(medicines[0]?.price ?? 0), note: '', newName: '', newUnit: 'Tablet', newCategory: 'Antibiotik Oral' });
  const [financeForm, setFinanceForm] = useState<{ type: 'pemasukan' | 'pengeluaran'; category: 'Pembelian Obat' | 'Penjualan Obat' | 'Layanan Klinik' | 'Operasional Lain'; title: string; amount: string; note: string }>({ type: 'pemasukan', category: 'Layanan Klinik', title: '', amount: '', note: '' });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [services, setServices] = useState<MasterPriceItem[]>(() => getStorage('clinic_master_services_v30', defaultServices));
  const [actions, setActions] = useState<MasterPriceItem[]>(() => getMasterRows(['clinic_master_actions_v61', 'clinic_master_actions_v30'], defaultActions, 'tindakan'));
  const [labs, setLabs] = useState<MasterPriceItem[]>(() => getMasterRows(['clinic_master_lab_v61', 'clinic_master_lab_v30'], defaultLabs, 'lab'));
  const [polis, setPolis] = useState<MasterPriceItem[]>(() => getStorage('clinic_master_poli_v30', defaultPoli));
  const [inpatients, setInpatients] = useState<MasterPriceItem[]>(() => getStorage('clinic_master_inpatients_v70', defaultInpatients));
  const [masterForm, setMasterForm] = useState({ kind: 'service' as 'service' | 'action' | 'lab' | 'poli' | 'inpatient', name: '', minPrice: '', maxPrice: '' });
  const [masterReady, setMasterReady] = useState(false);

  useEffect(() => { localStorage.setItem('clinic_master_services_v30', JSON.stringify(services)); }, [services]);
  useEffect(() => {
    const rows = normalizeMasterRows(actions, 'tindakan');
    localStorage.setItem('clinic_master_actions_v61', JSON.stringify(rows));
    localStorage.setItem('clinic_master_actions_v30', JSON.stringify(rows));
  }, [actions]);
  useEffect(() => {
    const rows = normalizeMasterRows(labs, 'lab');
    localStorage.setItem('clinic_master_lab_v61', JSON.stringify(rows));
    localStorage.setItem('clinic_master_lab_v30', JSON.stringify(rows));
  }, [labs]);
  useEffect(() => { localStorage.setItem('clinic_master_poli_v30', JSON.stringify(polis)); }, [polis]);
  useEffect(() => { localStorage.setItem('clinic_master_inpatients_v70', JSON.stringify(inpatients)); }, [inpatients]);


  useEffect(() => {
    let active = true;
    clinicApi.loadState()
      .then((remote) => {
        if (!active || !remote) return;
        if (remote.masterServices) setServices(remote.masterServices);
        if (remote.masterActions) setActions(normalizeMasterRows(remote.masterActions, 'tindakan'));
        if (remote.masterLabs) setLabs(normalizeMasterRows(remote.masterLabs, 'lab'));
        if (remote.masterPoli) setPolis(remote.masterPoli);
        if (remote.masterInpatients) setInpatients(remote.masterInpatients);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setMasterReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!masterReady) return;
    const timer = window.setTimeout(() => {
      clinicApi.saveMasters({ masterServices: services, masterActions: normalizeMasterRows(actions, 'tindakan'), masterLabs: normalizeMasterRows(labs, 'lab'), masterPoli: polis, masterInpatients: inpatients.map((item) => ({ ...item, type: 'rawat_inap', unit: item.unit || 'hari' })) })
        .catch((error) => console.warn('Gagal menyimpan master data ke database:', error));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [masterReady, services, actions, labs, polis, inpatients, patients, visits, medicines, inventoryTransactions, financeEntries]);
  useEffect(() => {
    let lastDay = getTodayKey();
    let lastMonth = getCurrentMonthKey();

    const syncDateFilters = () => {
      const nextDay = getTodayKey();
      const nextMonth = getCurrentMonthKey();

      if (nextDay !== lastDay) {
        lastDay = nextDay;
        setTransactionFilterDay(nextDay);
        setFinanceFilterDay(nextDay);
        setSelectedMethodNote('');
      }

      if (nextMonth !== lastMonth) {
        lastMonth = nextMonth;
        setSelectedMonth(nextMonth);
      }
    };

    const interval = window.setInterval(syncDateFilters, 60000);
    const onVisibility = () => { if (!document.hidden) syncDateFilters(); };
    const onFocus = () => syncDateFilters();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    syncDateFilters();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const availableMonths = useMemo(() => Array.from(new Set([...inventoryTransactions.map((item) => monthKey(item.createdAt)), ...financeEntries.map((item) => monthKey(item.createdAt)), ...visits.filter(v=>v.paymentDate).map(v=>monthKey(v.paymentDate!))])).sort().reverse(), [inventoryTransactions, financeEntries, visits]);
  const lowStockCount = medicines.filter((m) => m.stock <= 20).length;
  const activeDebtTotal = visits.filter((v) => v.paymentStatus === 'Hutang').reduce((sum, v) => sum + Math.max(0, (v.debtTotal || v.totalCost || 0) - (v.debtPaid || 0)), 0);
  const stockRows = medicines.filter((m) => {
    const matchSearch = `${m.name} ${m.category} ${m.unit}`.toLowerCase().includes(stockSearch.toLowerCase());
    const matchLow = !showLowStockOnly || m.stock <= 20;
    return matchSearch && matchLow;
  });

  const dailyInventory = inventoryTransactions.filter((item) => dayKey(item.createdAt) === transactionFilterDay && (transactionFilterType === 'all' || item.type === transactionFilterType));
  const allFinanceRows = financeEntries.filter((item) => dayKey(item.createdAt) === financeFilterDay);
  const financeRows = allFinanceRows.filter((item) => financeFilterType === 'all' || item.type === financeFilterType);
  const totalIncome = allFinanceRows.filter((item) => item.type === 'pemasukan').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = allFinanceRows.filter((item) => item.type === 'pengeluaran').reduce((sum, item) => sum + item.amount, 0);
  const paymentFinanceRows = allFinanceRows.filter((item) => item.type === 'pemasukan' && /(Cash|Debit|Transfer|QRIS|DP Rawat Inap)/i.test(item.note || ''));
  const methodBreakdown = paymentFinanceRows.reduce<Record<string, number>>((acc, item) => { acc[item.note || 'Lainnya'] = (acc[item.note || 'Lainnya'] || 0) + item.amount; return acc; }, {});
  const selectedMethodRows = selectedMethodNote ? paymentFinanceRows.filter((item) => item.note === selectedMethodNote) : [];
  const cashToday = paymentFinanceRows.filter((item) => item.note.startsWith('Cash')).reduce((sum, item) => sum + item.amount, 0);
  const totalOverall = totalIncome - totalExpense;

  const submitInventory = (e: React.FormEvent) => {
    e.preventDefault();
    let medicineId = inventoryForm.medicineId;
    let unitPrice = parseRupiahInput(inventoryForm.unitPrice);
    if (inventoryForm.medicineId === '__new__') {
      const created = addMedicine({ name: inventoryForm.newName, unit: inventoryForm.newUnit, category: inventoryForm.newCategory, price: unitPrice, stock: 0 });
      if (!created) return;
      medicineId = created.id;
    }
    addInventoryTransaction({ medicineId, type: inventoryForm.type, quantity: Number(inventoryForm.quantity), unitPrice, note: inventoryForm.note });
    setInventoryOpen(false);
    setInventoryForm({ medicineId: medicines[0]?.id ?? '__new__', type: 'masuk', quantity: 1, unitPrice: formatRupiahInput(medicines[0]?.price ?? 0), note: '', newName: '', newUnit: 'Tablet', newCategory: 'Antibiotik Oral' });
  };

  const submitFinance = (e: React.FormEvent) => {
    e.preventDefault();
    addFinanceEntry({ ...financeForm, amount: parseRupiahInput(financeForm.amount) });
    setFinanceOpen(false);
    setFinanceForm({ type: 'pemasukan', category: 'Layanan Klinik', title: '', amount: '', note: '' });
  };

  const handleDeleteMedicine = (medicineId: string, medicineName: string) => {
    if (!window.confirm("Yakin ingin menghapus obat " + medicineName + " dari master obat?")) return;
    deleteMedicine(medicineId);
  };

  const sameMasterName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const applyPriceToSameName = (rows: MasterPriceItem[], name: string, minPrice: number, maxPrice?: number) => rows.map((row) => sameMasterName(row.name, name) ? { ...row, minPrice, maxPrice } : row);

  const submitMaster = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MasterPriceItem = { id: crypto.randomUUID(), name: masterForm.name, type: masterForm.kind === 'lab' ? 'lab' : masterForm.kind === 'action' ? 'tindakan' : masterForm.kind === 'inpatient' ? 'rawat_inap' : undefined, unit: masterForm.kind === 'inpatient' ? 'hari' : undefined, minPrice: parseRupiahInput(masterForm.minPrice), maxPrice: parseRupiahInput(masterForm.maxPrice) || undefined };
    if (masterForm.kind === 'service') setServices((prev) => [item, ...prev]);
    if (masterForm.kind === 'action') setActions((prev) => [{ ...item, type: 'tindakan' }, ...prev]);
    if (masterForm.kind === 'lab') setLabs((prev) => [{ ...item, type: 'lab' }, ...prev]);
    if (masterForm.kind === 'poli') setPolis((prev) => [item, ...prev]);
    if (masterForm.kind === 'inpatient') setInpatients((prev) => [{ ...item, type: 'rawat_inap', unit: 'hari' }, ...prev]);
    setMasterForm({ kind: 'service', name: '', minPrice: '', maxPrice: '' });
  };

  const editMaster = (kind: 'service' | 'action' | 'lab' | 'poli' | 'inpatient', item: MasterPriceItem) => {
    const next = window.prompt(`Ubah harga minimum untuk ${item.name}`, formatRupiahInput(item.minPrice));
    if (!next) return;
    const max = window.prompt(`Ubah harga maksimum untuk ${item.name} (boleh kosong)`, item.maxPrice ? formatRupiahInput(item.maxPrice) : '') || '';
    const minPrice = parseRupiahInput(next);
    const maxPrice = parseRupiahInput(max) || undefined;
    const mutate = (arr: MasterPriceItem[]) => arr.map((row) => row.id === item.id ? { ...row, minPrice, maxPrice } : row);
    if (kind === 'service') {
      setServices(mutate);
      setActions((prev) => applyPriceToSameName(prev, item.name, minPrice, maxPrice));
      setLabs((prev) => applyPriceToSameName(prev, item.name, minPrice, maxPrice));
    }
    if (kind === 'action') {
      setActions(mutate);
      setServices((prev) => applyPriceToSameName(prev, item.name, minPrice, maxPrice));
    }
    if (kind === 'lab') {
      setLabs(mutate);
      setServices((prev) => applyPriceToSameName(prev, item.name, minPrice, maxPrice));
    }
    if (kind === 'poli') setPolis(mutate);
    if (kind === 'inpatient') setInpatients(mutate);
  };

  const deleteMaster = (kind: 'service' | 'action' | 'lab' | 'poli' | 'inpatient', item: MasterPriceItem) => {
    if (!window.confirm(`Yakin ingin menghapus ${item.name} dari master data?`)) return;
    const remove = (arr: MasterPriceItem[]) => arr.filter((row) => row.id !== item.id);
    if (kind === 'service') setServices(remove);
    if (kind === 'action') setActions(remove);
    if (kind === 'lab') setLabs(remove);
    if (kind === 'poli') setPolis(remove);
    if (kind === 'inpatient') setInpatients(remove);
  };

  const filterMasterRows = (kind: 'service' | 'action' | 'lab' | 'poli' | 'inpatient', rows: MasterPriceItem[]) => {
    const keyword = masterSearch[kind].trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((item) => item.name.toLowerCase().includes(keyword));
  };

  return (
    <Layout title="Akuntansi & Master Data" subtitle="Catatan keuangan harian, hutang, dan master data layanan klinik.">
      <section className="staff-section-card">
        <div className="internal-tabbar">
          <button className={`internal-tab ${tab === 'akuntansi' ? 'active' : ''}`} type="button" onClick={() => setTab('akuntansi')}>Akuntansi</button>
          <button className={`internal-tab ${tab === 'master' ? 'active' : ''}`} type="button" onClick={() => setTab('master')}>Master Data</button>
        </div>
      </section>

      <section className="internal-info-grid three-up">
        <article className="internal-mini-card"><strong>Arsip Aktif</strong><span>{monthLabel(selectedMonth)}</span></article>
      </section>

      {tab === 'akuntansi' && (
        <>
          <section className="internal-info-grid three-up">
            <article className="internal-mini-card clickable" onClick={() => setFinanceFilterType('pemasukan')}><strong>Total Pemasukan</strong><span>{rupiah(totalIncome)}</span></article>
            <article className="internal-mini-card clickable" onClick={() => setFinanceFilterType('pengeluaran')}><strong>Total Pengeluaran</strong><span>{rupiah(totalExpense)}</span></article>
            <article className="internal-mini-card"><strong>Saldo Harian</strong><span>{rupiah(totalIncome - totalExpense)}</span></article>
            <article className="internal-mini-card"><strong>Hutang Aktif</strong><span>{rupiah(activeDebtTotal)}</span></article>
            <article className="internal-mini-card"><strong>Total Keseluruhan</strong><span>{rupiah(totalOverall)}</span></article>
            <article className="internal-mini-card"><strong>Catatan Manual Hari Ini</strong><span>{rupiah(financeEntries.filter((item) => dayKey(item.createdAt) === financeFilterDay).reduce((sum, item) => sum + (item.type === 'pemasukan' ? item.amount : -item.amount), 0))}</span></article>
          </section>
          <section className="staff-section-card">
            <div className="section-head spread-head"><div><h2 className="section-title">Catatan Keuangan Harian</h2><p className="mini">Rincian pemasukan atau pengeluaran per hari, termasuk pembayaran dari kasir.</p></div><div className="head-inline-tools"><input type="date" className="staff-search-input compact" value={financeFilterDay} onChange={(e) => setFinanceFilterDay(e.target.value)} /><select className="staff-select-inline" value={financeFilterType} onChange={(e) => setFinanceFilterType(e.target.value as any)}><option value="all">Semua</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select><button className="staff-primary-button" type="button" onClick={() => setFinanceOpen(true)}>Tambah Catatan</button></div></div>
            <div className="finance-summary-box">
              <strong>Ringkasan Metode Bayar Hari Ini</strong>
              <div className="button-row wrap">{Object.entries(methodBreakdown).map(([key, value]) => <button key={key} type="button" className={`staff-outline-button small ${selectedMethodNote === key ? 'is-selected' : ''}`} onClick={() => setSelectedMethodNote((prev) => prev === key ? '' : key)}>{key}: <strong>{rupiah(value)}</strong></button>)}</div>
              <div className="mini-grid"><span>Kas minimum yang harus tersedia: <strong>{rupiah(150000)}</strong></span><span>Total cash masuk hari ini: <strong>{rupiah(cashToday)}</strong></span></div>
            </div>
            {selectedMethodNote ? <div className="payment-note-box"><strong>Rincian {selectedMethodNote}</strong><div className="table-wrap"><table className="staff-table"><thead><tr><th>Tanggal</th><th>Judul</th><th>Metode</th><th>Nominal</th></tr></thead><tbody>{selectedMethodRows.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td><td>{item.title}</td><td>{item.note || '-'}</td><td>{rupiah(item.amount)}</td></tr>)}</tbody></table></div></div> : null}
            <div className="table-wrap"><table className="staff-table"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Judul</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>{financeRows.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td><td>{item.type}</td><td>{item.category}</td><td>{item.title}</td><td>{rupiah(item.amount)}</td><td>{item.note || '-'}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}

      {tab === 'master' && (
        <section className="staff-section-card">
          <div className="section-head spread-head"><div><h2 className="section-title">Master Layanan, Tindakan, Pemeriksaan Lab, Rawat Inap, dan Poli</h2><p className="mini">Data awal diambil dari template Excel klinik dan seluruh harga dibuat Rp 0. FO/Admin dapat mengisi harga minimum dan harga maksimum dari halaman ini. Harga minimum saja = harga tetap; harga minimum + maksimum = dokter mengisi nominal akhir sesuai rentang.</p></div></div>
          <form className="internal-form-grid compact-gap" onSubmit={submitMaster}>
            <label><span>Jenis Master</span><select value={masterForm.kind} onChange={(e) => setMasterForm({ ...masterForm, kind: e.target.value as any })}><option value="service">Master Layanan</option><option value="action">Master Tindakan</option><option value="lab">Master Pemeriksaan Lab / Detail</option><option value="poli">Master Poli</option><option value="inpatient">Master Rawat Inap</option></select></label>
            <label><span>Nama</span><input value={masterForm.name} onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })} /></label>
            <label><span>Harga Minimum</span><input value={masterForm.minPrice} onChange={(e) => setMasterForm({ ...masterForm, minPrice: formatRupiahInput(e.target.value) })} /></label>
            <label><span>Harga Maksimum (opsional)</span><input value={masterForm.maxPrice} onChange={(e) => setMasterForm({ ...masterForm, maxPrice: formatRupiahInput(e.target.value) })} /></label>
            <div className="internal-actions span-2"><button className="staff-primary-button" type="submit">Simpan Master</button></div>
          </form>
          <div className="dashboard-grid two-column">
            {[['Master Layanan', services, 'service'], ['Master Tindakan', actions, 'action'], ['Master Pemeriksaan Lab / Detail', labs, 'lab'], ['Master Poli', polis, 'poli'], ['Master Rawat Inap', inpatients, 'inpatient']].map(([label, rows, kind]) => {
              const searchKey = kind as 'service' | 'action' | 'lab' | 'poli' | 'inpatient';
              const filteredRows = filterMasterRows(searchKey, rows as MasterPriceItem[]);
              return (
                <article key={String(label)} className="staff-section-card">
                  <div className="section-head spread-head">
                    <h3 className="section-title smaller">{String(label)}</h3>
                    <input
                      className="staff-search-input compact"
                      placeholder={`Cari ${String(label).toLowerCase()}`}
                      value={masterSearch[searchKey]}
                      onChange={(e) => setMasterSearch((prev) => ({ ...prev, [searchKey]: e.target.value }))}
                    />
                  </div>
                  <div className="table-wrap">
                    <table className="staff-table">
                      <thead><tr><th>Nama</th><th>Harga</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {filteredRows.length ? filteredRows.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.maxPrice && item.maxPrice > item.minPrice ? `${rupiah(item.minPrice)} - ${rupiah(item.maxPrice)}` : rupiah(item.minPrice)}</td><td><div className="table-action-row"><button type="button" className="staff-outline-button small" onClick={() => editMaster(searchKey, item)}>Edit Harga</button><button type="button" className="staff-danger-button small" onClick={() => deleteMaster(searchKey, item)}>Hapus</button></div></td></tr>) : <tr><td colSpan={3} className="mini">Data tidak ditemukan.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="staff-section-card archive-bottom-block">
        <div><h3 className="section-title smaller">Arsip Bulanan</h3><p className="mini">Dipakai untuk melihat periode transaksi dan keuangan sebelumnya.</p></div>
        <label className="archive-select-block"><span>Periode Arsip</span><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{availableMonths.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label>
      </section>

      {inventoryOpen && (
        <div className="modal-backdrop"><div className="modal-card"><div className="section-head spread-head"><h3 className="section-title smaller">Catat Barang Masuk / Keluar</h3><button className="staff-ghost-button" type="button" onClick={() => setInventoryOpen(false)}>Tutup</button></div><form className="internal-form-grid compact-gap" onSubmit={submitInventory}><label><span>Obat</span><select value={inventoryForm.medicineId} onChange={(e) => { const med = medicines.find((item) => item.id === e.target.value); setInventoryForm({ ...inventoryForm, medicineId: e.target.value, unitPrice: formatRupiahInput(med?.price ?? 0) }); }}><option value="__new__">+ Obat baru</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}</select></label><label><span>Jenis</span><select value={inventoryForm.type} onChange={(e) => setInventoryForm({ ...inventoryForm, type: e.target.value as 'masuk' | 'keluar' })}><option value="masuk">Barang Masuk</option><option value="keluar">Barang Keluar</option></select></label>{inventoryForm.medicineId === '__new__' ? <><label className="span-2"><span>Nama Obat Baru</span><input value={inventoryForm.newName} onChange={(e) => setInventoryForm({ ...inventoryForm, newName: e.target.value })} /></label><label><span>Satuan</span><input value={inventoryForm.newUnit} onChange={(e) => setInventoryForm({ ...inventoryForm, newUnit: e.target.value })} /></label><label><span>Kategori</span><input value={inventoryForm.newCategory} onChange={(e) => setInventoryForm({ ...inventoryForm, newCategory: e.target.value })} /></label></> : null}<label><span>Jumlah</span><input type="number" min="1" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: Number(e.target.value) })} /></label><label><span>Harga per Unit</span><input inputMode="numeric" placeholder="225.000" value={inventoryForm.unitPrice} onChange={(e) => setInventoryForm({ ...inventoryForm, unitPrice: formatRupiahInput(e.target.value) })} /></label><label className="span-2"><span>Keterangan</span><textarea value={inventoryForm.note} onChange={(e) => setInventoryForm({ ...inventoryForm, note: e.target.value })} /></label><div className="internal-actions span-2"><button className="staff-ghost-button" type="button" onClick={() => setInventoryOpen(false)}>Batal</button><button className="staff-primary-button" type="submit">Simpan Transaksi</button></div></form></div></div>
      )}

      {financeOpen && (
        <div className="modal-backdrop"><div className="modal-card"><div className="section-head spread-head"><h3 className="section-title smaller">Tambah Catatan Keuangan</h3><button className="staff-ghost-button" type="button" onClick={() => setFinanceOpen(false)}>Tutup</button></div><form className="internal-form-grid compact-gap" onSubmit={submitFinance}><label><span>Jenis</span><select value={financeForm.type} onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value as any })}><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select></label><label><span>Kategori</span><select value={financeForm.category} onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value as any })}><option>Layanan Klinik</option><option>Operasional Lain</option></select></label><label className="span-2"><span>Judul</span><input required value={financeForm.title} onChange={(e) => setFinanceForm({ ...financeForm, title: e.target.value })} /></label><label><span>Nominal</span><input inputMode="numeric" placeholder="225.000" value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: formatRupiahInput(e.target.value) })} /></label><label className="span-2"><span>Keterangan</span><textarea value={financeForm.note} onChange={(e) => setFinanceForm({ ...financeForm, note: e.target.value })} /></label><div className="internal-actions span-2"><button className="staff-ghost-button" type="button" onClick={() => setFinanceOpen(false)}>Batal</button><button className="staff-primary-button" type="submit">Simpan Akuntansi</button></div></form></div></div>
      )}
    </Layout>
  );
};
