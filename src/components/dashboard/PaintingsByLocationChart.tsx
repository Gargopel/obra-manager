import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useDashboardData from '@/hooks/use-dashboard-data';
import { Loader2 } from 'lucide-react';

const PaintingsByLocationChart: React.FC = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !data || data.totalPaintings === 0) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Nenhum serviço de pintura registrado.</div>;
  }

  // Filter out locations with 0 count for cleaner visualization
  const chartData = data.paintingsByLocation.filter(d => d.count > 0);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--foreground))" angle={-45} textAnchor="end" height={60} interval={0} />
          <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))', 
              borderRadius: 'var(--radius)' 
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--secondary-foreground))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaintingsByLocationChart;