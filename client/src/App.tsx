import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load route components to prevent module evaluation crashes
const MarketingPage = lazy(() => import("@/pages/marketing"));
const LoginPage = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const EnhancedDashboard = lazy(() => import("@/components/enhanced-dashboard").then(module => ({ default: module.EnhancedDashboard })));
const Commercial = lazy(() => import("@/pages/commercial"));
const Programming = lazy(() => import("@/pages/programming"));
const VMBenchmarking = lazy(() => import("@/pages/vm-benchmarking"));
const HKMTraining = lazy(() => import("@/pages/hkm-training"));
const Admin = lazy(() => import("@/pages/admin"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-white">Loading WSM System...</p>
        </div>
      </div>
    }>
      <Switch>
        {/* Public marketing page */}
        <Route path="/" component={MarketingPage} />
        
        {/* Public login page */}
        <Route path="/login" component={LoginPage} />
        
        {/* Protected technical routes */}
        <Route path="/dashboard" component={Dashboard} />
        
        <Route path="/enhanced" component={EnhancedDashboard} />
        
        <Route path="/commercial" component={Commercial} />
        
        <Route path="/programming" component={Programming} />
        
        <Route path="/vm-benchmarking" component={VMBenchmarking} />
        
        <Route path="/hkm-training" component={HKMTraining} />
        
        <Route path="/admin" component={Admin} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
