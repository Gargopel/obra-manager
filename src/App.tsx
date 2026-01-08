import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import Login from "./pages/Login";
import DemandsPage from "./pages/DemandsPage";
import MeasurementsPage from "./pages/MeasurementsPage";
import CeramicsPage from "./pages/CeramicsPage";
import PaintingsPage from "./pages/PaintingsPage";
import OpeningsPage from "./pages/OpeningsPage";
import DoorsPage from "./pages/DoorsPage";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulesPage from "./pages/SchedulesPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import SyncPage from "./pages/SyncPage";
import UnitHubPage from "./pages/UnitHubPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

const AppRoutes = () => {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={session ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Index />} />
        <Route path="/demands" element={<DemandsPage />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/ceramics" element={<CeramicsPage />} />
        <Route path="/paintings" element={<PaintingsPage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/doors" element={<DoorsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sync" element={<SyncPage />} />
        <Route path="/unit/:blockId/:unitId" element={<UnitHubPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionProvider>
            <AppRoutes />
          </SessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;