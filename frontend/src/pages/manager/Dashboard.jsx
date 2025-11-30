import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/dashboard/manager');
        setData(data);
      } finally { setLoading(false); }
    };
    load();
    const int = setInterval(async () => {
      try {
        setRefreshing(true);
        const { data } = await api.get('/api/dashboard/manager');
        setData(data);
      } catch {}
      finally { setRefreshing(false); }
    }, 15000);
    return () => clearInterval(int);
  }, []);

  if (loading) return <p>Loading...</p>;

  const deptChart = Object.entries(data.departments).map(([dept, v]) => ({ department: dept, present: v.present, absent: v.absent }));
  const pieData = [
    { name: 'Present', value: data.presentToday },
    { name: 'Absent', value: data.absentToday }
  ];
  const colors = ['#22c55e', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading">Manager Dashboard</h1>
        <button className="btn-ghost" onClick={async () => {
          try {
            setRefreshing(true);
            const { data } = await api.get('/api/dashboard/manager');
            setData(data);
          } finally { setRefreshing(false); }
        }}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4"><p className="text-gray-600">Total Employees</p><p className="text-lg font-semibold">{data.totalEmployees}</p></div>
        <div className="card p-4"><p className="text-gray-600">Present Today</p><p className="text-lg font-semibold">{data.presentToday}</p></div>
        <div className="card p-4"><p className="text-gray-600">Absent Today</p><p className="text-lg font-semibold">{data.absentToday}</p></div>
        <div className="card p-4"><p className="text-gray-600">Late Employees</p><p className="text-lg font-semibold">{data.lateEmployees.length}</p></div>
      </div>

      <div className="card p-4">
        <p className="font-medium mb-2">Attendance Trend (last 14 days)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="font-medium mb-2">Present vs Absent (Today)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <p className="font-medium mb-2">Late Arrivals Trend (last 14 days)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.lateTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-medium mb-2">Department-wise Report</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#22c55e" />
              <Bar dataKey="absent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}