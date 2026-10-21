import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useClinic } from '../context/ClinicContext';
import type { VisitRecord } from '../types';

const monthKey = (date: string) => date.slice(0, 7);
const monthLabel = (month: string) => new Date(`${month}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const angkaKeTerbilang = (value: number): string => {
  const angka = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const n = Math.floor(Math.abs(value));
  if (n < 12) return angka[n];
  if (n < 20) return `${angkaKeTerbilang(n - 10)} belas`;
  if (n < 100) return `${angkaKeTerbilang(Math.floor(n / 10))} puluh${n % 10 ? ` ${angkaKeTerbilang(n % 10)}` : ''}`;
  if (n < 200) return `seratus${n - 100 ? ` ${angkaKeTerbilang(n - 100)}` : ''}`;
  if (n < 1000) return `${angkaKeTerbilang(Math.floor(n / 100))} ratus${n % 100 ? ` ${angkaKeTerbilang(n % 100)}` : ''}`;
  if (n < 2000) return `seribu${n - 1000 ? ` ${angkaKeTerbilang(n - 1000)}` : ''}`;
  if (n < 1000000) return `${angkaKeTerbilang(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${angkaKeTerbilang(n % 1000)}` : ''}`;
  if (n < 1000000000) return `${angkaKeTerbilang(Math.floor(n / 1000000))} juta${n % 1000000 ? ` ${angkaKeTerbilang(n % 1000000)}` : ''}`;
  if (n < 1000000000000) return `${angkaKeTerbilang(Math.floor(n / 1000000000))} miliar${n % 1000000000 ? ` ${angkaKeTerbilang(n % 1000000000)}` : ''}`;
  return `${angkaKeTerbilang(Math.floor(n / 1000000000000))} triliun${n % 1000000000000 ? ` ${angkaKeTerbilang(n % 1000000000000)}` : ''}`;
};
const rupiahTerbilang = (value: number) => `${angkaKeTerbilang(value || 0)} rupiah`;
const formatThousand = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};
const parseThousand = (value: string) => Number(value.replace(/\D/g, '') || 0);
const installmentLabel = (item: any) => `${item.method}${item.method === 'Transfer' && item.bank ? ` • ${item.bank}` : ''}`;
const shouldShowRemaining = (visit: VisitRecord, isDebt: boolean) => Boolean(
  isDebt
  || visit.isHospitalized
  || visit.depositAmount
  || visit.depositMethod
  || visit.hospitalizationType
  || /rawat\s*inap/i.test(visit.poli || '')
);

const computeVisitFinancials = (visit: VisitRecord, medicineTotal: number, discountFallback = 0) => {
  const extraCharges = visit.additionalCharges || [];
  const totalCharge = visit.totalCost ?? Math.max(0, extraCharges.reduce((sum, item) => sum + item.price, 0) + medicineTotal - (visit.discountAmount || discountFallback || 0));
  const rawDeposit = visit.depositAmount || 0;
  const rawPaid = visit.paidAmount || 0;
  const paidTotal = visit.paymentStatus === 'Lunas'
    ? Math.max(totalCharge, rawPaid, rawDeposit)
    : Math.min(totalCharge, Math.max(rawPaid, rawDeposit));
  const downPayment = Math.min(totalCharge, rawDeposit);
  const baseDue = Math.max(0, totalCharge - paidTotal);
  const installments = visit.installmentPayments || [];
  const isDebt = (visit.debtTotal || 0) > 0 || visit.paymentMethod === 'Hutang' || installments.length > 0;
  const debtTotal = visit.debtTotal || (isDebt ? baseDue : 0);
  const debtPaid = visit.debtPaid || 0;
  const remainingDebt = Math.max(0, debtTotal - debtPaid);
  const remainingPayment = isDebt ? remainingDebt : visit.paymentStatus === 'Lunas' ? 0 : baseDue;
  const lastInstallment = installments[installments.length - 1];
  const lastCashChange = visit.changeAmount || lastInstallment?.changeAmount || 0;
  const lastCashReceived = visit.cashReceived || lastInstallment?.receivedAmount || 0;
  const paidDisplay = isDebt ? debtPaid : paidTotal;
  return { extraCharges, totalCharge, downPayment, paidTotal, baseDue, installments, isDebt, debtTotal, debtPaid, remainingDebt, remainingPayment, lastInstallment, lastCashChange, lastCashReceived, paidDisplay };
};

const buildReceipt = (visit: VisitRecord, patient: any, medicineTotal: number, discount: number) => {
  const { extraCharges, totalCharge, downPayment, installments, isDebt, debtTotal, debtPaid, remainingDebt, remainingPayment, lastCashChange, lastCashReceived } = computeVisitFinancials(visit, medicineTotal, discount);
  const showRemaining = shouldShowRemaining(visit, isDebt);
    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(visit.id).slice(0, 6).toUpperCase()}`;
  const chargeRows = [
    ...extraCharges.map((item) => ({
      name: item.days ? `${item.name} (${item.days} hari)` : item.name,
      qty: item.days || 1,
      price: item.unitPrice || item.price,
      subtotal: item.price,
    })),
    ...visit.medicineItems.map((item) => ({ name: item.name || item.customName || '-', qty: item.quantity, price: item.price, subtotal: item.price * item.quantity })),
  ];
  const paymentLabel = visit.paymentMethod === 'Transfer' && visit.paymentBank ? `TRANSFER ${visit.paymentBank}` : (visit.paymentMethod || '-').toUpperCase();
  const paymentInfo = visit.paymentMethod === 'Cash'
    ? `<tr><td colspan='4'>Uang Diterima</td><td colspan='2'>${rupiah(lastCashReceived)}</td></tr><tr><td colspan='4'>Kembalian</td><td colspan='2'>${rupiah(lastCashChange)}</td></tr>`
    : visit.paymentMethod && visit.paymentStatus === 'Lunas' && !isDebt
      ? `<tr><td colspan='4'>Uang Diterima</td><td colspan='2'>${rupiah(visit.cashReceived || Math.max(0, totalCharge - downPayment))}</td></tr>`
      : '';
  return `
<html><head><title>Invoice Hug Me By Vet</title><style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#eef2f7;padding:22px;color:#111827}.invoice{max-width:1040px;min-height:720px;margin:0 auto;background:#fff;border:1px solid #26364d;padding:26px 30px}.top{display:grid;grid-template-columns:1.1fr .8fr 1.1fr;gap:20px;align-items:start}.clinic h3{margin:0 0 6px;font-size:18px}.clinic p,.to p,.meta p{margin:2px 0;line-height:1.45}.title{text-align:center;font-size:42px;letter-spacing:10px;font-weight:800;margin-top:10px}.to h4{margin:0 0 6px}.meta{display:grid;grid-template-columns:1fr 1.2fr;gap:2px 12px;margin:24px 0 10px;max-width:460px}.meta strong{font-weight:700}.service{position:absolute;right:38px;top:154px;min-width:330px}.service-row{display:grid;grid-template-columns:130px 1fr;gap:10px;margin:4px 0}.main-table{width:100%;border-collapse:collapse;margin-top:18px;border:2px solid #2b3343}.main-table th,.main-table td{border:1px solid #2b3343;padding:9px 10px;vertical-align:top}.main-table th{background:#f7f7f8;text-align:center}.no{width:48px;text-align:center}.qty{width:75px;text-align:center}.money{text-align:right;white-space:nowrap}.desc{min-height:260px}.total-row td{font-weight:800}.summary-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:14px}.note{font-size:13px;line-height:1.6}.note h4{margin:0 0 6px}.terbilang{border-top:1px solid #2b3343;border-bottom:1px solid #2b3343;padding:8px 0;margin-top:8px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:42px;text-align:center}.sign-line{height:55px;border-bottom:1px solid #1f2937;margin-bottom:8px}.payment-extra{margin-top:8px;border:1px solid #2b3343}.payment-extra td{border:1px solid #2b3343;padding:8px}.small-muted{font-size:12px;color:#4b5563}@media print{body{background:#fff;padding:0}.invoice{border:1px solid #000;box-shadow:none;max-width:none}.title{font-size:38px}.service{right:30px;top:132px}}
</style></head><body><div class='invoice'>
  <div class='top'>
    <div class='clinic'><h3>HUG ME BY VET</h3><p>Ruko Pasadena Blok R2 No.8, Mutiara Gading Timur</p><p>Telp. 082299222025</p></div>
    <div class='title'>INVOICE</div>
    <div class='to'><h4>Kepada:</h4><p><strong>${patient.ownerName}</strong></p><p>${patient.address || patient.city || '-'}</p><p>Telp. ${patient.phoneNumber || '-'}</p></div>
  </div>
  <div class='meta'><strong>Tanggal</strong><span>: ${new Date(visit.paymentDate || visit.visitDate).toLocaleDateString('id-ID')}</span><strong>No. Faktur</strong><span>: ${invoiceNo}</span><strong>Kasir</strong><span>: Front Office</span></div>
  <div class='service'><div class='service-row'><strong>Poli</strong><span>: ${visit.poli}</span></div><div class='service-row'><strong>Dokter</strong><span>: ${visit.doctor}</span></div><div class='service-row'><strong>Pembayaran</strong><span>: ${paymentLabel}</span></div><div class='service-row'><strong>ID/RFID</strong><span>: ${patient.customerNumber} / ${patient.rfidUid ?? '-'}</span></div></div>
  <table class='main-table'><thead><tr><th class='no'>No.</th><th>Keterangan</th><th class='qty'>Qty</th><th>Harga</th><th>Diskon</th><th>Total</th></tr></thead><tbody>
    ${chargeRows.length ? chargeRows.map((item, index) => `<tr><td class='no'>${index + 1}</td><td>${item.name}</td><td class='qty'>${item.qty}</td><td class='money'>${rupiah(item.price)}</td><td class='qty'>0%</td><td class='money'>${rupiah(item.subtotal)}</td></tr>`).join('') : `<tr><td class='no'>1</td><td class='desc'>Tidak ada item tagihan.</td><td></td><td></td><td></td><td></td></tr>`}
    <tr><td colspan='4' class='money'>Subtotal</td><td colspan='2' class='money'>${rupiah(totalCharge + (visit.discountAmount || discount || 0))}</td></tr>
    <tr><td colspan='4' class='money'>Diskon ${visit.discountPercent ? `(${visit.discountPercent}%)` : ''}</td><td colspan='2' class='money'>${rupiah(visit.discountAmount || discount || 0)}</td></tr>
    <tr class='total-row'><td colspan='4' class='money'>TOTAL</td><td colspan='2' class='money'>${rupiah(totalCharge)}</td></tr>
    ${showRemaining && downPayment > 0 ? `<tr><td colspan='4' class='money'>Down Payment</td><td colspan='2' class='money'>${rupiah(downPayment)}</td></tr>` : ''}
    ${showRemaining ? `<tr><td colspan='4' class='money'>Sisa Pembayaran</td><td colspan='2' class='money'>${rupiah(remainingPayment)}</td></tr>` : ''}
    ${isDebt ? `<tr><td colspan='4' class='money'>Hutang</td><td colspan='2' class='money'>${rupiah(debtTotal)}</td></tr><tr><td colspan='4' class='money'>Sudah Dibayar</td><td colspan='2' class='money'>${rupiah(debtPaid)}</td></tr><tr><td colspan='4' class='money'>Status Hutang</td><td colspan='2' class='money'>${remainingDebt <= 0 ? 'Lunas' : 'Belum Lunas'}</td></tr>` : paymentInfo}
  </tbody></table>
  ${isDebt ? `<table class='payment-extra'><tbody><tr><td colspan='3'><strong>Riwayat Cicilan / Hutang</strong></td></tr>${installments.length ? installments.map((item:any)=>`<tr><td>${new Date(item.createdAt).toLocaleDateString('id-ID')}</td><td>${installmentLabel(item)}</td><td class='money'>${rupiah(item.amount)}</td></tr>`).join('') : `<tr><td colspan='3'>Belum ada cicilan tercatat.</td></tr>`}</tbody></table>` : ''}
  <div class='summary-grid'><div><div class='terbilang'><strong>Terbilang:</strong> ${rupiahTerbilang(totalCharge)}</div><div class='note'><h4>Note</h4><p>Obat/tindakan yang telah diberikan tidak dapat ditukar/dikembalikan.</p><p>Terima kasih atas kunjungannya, semoga lekas sembuh.</p></div></div><div class='signature'><div><div class='sign-line'></div><span>Penerima</span></div><div><div class='sign-line'></div><span>HUG ME BY VET<br/><strong>Administrator</strong></span></div></div></div>
</div></body></html>`;
};

export const PaymentPage = () => {
  const { visits, getCompletedVisits, getPatientById, updateVisit, addFinanceEntry } = useClinic();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('all');
  const [method, setMethod] = useState<'Cash' | 'Debit' | 'Transfer' | 'QRIS' | 'Hutang'>('Cash');
  const [cashInput, setCashInput] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [transferBank, setTransferBank] = useState('BCA');
  const [installmentMonths, setInstallmentMonths] = useState(2);
  const [dueDay, setDueDay] = useState(new Date().getDate());

  const completedVisits = getCompletedVisits();
  const monthOptions = Array.from(new Set(completedVisits.map((visit) => monthKey(visit.visitDate)))).sort().reverse();
  const selectedVisitId = searchParams.get('visit') || '';
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId) || null;
  const selectedPatient = selectedVisit ? getPatientById(selectedVisit.patientId) : undefined;

  const filtered = useMemo(() => completedVisits.filter((visit) => {
    const patient = getPatientById(visit.patientId);
    if (!patient) return false;
    const hay = `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase();
    return (month === 'all' || monthKey(visit.visitDate) === month) && hay.includes(search.toLowerCase());
  }), [completedVisits, getPatientById, month, search]);

  useEffect(() => {
    if (!selectedVisit && filtered[0]) setSearchParams({ visit: filtered[0].id });
  }, [filtered, selectedVisit, setSearchParams]);

  useEffect(() => {
    if (selectedVisit?.paymentMethod) setMethod(selectedVisit.paymentMethod);

    let nextPaymentInput = '';
    if (selectedVisit && selectedVisit.paymentStatus !== 'Lunas') {
      const visitMedicineTotal = selectedVisit.medicineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const visitExtraTotal = (selectedVisit.additionalCharges || []).reduce((sum, item) => sum + item.price, 0);
      const visitSubtotal = visitMedicineTotal + visitExtraTotal;
      const visitDiscount = selectedVisit.discountAmount || Math.round(visitSubtotal * (selectedVisit.discountPercent || 0) / 100);
      const visitTotal = selectedVisit.totalCost ?? Math.max(0, visitSubtotal - visitDiscount);
      const alreadyPaid = Math.min(visitTotal, Math.max(selectedVisit.paidAmount || 0, selectedVisit.depositAmount || 0));
      const suggestedAmount = alreadyPaid > 0
        ? Math.max(0, visitTotal - alreadyPaid)
        : (selectedVisit.depositPlannedAmount || selectedVisit.cashReceived || selectedVisit.depositAmount || 0);
      nextPaymentInput = suggestedAmount > 0 ? formatThousand(String(suggestedAmount))  : '';
    }

    setCashInput(nextPaymentInput);
    setDiscountInput(String(selectedVisit?.discountPercent || 0));
    setTransferBank(selectedVisit?.paymentBank || 'BCA');
    setInstallmentMonths(selectedVisit?.debtInstallmentMonths || 2);
    setDueDay(selectedVisit?.debtDueDay || new Date().getDate());
  }, [selectedVisit?.id, selectedVisit?.paymentMethod, selectedVisit?.cashReceived, selectedVisit?.paidAmount, selectedVisit?.depositAmount, selectedVisit?.depositPlannedAmount, selectedVisit?.discountPercent, selectedVisit?.paymentBank, selectedVisit?.debtInstallmentMonths, selectedVisit?.debtDueDay]);

  const medicineTotal = selectedVisit ? selectedVisit.medicineItems.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  const extraCharges = selectedVisit?.additionalCharges || [];
  const extraChargeTotal = extraCharges.reduce((sum, item) => sum + item.price, 0);
  const subTotal = medicineTotal + extraChargeTotal;
  const discountPercent = Math.max(0, Math.min(100, Number(discountInput.replace(/\D/g, '') || 0)));
  const discount = Math.round(subTotal * discountPercent / 100);
  const total = Math.max(0, subTotal - discount);
  const currentVisit = selectedVisit ? { ...selectedVisit, totalCost: total, discountAmount: discount, discountPercent } : null;
  const paidSoFar = Math.min(total, Math.max(currentVisit?.paidAmount || 0, currentVisit?.depositAmount || 0));
  const downPayment = currentVisit?.depositAmount || 0;
  const plannedDp = currentVisit?.depositPlannedAmount || 0;
  const financials = currentVisit ? computeVisitFinancials(currentVisit, medicineTotal, discount) : null;
  const showRemaining = currentVisit ? shouldShowRemaining(currentVisit, !!financials?.isDebt) : false;
  const amountDue = financials?.remainingPayment || 0;
  const cashReceived = parseThousand(cashInput);
  const editablePaymentAmount = method === 'Cash' || plannedDp > 0 || downPayment > 0 || paidSoFar > 0;
  const paymentAmount = editablePaymentAmount ? cashReceived : amountDue;
  const change = Math.max(0, paymentAmount - amountDue);
  const isSettled = !!currentVisit && currentVisit.paymentStatus === 'Lunas' && !(financials?.isDebt && (financials?.remainingDebt || 0) > 0);
  const settledMethod = currentVisit?.paymentMethod || method;
  const settledCashReceived = currentVisit?.cashReceived || 0;
  const settledChange = currentVisit?.changeAmount || 0;
  const settledPaidAmount = financials?.isDebt ? (financials?.debtPaid || 0) : (currentVisit?.paidAmount || currentVisit?.cashReceived || Math.max(0, total - downPayment));
  const settledMethodLabel = settledMethod === 'Transfer' ? `${settledMethod}${currentVisit?.paymentBank ? ` • ${currentVisit.paymentBank}` : ''}` : settledMethod;

  const processPayment = () => {
    if (!selectedVisit) return;

    const alreadyPaid = Math.min(total, Math.max(selectedVisit.paidAmount || 0, selectedVisit.depositAmount || 0));
    const existingDpPaid = selectedVisit.depositAmount || 0;
    const plannedDeposit = selectedVisit.depositPlannedAmount || 0;
    const remainingBeforePayment = Math.max(0, total - alreadyPaid);
    const requestedPayment = paymentAmount;
    const now = new Date().toISOString();

    if (method !== 'Hutang' && (!requestedPayment || requestedPayment <= 0)) {
      window.alert('Nominal pembayaran belum diisi.');
      return;
    }

    const isFirstDownPayment = plannedDeposit > 0 && existingDpPaid <= 0 && alreadyPaid <= 0 && requestedPayment < total;

    if (method !== 'Hutang' && !isFirstDownPayment && requestedPayment < remainingBeforePayment) {
      window.alert(`Nominal pembayaran belum mencukupi sisa pembayaran. Sisa yang harus dibayar adalah ${rupiah(remainingBeforePayment)}.`);
      return;
    }

    const appliedPayment = Math.min(remainingBeforePayment, Math.max(0, requestedPayment));
    const nextPaidTotal = Math.min(total, alreadyPaid + appliedPayment);
    const nextRemaining = Math.max(0, total - nextPaidTotal);
    const nextDepositAmount = existingDpPaid || (isFirstDownPayment ? appliedPayment : 0);

    if (method === 'Hutang') {
      const months = Math.max(1, Number(installmentMonths || 1));
      const safeDueDay = Math.max(1, Math.min(28, Number(dueDay || new Date().getDate())));
      const debtValue = Math.max(0, remainingBeforePayment);

      updateVisit(selectedVisit.id, {
        paymentStatus: debtValue > 0 ? 'Hutang' : 'Lunas',
        paymentMethod: debtValue > 0 ? 'Hutang' : method,
        paymentDate: now,
        totalCost: total,
        discountAmount: discount,
        discountPercent,
        debtTotal: debtValue,
        debtPaid: 0,
        debtInstallmentMonths: months,
        debtMonthlyAmount: debtValue > 0 ? Math.ceil(debtValue / months) : 0,
        debtDueDay: safeDueDay,
        debtStartDate: now,
        cashReceived: 0,
        paidAmount: alreadyPaid,
        depositAmount: existingDpPaid,
        changeAmount: 0,
      });

      if (debtValue > 0) navigate(`/debts?visit=${selectedVisit.id}`);
      else window.alert('Pembayaran berhasil disimpan. Status pembayaran berubah menjadi Lunas.');
      return;
    }

    const paymentDate = now;
    const changeAmount = method === 'Cash' ? Math.max(0, requestedPayment - remainingBeforePayment) : 0;

    updateVisit(selectedVisit.id, {
      paymentStatus: nextRemaining <= 0 ? 'Lunas' : 'Menunggu Pembayaran',
      paymentMethod: method,
      paymentBank: method === 'Transfer' ? transferBank : undefined,
      paymentDate,
      cashReceived: requestedPayment,
      paidAmount: nextPaidTotal,
      depositAmount: nextDepositAmount,
      depositMethod: nextDepositAmount > 0 && isFirstDownPayment ? method : selectedVisit.depositMethod,
      depositBank: nextDepositAmount > 0 && isFirstDownPayment && method === 'Transfer' ? transferBank : selectedVisit.depositBank,
      changeAmount,
      totalCost: total,
      discountAmount: discount,
      discountPercent,
    });

    addFinanceEntry({
      type: 'pemasukan',
      category: 'Layanan Klinik',
      title: `${isFirstDownPayment ? 'DP Rawat Inap' : nextRemaining <= 0 && alreadyPaid > 0 ? 'Pelunasan' : 'Pembayaran'} ${selectedPatient?.animalName || selectedVisit.poli}`,
      amount: appliedPayment,
      note: `${method}${method === 'Transfer' ? ` • ${transferBank}` : ''}${isFirstDownPayment ? ' • DP Rawat Inap' : nextRemaining <= 0 && alreadyPaid > 0 ? ' • Pelunasan sisa pembayaran' : ''}`,
    });

    if (nextRemaining <= 0) {
      window.alert(alreadyPaid > 0 ? 'Sisa pembayaran berhasil dilunasi. Status pembayaran berubah menjadi Lunas.' : 'Pembayaran berhasil disimpan. Status pembayaran berubah menjadi Lunas.');
    } else {
      window.alert('Down payment berhasil disimpan. Sisa pembayaran akan dilunasi setelah rawat inap selesai.');
    }
  };
  const printReceipt = () => {
    if (!selectedVisit || !selectedPatient) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const forPrint = { ...selectedVisit, totalCost: total, discountAmount: discount, discountPercent, paymentMethod: selectedVisit.paymentStatus === 'Lunas' ? (selectedVisit.paymentMethod || method) : method, paymentBank: selectedVisit.paymentStatus === 'Lunas' ? (selectedVisit.paymentBank || transferBank) : transferBank, cashReceived: selectedVisit.paymentStatus === 'Lunas' ? (selectedVisit.cashReceived || 0) : (method === 'Cash' ? cashReceived : amountDue), changeAmount: selectedVisit.paymentStatus === 'Lunas' ? (selectedVisit.changeAmount || 0) : (method === 'Cash' ? change : 0) };
    win.document.write(buildReceipt(forPrint, selectedPatient, medicineTotal, discount));
    win.document.close();
    win.print();
  };

  const waUrl = selectedVisit && selectedPatient
    ? `https://wa.me/6281234567890?text=${encodeURIComponent(`Halo ${selectedPatient.ownerName}, pembayaran untuk ${selectedPatient.animalName} di Hug Me By Vet sebesar ${rupiah(total)} dengan layanan ${selectedVisit.poli}. Status: ${method === 'Hutang' ? 'Hutang / Cicilan' : 'Lunas'}. Sisa pembayaran: ${rupiah(currentVisit?.paymentStatus === 'Lunas' && method !== 'Hutang' ? 0 : amountDue)}.`)}`
    : '#';

  return (
    <Layout title="Pembayaran" subtitle="Front office dapat memproses pembayaran cash, debit, transfer, QRIS, maupun hutang/cicilan.">
      <section className="staff-section-card">
        <div className="section-head spread-head">
          <div><h2 className="section-title">Daftar Tagihan</h2><p className="mini">Pilih kunjungan yang sudah selesai ditangani dokter untuk dibuatkan pembayaran.</p></div>
          <div className="head-inline-tools">
            <input className="staff-search-input compact" placeholder="Cari hewan / pemilik / RFID" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="staff-select-inline" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">Semua Arsip</option>
              {monthOptions.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}
            </select>
          </div>
        </div>
        <div className="payment-layout">
          <div className="payment-list cardless-list">
            {filtered.map((visit) => {
              const patient = getPatientById(visit.patientId);
              if (!patient) return null;
              const active = selectedVisitId === visit.id;
              return (
                <button key={visit.id} type="button" className={`payment-list-item ${active ? 'active' : ''}`} onClick={() => setSearchParams({ visit: visit.id })}>
                  <div>
                    <strong>{patient.animalName}</strong>
                    <span>{patient.ownerName}</span>
                    <span>{visit.poli} • {visit.doctor}</span>
                  </div>
                  <div className="payment-side">
                    <span className={`queue-tag ${visit.paymentStatus === 'Lunas' ? 'paid' : visit.paymentStatus === 'Hutang' ? 'warn' : ''}`}>{visit.paymentStatus || 'Menunggu Pembayaran'}</span>
                    <strong>{rupiah(Math.max(0, (visit.totalCost ?? Math.max(0, (visit.additionalCharges || []).reduce((sum, item) => sum + item.price, 0) + visit.medicineItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - (visit.discountAmount || 0))) - Math.max(visit.paidAmount || 0, visit.depositAmount || 0)))}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="staff-section-card payment-receipt-card">
            {!selectedVisit || !selectedPatient ? <p className="mini">Pilih tagihan di sebelah kiri.</p> : (
              <>
                <div className="receipt-header">
                  <div>
                    <p className="staff-kicker">Struk Pembayaran</p>
                    <h2 className="section-title">Preview Pembayaran</h2>
                  </div>
                  <div className="receipt-status">{selectedVisit.paymentStatus || 'Menunggu Pembayaran'}</div>
                </div>
                <div className="receipt-meta-grid">
                  <div><strong>Tanggal</strong><span>{new Date(selectedVisit.visitDate).toLocaleDateString('id-ID')}</span></div>
                  <div><strong>ID Pasien / RFID</strong><span>{selectedPatient.customerNumber} / {selectedPatient.rfidUid ?? '-'}</span></div>
                  <div><strong>Nama Hewan</strong><span>{selectedPatient.animalName}</span></div>
                  <div><strong>Nama Pemilik</strong><span>{selectedPatient.ownerName}</span></div>
                  <div><strong>Dokter</strong><span>{selectedVisit.doctor}</span></div>
                  <div><strong>Layanan / Poli</strong><span>{selectedVisit.poli}</span></div>
                </div>

                <div className="receipt-table-wrap">
                  <table className="staff-table receipt-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {extraCharges.map((item, index) => {
                        const qty = item.days || 1;
                        const unitPrice = item.unitPrice || item.price;
                        return <tr key={`extra-${index}`}><td>{item.days ? `${item.name} (${item.days} hari)` : item.name}</td><td>{qty}</td><td>{rupiah(unitPrice)}</td><td>{rupiah(item.price)}</td></tr>;
                      })}
                      {selectedVisit.medicineItems.map((item, index) => (
                        <tr key={`${item.medicineId}-${index}`}><td>{item.name}</td><td>{item.quantity}</td><td>{rupiah(item.price)}</td><td>{rupiah(item.price * item.quantity)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="receipt-total-box">
                  <div className="receipt-line"><span>Tindakan, Layanan, dan Rawat Inap</span><strong>{rupiah(extraChargeTotal)}</strong></div>
                  <div className="receipt-line"><span>Diskon ({discountPercent}%)</span><strong>{rupiah(discount)}</strong></div>
                  <div className="receipt-line"><span>Total Biaya</span><strong>{rupiah(total)}</strong></div>
                  {plannedDp > 0 && downPayment <= 0 ? <div className="receipt-line"><span>Rencana DP Rawat Inap</span><strong>{rupiah(plannedDp)}</strong></div> : null}
                  {downPayment > 0 ? <div className="receipt-line"><span>Down Payment Tercatat</span><strong>{rupiah(downPayment)}</strong></div> : null}
                  <div className="receipt-line grand"><span>Total Keseluruhan</span><strong>{rupiah(total)}</strong></div>
                  {showRemaining ? <div className="receipt-line"><span>Sisa Pembayaran</span><strong>{rupiah(amountDue)}</strong></div> : null}
                  {isSettled && settledMethod === 'Cash' ? <><div className="receipt-line"><span>Uang Diterima</span><strong>{rupiah(settledCashReceived)}</strong></div><div className="receipt-line"><span>Kembalian</span><strong>{rupiah(settledChange)}</strong></div></> : null}
                  {isSettled && settledMethod !== 'Cash' && !financials?.isDebt ? <div className="receipt-line"><span>Uang Diterima</span><strong>{rupiah(settledPaidAmount)}</strong></div> : null}
                </div>
                {plannedDp > 0 && downPayment <= 0 ? <div className="payment-note-box"><strong>Rencana Down Payment Rawat Inap</strong><span>Nominal DP yang direncanakan: {rupiah(plannedDp)}. Metode pembayaran dipilih di halaman ini bersama pembayaran tagihan.</span></div> : null}
                {downPayment > 0 ? <div className="payment-note-box"><strong>Down Payment Rawat Inap</strong><span>Down payment tercatat: {rupiah(downPayment)}{selectedVisit.depositMethod ? ` melalui ${selectedVisit.depositMethod}${selectedVisit.depositMethod === 'Transfer' && selectedVisit.depositBank ? ` • ${selectedVisit.depositBank}` : ''}` : ''}. Sisa pembayaran akhir yang harus dilunasi: {rupiah(amountDue)}.</span></div> : null}
                {financials?.isDebt ? <div className="payment-note-box"><strong>Riwayat Hutang / Cicilan</strong><span>Hutang: {rupiah(financials.debtTotal)} • Sudah dibayar: {rupiah(financials.debtPaid)} • Sisa: {rupiah(financials.remainingDebt)} • Status: {financials.remainingDebt <= 0 ? 'Lunas' : 'Belum Lunas'}.</span>{selectedVisit.installmentPayments?.length ? <div className="table-wrap minor-top"><table className="staff-table"><thead><tr><th>Tanggal</th><th>Metode</th><th>Nominal</th></tr></thead><tbody>{selectedVisit.installmentPayments.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td><td>{installmentLabel(item)}</td><td>{rupiah(item.amount)}</td></tr>)}</tbody></table></div> : null}</div> : null}

                {!isSettled ? (
                  <>
                    <div className="internal-form-grid compact-gap minor-top">
                      <label><span>Metode Pembayaran</span><select value={method} onChange={(e) => setMethod(e.target.value as any)}><option>Cash</option><option>Debit</option><option>Transfer</option><option>QRIS</option><option>Hutang</option></select></label>
                      {editablePaymentAmount
                        ? <label><span>Nominal Dibayar</span><input inputMode="numeric" placeholder="Contoh: 225.000" value={cashInput} onChange={(e) => setCashInput(formatThousand(e.target.value))} /></label>
                        : <label><span>Nominal Dibayar</span><input value={rupiah(amountDue)} readOnly /></label>}
                      <label className="span-2"><span>Status Pembayaran</span><input value={method === 'Hutang' ? 'Hutang / Cicilan' : (selectedVisit.paymentStatus || 'Menunggu Pembayaran')} readOnly /></label>
                    </div>

                    <div className="receipt-line align-center"><span>Diskon</span><div className="button-row"><button className="staff-outline-button small" type="button" onClick={() => setDiscountOpen((v) => !v)}>{discountOpen ? 'Tutup Diskon' : 'Tambah Diskon'}</button>{discountOpen ? <input className="discount-inline-input" inputMode="numeric" placeholder="Contoh: 10" value={discountInput} onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, '').slice(0,3))} /> : null}<span className="mini">%</span></div></div>

                    {method === 'Cash' ? <div className="receipt-change">Kembalian: <strong>{rupiah(change)}</strong></div> : null}
                    {method === 'Transfer' ? <div className="payment-note-box"><strong>Nomor Rekening Klinik</strong><select value={transferBank} onChange={(e) => setTransferBank(e.target.value)}><option value="BCA">Bank BCA • 1234567890</option><option value="BSI">Bank BSI • 1234567890</option><option value="Mandiri">Bank Mandiri • 1234567890</option></select></div> : null}
                    {method === 'Debit' ? <div className="payment-note-box"><strong>Pembayaran Debit</strong><span>Silakan lanjutkan transaksi melalui mesin EDC klinik.</span></div> : null}
                    {method === 'QRIS' ? <div className="payment-qris-box"><strong>QRIS Klinik</strong><div className="payment-qris-placeholder">QRIS<br />Hug Me By Vet</div><span>Pelanggan dapat memindai QRIS klinik untuk menyelesaikan pembayaran.</span></div> : null}
                    {method === 'Hutang' ? <div className="payment-note-box"><strong>Metode Hutang / Cicilan</strong><span>Pilih tenor cicilan dan tanggal jatuh tempo sebelum pindah ke halaman hutang.</span><div className="internal-form-grid compact-gap minor-top"><label><span>Cicilan Berapa Bulan</span><select value={installmentMonths} onChange={(e) => setInstallmentMonths(Number(e.target.value))}><option value={2}>2 bulan</option><option value={3}>3 bulan</option><option value={6}>6 bulan</option><option value={12}>12 bulan</option></select></label><label><span>Tanggal Jatuh Tempo Tiap Bulan</span><input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(Math.max(1, Math.min(28, Number(e.target.value || 1))))} /></label><label className="span-2"><span>Estimasi Cicilan / Bulan</span><input value={rupiah(Math.ceil(Math.max(0, amountDue) / Math.max(1, installmentMonths || 1)))} readOnly /></label></div></div> : null}
                  </>
                ) : (
                  <div className="payment-note-box"><strong>Pembayaran Sudah Final</strong><span>{settledMethod === 'Cash' ? `Pembayaran cash telah diterima sebesar ${rupiah(settledCashReceived)} dengan kembalian ${rupiah(settledChange)}.` : `Bayar (${settledMethodLabel}) telah dikonfirmasi sebesar ${rupiah(settledPaidAmount)}.`}</span></div>
                )}

                <div className="internal-actions spread-line">
                  <button className="staff-outline-link" type="button" onClick={() => navigate('/front-office?tab=completed')}>Kembali ke Data Selesai</button>
                  <div className="button-row">
                    <a className="staff-outline-link" href={waUrl} target="_blank" rel="noreferrer">Bagikan WA</a>
                    {!isSettled ? <button className="staff-primary-button" type="button" onClick={processPayment}>{method === 'Hutang' ? 'Pindah ke Hutang' : 'Simpan Pembayaran'}</button> : null}
                    <button className="staff-accent-button" type="button" onClick={printReceipt}>Print Struk</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};
