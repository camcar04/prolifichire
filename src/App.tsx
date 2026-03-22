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
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import GrowerOnboarding from "./pages/onboarding/GrowerOnboarding";
import OperatorOnboarding from "./pages/onboarding/OperatorOnboarding";
import Templates from "./pages/Templates";
import NotificationsPage from "./pages/Notifications";
import Integrations from "./pages/Integrations";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import AcceptableUse from "./pages/legal/AcceptableUse";
import CookieConsent from "./components/legal/CookieConsent";
import { AIAssistant } from "./components/ai/AIAssistant";
import OperatorProfile from "./pages/OperatorProfile";
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
            <Route path="/templates" element={<Templates />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/finance" element={<Dashboard />} />
            <Route path="/files" element={<Dashboard />} />
            <Route path="/messages" element={<Dashboard />} />
            <Route path="/operators" element={<Dashboard />} />
            <Route path="/operators/:operatorId" element={<OperatorProfile />} />
            <Route path="/compliance" element={<Dashboard />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            <Route path="/legal/acceptable-use" element={<AcceptableUse />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          <AIAssistant />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
