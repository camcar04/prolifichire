import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FieldWorkspace from "./pages/FieldWorkspace";
import Fields from "./pages/Fields";
import Marketplace from "./pages/Marketplace";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Schedule from "./pages/Schedule";
import Packets from "./pages/Packets";
import Payouts from "./pages/Payouts";
import NotFound from "./pages/NotFound";
import GrowerOnboarding from "./pages/onboarding/GrowerOnboarding";
import OperatorOnboarding from "./pages/onboarding/OperatorOnboarding";
import Templates from "./pages/Templates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding/grower" element={<GrowerOnboarding />} />
            <Route path="/onboarding/operator" element={<OperatorOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/fields/:fieldId" element={<FieldWorkspace />} />
            <Route path="/jobs" element={<Dashboard />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/packets" element={<Packets />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/finance" element={<Dashboard />} />
            <Route path="/files" element={<Dashboard />} />
            <Route path="/messages" element={<Dashboard />} />
            <Route path="/operators" element={<Dashboard />} />
            <Route path="/compliance" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
