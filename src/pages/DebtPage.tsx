import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useClinic } from '../context/ClinicContext';
import type { InstallmentPayment, VisitRecord } from '../types';

const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const formatThousand = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};
const parseThousand = (value: string) => Number(value.replace(/\D/g, '') || 0);
const installmentLabel = (item: InstallmentPayment) => `${item.method}${item.method === 'Transfer' && item.bank ? ` • ${item.bank}` : ''}`;

const rekeningKlinik = [
  'BCA 0000000000 a.n. Hug Me By Vet',
  'BSI 0000000000 a.n. Hug Me By Vet',
  'Mandiri 0000000000 a.n. Hug Me By Vet',
];

const normalizePhoneForWa = (phone?: string) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith('62')) digits = `62${digits}`;
  return digits;
};

const safeDate = (value?: string) => {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

type DebtScheduleItem = {
  monthNumber: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: 'paid' | 'due' | 'overdue' | 'upcoming';
  statusLabel: string;
};

const dueDateForMonth = (visit: VisitRecord, index: number) => {
  const start = safeDate(visit.debtStartDate || visit.paymentDate || visit.visitDate);
  const dueDay = Math.max(1, Math.min(28, Number(visit.debtDueDay || start.getDate() || 1)));
  return new Date(start.getFullYear(), start.getMonth() + index + 1, dueDay, 23, 59, 59, 999);
};

const buildDebtSchedule = (visit: VisitRecord): DebtScheduleItem[] => {
  const totalDebt = visit.debtTotal || visit.totalCost || 0;
  const months = Math.max(1, Number(visit.debtInstallmentMonths || 1));
  const monthlyAmount = visit.debtMonthlyAmount || Math.ceil(totalDebt / months);
  let remainingPaid = visit.debtPaid || 0;
  const today = todayStart();

  return Array.from({ length: months }).map((_, index) => {
    const isLast = index === months - 1;
    const amount = isLast ? Math.max(0, totalDebt - monthlyAmount * (months - 1)) : monthlyAmount;
    const paidAmount = Math.min(remainingPaid, amount);
    remainingPaid = Math.max(0, remainingPaid - amount);
    const unpaidAmount = Math.max(0, amount - paidAmount);
    const dueDate = dueDateForMonth(visit, index);
    const dueStart = new Date(dueDate);
    dueStart.setHours(0, 0, 0, 0);

    let status: DebtScheduleItem['status'] = 'upcoming';
    let statusLabel = 'Belum Jatuh Tempo';
    if (unpaidAmount <= 0) {
      status = 'paid';
      statusLabel = 'Lunas';
    } else if (dueStart.getTime() < today.getTime()) {
      status = 'overdue';
      statusLabel = 'Terlambat';
    } else if (dueStart.getTime() === today.getTime()) {
      status = 'due';
      statusLabel = 'Jatuh Tempo';
    }

    return { monthNumber: index + 1, dueDate, amount, paidAmount, unpaidAmount, status, statusLabel };
  });
};

const calculateDueNow = (visit: VisitRecord) => {
  const schedule = buildDebtSchedule(visit);
  const today = todayStart();
  const shouldAlreadyBePaid = schedule
    .filter((item) => {
      const dueStart = new Date(item.dueDate);
      dueStart.setHours(0, 0, 0, 0);
      return dueStart.getTime() <= today.getTime();
    })
    .reduce((sum, item) => sum + item.amount, 0);
  const paid = visit.debtPaid || 0;
  const totalDebt = visit.debtTotal || visit.totalCost || 0;
  return Math.min(Math.max(0, totalDebt - paid), Math.max(0, shouldAlreadyBePaid - paid));
};

const getNextUnpaidSchedule = (visit: VisitRecord) => buildDebtSchedule(visit).find((item) => item.unpaidAmount > 0);

const buildWaMessage = (visit: VisitRecord, patient: any) => {
  const totalDebt = visit.debtTotal || visit.totalCost || 0;
  const paid = visit.debtPaid || 0;
  const remaining = Math.max(0, totalDebt - paid);
  const dueNow = calculateDueNow(visit);
  const dueItems = buildDebtSchedule(visit).filter((item) => item.status === 'due' || item.status === 'overdue');
  const nextDue = getNextUnpaidSchedule(visit);
  const detailTagihan = dueItems.length
    ? dueItems.map((item) => `- Cicilan bulan ke-${item.monthNumber}: ${rupiah(item.unpaidAmount)} (${item.statusLabel}, jatuh tempo ${item.dueDate.toLocaleDateString('id-ID')})`).join('\n')
    : nextDue
      ? `- Cicilan berikutnya bulan ke-${nextDue.monthNumber}: ${rupiah(nextDue.unpaidAmount)} jatuh tempo ${nextDue.dueDate.toLocaleDateString('id-ID')}`
      : '- Tidak ada cicilan tertunggak.';

  return `Halo ${patient.ownerName},\n\nKami dari Hug Me By Vet ingin menginformasikan pembayaran hutang/cicilan untuk pasien:\n\nNama Hewan: ${patient.animalName}\nLayanan: ${visit.poli}\nDokter: ${visit.doctor}\n\nTotal hutang: ${rupiah(totalDebt)}\nSudah dibayar: ${rupiah(paid)}\nSisa hutang: ${rupiah(remaining)}\nTagihan jatuh tempo saat ini: ${rupiah(dueNow)}\n\nDetail cicilan:\n${detailTagihan}\n\nPembayaran dapat dilakukan melalui rekening:\n${rekeningKlinik.map((item) => `- ${item}`).join('\n')}\n\nSetelah melakukan pembayaran, mohon kirimkan bukti transfer agar dapat kami catat pada sistem. Terima kasih.`;
};

export const DebtPage = () => {
  const { visits, getPatientById, updateVisit, addFinanceEntry } = useClinic();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [installmentInput, setInstallmentInput] = useState('');
  const [installmentMethod, setInstallmentMethod] = useState<'Cash' | 'Debit' | 'Transfer' | 'QRIS'>('Cash');
  const [transferBank, setTransferBank] = useState('BCA');
  const [search, setSearch] = useState('');

  const debtVisits = useMemo(() => visits.filter((visit) => {
    const hasDebt = visit.paymentStatus === 'Hutang' || visit.paymentMethod === 'Hutang' || (visit.debtTotal || 0) > 0;
    const remainingDebt = Math.max(0, (visit.debtTotal || visit.totalCost || 0) - (visit.debtPaid || 0));
    return !visit.debtArchived && hasDebt && remainingDebt > 0;
  }), [visits]);

  const filteredDebtVisits = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return debtVisits;
    return debtVisits.filter((visit) => {
      const p = getPatientById(visit.patientId);
      if (!p) return false;
      return `${p.ownerName} ${p.animalName} ${p.phoneNumber} ${p.customerNumber} ${p.rfidUid ?? ''} ${visit.poli} ${visit.doctor}`.toLowerCase().includes(keyword);
    });
  }, [debtVisits, getPatientById, search]);

  const selectedVisitId = searchParams.get('visit') || filteredDebtVisits[0]?.id || '';
  const selectedVisit = filteredDebtVisits.find((visit) => visit.id === selectedVisitId) || null;
  const patient = selectedVisit ? getPatientById(selectedVisit.patientId) : undefined;
  const debtTotal = selectedVisit?.debtTotal || selectedVisit?.totalCost || 0;
  const debtPaid = selectedVisit?.debtPaid || 0;
  const remaining = Math.max(0, debtTotal - debtPaid);
  const schedule = selectedVisit ? buildDebtSchedule(selectedVisit) : [];
  const dueNow = selectedVisit ? calculateDueNow(selectedVisit) : 0;
  const nextDue = selectedVisit ? getNextUnpaidSchedule(selectedVisit) : undefined;

  useEffect(() => {
    if (!searchParams.get('visit') && filteredDebtVisits[0]) setSearchParams({ visit: filteredDebtVisits[0].id });
  }, [filteredDebtVisits, searchParams, setSearchParams]);

  const addInstallment = () => {
    if (!selectedVisit) return;
    const received = parseThousand(installmentInput);
    if (!received) {
      window.alert('Nominal pembayaran cicilan belum diisi.');
      return;
    }
    const appliedAmount = Math.min(remaining, received);
    const changeAmount = installmentMethod === 'Cash' ? Math.max(0, received - remaining) : 0;
    const nextPaid = Math.min(debtTotal, debtPaid + appliedAmount);
    const installment: InstallmentPayment = {
      id: crypto.randomUUID(),
      amount: appliedAmount,
      receivedAmount: received,
      appliedAmount,
      changeAmount,
      method: installmentMethod,
      bank: installmentMethod === 'Transfer' ? transferBank : undefined,
      createdAt: new Date().toISOString(),
    };
    updateVisit(selectedVisit.id, {
      debtPaid: nextPaid,
      paymentDate: installment.createdAt,
      cashReceived: installmentMethod === 'Cash' ? received : appliedAmount,
      changeAmount,
      installmentPayments: [...(selectedVisit.installmentPayments || []), installment],
    });
    addFinanceEntry({
      type: 'pemasukan',
      category: 'Layanan Klinik',
      title: `Cicilan hutang ${patient?.animalName || ''}`,
      amount: appliedAmount,
      note: `${installmentMethod}${installmentMethod === 'Transfer' ? ` • ${transferBank}` : ''} • Pembayaran cicilan / hutang`,
    });
    setInstallmentInput('');
    window.alert(changeAmount > 0 ? `Pembayaran cicilan berhasil ditambahkan. Kembalian pelanggan ${rupiah(changeAmount)}.` : 'Pembayaran cicilan berhasil ditambahkan. Jika sisa sudah 0, tekan tombol Lunas untuk mengubah status pembayaran.');
  };

  const markPaid = () => {
    if (!selectedVisit) return;
    const lastInstallment = [...(selectedVisit.installmentPayments || [])].slice(-1)[0];
    updateVisit(selectedVisit.id, {
      paymentStatus: 'Lunas',
      paymentMethod: lastInstallment?.method || installmentMethod,
      paymentBank: (lastInstallment?.method || installmentMethod) === 'Transfer' ? (lastInstallment?.bank || transferBank) : undefined,
      debtPaid: debtTotal,
      paymentDate: new Date().toISOString(),
      cashReceived: lastInstallment?.receivedAmount || selectedVisit.cashReceived || debtTotal,
      changeAmount: lastInstallment?.changeAmount || selectedVisit.changeAmount || 0,
    });
    window.alert('Hutang telah dilunasi. Status pembayaran diperbarui menjadi Lunas.');
    navigate(`/payments?visit=${selectedVisit.id}`);
  };

  const sendWaReminder = () => {
    if (!selectedVisit || !patient) return;
    const phone = normalizePhoneForWa(patient.phoneNumber || patient.secondaryPhone);
    if (!phone) {
      window.alert('Nomor WhatsApp pemilik belum tersedia.');
      return;
    }
    updateVisit(selectedVisit.id, { debtReminderLastSent: new Date().toISOString() });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWaMessage(selectedVisit, patient))}`, '_blank');
  };

  const archiveDebt = () => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, { debtArchived: true });
    window.alert('Data hutang yang sudah lunas dihapus dari daftar hutang.');
    navigate('/payments');
  };

  return (
    <Layout title="Hutang / Cicilan" subtitle="Kelola pembayaran bertahap, jatuh tempo bulanan, dan pengingat WhatsApp.">
      <section className="staff-section-card">
        <div className="section-head spread-head"><div><h2 className="section-title">Daftar Hutang Aktif</h2><p className="mini">Klik data hutang untuk melihat jadwal cicilan dan kirim pengingat WA.</p></div><input className="staff-search-input compact" placeholder="Cari pemilik / hewan / no HP" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="payment-layout">
          <div className="payment-list cardless-list">
            {filteredDebtVisits.length ? filteredDebtVisits.map((visit) => {
              const p = getPatientById(visit.patientId);
              if (!p) return null;
              const active = selectedVisitId === visit.id;
              const left = Math.max(0, (visit.debtTotal || visit.totalCost || 0) - (visit.debtPaid || 0));
              const currentDue = calculateDueNow(visit);
              return <button key={visit.id} type="button" className={`payment-list-item ${active ? 'active' : ''}`} onClick={() => setSearchParams({ visit: visit.id })}><div><strong>{p.animalName}</strong><span>{p.ownerName}</span><span>{visit.poli} • {visit.doctor}</span><span>Cicilan: {visit.debtInstallmentMonths || 1} bulan{visit.debtDueDay ? ` • Jatuh tempo tgl ${visit.debtDueDay}` : ''}</span></div><div className="payment-side"><span className="queue-tag warn">Hutang</span><strong>{rupiah(left)}</strong>{currentDue > 0 ? <span className="mini">Jatuh tempo: {rupiah(currentDue)}</span> : <span className="mini">Belum jatuh tempo</span>}</div></button>;
            }) : <div className="payment-note-box"><strong>Tidak ada hutang aktif</strong><span>Semua data hutang sudah lunas atau belum ada pembayaran dengan metode hutang.</span></div>}
          </div>

          <div className="staff-section-card payment-receipt-card">
            {!selectedVisit || !patient ? <p className="mini">Tidak ada data hutang aktif.</p> : <>
              <div className="receipt-header"><div><p className="staff-kicker">Pembayaran Bertahap</p><h2 className="section-title">Hutang Pasien</h2></div><div className="receipt-status">Sisa {rupiah(remaining)}</div></div>
              <div className="receipt-meta-grid"><div><strong>Nama Hewan</strong><span>{patient.animalName}</span></div><div><strong>Nama Pemilik</strong><span>{patient.ownerName}</span></div><div><strong>No. HP</strong><span>{patient.phoneNumber || '-'}</span></div><div><strong>Dokter</strong><span>{selectedVisit.doctor}</span></div><div><strong>Layanan / Poli</strong><span>{selectedVisit.poli}</span></div><div><strong>Jatuh Tempo Bulanan</strong><span>Tanggal {selectedVisit.debtDueDay || '-'}</span></div><div><strong>Tenor Cicilan</strong><span>{selectedVisit.debtInstallmentMonths || 1} bulan</span></div><div><strong>Cicilan / Bulan</strong><span>{rupiah(selectedVisit.debtMonthlyAmount || Math.ceil(debtTotal / Math.max(1, selectedVisit.debtInstallmentMonths || 1)))}</span></div><div><strong>Total Hutang</strong><span>{rupiah(debtTotal)}</span></div><div><strong>Sudah Dibayar</strong><span>{rupiah(debtPaid)}</span></div></div>
              <div className="receipt-total-box"><div className="receipt-line"><span>Total Hutang</span><strong>{rupiah(debtTotal)}</strong></div><div className="receipt-line"><span>Sudah Dibayar</span><strong>{rupiah(debtPaid)}</strong></div><div className="receipt-line"><span>Tagihan Jatuh Tempo Saat Ini</span><strong>{rupiah(dueNow)}</strong></div><div className="receipt-line grand"><span>Sisa Hutang</span><strong>{rupiah(remaining)}</strong></div></div>
              {dueNow > 0 ? <div className="payment-note-box debt-warning"><strong>Tagihan Jatuh Tempo</strong><span>Tagihan bulan berjalan dan tunggakan sebelumnya otomatis digabung sebesar {rupiah(dueNow)}.</span></div> : nextDue ? <div className="payment-note-box"><strong>Jadwal Berikutnya</strong><span>Cicilan berikutnya bulan ke-{nextDue.monthNumber} sebesar {rupiah(nextDue.unpaidAmount)} jatuh tempo pada {nextDue.dueDate.toLocaleDateString('id-ID')}.</span></div> : null}
              {selectedVisit.debtReminderLastSent ? <div className="payment-note-box"><strong>Pengingat Terakhir</strong><span>{new Date(selectedVisit.debtReminderLastSent).toLocaleString('id-ID')}</span></div> : null}

              <div className="debt-plan-box"><strong>Jadwal Cicilan</strong><div className="debt-schedule-list">{schedule.map((item) => <div key={item.monthNumber} className={`debt-schedule-item ${item.status}`}><div className="debt-schedule-head"><span className="debt-schedule-title">Cicilan Bulan ke-{item.monthNumber}</span><span className="debt-schedule-status">{item.statusLabel}</span></div><div className="receipt-line"><span>Jatuh Tempo</span><strong>{item.dueDate.toLocaleDateString('id-ID')}</strong></div><div className="receipt-line"><span>Nominal</span><strong>{rupiah(item.amount)}</strong></div><div className="receipt-line"><span>Sudah Dibayar</span><strong>{rupiah(item.paidAmount)}</strong></div><div className="receipt-line"><span>Sisa</span><strong>{rupiah(item.unpaidAmount)}</strong></div></div>)}</div></div>

              <div className="internal-form-grid compact-gap minor-top"><label><span>Metode Pembayaran Cicilan</span><select value={installmentMethod} onChange={(e) => setInstallmentMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="Debit">Debit</option><option value="Transfer">Transfer</option><option value="QRIS">QRIS</option></select></label>{installmentMethod === 'Transfer' ? <label><span>Bank Transfer</span><select value={transferBank} onChange={(e) => setTransferBank(e.target.value)}><option value="BCA">BCA</option><option value="BSI">BSI</option><option value="Mandiri">Mandiri</option></select></label> : <label><span>Info Pembayaran</span><input readOnly value={installmentMethod === 'Debit' ? 'Mesin EDC Klinik' : installmentMethod === 'QRIS' ? 'QRIS Klinik' : 'Kas Klinik'} /></label>}<label className="span-2"><span>Nominal Pembayaran</span><div className="medicine-line" style={{ gridTemplateColumns: '1fr auto' }}><input inputMode="numeric" placeholder={`Contoh: ${dueNow > 0 ? dueNow.toLocaleString('id-ID') : '150.000'}`} value={installmentInput} onChange={(e) => setInstallmentInput(formatThousand(e.target.value))} /><button type="button" className="staff-primary-button" onClick={addInstallment}>Tambah Pembayaran</button></div></label></div>
              {selectedVisit.installmentPayments?.length ? <div className="table-wrap minor-top"><table className="staff-table"><thead><tr><th>Tanggal</th><th>Metode</th><th>Nominal Dibayar</th><th>Diterapkan</th><th>Kembalian</th></tr></thead><tbody>{selectedVisit.installmentPayments.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td><td>{installmentLabel(item)}</td><td>{rupiah(item.receivedAmount || item.amount)}</td><td>{rupiah(item.appliedAmount || item.amount)}</td><td>{rupiah(item.changeAmount || 0)}</td></tr>)}</tbody></table></div> : null}
              <div className="internal-actions spread-line"><Link className="staff-outline-link" to="/payments">Kembali ke Pembayaran</Link><div className="button-row"><button className="staff-outline-button" type="button" onClick={sendWaReminder}>Kirim Pengingat WA</button>{remaining <= 0 && selectedVisit.paymentStatus !== 'Lunas' ? <button className="staff-accent-button" type="button" onClick={markPaid}>Lunas</button> : null}{remaining <= 0 && selectedVisit.paymentStatus === 'Lunas' ? <button className="staff-danger-button" type="button" onClick={archiveDebt}>Hapus</button> : null}</div></div>
            </>}
          </div>
        </div>
      </section>
    </Layout>
  );
};
