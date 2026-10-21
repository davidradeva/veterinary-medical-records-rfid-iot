import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { NoticeToast, type NoticeState } from '../../components/NoticeToast';
import { useClinic } from '../../context/ClinicContext';
import { clinicApi } from '../../api/clinicApi';
import type { ChargeItem, MasterPriceItem, MedicineEntry, VisitRecord } from '../../types';

const monthKey = (date: string) => date.slice(0, 7);
const monthLabel = (month: string) => new Date(`${month}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const formatCurrency = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const formatMoneyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('id-ID') : '';
};
const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, '') || 0);
const numericInput = (value: string, allowDecimal = true) => {
  const cleaned = value.replace(allowDecimal ? /[^\d.,]/g : /\D/g, '');
  if (!allowDecimal) return cleaned;
  const normalizedValue = cleaned.replace(',', '.');
  const parts = normalizedValue.split('.');
  return parts.length <= 1 ? parts[0] : `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
};

type WeightUnit = 'kg' | 'gram';
type Tab = 'pending' | 'inpatient' | 'records';
type EstimateKind = 'rawat_inap' | 'tindakan';

type FormState = {
  complaint: string;
  weight: string;
  temperature: string;
  examResult: string;
  labResult: string;
  diagnosis: string;
  prognosis: string;
  medicalAction: string;
  recommendations: string;
  notes: string;
};

const emptyForm: FormState = {
  complaint: '', weight: '', temperature: '', examResult: '', labResult: '', diagnosis: '', prognosis: '', medicalAction: '', recommendations: '', notes: '',
};

const detectWeightUnit = (value?: string): WeightUnit => /gram|gr\b|\bg\b/i.test(String(value || '')) ? 'gram' : 'kg';
const stripNumberWithDecimal = (value?: string) => numericInput(String(value || ''));

const getMasterPrice = (item?: MasterPriceItem) => Number(item?.minPrice || 0);
const buildPrintShell = (subtitle: string, content: string) => `
<html><head><title>Hug Me By Vet</title><style>
body{font-family:Arial,Helvetica,sans-serif;padding:28px;background:#f6f3ff;color:#1f2937}.sheet{max-width:980px;margin:0 auto;background:#fff;border:1px solid #e5def8;border-radius:24px;overflow:hidden}.head{padding:30px 34px;background:linear-gradient(135deg,#312e81,#7c3aed,#db2777);color:#fff}.head h1{margin:0;font-size:32px}.head p{margin:8px 0 0;opacity:.95}.body{padding:28px 34px}.section{border:1px solid #ebe5fb;border-radius:18px;padding:18px;margin-bottom:16px;background:#fcfbff}.section h3{margin:0 0 10px;color:#4338ca}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}.row{margin:7px 0;line-height:1.7}.table{width:100%;border-collapse:collapse;margin-top:10px}.table th,.table td{border:1px solid #d8d2ea;padding:8px;text-align:left}.money{text-align:right}.total{font-weight:800;background:#f5f3ff}.foot{padding:16px 34px;border-top:1px solid #ebe5fb;background:#f9f7ff;color:#6b7280;text-align:center;font-size:13px}</style></head><body><div class="sheet"><div class="head"><h1>🐾 Hug Me By Vet</h1><p>${subtitle}</p></div><div class="body">${content}</div><div class="foot">Dokumen klinik • Untuk arsip internal</div></div></body></html>`;

const printHtml = (html: string) => {
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
};

export const DoctorPage = () => {
  const { visits, getPendingVisits, getCompletedVisits, getPatientById, updateVisit, deleteVisit } = useClinic();
  const [tab, setTab] = useState<Tab>('pending');
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [search, setSearch] = useState('');
  const [archiveMonth, setArchiveMonth] = useState('all');
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [masterActions, setMasterActions] = useState<MasterPriceItem[]>([]);
  const [masterInpatients, setMasterInpatients] = useState<MasterPriceItem[]>([]);
  const [estimateQuery, setEstimateQuery] = useState('');
  const [estimateKind, setEstimateKind] = useState<EstimateKind>('rawat_inap');
  const [estimateQty, setEstimateQty] = useState(1);
  const [estimateCharges, setEstimateCharges] = useState<ChargeItem[]>([]);

  const showNotice = (tone: NoticeState['tone'], title: string, message: string) => setNotice({ tone, title, message });

  useEffect(() => {
    clinicApi.loadState().then((state) => {
      setMasterActions(state?.masterActions || []);
      setMasterInpatients(state?.masterInpatients || []);
    }).catch(() => undefined);
  }, []);

  const pendingVisits = getPendingVisits().filter((visit) => !visit.isHospitalized);
  const inpatientVisits = visits.filter((visit) => visit.status === 'pending' && visit.isHospitalized);
  const completedVisits = getCompletedVisits();
  const monthOptions = Array.from(new Set(completedVisits.map((visit) => monthKey(visit.visitDate)))).sort().reverse();
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId) || null;
  const selectedPatient = selectedVisit ? getPatientById(selectedVisit.patientId) : undefined;
  const estimateTotal = estimateCharges.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const estimateChoices = estimateKind === 'rawat_inap' ? masterInpatients : masterActions;

  const groupedRecords = useMemo(() => {
    const map = new Map<string, VisitRecord[]>();
    completedVisits.forEach((visit) => {
      const patient = getPatientById(visit.patientId);
      if (!patient) return;
      const hay = `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase();
      if (search && !hay.includes(search.toLowerCase())) return;
      if (archiveMonth !== 'all' && monthKey(visit.visitDate) !== archiveMonth) return;
      const list = map.get(visit.patientId) || [];
      list.push(visit);
      map.set(visit.patientId, list.sort((a, b) => +new Date(a.visitDate) - +new Date(b.visitDate)));
    });
    return Array.from(map.entries());
  }, [completedVisits, getPatientById, search, archiveMonth]);

  const resetForm = () => {
    setForm(emptyForm);
    setWeightUnit('kg');
    setEstimateCharges([]);
    setEstimateQuery('');
    setEstimateQty(1);
  };

  const selectVisit = (visit: VisitRecord, nextTab?: Tab) => {
    setSelectedVisitId(visit.id);
    setWeightUnit(detectWeightUnit(visit.weight));
    setForm({
      complaint: visit.complaint || '',
      weight: stripNumberWithDecimal(visit.weight),
      temperature: stripNumberWithDecimal(visit.temperature),
      examResult: visit.examResult || '',
      labResult: visit.labResult || '',
      diagnosis: visit.diagnosis || '',
      prognosis: visit.prognosis || '',
      medicalAction: visit.medicalAction || '',
      recommendations: visit.recommendations || '',
      notes: visit.notes || '',
    });
    setEstimateCharges(visit.additionalCharges || []);
    if (nextTab) setTab(nextTab);
    setNotice(null);
  };

  const buildPayload = (): Partial<VisitRecord> => ({
    complaint: form.complaint,
    weight: form.weight ? `${form.weight} ${weightUnit}` : '',
    temperature: form.temperature ? `${form.temperature} °C` : '',
    examResult: form.examResult,
    labResult: form.labResult,
    diagnosis: form.diagnosis,
    prognosis: form.prognosis,
    medicalAction: form.medicalAction,
    recommendations: form.recommendations,
    notes: form.notes,
    billingStatus: 'menunggu_billing_fo',
    doctorDoneAt: new Date().toISOString(),
    paymentStatus: 'Menunggu Pembayaran',
  });

  const saveVisit = () => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, { ...buildPayload(), status: 'completed', isHospitalized: false, inpatientReadyForCheckout: false });
    showNotice('success', 'Rekam medis dokter tersimpan', 'Data pemeriksaan masuk ke Front Office untuk input billing.');
    setSelectedVisitId('');
    resetForm();
  };

  const saveInpatientProgress = () => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, { ...buildPayload(), status: 'pending', isHospitalized: true, inpatientReadyForCheckout: false, additionalCharges: estimateCharges, medicineItems: [], estimateTotal });
    showNotice('success', 'Progress rawat inap tersimpan', 'Catatan medis dan estimasi sementara tersimpan.');
  };

  const sendToFoBilling = () => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, {
      ...buildPayload(),
      status: 'completed',
      isHospitalized: false,
      inpatientReadyForCheckout: true,
      billingStatus: 'menunggu_billing_fo',
      additionalCharges: estimateCharges,
      medicineItems: [],
      totalCost: estimateTotal,
      estimateTotal,
      estimateSentToFoAt: new Date().toISOString(),
    });
    showNotice('success', 'Dikirim ke Billing FO', 'Estimasi dokter terkirim ke Front Office. FO dapat mengubahnya menjadi billing final.');
    setSelectedVisitId('');
    resetForm();
    setTab('records');
  };

  const sendToInpatient = () => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, { ...buildPayload(), status: 'pending', isHospitalized: true, inpatientReadyForCheckout: false, hospitalizationType: selectedVisit.hospitalizationType || 'Rawat Inap', billingStatus: 'menunggu_billing_fo' });
    showNotice('info', 'Pasien masuk rawat inap', 'Pasien pindah ke tab Rawat Inap. Dokter dapat membuat estimasi, FO finalisasi billing.');
    setSelectedVisitId('');
    resetForm();
    setTab('inpatient');
  };

  const addEstimateCharge = () => {
    const item = estimateChoices.find((row) => row.name.toLowerCase() === estimateQuery.trim().toLowerCase());
    if (!item) {
      showNotice('warning', 'Pilihan belum valid', 'Pilih item dari master data.');
      return;
    }
    const qty = Math.max(1, Number(estimateQty || 1));
    const unitPrice = getMasterPrice(item);
    const price = unitPrice * qty;
    setEstimateCharges((prev) => [...prev, {
      name: item.name,
      kind: estimateKind === 'rawat_inap' ? 'rawat_inap' : 'tindakan',
      quantity: qty,
      days: estimateKind === 'rawat_inap' ? qty : undefined,
      unitPrice,
      price,
      masterTable: estimateKind === 'rawat_inap' ? 'inpatient_masters' : 'actions',
      masterId: item.dbId,
      chargeSource: 'doctor',
    }]);
    setEstimateQuery('');
    setEstimateQty(1);
  };

  const printEstimate = () => {
    if (!selectedVisit || !selectedPatient) return;
    const rows = [
      ...estimateCharges.map((item) => ({ name: item.name, qty: item.days || item.quantity || 1, unit: item.unitPrice || item.price, total: item.price })),
    ];
    const body = `<div class="section"><h3>Identitas Pasien</h3><div class="grid"><div class="row"><strong>Nama Hewan:</strong> ${selectedPatient.animalName}</div><div class="row"><strong>Pemilik:</strong> ${selectedPatient.ownerName}</div><div class="row"><strong>Dokter:</strong> ${selectedVisit.doctor}</div><div class="row"><strong>Poli:</strong> ${selectedVisit.poli}</div></div></div><div class="section"><h3>Estimasi Rawat Inap</h3><table class="table"><thead><tr><th>Item</th><th>Qty/Hari</th><th>Harga</th><th>Total</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td><td class="money">${formatCurrency(item.unit)}</td><td class="money">${formatCurrency(item.total)}</td></tr>`).join('')}<tr class="total"><td colspan="3">TOTAL ESTIMASI</td><td class="money">${formatCurrency(estimateTotal)}</td></tr></tbody></table><p>Catatan: Estimasi dapat berubah sesuai kondisi pasien, tambahan tindakan, obat, dan lama rawat inap aktual.</p></div>`;
    updateVisit(selectedVisit.id, { estimatePrintedAt: new Date().toISOString(), estimateTotal });
    printHtml(buildPrintShell(`Estimasi harga rawat inap ${selectedPatient.animalName}`, body));
  };

  const renderPreviousVisitsPanel = () => {
    if (!selectedPatient) return <aside className="previous-record-panel empty"><p className="staff-kicker">Riwayat Sebelumnya</p><h3>Belum ada pasien dipilih</h3><p className="mini">Pilih pasien menunggu untuk melihat kunjungan terakhir.</p></aside>;
    const histories = completedVisits.filter((visit) => visit.patientId === selectedPatient.id && visit.id !== selectedVisitId).sort((a, b) => +new Date(b.visitDate) - +new Date(a.visitDate));
    return <aside className="previous-record-panel"><div className="previous-record-head"><p className="staff-kicker">Riwayat Sebelumnya</p><h3>{selectedPatient.animalName}</h3><span>{histories.length ? `${histories.length} kunjungan tersimpan` : 'Belum ada kunjungan selesai'}</span></div>{histories.length ? <div className="previous-record-list">{histories.slice(0, 4).map((visit, index) => <article key={visit.id} className="previous-record-item"><div className="previous-record-top"><strong>Kunjungan {histories.length - index}</strong><span>{new Date(visit.visitDate).toLocaleDateString('id-ID')}</span></div><div className="previous-record-grid"><span>Dokter</span><b>{visit.doctor}</b><span>Poli</span><b>{visit.poli}</b><span>Diagnosis</span><b>{visit.diagnosis || '-'}</b><span>Billing</span><b>{(visit.additionalCharges || []).map((item) => item.name).join(', ') || '-'}</b></div></article>)}</div> : <div className="previous-record-empty">Belum ada riwayat pemeriksaan selesai.</div>}</aside>;
  };

  const renderHistoryContent = (patientId: string) => {
    const patient = getPatientById(patientId);
    const histories = completedVisits.filter((visit) => visit.patientId === patientId).sort((a, b) => +new Date(a.visitDate) - +new Date(b.visitDate));
    if (!patient) return '';
    return `<div class="history-sheet-card"><div class="section"><h3>Identitas</h3><div class="grid"><div class="row"><strong>Nama Pemilik:</strong> ${patient.ownerName}</div><div class="row"><strong>Nama Hewan:</strong> ${patient.animalName}</div><div class="row"><strong>No RM/RFID:</strong> ${patient.customerNumber} / ${patient.rfidUid || '-'}</div><div class="row"><strong>Jenis:</strong> ${patient.animalType} • ${patient.breed}</div></div></div>${histories.map((visit, idx) => `<div class="section"><h3>Kunjungan ${idx + 1}</h3><div class="grid"><div class="row"><strong>Dokter:</strong> ${visit.doctor}</div><div class="row"><strong>Poli:</strong> ${visit.poli}</div><div class="row"><strong>Berat:</strong> ${visit.weight || '-'}</div><div class="row"><strong>Suhu:</strong> ${visit.temperature || '-'}</div></div><div class="row"><strong>Anamnesis:</strong> ${visit.complaint || '-'}</div><div class="row"><strong>Diagnosis:</strong> ${visit.diagnosis || '-'}</div><div class="row"><strong>Tindakan Medis:</strong> ${visit.medicalAction || '-'}</div><div class="row"><strong>Saran:</strong> ${visit.recommendations || '-'}</div></div>`).join('')}</div>`;
  };

  const renderEstimatePanel = () => {
    if (!selectedVisit || !selectedPatient) return null;
    return <div className="payment-note-box estimate-box"><strong>Estimasi Rawat Inap dari Dokter</strong><span>Isi estimasi tindakan dan rawat inap. Item obat tidak dipisahkan karena sudah masuk ke master tindakan.</span><div className="internal-form-grid compact-gap minor-top"><label><span>Jenis Estimasi</span><select value={estimateKind} onChange={(e) => { setEstimateKind(e.target.value as EstimateKind); setEstimateQuery(''); }}><option value="rawat_inap">Rawat Inap</option><option value="tindakan">Tindakan</option></select></label><label><span>Item</span><input list="doctor-estimate-list" value={estimateQuery} onChange={(e) => setEstimateQuery(e.target.value)} placeholder="Pilih item estimasi" /></label><label><span>Qty/Hari</span><input type="number" min="1" value={estimateQty} onChange={(e) => setEstimateQty(Math.max(1, Number(e.target.value || 1)))} /></label><div className="internal-actions"><button className="staff-outline-button" type="button" onClick={addEstimateCharge}>Tambah Estimasi</button></div></div><datalist id="doctor-estimate-list">{estimateChoices.map((item) => <option key={item.id} value={item.name} />)}</datalist><div className="table-wrap minor-top"><table className="staff-table"><thead><tr><th>Item</th><th>Jenis</th><th>Qty/Hari</th><th>Total</th><th>Aksi</th></tr></thead><tbody>{estimateCharges.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}</td><td>{item.kind}</td><td>{item.days || item.quantity || 1}</td><td>{formatCurrency(item.price)}</td><td><button className="staff-danger-button small" type="button" onClick={() => setEstimateCharges((prev) => prev.filter((_, i) => i !== index))}>Hapus</button></td></tr>)}</tbody></table></div><div className="receipt-total-box minor-top"><div className="receipt-line grand"><span>Total Estimasi</span><strong>{formatCurrency(estimateTotal)}</strong></div></div><div className="button-row"><button className="staff-outline-button" type="button" onClick={printEstimate}>Print Estimasi Harga</button><button className="staff-primary-button" type="button" onClick={sendToFoBilling}>Kirim ke Billing FO</button></div></div>;
  };

  const renderVisitForm = (isInpatientContext = false) => {
    if (!selectedVisit || !selectedPatient) return <p className="mini">Pilih pasien dari daftar.</p>;
    return <><div className="patient-info-panel"><div><strong>Nama Hewan</strong><span>{selectedPatient.animalName}</span></div><div><strong>Pemilik</strong><span>{selectedPatient.ownerName}</span></div><div><strong>ID/RFID</strong><span>{selectedPatient.customerNumber} / {selectedPatient.rfidUid ?? '-'}</span></div><div><strong>Dokter • Poli</strong><span>{selectedVisit.doctor} • {selectedVisit.poli}</span></div></div><div className="internal-form-grid compact-gap"><label className="span-2"><span>Anamnesis</span><textarea value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} /></label><label><span>Berat Badan</span><div className="unit-input-row"><input inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: numericInput(e.target.value) })} placeholder={weightUnit === 'kg' ? 'Contoh: 3.2' : 'Contoh: 3200'} /><select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}><option value="kg">Kg</option><option value="gram">Gram</option></select></div></label><label><span>Suhu</span><div className="unit-input-row"><input inputMode="decimal" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: numericInput(e.target.value) })} placeholder="Contoh: 38.6" /><span className="unit-static">°C</span></div></label><label className="span-2"><span>Hasil Pemeriksaan</span><textarea value={form.examResult} onChange={(e) => setForm({ ...form, examResult: e.target.value })} /></label><label className="span-2"><span>Pemeriksaan Lab / Hasil Lab</span><textarea value={form.labResult} onChange={(e) => setForm({ ...form, labResult: e.target.value })} placeholder="Tulis pemeriksaan lab yang dilakukan dan hasil interpretasinya." /></label><label className="span-2"><span>Diagnosis</span><textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></label><label className="span-2"><span>Prognosis</span><select value={form.prognosis} onChange={(e) => setForm({ ...form, prognosis: e.target.value })}><option value="">Pilih prognosis</option><option value="Fausta">Fausta</option><option value="Dubius">Dubius</option><option value="Infausta">Infausta</option></select></label><label className="span-2"><span>Tindakan Medis</span><textarea value={form.medicalAction} onChange={(e) => setForm({ ...form, medicalAction: e.target.value })} placeholder="Tulis tindakan medis secara naratif." /></label><label className="span-2"><span>Saran Kontrol</span><textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></label><label className="span-2"><span>Catatan</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label></div>{isInpatientContext ? renderEstimatePanel() : <div className="internal-actions spread-line"><div className="total-highlight">Tindakan, pemeriksaan detail, layanan, rawat inap, dan billing final diinput oleh Front Office.</div></div>}<div className="internal-actions">{!isInpatientContext ? <button className="staff-outline-button" type="button" onClick={sendToInpatient}>Masuk Rawat Inap</button> : null}{isInpatientContext ? <><button className="staff-accent-button" type="button" onClick={saveInpatientProgress}>Simpan Progress</button><button className="staff-primary-button" type="button" onClick={sendToFoBilling}>Kirim ke Billing FO</button></> : <button className="staff-primary-button" type="button" onClick={saveVisit}>Simpan Rekam Medis</button>}</div></>;
  };

  return <Layout title="Halaman Dokter" subtitle="Dokter mengisi data medis dan estimasi rawat inap. Billing final dikerjakan oleh Front Office."><div className="tab-switcher"><button className={`tab-button ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>Form Registrasi ({pendingVisits.length})</button><button className={`tab-button ${tab === 'inpatient' ? 'active' : ''}`} onClick={() => setTab('inpatient')}>Rawat Inap ({inpatientVisits.length})</button><button className={`tab-button ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Rekam Medis ({groupedRecords.length})</button></div><NoticeToast notice={notice} onClose={() => setNotice(null)} />{tab === 'pending' && <section className="dashboard-grid two-column"><article className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Daftar Pasien Menunggu</h2></div></div><div className="queue-list">{pendingVisits.map((visit) => { const patient = getPatientById(visit.patientId); if (!patient) return null; return <div key={visit.id} className="queue-card"><button type="button" className="queue-main" onClick={() => selectVisit(visit, 'pending')}><strong>{patient.animalName}</strong><span>{patient.ownerName}</span><span>{visit.poli} • {visit.doctor} • {new Date(visit.visitDate).toLocaleDateString('id-ID')}</span></button><div className="queue-side"><span className="queue-tag">{patient.customerNumber}</span><button className="staff-danger-button small" type="button" onClick={() => { if (window.confirm(`Yakin ingin menghapus antrian ${patient.animalName}?`)) deleteVisit(visit.id); }}>Hapus</button></div></div>; })}</div></article><article className="staff-section-card doctor-form-card-wide"><div className="section-head spread-head"><div><h2 className="section-title">Form Pemeriksaan Medis</h2><p className="mini">Khusus catatan dokter. Billing dikerjakan FO.</p></div></div><div className="doctor-form-with-history"><div className="doctor-form-main">{renderVisitForm(false)}</div>{renderPreviousVisitsPanel()}</div></article></section>}{tab === 'inpatient' && <section className="dashboard-grid two-column"><article className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Pasien Rawat Inap</h2></div></div><div className="queue-list">{inpatientVisits.map((visit) => { const patient = getPatientById(visit.patientId); if (!patient) return null; return <div key={visit.id} className="queue-card"><button type="button" className="queue-main" onClick={() => selectVisit(visit, 'inpatient')}><strong>{patient.animalName}</strong><span>{patient.ownerName}</span><span>{visit.hospitalizationType || 'Rawat inap'} • {visit.doctor}</span><span>{visit.inpatientReadyForCheckout ? 'Siap billing FO' : 'Masih rawat inap aktif'}</span></button><div className="queue-side"><span className="queue-tag">{patient.customerNumber}</span></div></div>; })}</div></article><article className="staff-section-card doctor-form-card-wide"><div className="section-head spread-head"><div><h2 className="section-title">Form Rawat Inap</h2><p className="mini">Dokter dapat mengisi estimasi tindakan dan rawat inap lalu mengirimkannya ke FO.</p></div></div><div className="doctor-form-with-history"><div className="doctor-form-main">{renderVisitForm(true)}</div>{renderPreviousVisitsPanel()}</div></article></section>}{tab === 'records' && <section className="staff-section-card"><div className="section-head spread-head"><div><h2 className="section-title">Rekam Medis Lengkap</h2><p className="mini">Riwayat pasien tersimpan per kunjungan.</p></div><div className="head-inline-tools"><input className="staff-search-input compact" placeholder="Cari pemilik / hewan / RFID" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="staff-select-inline" value={archiveMonth} onChange={(e) => setArchiveMonth(e.target.value)}><option value="all">Semua Arsip</option>{monthOptions.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></div></div><div className="records-grid">{groupedRecords.map(([patientId, histories]) => { const patient = getPatientById(patientId); if (!patient) return null; return <article key={patientId} className="record-card"><div><h3>{patient.animalName}</h3><p>{patient.ownerName}</p><p>{patient.customerNumber} • {patient.animalType}</p></div><div className="record-meta"><span>{histories.length} kunjungan</span><span>Kunjungan terakhir {new Date(histories[histories.length - 1].visitDate).toLocaleDateString('id-ID')}</span></div><div className="record-actions"><button className="staff-outline-button small" type="button" onClick={() => setHistoryOpenFor(patientId)}>Lihat Riwayat</button><button className="staff-primary-button small" type="button" onClick={() => printHtml(buildPrintShell(`Riwayat rekam medis ${patient.animalName}`, renderHistoryContent(patientId)))}>Print Riwayat</button></div></article>; })}</div>{historyOpenFor ? <div className="history-modal-shell"><div className="staff-section-card history-card-view"><div className="section-head spread-head"><div><h2 className="section-title">Lihat Riwayat</h2></div><button className="staff-ghost-button" type="button" onClick={() => setHistoryOpenFor(null)}>Tutup</button></div><div dangerouslySetInnerHTML={{ __html: renderHistoryContent(historyOpenFor) }} /></div></div> : null}</section>}</Layout>;
};
