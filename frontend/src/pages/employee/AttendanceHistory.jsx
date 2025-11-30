import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import dayjs from 'dayjs';

function Calendar({ records }) {
  const start = dayjs().startOf('month');
  const end = dayjs().endOf('month');
  const byDate = {};
  records.forEach(r => { byDate[dayjs(r.date).format('YYYY-MM-DD')] = r; });
  const cells = [];
  for (let d = 1; d <= end.date(); d++) {
    const key = dayjs().date(d).format('YYYY-MM-DD');
    const rec = byDate[key];
    let badge = { text: 'Absent', color: 'bg-red-100 text-red-700 border-red-200' };
    if (rec) {
      if (rec.status === 'present') badge = { text: 'Present', color: 'bg-green-100 text-green-700 border-green-200' };
      if (rec.status === 'late') badge = { text: 'Late', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      if (rec.status === 'half-day') badge = { text: 'Half-day', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    cells.push({ d, badge });
  }
  return (
    <div className="grid grid-cols-7 gap-2">
      {cells.map(({ d, badge }) => (
        <div key={d} className="card p-2 text-center">
          <div className="text-xs text-gray-600">{dayjs().date(d).format('ddd')}</div>
          <div className="text-lg font-semibold">{d}</div>
          <div className={`text-xs mt-1 inline-block px-2 py-1 rounded border ${badge.color}`}>{badge.text}</div>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const { data } = await api.get('/api/attendance/my-history', { params });
    setRecords(data.records);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Attendance History</h1>
      <div className="card p-4">
        <p className="font-medium mb-2">This Month Calendar</p>
        <Calendar records={records} />
      </div>
      <div className="card p-4">
        <div className="flex gap-2 mb-3">
          <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
          <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
          <button className="btn-primary" onClick={load}>Filter</button>
          <button
            className="btn-secondary"
            onClick={() => {
              const headers = ['Date','Check In','Check Out','Status','Total Hours'];
              const rows = records.map(r => [
                dayjs(r.date).format('YYYY-MM-DD'),
                r.checkInTime ? dayjs(r.checkInTime).format('HH:mm') : '',
                r.checkOutTime ? dayjs(r.checkOutTime).format('HH:mm') : '',
                r.status,
                (r.totalHours || 0).toFixed(2)
              ]);
              const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'my_attendance.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Check-In</th>
                <th className="p-2">Check-Out</th>
                <th className="p-2">Status</th>
                <th className="p-2">Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="p-2">{dayjs(r.date).format('YYYY-MM-DD')}</td>
                  <td className="p-2">{r.checkInTime ? dayjs(r.checkInTime).format('HH:mm') : '-'}</td>
                  <td className="p-2">{r.checkOutTime ? dayjs(r.checkOutTime).format('HH:mm') : '-'}</td>
                  <td className="p-2 capitalize">{r.status}</td>
                  <td className="p-2">{(r.totalHours || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}