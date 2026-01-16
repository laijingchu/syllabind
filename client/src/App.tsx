import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { StoreProvider } from "@/lib/store";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Catalog from "@/pages/Catalog";
import SyllabusOverview from "@/pages/SyllabusOverview";
import WeekView from "@/pages/WeekView";
import Completion from "@/pages/Completion";
import CreatorDashboard from "@/pages/CreatorDashboard";
import CreatorEditor from "@/pages/CreatorEditor";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/syllabus/:id" component={SyllabusOverview} />
        <Route path="/syllabus/:id/week/:index" component={WeekView} />
        <Route path="/syllabus/:id/completed" component={Completion} />
        
        {/* Creator Routes */}
        <Route path="/creator" component={CreatorDashboard} />
        <Route path="/creator/syllabus/new" component={CreatorEditor} />
        <Route path="/creator/syllabus/:id/edit" component={CreatorEditor} />
        
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
