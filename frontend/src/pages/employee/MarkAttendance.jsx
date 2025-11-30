import { useEffect, useRef, useState } from 'react';
import api from '../../utils/api.js';
import { useToast } from '../../components/Toast.jsx';
import { enqueue, drain } from '../../utils/offlineQueue.js';

export default function MarkAttendance() {
  const [today, setToday] = useState(null);
  const [message, setMessage] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const lastActivityRef = useRef(Date.now());

  const refresh = async () => {
    const { data } = await api.get('/api/attendance/today');
    setToday(data.record);
  };

  useEffect(() => { refresh(); }, []);

  // Live timer when checked in
  useEffect(() => {
    const int = setInterval(() => {
      if (today?.checkInTime && !today?.checkOutTime) {
        const ms = Date.now() - new Date(today.checkInTime).getTime();
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      } else {
        setElapsed('00:00:00');
      }
    }, 1000);
    return () => clearInterval(int);
  }, [today]);

  // Idle reminder while checked-in
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    const checkIdle = setInterval(() => {
      if (today?.checkInTime && !today?.checkOutTime) {
        const idleMs = Date.now() - lastActivityRef.current;
        if (idleMs > 10 * 60 * 1000) {
          toast?.show('You seem idle; remember to check-out when done.', 'info');
          lastActivityRef.current = Date.now();
        }
      }
    }, 60000);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearInterval(checkIdle);
    };
  }, [today, toast]);

  // Drain offline queue when online
  useEffect(() => {
    const process = async (item) => {
      if (item.type === 'checkin') {
        await api.post('/api/attendance/checkin', { device: item.device, at: item.at });
      }
      if (item.type === 'checkout') {
        await api.post('/api/attendance/checkout', { at: item.at });
      }
    };
    const onOnline = () => {
      drain(process).then(() => {
        toast?.show('Synced offline attendance records.', 'success');
        refresh();
      }).catch(() => {});
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [toast]);

  const checkin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/api/attendance/checkin', { device: 'web' });
      setMessage(data.message);
      toast?.show('Checked in successfully!', 'success');
      refresh();
    } catch (err) {
      if (!err.response) {
        await enqueue({ type: 'checkin', device: 'web', at: Date.now() });
        toast?.show('Offline: saved check-in and will sync later.', 'info');
      } else {
        toast?.show('Check-in failed.', 'error');
      }
    } finally { setBusy(false); }
  };
  const checkout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/api/attendance/checkout');
      setMessage(data.message);
      toast?.show('Checked out successfully!', 'success');
      refresh();
    } catch (err) {
      if (!err.response) {
        await enqueue({ type: 'checkout', at: Date.now() });
        toast?.show('Offline: saved check-out and will sync later.', 'info');
      } else {
        toast?.show('Check-out failed.', 'error');
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mark Attendance</h1>
      <div className="card p-4">
        <p className="mb-2">Today: {new Date().toLocaleDateString()}</p>
        <p>Status: <span className="font-medium">{today?.status || 'N/A'}</span></p>
        <p>Check-in: {today?.checkInTime ? new Date(today.checkInTime).toLocaleTimeString() : '-'}</p>
        <p>Check-out: {today?.checkOutTime ? new Date(today.checkOutTime).toLocaleTimeString() : '-'}</p>
        <p className="mt-1">Live Timer: <span className="font-mono">{elapsed}</span></p>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={checkin} disabled={busy || !!today?.checkInTime}>{busy ? 'Working…' : 'Check-In'}</button>
          <button className="btn-secondary" onClick={checkout} disabled={busy || !today?.checkInTime || !!today?.checkOutTime}>{busy ? 'Working…' : 'Check-Out'}</button>
        </div>
        {message && <p className="text-green-700 mt-2">{message}</p>}
      </div>
    </div>
  );
}