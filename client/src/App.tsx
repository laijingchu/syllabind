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
import BinderOverview from "@/pages/BinderOverview";
import WeekView from "@/pages/WeekView";
import Completion from "@/pages/Completion";
import CuratorDashboard from "@/pages/CuratorDashboard";
import BinderEditor from "@/pages/BinderEditor";
import BinderAnalytics from "@/pages/BinderAnalytics";
import BinderReaders from "@/pages/BinderReaders";
import CuratorProfile from "@/pages/CuratorProfile";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import AdminSettings from "@/pages/AdminSettings";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Pricing from "@/pages/Pricing";


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
        <Route path="/welcome" component={Catalog} />
        <Route path="/login" component={Login} />

        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/binder/:id" component={BinderOverview} />
        <Route path="/binder/:id/week/:index" component={WeekView} />
        <Route path="/binder/:id/completed" component={() => <ProtectedRoute component={Completion} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />

        <Route path="/create/preview" component={BinderOverview} />
        <Route path="/create" component={BinderEditor} />
        <Route path="/curator" component={() => <ProtectedRoute component={CuratorDashboard} />} />
        <Route path="/curator/binder/new" component={() => <ProtectedRoute component={BinderEditor} />} />
        <Route path="/curator/binder/:id/edit" component={() => <ProtectedRoute component={BinderEditor} />} />
        <Route path="/curator/binder/:id/readers" component={() => <ProtectedRoute component={BinderReaders} />} />
        <Route path="/curator/binder/:id/analytics" component={() => <ProtectedRoute component={BinderAnalytics} />} />
        <Route path="/curator/profile" component={() => <ProtectedRoute component={CuratorProfile} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/billing" component={() => <ProtectedRoute component={Billing} />} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/admin/settings" component={() => <ProtectedRoute component={AdminSettings} />} />

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
