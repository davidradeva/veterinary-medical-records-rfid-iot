export type AnimalType = string;
export type Gender = 'Jantan' | 'Betina';
export type SterilizationStatus = 'Intact' | 'Spayed' | 'Neutered';
export type VisitStatus = 'pending' | 'completed';
export type PaymentStatus = 'Menunggu Pembayaran' | 'Lunas' | 'Hutang';
export type InventoryTransactionType = 'masuk' | 'keluar';
export type FinanceCategory = 'Pembelian Obat' | 'Penjualan Obat' | 'Layanan Klinik' | 'Operasional Lain' | 'Down Payment Rawat Inap';

export interface Patient {
  id: string;
  customerNumber: string;
  rfidUid?: string;
  ownerName: string;
  address: string;
  rtRw: string;
  village: string;
  district: string;
  city: string;
  province: string;
  phoneNumber: string;
  secondaryPhone?: string;
  email: string;
  socialMedia: string;
  animalName: string;
  animalType: AnimalType;
  breed: string;
  gender: Gender;
  sterilizationStatus?: SterilizationStatus;
  birthDate: string;
  ageText: string;
  colorMark?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  stock: number;
  unit: string;
  price: number;
  category: string;
}

export interface InstallmentPayment {
  id: string;
  amount: number;
  method: 'Cash' | 'Debit' | 'Transfer' | 'QRIS';
  bank?: string;
  receivedAmount?: number;
  appliedAmount?: number;
  changeAmount?: number;
  createdAt: string;
}


export interface ChargeItem {
  name: string;
  price: number;
  kind?: 'layanan' | 'tindakan' | 'lab' | 'jasa' | 'rawat_inap' | 'estimasi_rawat_inap';
  days?: number;
  quantity?: number;
  unitPrice?: number;
  masterTable?: string;
  masterId?: number | string;
  chargeSource?: 'fo' | 'doctor' | string;
}

export interface MedicineEntry {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  medicineType?: string;
  customName?: string;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  visitDate: string;
  poli: string;
  doctor: string;
  status: VisitStatus;
  complaint?: string;
  weight?: string;
  temperature?: string;
  examResult?: string;
  labResult?: string;
  diagnosis?: string;
  prognosis?: string;
  depositAmount?: number;
  inpatientReadyForCheckout?: boolean;
  selectedActions?: string[];
  selectedLabs?: string[];
  medicalAction?: string;
  notes?: string;
  recommendations?: string;
  customServiceName?: string;
  customServiceFee?: number;
  serviceCharge?: number;
  additionalCharges?: ChargeItem[];
  discountPercent?: number;
  isHospitalized?: boolean;
  hospitalizationType?: string;
  medicineItems: MedicineEntry[];
  totalCost?: number;
  paymentStatus?: PaymentStatus;
  billingStatus?: 'belum_ditagih' | 'menunggu_billing_fo' | 'siap_bayar' | 'sudah_bayar' | string;
  doctorDoneAt?: string;
  foBillingDoneAt?: string;
  inpatientMasterId?: number | string;
  inpatientStartDate?: string;
  inpatientEndDate?: string;
  inpatientDays?: number;
  inpatientDailyPrice?: number;
  inpatientTotalPrice?: number;
  paymentMethod?: 'Cash' | 'Debit' | 'Transfer' | 'QRIS' | 'Hutang';
  depositMethod?: 'Cash' | 'Debit' | 'Transfer' | 'QRIS';
  depositBank?: string;
  paymentDate?: string;
  paymentBank?: string;
  cashReceived?: number;
  changeAmount?: number;
  discountAmount?: number;
  debtTotal?: number;
  debtPaid?: number;
  debtArchived?: boolean;
  debtInstallmentMonths?: number;
  debtMonthlyAmount?: number;
  debtDueDay?: number;
  debtStartDate?: string;
  debtReminderLastSent?: string;
  paidAmount?: number;
  estimateTotal?: number;
  estimatePrintedAt?: string;
  estimateSentToFoAt?: string;
  depositPlannedAmount?: number;
  installmentPayments?: InstallmentPayment[];
}

export interface MasterPriceItem {
  id: string;
  dbId?: number;
  name: string;
  minPrice: number;
  maxPrice?: number;
  note?: string;
  type?: 'tindakan' | 'lab' | 'rawat_inap' | string;
  unit?: string;
}

export interface InpatientRefusalLetter {
  id: string;
  visitId?: string;
  animalId: string;
  ownerId?: string;
  refusalDate: string;
  ownerNameSnapshot: string;
  animalNameSnapshot: string;
  customerNumberSnapshot?: string;
  rfidUidSnapshot?: string;
  doctorName?: string;
  staffName?: string;
  reason?: string;
  diagnosis?: string;
  recommendedTreatment?: string;
  rejectedActions?: string[];
  temporaryDiagnosis?: string;
  animalAgeSnapshot?: string;
  animalTypeGenderSnapshot?: string;
  ownerAge?: string;
  ownerAddress?: string;
  ownerPhone?: string;
  actingAs?: string;
  refusalReason?: string;
  suggestion?: string;
  letterLocation?: string;
  riskExplanation?: string;
  refusalStatement?: string;
  signatureOwnerName?: string;
  witnessName?: string;
  createdAt?: string;
}

export interface InventoryTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  type: InventoryTransactionType;
  quantity: number;
  unitPrice: number;
  total: number;
  note: string;
  createdAt: string;
}

export interface FinanceEntry {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  category: FinanceCategory;
  title: string;
  amount: number;
  note: string;
  createdAt: string;
}
