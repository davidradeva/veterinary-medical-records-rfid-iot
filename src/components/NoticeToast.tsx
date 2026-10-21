import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type NoticeTone = 'success' | 'warning' | 'error' | 'info';

export type NoticeState = {
  tone: NoticeTone;
  title: string;
  message: string;
};

type NoticeToastProps = {
  notice: NoticeState | null;
  onClose: () => void;
  autoHideMs?: number;
};

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
} satisfies Record<NoticeTone, typeof Info>;

export const NoticeToast = ({ notice, onClose, autoHideMs = 5000 }: NoticeToastProps) => {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [notice, autoHideMs, onClose]);

  if (!notice) return null;

  const Icon = iconMap[notice.tone];

  return (
    <div className={`notice-toast notice-${notice.tone}`} role="status" aria-live="polite">
      <div className="notice-toast-icon"><Icon size={20} /></div>
      <div className="notice-toast-content">
        <strong>{notice.title}</strong>
        <span>{notice.message}</span>
      </div>
      <button type="button" className="notice-toast-close" onClick={onClose} aria-label="Tutup notifikasi">
        <X size={18} />
      </button>
    </div>
  );
};
