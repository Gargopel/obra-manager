import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import useDashboardData from '@/hooks/use-dashboard-data';
import { Loader2 } from 'lucide-react';

const COLORS = ['#ef4444', '#22c55e']; // Pendente (Red), Resolvido (Green)

const StatusOverviewChart: React.FC = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !data || data.totalDemands === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma demanda registrada.</div>;
  }

  const chartData = [
    { name: 'Pendente', value: data.pendingDemands },
    { name: 'Resolvido', value: data.resolvedDemands },
  ];

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
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusOverviewChart;