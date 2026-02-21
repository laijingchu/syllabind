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
import SyllabindOverview from "@/pages/SyllabindOverview";
import WeekView from "@/pages/WeekView";
import Completion from "@/pages/Completion";
import CreatorDashboard from "@/pages/CreatorDashboard";
import SyllabindEditor from "@/pages/SyllabindEditor";
import SyllabindAnalytics from "@/pages/SyllabindAnalytics";
import SyllabindLearners from "@/pages/SyllabindLearners";
import CreatorProfile from "@/pages/CreatorProfile";
import Marketing from "@/pages/Marketing";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import AdminSettings from "@/pages/AdminSettings";

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
        <Route path="/syllabind/:id" component={SyllabindOverview} />
        <Route path="/syllabind/:id/week/:index" component={WeekView} />
        <Route path="/syllabind/:id/completed" component={() => <ProtectedRoute component={Completion} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        
        <Route path="/creator" component={() => <ProtectedRoute component={CreatorDashboard} />} />
        <Route path="/creator/syllabind/new" component={() => <ProtectedRoute component={SyllabindEditor} />} />
        <Route path="/creator/syllabind/:id/edit" component={() => <ProtectedRoute component={SyllabindEditor} />} />
        <Route path="/creator/syllabind/:id/learners" component={() => <ProtectedRoute component={SyllabindLearners} />} />
        <Route path="/creator/syllabind/:id/analytics" component={() => <ProtectedRoute component={SyllabindAnalytics} />} />
        <Route path="/creator/profile" component={() => <ProtectedRoute component={CreatorProfile} />} />

        <Route path="/admin" component={() => <ProtectedRoute component={AdminSettings} />} />

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
