import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import DashboardWithCharts from "@/pages/DashboardWithCharts";
import NewLead from "@/pages/NewLead";
import LeadsList from "@/pages/LeadsList";
import EditLead from "@/pages/EditLead";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Login from "./pages/Login";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardWithCharts} />} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute component={DashboardWithCharts} />} />
      <Route path={"/leads"} component={() => <ProtectedRoute component={LeadsList} />} />
      <Route path={"/leads/new"} component={() => <ProtectedRoute component={NewLead} />} />
      <Route path={"/leads/:id"} component={() => <ProtectedRoute component={EditLead} />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
