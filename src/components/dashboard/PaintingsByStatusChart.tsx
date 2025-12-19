import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import useDashboardData from '@/hooks/use-dashboard-data';
import { Loader2 } from 'lucide-react';

const COLORS = {
  'Em Andamento': '#3b82f6', // Blue
  'Finalizado': '#f59e0b', // Amber/Yellow
  'Entregue': '#10b981', // Emerald/Green
};

const PaintingsByStatusChart: React.FC = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !data || data.totalPaintings === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhum serviço de pintura registrado.</div>;
  }

  const chartData = data.paintingsByStatus.filter(d => d.count > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} 
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaintingsByStatusChart;