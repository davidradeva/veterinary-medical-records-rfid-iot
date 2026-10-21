import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicApi } from '../../api/clinicApi';

type LoginRole = 'doctor-a' | 'doctor-b' | 'doctor-c' | 'frontoffice';

const accounts: Record<LoginRole, { username: string; password: string; role: 'doctor' | 'front-office'; welcome: string; staffName: string }> = {
  'doctor-a': { username: 'doktera', password: 'dokter123', role: 'doctor', welcome: 'Selamat Datang Dokter A', staffName: 'Dr. A' },
  'doctor-b': { username: 'dokterb', password: 'dokter123', role: 'doctor', welcome: 'Selamat Datang Dokter B', staffName: 'Dr. B' },
  'doctor-c': { username: 'dokterc', password: 'dokter123', role: 'doctor', welcome: 'Selamat Datang Dokter C', staffName: 'Dr. C' },
  frontoffice: { username: 'frontoffice', password: 'front123', role: 'front-office', welcome: 'Selamat Datang Front Office', staffName: 'Front Office' },
};

const playWelcomeTone = () => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const audio = new AudioCtx();
  const gain = audio.createGain();
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 2);

  [392, 523, 659].forEach((freq, index) => {
    const osc = audio.createOscillator();
    osc.type = index % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, audio.currentTime + index * 0.18);
    osc.connect(gain);
    osc.start(audio.currentTime + index * 0.18);
    osc.stop(audio.currentTime + 0.45 + index * 0.18);
  });
};

export const StaffLoginPage = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [role, setRole] = useState<LoginRole>('doctor-a');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcomeText, setWelcomeText] = useState('Selamat Datang Staff');
  const navigate = useNavigate();

  const finishLogin = (account: { role: 'doctor' | 'front-office' | 'apotek' | 'admin'; staffName: string; welcome?: string }) => {
    setWelcomeText(account.welcome || (account.role === 'doctor' ? `Selamat Datang ${account.staffName}` : 'Selamat Datang Front Office'));
    setShowSplash(true);
    playWelcomeTone();
    setTimeout(() => {
      sessionStorage.setItem('staff_role', account.role);
      sessionStorage.setItem('staff_name', account.staffName);
      navigate(account.role === 'doctor' ? '/doctor' : '/front-office');
    }, 2000);
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await clinicApi.login(username, password);
      finishLogin(user);
      return;
    } catch {
      // Fallback untuk development lokal ketika PHP API belum berjalan.
      const account = accounts[role];
      if (username === account.username && password === account.password) {
        finishLogin(account);
        return;
      }
      setError('Username atau password salah. Halaman ini hanya untuk staf klinik.');
    }
  };

  if (showSplash) {
    return (
      <div className="splash-screen staff">
        <div className="pet-row">
          <div className="pet-bounce">🐱</div>
          <div className="pet-bounce delay">🐶</div>
        </div>
        <h1>{welcomeText}</h1>
        <p>Halaman ini hanya untuk staf internal klinik.</p>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={doLogin}>
        <h2>Login Staff</h2>
        <p>Tidak ada fitur daftar akun. Akun hanya dibuat oleh admin klinik.</p>
        <label>Role
          <select value={role} onChange={(e) => setRole(e.target.value as LoginRole)}>
            <option value="doctor-a">Dokter A</option>
            <option value="doctor-b">Dokter B</option>
            <option value="doctor-c">Dokter C</option>
            <option value="frontoffice">Front Office</option>
          </select>
        </label>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit">Masuk</button>
      </form>
    </div>
  );
};
