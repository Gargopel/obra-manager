import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ListChecks, CheckCircle, Clock, PaintBucket } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DemandsByServiceChart from "@/components/dashboard/DemandsByServiceChart";
import DemandsByBlockChart from "@/components/dashboard/DemandsByBlockChart";
import StatusOverviewChart from "@/components/dashboard/StatusOverviewChart";
import PaintingsByStatusChart from "@/components/dashboard/PaintingsByStatusChart";
import PaintingsByLocationChart from "@/components/dashboard/PaintingsByLocationChart";
import useSiteConfig from "@/hooks/use-site-config";
import React from "react";

const Index = () => {
  const { profile } = useSession();
  const { data: siteConfig } = useSiteConfig();
  
  React.useEffect(() => {
    if (siteConfig?.site_name) {
      document.title = siteConfig.site_name;
    }
  }, [siteConfig]);
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground/90 backdrop-blur-sm p-2 rounded-lg">
        <LayoutDashboard className="inline-block w-8 h-8 mr-2 text-primary" />
        Dashboard da Obra
      </h1>

      <DashboardStats />

      {/* Seção de Demandas */}
      <h2 className="text-2xl font-semibold mt-10 mb-4 flex items-center">
        <ListChecks className="w-6 h-6 mr-2 text-secondary-foreground" />
        Análise de Demandas
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Status de Demandas */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle>Status Geral (Demandas)</CardTitle>
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

      {/* Gráfico de Blocos (Demandas) */}
      <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle>Demandas por Bloco</CardTitle>
        </CardHeader>
        <CardContent>
          <DemandsByBlockChart />
        </CardContent>
      </Card>
      
      {/* Seção de Pinturas */}
      <h2 className="text-2xl font-semibold mt-10 mb-4 flex items-center">
        <PaintBucket className="w-6 h-6 mr-2 text-secondary-foreground" />
        Análise de Pinturas
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Status de Pinturas */}
        <Card className="lg:col-span-1 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle>Status Geral (Pinturas)</CardTitle>
          </CardHeader>
          <CardContent>
            <PaintingsByStatusChart />
          </CardContent>
        </Card>

        {/* Gráfico de Localização de Pinturas */}
        <Card className="lg:col-span-2 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 shadow-xl border border-white/30 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle>Pinturas por Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <PaintingsByLocationChart />
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Index;