import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import FarmerDashboard from "./pages/FarmerDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RoleSelect />} />
          <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          <Route path="/distributor-dashboard" element={<DistributorDashboard />} />
          <Route path="/consumer-dashboard" element={<ConsumerDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
