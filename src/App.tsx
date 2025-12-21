import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";
import Layout from "./components/Layout";
import DemandsPage from "./pages/DemandsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CeramicsPage from "./pages/CeramicsPage";
import PaintingsPage from "./pages/PaintingsPage";
import OpeningsPage from "./pages/OpeningsPage";
import DoorsPage from "./pages/DoorsPage"; // Importando a nova página

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Rotas Protegidas */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/demands" element={<DemandsPage />} />
              <Route path="/ceramics" element={<CeramicsPage />} />
              <Route path="/paintings" element={<PaintingsPage />} />
              <Route path="/openings" element={<OpeningsPage />} />
              <Route path="/doors" element={<DoorsPage />} /> {/* Nova Rota */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;