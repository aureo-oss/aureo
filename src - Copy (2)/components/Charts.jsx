// src/components/Dashboard/Charts.jsx
import { Bar, Pie, BarChart as RechartsBarChart, PieChart as RechartsPieChart, ResponsiveContainer } from 'recharts';

export function CustomBarChart({ data }) {  // Renamed from BarChart
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <Bar dataKey="value" fill="#8884d8" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function CustomPieChart({ data }) {  // Renamed from PieChart
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie data={data} dataKey="value" nameKey="name" fill="#82ca9d" label />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}