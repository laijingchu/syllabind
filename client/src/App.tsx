import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Catalog from "@/pages/Catalog";
import SyllabusOverview from "@/pages/SyllabusOverview";
import WeekView from "@/pages/WeekView";
import Completion from "@/pages/Completion";
import CreatorDashboard from "@/pages/CreatorDashboard";
import CreatorEditor from "@/pages/CreatorEditor";
import CreatorAnalytics from "@/pages/CreatorAnalytics";
import CreatorLearners from "@/pages/CreatorLearners";
import CreatorProfile from "@/pages/CreatorProfile";
import Marketing from "@/pages/Marketing";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/welcome" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/welcome" component={Marketing} />
        <Route path="/login" component={Login} />
        
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/syllabus/:id" component={SyllabusOverview} />
        <Route path="/syllabus/:id/week/:index" component={WeekView} />
        <Route path="/syllabus/:id/completed" component={() => <ProtectedRoute component={Completion} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        
        <Route path="/creator" component={() => <ProtectedRoute component={CreatorDashboard} />} />
        <Route path="/creator/syllabus/new" component={() => <ProtectedRoute component={CreatorEditor} />} />
        <Route path="/creator/syllabus/:id/edit" component={() => <ProtectedRoute component={CreatorEditor} />} />
        <Route path="/creator/syllabus/:id/learners" component={() => <ProtectedRoute component={CreatorLearners} />} />
        <Route path="/creator/syllabus/:id/analytics" component={() => <ProtectedRoute component={CreatorAnalytics} />} />
        <Route path="/creator/profile" component={() => <ProtectedRoute component={CreatorProfile} />} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <Router />
          <Toaster />
        </StoreProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
