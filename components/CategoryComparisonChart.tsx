"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CategoryComparisonChart({ data }: { data: { name: string, averageRisk: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No data available. Please run the batch scraper pipeline.</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="averageRisk" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              // Color code bars based on risk level
              const getFill = (score: number) => {
                if (score > 60) return '#ef4444'; // Red
                if (score > 25) return '#f59e0b'; // Amber
                return '#10b981'; // Emerald
              };
              return <Cell key={`cell-${index}`} fill={getFill(entry.averageRisk)} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
