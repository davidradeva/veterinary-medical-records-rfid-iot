import type { FinanceEntry, InventoryTransaction, Medicine, Patient, VisitRecord, MasterPriceItem, InpatientRefusalLetter } from '../types';

export type ClinicStatePayload = {
  patients: Patient[];
  visits: VisitRecord[];
  medicines: Medicine[];
  inventoryTransactions: InventoryTransaction[];
  financeEntries: FinanceEntry[];
  masterServices?: MasterPriceItem[];
  masterActions?: MasterPriceItem[];
  masterPoli?: MasterPriceItem[];
  masterLabs?: MasterPriceItem[];
  masterInpatients?: MasterPriceItem[];
  refusalLetters?: InpatientRefusalLetter[];
};

const API_BASE = './api';
const jsonHeaders = { 'Content-Type': 'application/json' };

const readJson = async (response: Response) => {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.status === 'error') {
    throw new Error(result.message || 'Request API gagal');
  }
  return result;
};

export const clinicApi = {
  async login(username: string, password: string): Promise<{ role: 'doctor' | 'front-office' | 'apotek' | 'admin'; staffName: string; username: string }> {
    const response = await fetch(`${API_BASE}/login.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ username, password }),
    });
    const result = await readJson(response);
    return result.user;
  },

  async loadState(): Promise<ClinicStatePayload | null> {
    const response = await fetch(`${API_BASE}/bootstrap.php`, { method: 'GET' });
    const result = await readJson(response);
    if (result.status === 'empty') return result.data ? (result.data as ClinicStatePayload) : null;
    return result.data as ClinicStatePayload;
  },

  async saveState(payload: ClinicStatePayload): Promise<void> {
    const response = await fetch(`${API_BASE}/save_state.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    await readJson(response);
  },

  async savePatient(patient: Patient): Promise<void> {
    const response = await fetch(`${API_BASE}/patients.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(patient),
    });
    await readJson(response);
  },

  async deletePatient(patientId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/patients.php?id=${encodeURIComponent(patientId)}`, { method: 'DELETE' });
    await readJson(response);
  },

  async saveVisit(visit: VisitRecord): Promise<void> {
    const response = await fetch(`${API_BASE}/visits.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(visit),
    });
    await readJson(response);
  },

  async deleteVisit(visitId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/visits.php?id=${encodeURIComponent(visitId)}`, { method: 'DELETE' });
    await readJson(response);
  },

  async saveMedicine(medicine: Medicine): Promise<void> {
    const response = await fetch(`${API_BASE}/medicines.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(medicine),
    });
    await readJson(response);
  },

  async deleteMedicine(medicineId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/medicines.php?id=${encodeURIComponent(medicineId)}`, { method: 'DELETE' });
    await readJson(response);
  },

  async saveInventoryTransaction(transaction: InventoryTransaction): Promise<void> {
    const response = await fetch(`${API_BASE}/inventory.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(transaction),
    });
    await readJson(response);
  },

  async saveFinanceEntry(entry: FinanceEntry): Promise<void> {
    const response = await fetch(`${API_BASE}/finance.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(entry),
    });
    await readJson(response);
  },

  async saveMasters(payload: { masterServices: MasterPriceItem[]; masterActions: MasterPriceItem[]; masterPoli: MasterPriceItem[]; masterLabs?: MasterPriceItem[]; masterInpatients?: MasterPriceItem[] }): Promise<void> {
    const response = await fetch(`${API_BASE}/master_data.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    await readJson(response);
  },

  async saveRefusalLetter(letter: InpatientRefusalLetter): Promise<void> {
    const response = await fetch(`${API_BASE}/refusal_letters.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(letter),
    });
    await readJson(response);
  },

  async logRfid(uid: string, status = 'scanned'): Promise<void> {
    await fetch(`${API_BASE}/rfid_log.php`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ uid, status, source: 'ESP32-RC522' }),
    }).catch(() => undefined);
  },
};
