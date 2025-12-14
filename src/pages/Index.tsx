import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ListChecks, CheckCircle, Clock } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DemandsByServiceChart from "@/components/dashboard/DemandsByServiceChart";
import DemandsByBlockChart from "@/components/dashboard/DemandsByBlockChart";
import StatusOverviewChart from "@/components/dashboard/StatusOverviewChart";

const Index = () => {
  const { profile } = useSession();
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
        <LayoutDashboard className="inline-block w-8 h-8 mr-2 text-primary" />
        Dashboard da Obra
      </h1>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Status */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle>Status Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusOverviewChart />
          </CardContent>
        </Card>

        {/* Gráfico de Tipos de Serviço */}
        <Card className="lg:col-span-2 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle>Demandas por Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <DemandsByServiceChart />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Blocos */}
      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle>Demandas por Bloco</CardTitle>
        </CardHeader>
        <CardContent>
          <DemandsByBlockChart />
        </CardContent>
      </Card>

      <MadeWithDyad />
    </div>
  );
};

export default Index;