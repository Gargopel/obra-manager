import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useDashboardData from '@/hooks/use-dashboard-data';
import { Loader2 } from 'lucide-react';

const DemandsByBlockChart: React.FC = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !data || data.totalDemands === 0) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Nenhuma demanda registrada.</div>;
  }

  // Use all blocks, including those with count 0, for a complete view
  const chartData = data.demandsByBlock;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="block" stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))', 
              borderRadius: 'var(--radius)' 
            }}
            formatter={(value: number) => [`${value} Demandas`, 'Bloco']}
          />
          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DemandsByBlockChart;