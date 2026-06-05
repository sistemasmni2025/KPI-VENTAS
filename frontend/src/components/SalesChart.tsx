import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Ene', Ventas: 4000, Meta: 2400 },
  { name: 'Feb', Ventas: 3000, Meta: 2800 },
  { name: 'Mar', Ventas: 4500, Meta: 3200 },
  { name: 'Abr', Ventas: 3780, Meta: 3500 },
  { name: 'May', Ventas: 4890, Meta: 4000 },
  { name: 'Jun', Ventas: 5390, Meta: 4200 },
  { name: 'Jul', Ventas: 6490, Meta: 4800 },
  { name: 'Ago', Ventas: 6200, Meta: 5000 },
  { name: 'Sep', Ventas: 7100, Meta: 5200 },
  { name: 'Oct', Ventas: 6800, Meta: 5500 },
  { name: 'Nov', Ventas: 8200, Meta: 6000 },
  { name: 'Dic', Ventas: 9500, Meta: 6500 },
];

export function SalesChart() {
  return (
    <div className="w-full h-full p-4 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#62D9F3" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#62D9F3" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F2AA27" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#F2AA27" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-sky-border)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-sky-muted)', fontSize: 11 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-sky-muted)', fontSize: 11 }}
            tickFormatter={(v) => `$${(v).toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-sky-surface)', 
              borderRadius: '12px', 
              border: '1px solid var(--color-sky-border)', 
              color: 'var(--color-sky-text)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' 
            }} 
            itemStyle={{ color: 'var(--color-sky-text)' }}
          />
          <Area 
            type="monotone" 
            dataKey="Ventas" 
            stroke="#62D9F3" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorVentas)" 
          />
          <Area 
            type="monotone" 
            dataKey="Meta" 
            stroke="#F2AA27" 
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1} 
            fill="url(#colorMeta)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
