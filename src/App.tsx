import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
import Enterprise from "./pages/Enterprise";
import CalendarView from "./pages/CalendarView";
import BidQueue from "./pages/BidQueue";
import LaborMarketplace from "./pages/LaborMarketplace";
import QuotesReceived from "./pages/QuotesReceived";
import Storefront from "./pages/Storefront";

const queryClient = new QueryClient();

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            <Route path="/legal/acceptable-use" element={<AcceptableUse />} />

            {/* Protected: onboarding */}
            <Route path="/onboarding/grower" element={<P><GrowerOnboarding /></P>} />
            <Route path="/onboarding/operator" element={<P><OperatorOnboarding /></P>} />

            {/* Protected: app */}
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/fields" element={<P><Fields /></P>} />
            <Route path="/fields/:fieldId" element={<P><FieldWorkspace /></P>} />
            <Route path="/jobs" element={<P><Dashboard /></P>} />
            <Route path="/jobs/:jobId" element={<P><JobDetail /></P>} />
            <Route path="/marketplace" element={<P><Marketplace /></P>} />
            <Route path="/schedule" element={<P><Schedule /></P>} />
            <Route path="/calendar" element={<P><CalendarView /></P>} />
            <Route path="/packets" element={<P><Packets /></P>} />
            <Route path="/templates" element={<P><Templates /></P>} />
            <Route path="/bid-queue" element={<P><BidQueue /></P>} />
            <Route path="/quotes" element={<P><QuotesReceived /></P>} />
            <Route path="/labor" element={<P><LaborMarketplace /></P>} />
            <Route path="/notifications" element={<P><NotificationsPage /></P>} />
            <Route path="/payouts" element={<P><Payouts /></P>} />
            <Route path="/integrations" element={<P><Integrations /></P>} />
            <Route path="/settings" element={<P><Settings /></P>} />
            <Route path="/finance" element={<P><Payouts /></P>} />
            <Route path="/files" element={<P><Fields /></P>} />
            <Route path="/messages" element={<P><NotificationsPage /></P>} />
            <Route path="/operators/:operatorId" element={<P><OperatorProfile /></P>} />
            <Route path="/storefront" element={<P><Storefront /></P>} />

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
