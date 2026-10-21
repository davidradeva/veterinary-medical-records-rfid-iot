import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { NoticeToast, type NoticeState } from '../../components/NoticeToast';
import { useClinic } from '../../context/ClinicContext';
import { clinicApi } from '../../api/clinicApi';
import type { ChargeItem, InpatientRefusalLetter, MasterPriceItem, Patient, VisitRecord } from '../../types';

const defaultBreedOptions: Record<string, string[]> = {
  Kucing: ['Domestic', 'Mix', 'Persia', 'Anggora', 'Himalaya', 'Maine Coon'],
  Anjing: ['Mix', 'Pomeranian', 'Shih Tzu', 'Golden Retriever', 'Bulldog', 'Beagle'],
  Kelinci: ['Lokal', 'Anggora', 'Rex', 'Flemish Giant'],
  Burung: ['Lokal', 'Lovebird', 'Kenari', 'Cockatiel'],
  Hamster: ['Syrian', 'Campbell', 'Winter White'],
  'Kura-kura': ['Brazil', 'Sulcata', 'Lokal'],
};

const defaultAnimalOptions = Object.keys(defaultBreedOptions);
const provinceOptions = ['Jawa Barat', 'DKI Jakarta', 'Banten', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta', 'Bali'];
const cityOptionsAll = ['Kota Bekasi', 'Kabupaten Bekasi', 'Jakarta Timur', 'Jakarta Selatan', 'Kota Bandung', 'Kota Depok', 'Kota Bogor', 'Kota Tangerang Selatan', 'Kota Tangerang', 'Kota Semarang', 'Kota Surabaya', 'Kabupaten Sleman'];
const districtOptionsAll = ['Bekasi Timur', 'Bekasi Selatan', 'Pasar Minggu', 'Kebayoran Baru', 'Duren Sawit', 'Cakung', 'Antapani', 'Cimanggis', 'Pondok Aren', 'Karawaci', 'Tembalang', 'Depok'];
const villageOptionsAll = ['Margahayu', 'Duren Jaya', 'Pekayon Jaya', 'Kayuringin Jaya', 'Pejaten Barat', 'Melawai', 'Klender', 'Jati Padang', 'Antapani Kulon', 'Cilangkap', 'Pondok Pucung', 'Nusa Jaya'];
const poliOptions = ['Poli Kucing', 'Poli Anjing', 'Poli Hewan Lain', 'Umum', 'Bedah', 'Dermatologi', 'Vaksinasi', 'Gigi & Mulut', 'Laboratorium', 'Rawat Inap', 'Reproduksi', 'Konsultasi Nutrisi'];
const doctorOptions = ['Dr. A', 'Dr. B', 'Dr. C'];
const getDoctorChoices = (poli: string) => (poli === 'Bedah' ? ['Dr. A'] : doctorOptions);
const getDefaultDoctor = (poli: string) => (poli === 'Bedah' ? 'Dr. A' : 'Dr. B');

const calcAge = (birthDate: string) => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  return `${Math.max(0, years)} tahun ${Math.max(0, months)} bulan`;
};

const monthKey = (date: string) => date.slice(0, 7);
const monthLabel = (month: string) => new Date(`${month}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const formatMoneyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};
const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, '') || 0);
const visitTotal = (visit: VisitRecord) => visit.totalCost || (visit.additionalCharges || []).reduce((sum, item) => sum + item.price, 0) + visit.medicineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

type TabKey = 'register' | 'search' | 'billing' | 'inpatient' | 'refusal' | 'completed';
type FormState = {
  ownerName: string; address: string; rtRw: string; village: string; district: string; city: string; province: string;
  phoneNumber: string; secondaryPhone: string; email: string; socialMedia: string;
  animalName: string; animalType: string; breed: string; gender: '' | 'Jantan' | 'Betina'; sterilizationStatus: '' | 'Intact' | 'Spayed' | 'Neutered'; birthDate: string; ageText: string; colorMark: string;
  poli: string; doctor: string; complaint: string;
};

const createEmptyForm = (): FormState => ({ ownerName: '', address: '', rtRw: '', village: '', district: '', city: '', province: '', phoneNumber: '', secondaryPhone: '', email: '', socialMedia: '', animalName: '', animalType: '', breed: '', gender: '', sterilizationStatus: '', birthDate: '', ageText: '', colorMark: '', poli: '', doctor: '', complaint: '' });

const buildPrintShell = (subtitle: string, content: string) => `
<html><head><title>Hug Me By Vet</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:28px;background:#f7f3ee;color:#1f2937}.sheet{max-width:920px;margin:0 auto;background:white;border:1px solid #e4d8ca;border-radius:22px;overflow:hidden}.head{padding:30px 34px;background:linear-gradient(135deg,#6d28d9,#db2777);color:white}.head h1{margin:0;font-size:34px}.head p{margin:8px 0 0;opacity:.95}.body{padding:28px 34px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}.section{padding:18px;border:1px solid #eadfd4;border-radius:16px;background:#fffdfb;margin-bottom:16px}.section h3{margin:0 0 10px;color:#6d28d9}.row{margin:8px 0;line-height:1.7}.foot{padding:16px 34px;background:#faf6f1;border-top:1px solid #eadfd4;text-align:center;color:#6b7280;font-size:13px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:56px;text-align:center}.line{height:70px;border-bottom:1px solid #111;margin-bottom:8px}</style></head><body><div class="sheet"><div class="head"><h1>🐾 Hug Me By Vet</h1><p>${subtitle}</p></div><div class="body">${content}</div><div class="foot">Dokumen front office Hug Me By Vet.</div></div></body></html>`;

const printHtml = (html: string) => {
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) return;
  win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
};

const masterPrice = (item?: MasterPriceItem) => Number(item?.minPrice || 0);
const masterMax = (item?: MasterPriceItem) => Number(item?.maxPrice || 0);

export const FrontOfficePage = () => {
  const { patients, addPatient, updatePatient, createVisitForExistingPatient, getCompletedVisits, getPatientById, deletePatient, visits, updateVisit } = useClinic();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryTab = (searchParams.get('tab') as TabKey | null) ?? 'search';
  const isValidTab = (value: string | null): value is TabKey => ['register','search','billing','inpatient','refusal','completed'].includes(value || '');
  const activeTab: TabKey = isValidTab(queryTab) ? queryTab : 'search';
  const setTab = (tab: TabKey) => { const next = new URLSearchParams(searchParams); next.set('tab', tab); setSearchParams(next, { replace: true }); };

  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [search, setSearch] = useState('');
  const [repeatPoli, setRepeatPoli] = useState<Record<string, string>>({});
  const [repeatDoctor, setRepeatDoctor] = useState<Record<string, string>>({});
  const [repeatComplaint, setRepeatComplaint] = useState<Record<string, string>>({});
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedMonth, setCompletedMonth] = useState('all');
  const [submitMode, setSubmitMode] = useState<'save' | 'send'>('save');
  const [animalOptions, setAnimalOptions] = useState<string[]>(() => JSON.parse(localStorage.getItem('clinic_animal_options_v26') || JSON.stringify(defaultAnimalOptions)));
  const [breedOptionsMap, setBreedOptionsMap] = useState<Record<string, string[]>>(() => JSON.parse(localStorage.getItem('clinic_breed_options_v26') || JSON.stringify(defaultBreedOptions)));
  const [newAnimalType, setNewAnimalType] = useState('');
  const [newBreed, setNewBreed] = useState('');

  const [masterServices, setMasterServices] = useState<MasterPriceItem[]>([]);
  const [masterActions, setMasterActions] = useState<MasterPriceItem[]>([]);
  const [masterLabs, setMasterLabs] = useState<MasterPriceItem[]>([]);
  const [masterInpatients, setMasterInpatients] = useState<MasterPriceItem[]>([]);

  const [billingVisitId, setBillingVisitId] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [actionQty, setActionQty] = useState(1);
  const [labQuery, setLabQuery] = useState('');
  const [inpatientQuery, setInpatientQuery] = useState('');
  const [billingCharges, setBillingCharges] = useState<ChargeItem[]>([]);
  const [inpatientDays, setInpatientDays] = useState(1);
  const [inpatientDpInput, setInpatientDpInput] = useState('');
  const [inpatientDpMethod, setInpatientDpMethod] = useState<'Cash' | 'Debit' | 'Transfer' | 'QRIS'>('Cash');
  const [inpatientDpBank, setInpatientDpBank] = useState('BCA');

  const [refusalSearch, setRefusalSearch] = useState('');
  const [refusalPatientId, setRefusalPatientId] = useState('');
  const [refusalForm, setRefusalForm] = useState({ doctorName: '', staffName: 'Front Office', reason: '', diagnosis: '', recommendedTreatment: 'Rawat inap', riskExplanation: 'Pemilik telah mendapat penjelasan mengenai risiko apabila rawat inap tidak dilakukan.', refusalStatement: 'Pemilik menolak tindakan/rawat inap atas kehendak sendiri.', witnessName: '' });

  const showNotice = (tone: NoticeState['tone'], title: string, message: string) => setNotice({ tone, title, message });

  useEffect(() => {
    let active = true;
    clinicApi.loadState().then((state) => {
      if (!active || !state) return;
      setMasterServices(state.masterServices || []);
      setMasterActions(state.masterActions || []);
      setMasterLabs(state.masterLabs || []);
      setMasterInpatients(state.masterInpatients || []);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const ownerGroups = useMemo(() => {
    const grouped = new Map<string, Patient[]>();
    patients.forEach((patient) => {
      const key = `${patient.ownerName.toLowerCase()}-${patient.phoneNumber}`;
      const items = grouped.get(key) || [];
      items.push(patient);
      grouped.set(key, items);
    });
    return Array.from(grouped.values()).filter((group) => group.some((patient) => `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase().includes(search.toLowerCase())));
  }, [patients, search]);

  const completedVisits = getCompletedVisits();
  const completedMonthOptions = Array.from(new Set(completedVisits.map((visit) => monthKey(visit.visitDate)))).sort().reverse();
  const filteredCompletedVisits = completedVisits.filter((visit) => {
    const patient = getPatientById(visit.patientId);
    const q = completedSearch.toLowerCase();
    return !!patient && (completedMonth === 'all' || monthKey(visit.visitDate) === completedMonth) && `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase().includes(q);
  });
  const billingVisits = visits.filter((visit) => {
    const notPaid = (visit.paymentStatus || 'Menunggu Pembayaran') !== 'Lunas';
    const medicallyFinished = visit.status === 'completed';
    const inpatientFromDoctor = visit.status === 'pending' && !!visit.isHospitalized;
    const waitingFoBilling = (visit.billingStatus || 'menunggu_billing_fo') !== 'sudah_bayar';
    return notPaid && waitingFoBilling && (medicallyFinished || inpatientFromDoctor);
  });
  const selectedBillingVisit = billingVisits.find((visit) => visit.id === billingVisitId) || null;
  const selectedBillingPatient = selectedBillingVisit ? getPatientById(selectedBillingVisit.patientId) : undefined;
  const inpatientVisits = visits.filter((visit) => visit.status === 'pending' && visit.isHospitalized);

  const refusalPatientOptions = patients.filter((patient) => `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase().includes(refusalSearch.toLowerCase()));
  const selectedRefusalPatient = patients.find((patient) => patient.id === refusalPatientId);

  const persistOptions = (nextAnimals: string[], nextBreeds: Record<string, string[]>) => {
    setAnimalOptions(nextAnimals); setBreedOptionsMap(nextBreeds);
    localStorage.setItem('clinic_animal_options_v26', JSON.stringify(nextAnimals));
    localStorage.setItem('clinic_breed_options_v26', JSON.stringify(nextBreeds));
  };

  const resetForm = () => { setForm(createEmptyForm()); setEditingPatientId(null); };
  const handlePoli = (value: string) => setForm((prev) => ({ ...prev, poli: value, doctor: value ? getDefaultDoctor(value) : '' }));
  const handleBirthDate = (value: string) => setForm((prev) => ({ ...prev, birthDate: value, ageText: calcAge(value) }));
  const handleAnimalType = (value: string) => setForm((prev) => ({ ...prev, animalType: value, breed: value ? ((breedOptionsMap[value] || ['Lokal'])[0] || 'Lokal') : '' }));

  const addAnimalType = () => {
    const name = newAnimalType.trim();
    if (!name || animalOptions.includes(name)) return;
    persistOptions([...animalOptions, name], { ...breedOptionsMap, [name]: ['Lokal'] });
    setNewAnimalType('');
    handleAnimalType(name);
  };

  const addBreed = () => {
    const name = newBreed.trim();
    if (!name) return;
    const existing = breedOptionsMap[form.animalType] || [];
    if (existing.includes(name)) return;
    const next = { ...breedOptionsMap, [form.animalType]: [...existing, name] };
    persistOptions(animalOptions, next);
    setNewBreed('');
    setForm((prev) => ({ ...prev, breed: name }));
  };

  const fillFormFromPatient = (patient: Patient, onlyOwner = false) => {
    const defaultAnimal = animalOptions[0] || 'Kucing';
    setForm({ ownerName: patient.ownerName, address: patient.address, rtRw: patient.rtRw, village: patient.village, district: patient.district, city: patient.city, province: patient.province, phoneNumber: patient.phoneNumber, secondaryPhone: patient.secondaryPhone || '', email: patient.email, socialMedia: patient.socialMedia, animalName: onlyOwner ? '' : patient.animalName, animalType: onlyOwner ? defaultAnimal : patient.animalType, breed: onlyOwner ? ((breedOptionsMap[defaultAnimal] || ['Lokal'])[0]) : patient.breed, gender: onlyOwner ? '' : patient.gender, sterilizationStatus: onlyOwner ? '' : (patient.sterilizationStatus || ''), birthDate: onlyOwner ? '' : patient.birthDate, ageText: onlyOwner ? '' : patient.ageText, colorMark: onlyOwner ? '' : (patient.colorMark || ''), poli: '', doctor: '', complaint: '' });
  };

  const startEdit = (patient: Patient) => { fillFormFromPatient(patient); setEditingPatientId(patient.id); setTab('register'); };
  const addNewAnimalForOwner = (patient: Patient) => { fillFormFromPatient(patient, true); setEditingPatientId(null); setTab('register'); };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ownerName || !form.phoneNumber || !form.animalName) {
      showNotice('warning', 'Data belum lengkap', 'Nama pemilik, nomor HP, dan nama hewan wajib diisi.');
      return;
    }
    const patientPayload = { ownerName: form.ownerName, address: form.address, rtRw: form.rtRw, village: form.village, district: form.district, city: form.city, province: form.province, phoneNumber: form.phoneNumber, secondaryPhone: form.secondaryPhone, email: form.email, socialMedia: form.socialMedia, animalName: form.animalName, animalType: form.animalType, breed: form.breed, gender: form.gender, sterilizationStatus: form.sterilizationStatus, birthDate: form.birthDate, ageText: form.ageText || calcAge(form.birthDate), colorMark: form.colorMark };
    if (editingPatientId) {
      updatePatient(editingPatientId, patientPayload);
      if (submitMode === 'send') createVisitForExistingPatient(editingPatientId, { poli: form.poli, doctor: form.doctor, complaint: form.complaint });
      showNotice('success', 'Data diperbarui', submitMode === 'send' ? 'Data pasien diperbarui dan dikirim ke dokter.' : 'Data pasien berhasil diperbarui.');
    } else {
      addPatient(patientPayload, { poli: form.poli, doctor: form.doctor, complaint: form.complaint }, submitMode === 'send');
      showNotice('success', 'Pasien tersimpan', submitMode === 'send' ? 'Pasien baru tersimpan dan dikirim ke dokter.' : 'Pasien baru berhasil disimpan.');
    }
    resetForm();
    setTab('search');
  };

  const handleRepeatPoli = (patientId: string, poli: string) => {
    setRepeatPoli((prev) => ({ ...prev, [patientId]: poli }));
    setRepeatDoctor((prev) => ({ ...prev, [patientId]: getDefaultDoctor(poli) }));
  };

  const sendRepeatVisit = (patientId: string) => {
    const poli = repeatPoli[patientId] || 'Poli Kucing';
    const doctor = repeatDoctor[patientId] || getDefaultDoctor(poli);
    createVisitForExistingPatient(patientId, { poli, doctor, complaint: repeatComplaint[patientId] || '' });
    showNotice('success', 'Pasien dikirim ke dokter', 'Antrian baru berhasil dibuat.');
  };

  const selectBillingVisit = (visit: VisitRecord) => {
    setBillingVisitId(visit.id);
    setBillingCharges(visit.additionalCharges || []);
    setInpatientDpInput(visit.depositPlannedAmount ? Number(visit.depositPlannedAmount).toLocaleString('id-ID') : visit.depositAmount ? Number(visit.depositAmount).toLocaleString('id-ID') : '');
    setInpatientDpMethod((visit.depositMethod as any) || 'Cash');
    setInpatientDpBank(visit.depositBank || 'BCA');
  };

  const addMasterCharge = (kind: 'layanan' | 'tindakan' | 'lab' | 'rawat_inap', item?: MasterPriceItem, days = 1) => {
    if (!item) return;
    const min = masterPrice(item);
    const max = masterMax(item);
    const unitPrice = max > min ? min : min;
    const qty = Math.max(1, Number(days || 1));
    const price = unitPrice * qty;
    setBillingCharges((prev) => [...prev, { name: item.name, kind, price, unitPrice, quantity: qty, days: kind === 'rawat_inap' ? qty : undefined, masterTable: kind === 'rawat_inap' ? 'inpatient_masters' : kind === 'layanan' ? 'services' : 'actions', masterId: item.dbId, chargeSource: 'fo' }]);
    if (kind === 'rawat_inap' && !inpatientDpInput) setInpatientDpInput('');
  };

  const billingMedicineTotal = 0;

  const saveBilling = (goPayment = false) => {
    if (!selectedBillingVisit) return;
    const medicineTotal = 0;
    const chargeTotal = billingCharges.reduce((sum, item) => sum + item.price, 0);
    const selectedActions = billingCharges.filter((item) => item.kind === 'tindakan').map((item) => item.name);
    const selectedLabs = billingCharges.filter((item) => item.kind === 'lab').map((item) => item.name);
    const inpatientCharge = billingCharges.find((item) => item.kind === 'rawat_inap');
    const depositAmount = parseMoneyInput(inpatientDpInput);
    updateVisit(selectedBillingVisit.id, {
      additionalCharges: billingCharges,
      medicineItems: [],
      selectedActions,
      selectedLabs,
      totalCost: medicineTotal + chargeTotal,
      billingStatus: 'siap_bayar',
      foBillingDoneAt: new Date().toISOString(),
      paymentStatus: 'Menunggu Pembayaran',
      hospitalizationType: inpatientCharge?.name || selectedBillingVisit.hospitalizationType,
      inpatientDays: inpatientCharge?.days,
      inpatientDailyPrice: inpatientCharge?.unitPrice,
      inpatientTotalPrice: inpatientCharge?.price,
      depositAmount: selectedBillingVisit.depositAmount || 0,
      depositPlannedAmount: depositAmount,
      depositMethod: inpatientDpMethod,
      depositBank: inpatientDpMethod === 'Transfer' ? inpatientDpBank : undefined,
    });
    showNotice('success', 'Billing FO tersimpan', 'Billing final tersimpan. Data siap diproses ke pembayaran.');
    if (goPayment) navigate('/payments?visit=' + selectedBillingVisit.id);
  };

  const openOwnerPrint = (visit: VisitRecord) => {
    const patient = getPatientById(visit.patientId);
    if (!patient) return;
    const html = buildPrintShell(`Ringkasan kunjungan ${patient.animalName}`, `<div class="section"><h3>Identitas</h3><div class="grid"><div class="row"><strong>Nama Hewan:</strong> ${patient.animalName}</div><div class="row"><strong>Pemilik:</strong> ${patient.ownerName}</div><div class="row"><strong>Dokter:</strong> ${visit.doctor}</div><div class="row"><strong>Poli:</strong> ${visit.poli}</div></div></div><div class="section"><h3>Ringkasan Medis</h3><div class="row"><strong>Anamnesis:</strong> ${visit.complaint || '-'}</div><div class="row"><strong>Diagnosis:</strong> ${visit.diagnosis || '-'}</div><div class="row"><strong>Saran Kontrol:</strong> ${visit.recommendations || '-'}</div><div class="row"><strong>Total Tagihan:</strong> ${formatCurrency(visitTotal(visit))}</div></div>`);
    printHtml(html);
  };

  const saveRefusalLetter = async () => {
    if (!selectedRefusalPatient) {
      showNotice('warning', 'Pasien belum dipilih', 'Pilih data hewan/pemilik terlebih dahulu.');
      return;
    }
    const rejectedActions = String(refusalForm.recommendedTreatment || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
    const letter: InpatientRefusalLetter = {
      id: crypto.randomUUID(),
      animalId: selectedRefusalPatient.id,
      refusalDate: new Date().toISOString(),
      ownerNameSnapshot: selectedRefusalPatient.ownerName,
      animalNameSnapshot: selectedRefusalPatient.animalName,
      customerNumberSnapshot: selectedRefusalPatient.customerNumber,
      rfidUidSnapshot: selectedRefusalPatient.rfidUid,
      ownerAddress: selectedRefusalPatient.address || selectedRefusalPatient.city || '',
      ownerPhone: selectedRefusalPatient.phoneNumber || '',
      animalAgeSnapshot: selectedRefusalPatient.ageText || '',
      animalTypeGenderSnapshot: `${selectedRefusalPatient.animalType || '-'} / ${selectedRefusalPatient.breed || '-'} / ${selectedRefusalPatient.gender || '-'}`,
      signatureOwnerName: selectedRefusalPatient.ownerName,
      rejectedActions,
      temporaryDiagnosis: refusalForm.diagnosis,
      refusalReason: refusalForm.reason,
      suggestion: (refusalForm as any).suggestion || '',
      letterLocation: 'Bekasi',
      actingAs: 'Pemilik hewan',
      ...refusalForm,
    };
    await clinicApi.saveRefusalLetter(letter).catch(() => undefined);
    const actionLines = [0,1,2].map((i) => `<div class="refusal-line"><b>${i + 1}.</b><span>${letter.rejectedActions?.[i] || ''}</span></div>`).join('');
    const html = `<!doctype html><html><head><title>Surat Penolakan Tindakan Medis</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;color:#111}.paper{width:820px;min-height:1120px;margin:auto;background:white;padding:46px 54px;border:1px solid #ddd}.brand{text-align:center}.brand h1{font-size:42px;margin:0;font-weight:900}.brand h2{font-size:16px;margin:6px 0 30px;letter-spacing:.5px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 44px}.row{display:grid;grid-template-columns:150px 1fr;gap:8px;margin:8px 0;align-items:end}.line{border-bottom:1px solid #222;min-height:22px;padding-left:6px}.para{line-height:1.65;margin:18px 0}.refusal-line{display:grid;grid-template-columns:28px 1fr;margin:10px 0;align-items:end}.refusal-line span{border-bottom:1px solid #222;min-height:24px;padding-left:6px}.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:26px;margin-top:48px;text-align:center}.sign-space{height:76px}.suggestion{margin-top:48px}.small{font-size:13px}</style></head><body><div class="paper"><div class="brand"><h1>Hug Me By Vet</h1><h2>SURAT KETERANGAN PENOLAKAN TINDAKAN MEDIS</h2></div><p>Yang bertanda tangan dibawah ini:</p><div class="grid"><div><div class="row"><b>Nama</b><div class="line">${letter.ownerNameSnapshot || ''}</div></div><div class="row"><b>Alamat</b><div class="line">${letter.ownerAddress || ''}</div></div><div class="row"><b>Bertindak sebagai</b><div class="line">${letter.actingAs || 'Pemilik hewan'}</div></div></div><div><div class="row"><b>Usia</b><div class="line">${letter.ownerAge || ''}</div></div><div class="row"><b>No. Telp.</b><div class="line">${letter.ownerPhone || ''}</div></div></div></div><p class="para">Dengan ini menyatakan dengan sesungguhnya telah memberikan <b>PENOLAKAN</b> untuk dilakukan tindakan medis yang disarankan oleh dokter hewan Hug Me by Vet berupa:</p>${actionLines}<p>Terhadap Hewan atas nama:</p><div class="grid"><div><div class="row"><b>Nama Hewan</b><div class="line">${letter.animalNameSnapshot || ''}</div></div><div class="row"><b>Diagnosa Sementara</b><div class="line">${letter.temporaryDiagnosis || letter.diagnosis || ''}</div></div></div><div><div class="row"><b>Umur</b><div class="line">${letter.animalAgeSnapshot || ''}</div></div><div class="row"><b>Jenis/Kelamin</b><div class="line">${letter.animalTypeGenderSnapshot || ''}</div></div></div></div><p class="para">Saya telah mengerti penjelasan dokter hewan Hug Me by Vet atas kondisi hewan saya dan risiko yang ditimbulkan atas tindakan yang saya tolak terhadap pasien/hewan yang bernama diatas.</p><p class="para">Saya menyetujui dengan sadar penolakan ini dengan alasan <span style="display:inline-block;min-width:330px;border-bottom:1px solid #222;">${letter.refusalReason || letter.reason || ''}</span></p><p class="para">Dan saya bertanggung jawab penuh atas risiko yang ditimbulkan terhadap penolakan tindakan yang dianjurkan oleh dokter hewan Hug Me by Vet.</p><p class="para">Demikian surat pernyataan ini dibuat untuk dipergunakan semestinya.</p><p>${letter.letterLocation || 'Bekasi'}, ${new Date(letter.refusalDate).toLocaleDateString('id-ID')}</p><div class="sign"><div><b>Saksi</b><div class="sign-space"></div>( ${letter.witnessName || ''} )</div><div><b>Dokter Hewan</b><div class="sign-space"></div>( ${letter.doctorName || ''} )</div><div><b>Yang membuat pernyataan</b><div class="sign-space"></div>( ${letter.signatureOwnerName || letter.ownerNameSnapshot || ''} )</div></div><div class="suggestion"><b>Saran:</b><div class="line">${letter.suggestion || ''}</div><div class="line"></div><div class="line"></div></div></div></body></html>`;
    printHtml(html);
    showNotice('success', 'Surat penolakan tersimpan', 'Surat penolakan berhasil dibuat dan siap dicetak.');
  };

  return (
    <Layout title="Front Office" subtitle="Registrasi pasien, pencarian data, input billing, pembayaran, dan surat penolakan rawat inap.">
      <div className="tab-switcher"><button className={`tab-button ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Cari Pemilik</button><button className={`tab-button ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Registrasi</button><button className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>Input Billing FO</button><button className={`tab-button ${activeTab === 'inpatient' ? 'active' : ''}`} onClick={() => setTab('inpatient')}>Rawat Inap</button><button className={`tab-button ${activeTab === 'refusal' ? 'active' : ''}`} onClick={() => setTab('refusal')}>Penolakan</button><button className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>Data Selesai</button></div>
      <NoticeToast notice={notice} onClose={() => setNotice(null)} />

      {activeTab === 'register' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">{editingPatientId ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'}</h2><p className="mini">Data bisa disimpan saja atau langsung dikirim ke dokter.</p></div></div><form className="internal-form-grid" onSubmit={handleRegister}><label><span>Nama Pemilik *</span><input value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} /></label><label><span>No. HP *</span><input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} /></label><label className="span-2"><span>Alamat</span><input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></label><label><span>RT/RW</span><input value={form.rtRw} onChange={(e) => setForm((p) => ({ ...p, rtRw: e.target.value }))} /></label><label><span>Kelurahan</span><input list="village-options" value={form.village} onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))} /></label><label><span>Kecamatan</span><input list="district-options" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} /></label><label><span>Kota</span><input list="city-options" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label><label><span>Provinsi</span><select value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}><option value="">Pilih provinsi</option>{provinceOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>No. HP 2</span><input value={form.secondaryPhone} onChange={(e) => setForm((p) => ({ ...p, secondaryPhone: e.target.value }))} /></label><label><span>Email</span><input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label><label><span>Media Sosial</span><input value={form.socialMedia} onChange={(e) => setForm((p) => ({ ...p, socialMedia: e.target.value }))} /></label><label><span>Nama Hewan *</span><input value={form.animalName} onChange={(e) => setForm((p) => ({ ...p, animalName: e.target.value }))} /></label><label><span>Jenis Hewan</span><select value={form.animalType} onChange={(e) => handleAnimalType(e.target.value)}><option value="">Pilih jenis hewan</option>{animalOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Tambah Jenis Hewan</span><div className="medicine-line" style={{gridTemplateColumns:'1fr auto'}}><input value={newAnimalType} onChange={(e) => setNewAnimalType(e.target.value)} /><button type="button" className="staff-outline-button" onClick={addAnimalType}>Tambah</button></div></label><label><span>Ras</span><select value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}><option value="">Pilih ras</option>{(breedOptionsMap[form.animalType] || []).map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Tambah Ras</span><div className="medicine-line" style={{gridTemplateColumns:'1fr auto'}}><input value={newBreed} onChange={(e) => setNewBreed(e.target.value)} /><button type="button" className="staff-outline-button" onClick={addBreed}>Tambah</button></div></label><label><span>Jenis Kelamin</span><select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}><option value="">Pilih jenis kelamin</option><option>Jantan</option><option>Betina</option></select></label><label><span>Sterilisasi</span><select value={form.sterilizationStatus} onChange={(e) => setForm((p) => ({ ...p, sterilizationStatus: e.target.value as any }))}><option value="">Pilih status steril</option><option>Intact</option><option>Spayed</option><option>Neutered</option></select></label><label><span>Tanggal Lahir</span><input type="date" value={form.birthDate} onChange={(e) => handleBirthDate(e.target.value)} /></label><label><span>Umur</span><input value={form.ageText} readOnly /></label><label className="span-2"><span>Warna / Ciri</span><input value={form.colorMark} onChange={(e) => setForm((p) => ({ ...p, colorMark: e.target.value }))} /></label><label><span>Poli / Layanan *</span><select value={form.poli} onChange={(e) => handlePoli(e.target.value)}><option value="">Pilih poli</option>{poliOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Dokter *</span><select value={form.doctor} onChange={(e) => setForm((p) => ({ ...p, doctor: e.target.value }))}><option value="">Pilih dokter</option>{getDoctorChoices(form.poli).map((item) => <option key={item}>{item}</option>)}</select></label><label className="span-2"><span>Anamnesis awal</span><textarea value={form.complaint} onChange={(e) => setForm((p) => ({ ...p, complaint: e.target.value }))} /></label><div className="internal-actions span-2"><button className="staff-ghost-button" type="button" onClick={() => { resetForm(); setTab('search'); }}>Batal</button><button className="staff-primary-button" type="submit" onClick={() => setSubmitMode('save')}>Simpan Pasien</button><button className="staff-accent-button" type="submit" onClick={() => setSubmitMode('send')}>Simpan & Kirim ke Dokter</button></div></form><datalist id="village-options">{villageOptionsAll.map((x) => <option key={x} value={x} />)}</datalist><datalist id="district-options">{districtOptionsAll.map((x) => <option key={x} value={x} />)}</datalist><datalist id="city-options">{cityOptionsAll.map((x) => <option key={x} value={x} />)}</datalist></section>}

      {activeTab === 'search' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Cari Data Pemilik Hewan</h2><p className="mini">Pencarian membaca nama pemilik, nama hewan, nomor registrasi, dan UID RFID.</p></div><input className="staff-search-input" placeholder="Cari data pemilik / hewan / RFID" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="owner-stack">{ownerGroups.map((group) => { const first = group[0]; return <article key={`${first.ownerName}-${first.phoneNumber}`} className="owner-card"><div className="owner-card-head"><div><h3>{first.ownerName}</h3><p>{first.phoneNumber} • {first.city}, {first.province}</p></div><button className="staff-outline-button" type="button" onClick={() => addNewAnimalForOwner(first)}>Tambah Hewan Baru</button></div><div className="owner-animals-grid">{group.map((patient) => <div key={patient.id} className="owner-animal-panel"><div><h4>{patient.animalName}</h4><p>{patient.animalType} • {patient.breed} • {patient.gender}</p><p>No. Registrasi: {patient.customerNumber}</p><p>UID RFID: {patient.rfidUid ?? '-'}</p></div><div className="owner-animal-actions"><button className="staff-outline-button" type="button" onClick={() => startEdit(patient)}>Edit</button><button className="staff-danger-button" type="button" onClick={() => { if (window.confirm(`Yakin ingin menghapus data ${patient.animalName}?`)) deletePatient(patient.id); }}>Hapus</button></div><div className="owner-repeat-row visit-send-row"><select value={repeatPoli[patient.id] || 'Poli Kucing'} onChange={(e) => handleRepeatPoli(patient.id, e.target.value)}>{poliOptions.map((item) => <option key={item}>{item}</option>)}</select><select value={repeatDoctor[patient.id] || getDefaultDoctor(repeatPoli[patient.id] || 'Poli Kucing')} onChange={(e) => setRepeatDoctor((prev) => ({ ...prev, [patient.id]: e.target.value }))}>{getDoctorChoices(repeatPoli[patient.id] || 'Poli Kucing').map((item) => <option key={item}>{item}</option>)}</select><textarea className="fo-anamnesis-input" value={repeatComplaint[patient.id] || ''} onChange={(e) => setRepeatComplaint((prev) => ({ ...prev, [patient.id]: e.target.value }))} placeholder="Anamnesis awal dari FO." /><button className="staff-primary-button" type="button" onClick={() => sendRepeatVisit(patient.id)}>Kirim ke Dokter</button></div></div>)}</div></article>; })}</div></section>}

      {activeTab === 'billing' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Input Billing Front Office</h2><p className="mini">FO mengisi tindakan, layanan/pemeriksaan detail, dan rawat inap. Obat tidak dipisah karena sudah masuk ke tindakan.</p></div></div><div className="payment-layout"><div className="payment-list cardless-list">{billingVisits.map((visit) => { const patient = getPatientById(visit.patientId); if (!patient) return null; return <button key={visit.id} type="button" className={`payment-list-item ${billingVisitId === visit.id ? 'active' : ''}`} onClick={() => selectBillingVisit(visit)}><div><strong>{patient.animalName}</strong><span>{patient.ownerName}</span><span>{visit.doctor} • {visit.poli}</span><span>{visit.billingStatus || 'menunggu_billing_fo'}</span></div><div className="payment-side"><span className="queue-tag warn">Billing FO</span><strong>{formatCurrency(visitTotal(visit))}</strong></div></button>; })}</div><div className="staff-section-card payment-receipt-card">{!selectedBillingVisit || !selectedBillingPatient ? <p className="mini">Pilih data kunjungan selesai untuk input billing.</p> : <><div className="receipt-header"><div><p className="staff-kicker">Billing Kunjungan</p><h2 className="section-title">{selectedBillingPatient.animalName} • {selectedBillingPatient.ownerName}</h2></div><div className="receipt-status">{formatCurrency(billingCharges.reduce((s,i)=>s+i.price,0))}</div></div><div className="receipt-meta-grid"><div><strong>Dokter</strong><span>{selectedBillingVisit.doctor}</span></div><div><strong>Poli</strong><span>{selectedBillingVisit.poli}</span></div><div><strong>Diagnosis</strong><span>{selectedBillingVisit.diagnosis || '-'}</span></div><div><strong>Saran</strong><span>{selectedBillingVisit.recommendations || '-'}</span></div></div><div className="internal-form-grid compact-gap minor-top"><label><span>Layanan / Administrasi</span><div className="medicine-line" style={{gridTemplateColumns:'1fr auto'}}><input list="service-master-list" value={serviceQuery} onChange={(e)=>setServiceQuery(e.target.value)} placeholder="Pilih layanan"/><button type="button" className="staff-outline-button" onClick={()=>{addMasterCharge('layanan', masterServices.find(i=>i.name.toLowerCase()===serviceQuery.toLowerCase())); setServiceQuery('');}}>Tambah</button></div></label><label><span>Tindakan</span><div className="medicine-line" style={{gridTemplateColumns:'1fr 90px auto'}}><input list="action-master-list" value={actionQuery} onChange={(e)=>setActionQuery(e.target.value)} placeholder="Pilih tindakan"/><input type="number" min="1" value={actionQty} onChange={(e)=>setActionQty(Math.max(1, Number(e.target.value||1)))} placeholder="Qty"/><button type="button" className="staff-outline-button" onClick={()=>{addMasterCharge('tindakan', masterActions.find(i=>i.name.toLowerCase()===actionQuery.toLowerCase()), actionQty); setActionQuery(''); setActionQty(1);}}>Tambah</button></div></label><label><span>Pemeriksaan Detail/Lab</span><div className="medicine-line" style={{gridTemplateColumns:'1fr auto'}}><input list="lab-master-list" value={labQuery} onChange={(e)=>setLabQuery(e.target.value)} placeholder="Pilih pemeriksaan"/><button type="button" className="staff-outline-button" onClick={()=>{addMasterCharge('lab', masterLabs.find(i=>i.name.toLowerCase()===labQuery.toLowerCase())); setLabQuery('');}}>Tambah</button></div></label><label><span>Rawat Inap</span><div className="medicine-line fo-inpatient-line"><input list="inpatient-master-list" value={inpatientQuery} onChange={(e)=>setInpatientQuery(e.target.value)} placeholder="Pilih rawat inap"/><input type="number" min="1" value={inpatientDays} onChange={(e)=>setInpatientDays(Math.max(1, Number(e.target.value||1)))} placeholder="Hari"/><button type="button" className="staff-outline-button" onClick={()=>{addMasterCharge('rawat_inap', masterInpatients.find(i=>i.name.toLowerCase()===inpatientQuery.toLowerCase()), inpatientDays); setInpatientQuery('');}}>Tambah</button></div></label>{billingCharges.some((item)=>item.kind === 'rawat_inap') ? <><label><span>DP Rawat Inap</span><input value={inpatientDpInput} onChange={(e)=>setInpatientDpInput(formatMoneyInput(e.target.value))} placeholder="Contoh: 200.000" /></label><label><span>Metode DP</span><select value={inpatientDpMethod} onChange={(e)=>setInpatientDpMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="Debit">Debit</option><option value="QRIS">QRIS</option></select></label>{inpatientDpMethod === 'Transfer' ? <label><span>Bank DP</span><select value={inpatientDpBank} onChange={(e)=>setInpatientDpBank(e.target.value)}><option value="BCA">BCA</option><option value="BSI">BSI</option><option value="Mandiri">Mandiri</option></select></label> : null}</> : null}</div><datalist id="service-master-list">{masterServices.map((i)=><option key={i.id} value={i.name}/>)}</datalist><datalist id="action-master-list">{masterActions.map((i)=><option key={i.id} value={i.name}/>)}</datalist><datalist id="lab-master-list">{masterLabs.map((i)=><option key={i.id} value={i.name}/>)}</datalist><datalist id="inpatient-master-list">{masterInpatients.map((i)=><option key={i.id} value={i.name}/>)}</datalist><div className="table-wrap minor-top"><table className="staff-table"><thead><tr><th>Item Billing</th><th>Jenis</th><th>Qty/Hari</th><th>Total</th><th>Aksi</th></tr></thead><tbody>{billingCharges.map((item, idx)=><tr key={`${item.name}-${idx}`}><td>{item.name}</td><td>{item.kind}</td><td>{item.days || item.quantity || 1}</td><td>{formatCurrency(item.price)}</td><td><button className="staff-danger-button small" type="button" onClick={()=>setBillingCharges((prev)=>prev.filter((_,i)=>i!==idx))}>Hapus</button></td></tr>)}</tbody></table></div><div className="receipt-total-box minor-top"><div className="receipt-line"><span>Tindakan/Layanan/Rawat Inap</span><strong>{formatCurrency(billingCharges.reduce((sum,item)=>sum+item.price,0))}</strong></div><div className="receipt-line grand"><span>Total Keseluruhan</span><strong>{formatCurrency(billingCharges.reduce((sum,item)=>sum+item.price,0))}</strong></div>{parseMoneyInput(inpatientDpInput) > 0 ? <div className="receipt-line"><span>Rencana DP Rawat Inap</span><strong>{formatCurrency(parseMoneyInput(inpatientDpInput))} • {inpatientDpMethod}{inpatientDpMethod === 'Transfer' ? ` ${inpatientDpBank}` : ''}</strong></div> : null}</div><div className="internal-actions spread-line"><button className="staff-outline-link" type="button" onClick={()=>saveBilling(true)}>Ke Pembayaran</button><button className="staff-primary-button" type="button" onClick={()=>saveBilling(false)}>Simpan Billing FO</button></div></>}</div></div></section>}

      {activeTab === 'inpatient' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Pasien Rawat Inap Aktif</h2><p className="mini">Dokter menangani catatan medis. FO dapat memantau pasien rawat inap aktif dan finalisasi billing dari tab Input Billing FO.</p></div></div>{inpatientVisits.length === 0 ? <div className="empty-state"><strong>Belum ada pasien rawat inap aktif.</strong><span>Pasien muncul di sini setelah dokter menandai rawat inap.</span></div> : null}<div className="owner-stack">{inpatientVisits.map((visit) => { const patient = getPatientById(visit.patientId); if (!patient) return null; return <article key={visit.id} className="owner-card"><div className="owner-card-head"><div><h3>{patient.animalName} • {patient.ownerName}</h3><p>{visit.doctor} • {visit.hospitalizationType || 'Rawat inap'} • {new Date(visit.visitDate).toLocaleDateString('id-ID')}</p></div><span className="queue-tag">{visit.inpatientReadyForCheckout ? 'Siap billing FO' : 'Masih rawat inap aktif'}</span></div><div className="patient-info-panel"><div><strong>ID/RFID</strong><span>{patient.customerNumber} / {patient.rfidUid ?? '-'}</span></div><div><strong>Poli</strong><span>{visit.poli}</span></div><div><strong>Diagnosis</strong><span>{visit.diagnosis || '-'}</span></div><div><strong>Status</strong><span>{visit.billingStatus || 'belum_ditagih'}</span></div></div></article>; })}</div></section>}

      {activeTab === 'refusal' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Surat Penolakan Rawat Inap</h2><p className="mini">Cari pasien dengan nama hewan, pemilik, nomor registrasi, atau UID RFID. RFID dapat diketik/di-scan ke kolom pencarian.</p></div></div><div className="internal-form-grid compact-gap"><label><span>Cari Pasien / RFID</span><input value={refusalSearch} onChange={(e)=>setRefusalSearch(e.target.value)} placeholder="Nama hewan / pemilik / REG / UID RFID" /></label><label><span>Pilih Pasien</span><select value={refusalPatientId} onChange={(e)=>setRefusalPatientId(e.target.value)}><option value="">Pilih pasien</option>{refusalPatientOptions.map((p)=><option key={p.id} value={p.id}>{p.ownerName} • {p.animalName} • {p.customerNumber} • {p.rfidUid || '-'}</option>)}</select></label>{selectedRefusalPatient ? <div className="patient-info-panel span-2"><div><strong>Pemilik</strong><span>{selectedRefusalPatient.ownerName}</span></div><div><strong>Hewan</strong><span>{selectedRefusalPatient.animalName}</span></div><div><strong>No. Registrasi</strong><span>{selectedRefusalPatient.customerNumber}</span></div><div><strong>RFID</strong><span>{selectedRefusalPatient.rfidUid || '-'}</span></div></div> : null}<label><span>Dokter</span><input value={refusalForm.doctorName} onChange={(e)=>setRefusalForm({...refusalForm, doctorName:e.target.value})} /></label><label><span>Petugas FO</span><input value={refusalForm.staffName} onChange={(e)=>setRefusalForm({...refusalForm, staffName:e.target.value})} /></label><label className="span-2"><span>Alasan Penolakan</span><textarea value={refusalForm.reason} onChange={(e)=>setRefusalForm({...refusalForm, reason:e.target.value})} /></label><label className="span-2"><span>Diagnosis / Kondisi</span><textarea value={refusalForm.diagnosis} onChange={(e)=>setRefusalForm({...refusalForm, diagnosis:e.target.value})} /></label><label className="span-2"><span>Tindakan yang Disarankan</span><textarea value={refusalForm.recommendedTreatment} onChange={(e)=>setRefusalForm({...refusalForm, recommendedTreatment:e.target.value})} /></label><label className="span-2"><span>Risiko yang Dijelaskan</span><textarea value={refusalForm.riskExplanation} onChange={(e)=>setRefusalForm({...refusalForm, riskExplanation:e.target.value})} /></label><label className="span-2"><span>Pernyataan Penolakan</span><textarea value={refusalForm.refusalStatement} onChange={(e)=>setRefusalForm({...refusalForm, refusalStatement:e.target.value})} /></label><label><span>Nama Saksi</span><input value={refusalForm.witnessName} onChange={(e)=>setRefusalForm({...refusalForm, witnessName:e.target.value})} /></label><label className="span-2"><span>Saran</span><textarea value={(refusalForm as any).suggestion || ''} onChange={(e)=>setRefusalForm({...refusalForm, suggestion:e.target.value} as any)} placeholder="Contoh: Segera cek lab / observasi ulang / obat yang disarankan" /></label><div className="internal-actions span-2"><button className="staff-primary-button" type="button" onClick={saveRefusalLetter}>Simpan & Print Surat</button></div></div></section>}

      {activeTab === 'completed' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Data Pemeriksaan Selesai</h2><p className="mini">Data dari dokter masuk ke sini. Jika billing belum diisi, lanjut ke tab Input Billing FO.</p></div><div className="head-inline-tools"><input className="staff-search-input compact" placeholder="Cari pemilik / hewan / RFID" value={completedSearch} onChange={(e) => setCompletedSearch(e.target.value)} /><select className="staff-select-inline" value={completedMonth} onChange={(e) => setCompletedMonth(e.target.value)}><option value="all">Semua Arsip</option>{completedMonthOptions.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></div></div><div className="table-wrap"><table className="staff-table"><thead><tr><th>Nama Hewan</th><th>Nama Pemilik</th><th>Dokter</th><th>Poli</th><th>Total Biaya</th><th>Status Billing</th><th>Status Pembayaran</th><th>Saran Kontrol</th><th>Aksi</th></tr></thead><tbody>{filteredCompletedVisits.map((visit) => { const patient = getPatientById(visit.patientId); if (!patient) return null; const paymentStatus = visit.paymentStatus || 'Menunggu Pembayaran'; return <tr key={visit.id}><td>{patient.animalName}</td><td>{patient.ownerName}</td><td>{visit.doctor}</td><td>{visit.poli}</td><td>{formatCurrency(visitTotal(visit))}</td><td>{visit.billingStatus || 'menunggu_billing_fo'}</td><td>{paymentStatus}</td><td>{visit.recommendations || '-'}</td><td><div className="table-action-row"><button className="staff-outline-button small" type="button" onClick={() => { selectBillingVisit(visit); setTab('billing'); }}>Input Billing</button><Link className="staff-primary-link small" to={`/payments?visit=${visit.id}`}>{paymentStatus === 'Lunas' ? 'Lihat Pembayaran' : 'Bayar'}</Link><button className="staff-outline-button small" type="button" onClick={() => openOwnerPrint(visit)}>Print</button></div></td></tr>; })}</tbody></table></div></section>}
    </Layout>
  );
};
