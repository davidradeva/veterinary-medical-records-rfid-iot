import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { useClinic } from '../context/ClinicContext';
import type { Patient } from '../types';

type ScannerStatus = 'idle' | 'connecting' | 'connected' | 'error';

const normalizeUid = (value: string) => {
  const raw = value.replace(/UID\s*Kartu\s*:/i, '').replace(/^UID\s*:/i, '').trim();
  const hex = raw.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  return hex || raw.toUpperCase();
};

const displayUid = (value?: string) => value ? value.replace(/(.{2})/g, '$1 ').trim() : '-';

const getDefaultDoctor = (poli: string) => {
  if (poli === 'Bedah') return 'Dr. A';
  return 'Dr. B';
};

const getDoctorChoices = (poli: string) => {
  if (poli === 'Bedah') return ['Dr. A'];
  return ['Dr. A', 'Dr. B', 'Dr. C'];
};

const poliOptions = ['Poli Kucing', 'Poli Anjing', 'Poli Hewan Lain', 'Umum', 'Bedah', 'Dermatologi', 'Vaksinasi', 'Gigi & Mulut', 'Laboratorium', 'Rawat Inap', 'Reproduksi', 'Konsultasi Nutrisi'];

export const RfidPage = () => {
  const { patients, updatePatient, createVisitForExistingPatient, getPendingVisits, getCompletedVisits } = useClinic();
  const [mode, setMode] = useState<'lookup' | 'register'>('lookup');
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [message, setMessage] = useState('Scanner belum terhubung. Gunakan input manual atau klik Hubungkan Scanner.');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [poli, setPoli] = useState('Poli Kucing');
  const [doctor, setDoctor] = useState('Dr. B');
  const [lastLines, setLastLines] = useState<string[]>([]);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef(false);
  const lastUidRef = useRef<{ uid: string; at: number }>({ uid: '', at: 0 });

  const normalizedUid = useMemo(() => normalizeUid(uid), [uid]);

  const matchedPatient = useMemo(() => {
    const q = normalizedUid.toLowerCase();
    if (!q) return undefined;
    return patients.find((item) =>
      (item.rfidUid ?? '').replace(/[^a-fA-F0-9]/g, '').toLowerCase() === q ||
      (item.rfidUid ?? '').toLowerCase() === uid.trim().toLowerCase() ||
      item.customerNumber.toLowerCase() === uid.trim().toLowerCase() ||
      item.animalName.toLowerCase() === uid.trim().toLowerCase(),
    );
  }, [patients, normalizedUid, uid]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);
  const pendingCount = matchedPatient ? getPendingVisits().filter((visit) => visit.patientId === matchedPatient.id).length : 0;
  const matchedPatientHistory = matchedPatient ? getCompletedVisits().filter((visit) => visit.patientId === matchedPatient.id).sort((a, b) => +new Date(b.visitDate) - +new Date(a.visitDate)) : [];

  const patientOptions = useMemo(() => {
    const q = searchPatient.toLowerCase();
    return patients.filter((patient) => `${patient.ownerName} ${patient.animalName} ${patient.customerNumber} ${patient.rfidUid ?? ''}`.toLowerCase().includes(q));
  }, [patients, searchPatient]);

  const extractUidFromSerialLine = (line: string) => {
    const clean = line.trim();
    // Hanya baris yang memang diawali UID yang diproses.
    // Ini mencegah teks boot ESP32 seperti "entry 0x400805b4" atau error PSRAM terbaca sebagai UID palsu.
    const match = clean.match(/^UID(?:\s*Kartu|\s*terbaca)?\s*:\s*((?:[0-9A-Fa-f]{2}\s*){4,10})$/i);
    return match ? match[1].trim() : '';
  };

  const applyUid = (value: string) => {
    const parsed = normalizeUid(value);
    if (!parsed || parsed.length < 8) return;
    const now = Date.now();
    if (lastUidRef.current.uid === parsed && now - lastUidRef.current.at < 900) return;
    lastUidRef.current = { uid: parsed, at: now };
    setUid(parsed);
    setLastLines((prev) => [`UID terbaca: ${displayUid(parsed)}`, ...prev.filter((line) => line !== `UID terbaca: ${displayUid(parsed)}`)].slice(0, 5));
    setMessage(`UID kartu terbaca: ${displayUid(parsed)}`);
  };

  const readSerial = async (port: any) => {
    const reader = port.readable.getReader();
    const decoder = new TextDecoder();
    readerRef.current = reader;
    keepReadingRef.current = true;
    let buffer = '';
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n/);
        buffer = parts.pop() || '';
        for (const line of parts) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          const parsedLineUid = extractUidFromSerialLine(cleanLine);
          if (parsedLineUid) {
            applyUid(parsedLineUid);
          } else if (/RC522 siap|Tempelkan kartu|Mulai SPI|Init RC522|terdeteksi/i.test(cleanLine)) {
            setLastLines((prev) => [cleanLine, ...prev].slice(0, 5));
          }
        }
      }
    } catch (error) {
      if (keepReadingRef.current) {
        setStatus('error');
        setMessage(`Gagal membaca serial: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    } finally {
      try { reader.releaseLock(); } catch {}
      if (readerRef.current === reader) readerRef.current = null;
    }
  };

  const closeCurrentPort = async () => {
    keepReadingRef.current = false;
    const reader = readerRef.current;
    const port = portRef.current;
    try { await reader?.cancel(); } catch {}
    try { reader?.releaseLock?.(); } catch {}
    readerRef.current = null;
    if (port) {
      try { await port.close(); } catch {}
    }
    portRef.current = null;
    await new Promise((resolve) => setTimeout(resolve, 180));
  };

  const connectScanner = async () => {
    const serial = (navigator as any).serial;
    if (!serial) {
      setStatus('error');
      setMessage('Browser belum mendukung Web Serial. Gunakan Chrome/Edge di localhost, atau pakai input manual UID.');
      return;
    }
    try {
      if (portRef.current || readerRef.current) await closeCurrentPort();
      setStatus('connecting');
      setUid('');
      setLastLines([]);
      lastUidRef.current = { uid: '', at: 0 };
      setMessage('Meminta akses port ESP32/RC522...');
      const port = await serial.requestPort();
      portRef.current = port;
      await port.open({ baudRate: 115200 });
      setStatus('connected');
      setMessage('Scanner aktif. Tempelkan kartu RFID ke reader. UID hanya diproses dari baris yang diawali UID:.');
      readSerial(port);
    } catch (error) {
      await closeCurrentPort();
      setStatus('error');
      setMessage(`Scanner gagal dihubungkan: ${error instanceof Error ? error.message : 'akses port dibatalkan'}. Tekan Reset Port lalu hubungkan lagi.`);
    }
  };

  const disconnectScanner = async () => {
    await closeCurrentPort();
    setStatus('idle');
    setMessage('Scanner dimatikan dari website. Reader masih mendapat daya dari ESP32 selama USB tersambung.');
  };

  const resetScannerPort = async () => {
    await closeCurrentPort();
    setUid('');
    setLastLines([]);
    lastUidRef.current = { uid: '', at: 0 };
    setStatus('idle');
    setMessage('Port serial sudah di-reset. Klik Hubungkan Scanner untuk membuka ulang koneksi.');
  };

  useEffect(() => () => { void closeCurrentPort(); }, []);

  const handlePoli = (value: string) => {
    setPoli(value);
    setDoctor(getDefaultDoctor(value));
  };

  const registerCard = () => {
    if (!selectedPatient) {
      alert('Pilih pemilik/hewan yang akan dihubungkan dengan kartu RFID.');
      return;
    }
    if (!normalizedUid) {
      alert('Scan atau ketik UID kartu terlebih dahulu.');
      return;
    }
    const usedByOther = patients.find((patient) => patient.id !== selectedPatient.id && normalizeUid(patient.rfidUid || '') === normalizedUid);
    if (usedByOther && !window.confirm(`UID ini sudah terhubung ke ${usedByOther.animalName} (${usedByOther.ownerName}). Pindahkan UID ke pasien ini?`)) return;
    if (usedByOther) updatePatient(usedByOther.id, { rfidUid: undefined });
    updatePatient(selectedPatient.id, { rfidUid: normalizedUid });
    setMessage(`Kartu ${displayUid(normalizedUid)} berhasil dihubungkan ke ${selectedPatient.animalName} milik ${selectedPatient.ownerName}.`);
  };

  const sendToDoctor = (patient?: Patient) => {
    const target = patient || matchedPatient;
    if (!target) {
      alert('Data pasien belum ditemukan dari kartu RFID.');
      return;
    }
    createVisitForExistingPatient(target.id, { poli, doctor });
    setMessage(`${target.animalName} berhasil dikirim ke dokter (${doctor} • ${poli}).`);
  };

  return (
    <Layout title="RFID Scanner" subtitle="Hubungkan UID kartu RFID ke pemilik dan hewan, lalu gunakan kartu untuk memanggil data pasien saat kunjungan lanjutan.">
      <section className="staff-section-card">
        <div className="internal-info-grid three-up">
          <article className="internal-mini-card"><strong>1. Daftarkan Kartu</strong><span>Scan kartu baru lalu hubungkan UID ke data pemilik dan hewan.</span></article>
          <article className="internal-mini-card"><strong>2. Scan Kunjungan Lanjutan</strong><span>FO cukup tap kartu untuk memunculkan data pasien lama.</span></article>
          <article className="internal-mini-card"><strong>3. Kirim ke Dokter</strong><span>Pilih poli dan dokter, lalu masukkan pasien ke antrian dokter.</span></article>
        </div>
      </section>

      <section className="staff-section-card rfid-control-card">
        <div className="section-head spread-head">
          <div>
            <p className="staff-kicker">Kontrol Scanner</p>
            <h2 className="section-title">RC522 via ESP32 Serial</h2>
            <p className="mini">Gunakan tombol hubungkan untuk membaca UID dari Serial Monitor ESP32. Input manual tetap tersedia untuk simulasi.</p>
          </div>
          <div className="button-row">
            {status === 'connected' ? <button className="staff-danger-button" type="button" onClick={disconnectScanner}>Matikan Scanner</button> : <button className="staff-primary-button" type="button" onClick={connectScanner}>{status === 'connecting' ? 'Menghubungkan...' : 'Hubungkan Scanner'}</button>}
            <button className="staff-outline-button" type="button" onClick={resetScannerPort}>Reset Port</button>
          </div>
        </div>
        <div className={`rfid-live-status ${status}`}>
          <strong>{status === 'connected' ? 'Scanner Aktif' : status === 'connecting' ? 'Menghubungkan Scanner' : status === 'error' ? 'Perlu Dicek' : 'Scanner Nonaktif'}</strong>
          <span>{message}</span>
        </div>
        <div className="rfid-log-box">
          <strong>Log Serial Terakhir</strong>
          {lastLines.length ? lastLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>) : <span>Belum ada data serial.</span>}
        </div>
      </section>

      <section className="staff-section-card rfid-mode-card">
        <div className="rfid-mode-tabs">
          <button type="button" className={mode === 'lookup' ? 'active' : ''} onClick={() => setMode('lookup')}>Scan Kartu Pasien</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Scan untuk Daftar Kartu</button>
        </div>

        <div className="rfid-shell">
          <div className="rfid-panel">
            <p className="staff-kicker">UID Kartu</p>
            <h2>{mode === 'lookup' ? 'Cari data dari kartu RFID' : 'Hubungkan kartu ke pemilik dan hewan'}</h2>
            <label className="rfid-input-wrap">
              <span>UID / Nomor Registrasi / Nama Hewan</span>
              <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Contoh serial: 04 A1 B2 C3 atau 04A1B2C3" />
            </label>
            <div className="patient-info-panel stacked minor-top">
              <div><strong>UID Normalisasi</strong><span>{displayUid(normalizedUid)}</span></div>
              <div><strong>Mode</strong><span>{mode === 'lookup' ? 'Scan kunjungan lanjutan' : 'Daftar kartu baru'}</span></div>
            </div>
          </div>

          <div className="rfid-result-card">
            {mode === 'lookup' ? (
              <>
                <p className="staff-kicker">Hasil Scan</p>
                {!uid ? <p className="mini">Scan kartu atau ketik UID untuk mencari pasien.</p> : matchedPatient ? (
                  <div className="patient-info-panel stacked">
                    <div><strong>Nama Hewan</strong><span>{matchedPatient.animalName}</span></div>
                    <div><strong>Pemilik</strong><span>{matchedPatient.ownerName}</span></div>
                    <div><strong>No. Registrasi</strong><span>{matchedPatient.customerNumber}</span></div>
                    <div><strong>UID RFID</strong><span>{displayUid(matchedPatient.rfidUid)}</span></div>
                    <div><strong>Jenis Hewan</strong><span>{matchedPatient.animalType} • {matchedPatient.breed}</span></div>
                    <div><strong>Status Antrian</strong><span>{pendingCount ? `Sudah masuk antrian (${pendingCount})` : 'Belum ada antrian aktif'}</span></div>
                  </div>
                ) : <div className="staff-notice">UID belum terdaftar. Pindah ke tab “Scan untuk Daftar Kartu” untuk menghubungkan kartu ke pasien.</div>}

                {matchedPatient && matchedPatientHistory.length ? <div className="previous-record-list minor-top"><strong>Riwayat Sebelumnya</strong>{matchedPatientHistory.slice(0, 4).map((visit, index) => <article key={visit.id} className="previous-record-item"><div className="previous-record-top"><strong>Kunjungan {matchedPatientHistory.length - index}</strong><span>{new Date(visit.visitDate).toLocaleDateString('id-ID')}</span></div><div className="previous-record-grid"><span>Dokter</span><b>{visit.doctor}</b><span>Poli</span><b>{visit.poli}</b><span>Diagnosis</span><b>{visit.diagnosis || '-'}</b><span>Tindakan/Billing</span><b>{(visit.selectedActions || []).join(', ') || (visit.additionalCharges || []).map((item) => item.name).join(', ') || '-'}</b></div></article>)}</div> : null}

                {matchedPatient ? <div className="rfid-send-box">
                  <label><span>Poli / Layanan</span><select value={poli} onChange={(e) => handlePoli(e.target.value)}>{poliOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Dokter</span><select value={doctor} onChange={(e) => setDoctor(e.target.value)}>{getDoctorChoices(poli).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <button className="staff-primary-button" type="button" onClick={() => sendToDoctor(matchedPatient)}>Kirim ke Dokter</button>
                </div> : null}
              </>
            ) : (
              <>
                <p className="staff-kicker">Daftar Kartu Baru</p>
                <label className="rfid-input-wrap">
                  <span>Cari Pemilik / Hewan</span>
                  <input value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} placeholder="Cari nama pemilik, hewan, atau nomor registrasi" />
                </label>
                <label className="rfid-input-wrap minor-top">
                  <span>Pilih Data yang Akan Dihubungkan</span>
                  <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                    <option value="">Pilih pemilik dan hewan</option>
                    {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.ownerName} • {patient.animalName} • {patient.customerNumber}</option>)}
                  </select>
                </label>
                {selectedPatient ? <div className="patient-info-panel stacked minor-top">
                  <div><strong>Pemilik</strong><span>{selectedPatient.ownerName}</span></div>
                  <div><strong>Hewan</strong><span>{selectedPatient.animalName}</span></div>
                  <div><strong>UID Saat Ini</strong><span>{displayUid(selectedPatient.rfidUid)}</span></div>
                </div> : null}
                <button className="staff-accent-button full-width minor-top" type="button" onClick={registerCard}>Simpan UID Kartu ke Pasien</button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="staff-section-card rfid-help-card">
        <h2 className="section-title">Catatan koneksi perangkat</h2>
        <p className="mini">Tombol “Matikan Scanner” di website menghentikan pembacaan serial dari browser, bukan memutus listrik RC522. RC522 aman dibiarkan aktif selama wiring benar. Konslet biasanya terjadi karena salah sambung 3.3V/GND/SPI, bukan karena scanner dinyalakan terus. Kalau ingin benar-benar memutus daya reader, gunakan saklar fisik atau rangkaian kontrol daya terpisah.</p>
      </section>
    </Layout>
  );
};
