import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import dayjs from 'dayjs';

function CalendarGrid({ recordsByDay }) {
  const start = dayjs().startOf('month');
  const end = dayjs().endOf('month');
  const days = [];
  for (let d = start.date(); d <= end.date(); d++) {
    const key = dayjs().date(d).format('YYYY-MM-DD');
    const list = recordsByDay[key] || [];
    const present = list.length;
    days.push({ d, present });
  }
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ d, present }) => (
        <div key={d} className="card p-2 text-center">
          <div className="text-xs text-gray-600">{dayjs().date(d).format('ddd')}</div>
          <div className="text-lg font-semibold">{d}</div>
          <div className="text-sm">Present: {present}</div>
        </div>
      ))}
    </div>
  );
}

export default function TeamCalendar() {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    const load = async () => {
      const start = dayjs().startOf('month').format('YYYY-MM-DD');
      const end = dayjs().endOf('month').format('YYYY-MM-DD');
      const { data } = await api.get('/api/attendance/all', { params: { start, end } });
      setRecords(data.records);
    };
    load();
  }, []);

  const group = {};
  records.forEach(r => {
    const key = dayjs(r.date).format('YYYY-MM-DD');
    if (!group[key]) group[key] = [];
    group[key].push(r);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Team Attendance Calendar</h1>
      <CalendarGrid recordsByDay={group} />
    </div>
  );
}