import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";
import ForcePasswordChange from "@/components/ForcePasswordChange";

import Dashboard from "@/pages/Dashboard";
import CompletedJourneys from "@/pages/CompletedJourneys";
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
import AdminEmailPreviews from "@/pages/AdminEmailPreviews";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Pricing from "@/pages/Pricing";
import ElementsOverview from "@/pages/design-system/ElementsOverview";
import ElementsColors from "@/pages/design-system/ElementsColors";
import ElementsTypography from "@/pages/design-system/ElementsTypography";
import ElementsSpacing from "@/pages/design-system/ElementsSpacing";
import ElementsShadows from "@/pages/design-system/ElementsShadows";
import ElementsAnimations from "@/pages/design-system/ElementsAnimations";
import ElementsLayout from "@/pages/design-system/ElementsLayout";
import UIOverview from "@/pages/design-system/ui/UIOverview";
import UIButton from "@/pages/design-system/ui/UIButton";
import UICard from "@/pages/design-system/ui/UICard";
import UIInput from "@/pages/design-system/ui/UIInput";
import UIBadge from "@/pages/design-system/ui/UIBadge";
import UIPill from "@/pages/design-system/ui/UIPill";
import UITextarea from "@/pages/design-system/ui/UITextarea";
import UILabel from "@/pages/design-system/ui/UILabel";
import UICheckbox from "@/pages/design-system/ui/UICheckbox";
import UISwitch from "@/pages/design-system/ui/UISwitch";
import UIRadioGroup from "@/pages/design-system/ui/UIRadioGroup";
import UISelect from "@/pages/design-system/ui/UISelect";
import UICalendar from "@/pages/design-system/ui/UICalendar";
import UISeparator from "@/pages/design-system/ui/UISeparator";
import UITable from "@/pages/design-system/ui/UITable";
import UITabs from "@/pages/design-system/ui/UITabs";
import UIBreadcrumb from "@/pages/design-system/ui/UIBreadcrumb";
import UIDropdownMenu from "@/pages/design-system/ui/UIDropdownMenu";
import UIDialog from "@/pages/design-system/ui/UIDialog";
import UIAlertDialog from "@/pages/design-system/ui/UIAlertDialog";
import UIPopover from "@/pages/design-system/ui/UIPopover";
import UISheet from "@/pages/design-system/ui/UISheet";
import UIOverlay from "@/pages/design-system/ui/UIOverlay";
import UIDrawer from "@/pages/design-system/ui/UIDrawer";
import UITooltip from "@/pages/design-system/ui/UITooltip";
import UIAvatar from "@/pages/design-system/ui/UIAvatar";
import UISkeleton from "@/pages/design-system/ui/UISkeleton";
import UIProgress from "@/pages/design-system/ui/UIProgress";
import UISpinner from "@/pages/design-system/ui/UISpinner";
import UIAlert from "@/pages/design-system/ui/UIAlert";
import UIToast from "@/pages/design-system/ui/UIToast";
import UIAccordion from "@/pages/design-system/ui/UIAccordion";
import UIAnimatedContainer from "@/pages/design-system/ui/UIAnimatedContainer";
import UIRichTextEditor from "@/pages/design-system/ui/UIRichTextEditor";
import ComponentPageHeader from "@/pages/design-system/components/ComponentPageHeader";
import ComponentEmptyState from "@/pages/design-system/components/ComponentEmptyState";
import ComponentSearchBar from "@/pages/design-system/components/ComponentSearchBar";
import ComponentBinderFilterBar from "@/pages/design-system/components/ComponentBinderFilterBar";
import ComponentsOverview from "@/pages/design-system/components/ComponentsOverview";
import ComponentBinderCard from "@/pages/design-system/components/ComponentBinderCard";
import ComponentShareDialog from "@/pages/design-system/components/ComponentShareDialog";
import ComponentAvatarUpload from "@/pages/design-system/components/ComponentAvatarUpload";
import ComponentUpgradePrompt from "@/pages/design-system/components/ComponentUpgradePrompt";
import ComponentGeneratingWeekPlaceholder from "@/pages/design-system/components/ComponentGeneratingWeekPlaceholder";
import ComponentErrorBoundary from "@/pages/design-system/components/ComponentErrorBoundary";
import ComponentCuratorBinderCard from "@/pages/design-system/components/ComponentCuratorBinderCard";
import ComponentReviewQueueCard from "@/pages/design-system/components/ComponentReviewQueueCard";
import ComponentOnboardingChecklist from "@/pages/design-system/components/ComponentOnboardingChecklist";
import ComponentProOnboardingChecklist from "@/pages/design-system/components/ComponentProOnboardingChecklist";
import ComponentCreditsCard from "@/pages/design-system/components/ComponentCreditsCard";
import ComponentBinderReviewStatusCard from "@/pages/design-system/components/ComponentBinderReviewStatusCard";
import ComponentFeedbackCard from "@/pages/design-system/components/ComponentFeedbackCard";
import ComponentCuratorRecruitCard from "@/pages/design-system/components/ComponentCuratorRecruitCard";
import ComponentItemList from "@/pages/design-system/components/ComponentItemList";


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
      {user?.mustChangePassword && <ForcePasswordChange />}
      <Switch>
        <Route path="/welcome">
          {import.meta.env.PROD && !user ? <Redirect to="/login?mode=signup" /> : <Catalog />}
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/completed" component={() => <ProtectedRoute component={CompletedJourneys} />} />
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
        <Route path="/admin/emails" component={() => <ProtectedRoute component={AdminEmailPreviews} />} />

        <Route path="/design-system" component={ElementsOverview} />
        <Route path="/design-system/colors" component={ElementsColors} />
        <Route path="/design-system/typography" component={ElementsTypography} />
        <Route path="/design-system/spacing" component={ElementsSpacing} />
        <Route path="/design-system/layout" component={ElementsLayout} />
        <Route path="/design-system/shadows" component={ElementsShadows} />
        <Route path="/design-system/animations" component={ElementsAnimations} />

        <Route path="/design-system/ui" component={UIOverview} />
        <Route path="/design-system/ui/button" component={UIButton} />
        <Route path="/design-system/ui/badge" component={UIBadge} />
        <Route path="/design-system/ui/pill" component={UIPill} />
        <Route path="/design-system/ui/input" component={UIInput} />
        <Route path="/design-system/ui/textarea" component={UITextarea} />
        <Route path="/design-system/ui/label" component={UILabel} />
        <Route path="/design-system/ui/checkbox" component={UICheckbox} />
        <Route path="/design-system/ui/switch" component={UISwitch} />
        <Route path="/design-system/ui/radio-group" component={UIRadioGroup} />
        <Route path="/design-system/ui/select" component={UISelect} />
        <Route path="/design-system/ui/calendar" component={UICalendar} />
        <Route path="/design-system/ui/card" component={UICard} />
        <Route path="/design-system/ui/separator" component={UISeparator} />
        <Route path="/design-system/ui/table" component={UITable} />
        <Route path="/design-system/ui/tabs" component={UITabs} />
        <Route path="/design-system/ui/breadcrumb" component={UIBreadcrumb} />
        <Route path="/design-system/ui/dropdown-menu" component={UIDropdownMenu} />
        <Route path="/design-system/ui/overlay" component={UIOverlay} />
        <Route path="/design-system/ui/dialog" component={UIDialog} />
        <Route path="/design-system/ui/alert-dialog" component={UIAlertDialog} />
        <Route path="/design-system/ui/popover" component={UIPopover} />
        <Route path="/design-system/ui/sheet" component={UISheet} />
        <Route path="/design-system/ui/drawer" component={UIDrawer} />
        <Route path="/design-system/ui/tooltip" component={UITooltip} />
        <Route path="/design-system/ui/avatar" component={UIAvatar} />
        <Route path="/design-system/ui/skeleton" component={UISkeleton} />
        <Route path="/design-system/ui/progress" component={UIProgress} />
        <Route path="/design-system/ui/spinner" component={UISpinner} />
        <Route path="/design-system/ui/alert" component={UIAlert} />
        <Route path="/design-system/ui/toast" component={UIToast} />
        <Route path="/design-system/ui/accordion" component={UIAccordion} />
        <Route path="/design-system/ui/animated-container" component={UIAnimatedContainer} />
        <Route path="/design-system/ui/rich-text-editor" component={UIRichTextEditor} />

        <Route path="/design-system/components" component={ComponentsOverview} />
        <Route path="/design-system/components/page-header" component={ComponentPageHeader} />
        <Route path="/design-system/components/empty-state" component={ComponentEmptyState} />
        <Route path="/design-system/components/search-bar" component={ComponentSearchBar} />
        <Route path="/design-system/components/binder-filter-bar" component={ComponentBinderFilterBar} />
        <Route path="/design-system/components/binder-card" component={ComponentBinderCard} />
        <Route path="/design-system/components/share-dialog" component={ComponentShareDialog} />
        <Route path="/design-system/components/avatar-upload" component={ComponentAvatarUpload} />
        <Route path="/design-system/components/upgrade-prompt" component={ComponentUpgradePrompt} />
        <Route path="/design-system/components/generating-week-placeholder" component={ComponentGeneratingWeekPlaceholder} />
        <Route path="/design-system/components/error-boundary" component={ComponentErrorBoundary} />
        <Route path="/design-system/components/curator-binder-card" component={ComponentCuratorBinderCard} />
        <Route path="/design-system/components/review-queue-card" component={ComponentReviewQueueCard} />
        <Route path="/design-system/components/onboarding-checklist" component={ComponentOnboardingChecklist} />
        <Route path="/design-system/components/pro-onboarding-checklist" component={ComponentProOnboardingChecklist} />
        <Route path="/design-system/components/credits-card" component={ComponentCreditsCard} />
        <Route path="/design-system/components/binder-review-status-card" component={ComponentBinderReviewStatusCard} />
        <Route path="/design-system/components/feedback-card" component={ComponentFeedbackCard} />
        <Route path="/design-system/components/curator-recruit-card" component={ComponentCuratorRecruitCard} />
        <Route path="/design-system/components/item-list" component={ComponentItemList} />

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
