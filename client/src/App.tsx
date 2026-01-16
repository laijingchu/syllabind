import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { StoreProvider, useStore } from "@/lib/store";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Catalog from "@/pages/Catalog";
import SyllabusOverview from "@/pages/SyllabusOverview";
import WeekView from "@/pages/WeekView";
import Completion from "@/pages/Completion";
import CreatorDashboard from "@/pages/CreatorDashboard";
import CreatorEditor from "@/pages/CreatorEditor";
import CreatorAnalytics from "@/pages/CreatorAnalytics";
import CreatorProfile from "@/pages/CreatorProfile";
import Marketing from "@/pages/Marketing";
import Login from "@/pages/Login";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/welcome" />;
}

function Router() {
  const { isAuthenticated } = useStore();

  return (
    <Layout>
      <Switch>
        <Route path="/welcome" component={Marketing} />
        <Route path="/login" component={Login} />
        
        {/* Protected Routes - Redirect to /welcome if not logged in */}
        {isAuthenticated ? (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/catalog" component={Catalog} />
            <Route path="/syllabus/:id" component={SyllabusOverview} />
            <Route path="/syllabus/:id/week/:index" component={WeekView} />
            <Route path="/syllabus/:id/completed" component={Completion} />
            
            <Route path="/creator" component={CreatorDashboard} />
            <Route path="/creator/syllabus/new" component={CreatorEditor} />
            <Route path="/creator/syllabus/:id/edit" component={CreatorEditor} />
            <Route path="/creator/syllabus/:id/analytics" component={CreatorAnalytics} />
            <Route path="/creator/profile" component={CreatorProfile} />
          </>
        ) : (
           /* If not authenticated, redirect root to welcome, but allow catalog/preview? 
              PRD says "Secondary text link: See a sample Syllabind -> anchors to ... or separate route"
              Let's allow catalog and syllabus overview publicly for now?
              PRD: "Open sample (no login) -> read-only demo of Week 1 view."
              Okay, let's open up Catalog and Syllabus routes.
           */
           <>
             <Route path="/" component={() => <Redirect to="/welcome" />} />
             <Route path="/catalog" component={Catalog} />
             <Route path="/syllabus/:id" component={SyllabusOverview} />
             <Route path="/syllabus/:id/week/:index" component={WeekView} />
             {/* If they try to access creator routes or others, 404 or redirect */}
             <Route path="/creator" component={() => <Redirect to="/login" />} />
           </>
        )}
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Router />
        <Toaster />
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
