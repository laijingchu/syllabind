import { useRef, useEffect, useCallback, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { BookOpen, Palette, Type, Square, Layers, Play, LayoutGrid, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';


const elementsNav = [
  { href: '/design-system', label: 'Overview', icon: BookOpen },
  { href: '/design-system/colors', label: 'Colors', icon: Palette },
  { href: '/design-system/typography', label: 'Typography', icon: Type },
  { href: '/design-system/spacing', label: 'Spacing & Radius', icon: Square },
  { href: '/design-system/layout', label: 'Layout Grid', icon: LayoutGrid },
  { href: '/design-system/shadows', label: 'Shadows & Elevation', icon: Layers },
  { href: '/design-system/animations', label: 'Animations', icon: Play },
];

const uiNav = [
  { category: 'Buttons & Actions', items: [
    { href: '/design-system/ui/button', label: 'Button' },
    { href: '/design-system/ui/badge', label: 'Badge' },
    { href: '/design-system/ui/pill', label: 'Pill' },
  ]},
  { category: 'Form Inputs', items: [
    { href: '/design-system/ui/input', label: 'Input' },
    { href: '/design-system/ui/textarea', label: 'Textarea' },
    { href: '/design-system/ui/label', label: 'Label' },
    { href: '/design-system/ui/checkbox', label: 'Checkbox' },
    { href: '/design-system/ui/switch', label: 'Switch' },
    { href: '/design-system/ui/radio-group', label: 'Radio Group' },
    { href: '/design-system/ui/select', label: 'Select' },
    { href: '/design-system/ui/calendar', label: 'Calendar' },
  ]},
  { category: 'Layout', items: [
    { href: '/design-system/ui/card', label: 'Card' },
    { href: '/design-system/ui/separator', label: 'Separator' },
    { href: '/design-system/ui/table', label: 'Table' },
  ]},
  { category: 'Navigation', items: [
    { href: '/design-system/ui/tabs', label: 'Tabs' },
    { href: '/design-system/ui/breadcrumb', label: 'Breadcrumb' },
    { href: '/design-system/ui/dropdown-menu', label: 'Dropdown Menu' },
  ]},
  { category: 'Overlays', items: [
    { href: '/design-system/ui/overlay', label: 'Overlay' },
    { href: '/design-system/ui/dialog', label: 'Dialog' },
    { href: '/design-system/ui/alert-dialog', label: 'Alert Dialog' },
    { href: '/design-system/ui/popover', label: 'Popover' },
    { href: '/design-system/ui/sheet', label: 'Sheet' },
    { href: '/design-system/ui/drawer', label: 'Drawer' },
    { href: '/design-system/ui/tooltip', label: 'Tooltip' },
  ]},
  { category: 'Data Display', items: [
    { href: '/design-system/ui/avatar', label: 'Avatar' },
    { href: '/design-system/ui/skeleton', label: 'Skeleton' },
    { href: '/design-system/ui/progress', label: 'Progress' },
    { href: '/design-system/ui/spinner', label: 'Spinner' },
  ]},
  { category: 'Feedback', items: [
    { href: '/design-system/ui/alert', label: 'Alert' },
    { href: '/design-system/ui/toast', label: 'Toast' },
    { href: '/design-system/ui/accordion', label: 'Accordion' },
  ]},
  { category: 'Advanced', items: [
    { href: '/design-system/ui/animated-container', label: 'Animated Container' },
    { href: '/design-system/ui/rich-text-editor', label: 'Rich Text Editor' },
  ]},
];

const componentsNav = [
  { href: '/design-system/components/avatar-upload', label: 'AvatarUpload' },
  { href: '/design-system/components/binder-card', label: 'BinderCard' },
  { href: '/design-system/components/binder-filter-bar', label: 'BinderFilterBar' },
  { href: '/design-system/components/curator-binder-card', label: 'CuratorBinderCard' },
  { href: '/design-system/components/empty-state', label: 'EmptyState' },
  { href: '/design-system/components/error-boundary', label: 'ErrorBoundary' },
  { href: '/design-system/components/generating-week-placeholder', label: 'GeneratingWeekPlaceholder' },
  { href: '/design-system/components/page-header', label: 'PageHeader' },
  { href: '/design-system/components/review-queue-card', label: 'ReviewQueueCard' },
  { href: '/design-system/components/onboarding-checklist', label: 'OnboardingChecklist' },
  { href: '/design-system/components/credits-card', label: 'CreditsCard' },
  { href: '/design-system/components/binder-review-status-card', label: 'BinderReviewStatusCard' },
  { href: '/design-system/components/feedback-card', label: 'FeedbackCard' },
  { href: '/design-system/components/curator-recruit-card', label: 'CuratorRecruitCard' },
  { href: '/design-system/components/item-list', label: 'ItemList' },
  { href: '/design-system/components/search-bar', label: 'SearchBar' },
  { href: '/design-system/components/share-dialog', label: 'ShareDialog' },
  { href: '/design-system/components/upgrade-prompt', label: 'UpgradePrompt' },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border">
      <code>{children}</code>
    </pre>
  );
}

function TokenRow({ token, value, children }: { token: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 border-b border-border last:border-0">
      <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[120px] md:min-w-[200px] shrink-0">{token}</code>
      {value && <span className="text-base text-muted-foreground shrink-0">{value}</span>}
      {children}
    </div>
  );
}

export { CodeBlock, TokenRow };

function SidebarNav({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <>
      <h2 className="font-display text-lg font-medium mb-1">Design System</h2>

      {/* Elements section */}
      <p className="text-sm text-muted-foreground mb-2 mt-4 uppercase tracking-wider font-medium">Elements</p>
      <nav className="flex flex-col gap-0.5">
        {elementsNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate}>
            <span className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
              location === href
                ? "bg-highlight text-highlight-foreground font-medium"
                : "text-foreground/70 hover:text-foreground hover:bg-muted"
            )}>
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </Link>
        ))}
      </nav>

      {/* UI section */}
      <p className="text-sm text-muted-foreground mb-2 mt-6 uppercase tracking-wider font-medium">UI Components</p>
      <nav className="flex flex-col gap-3">
        <Link href="/design-system/ui" onClick={onNavigate}>
          <span className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
            location === '/design-system/ui'
              ? "bg-highlight text-highlight-foreground font-medium"
              : "text-foreground/70 hover:text-foreground hover:bg-muted"
          )}>
            Overview
          </span>
        </Link>
        {uiNav.map(({ category, items }) => (
          <div key={category}>
            <p className="text-xs text-muted-foreground px-3 mb-1 uppercase tracking-wider font-medium">{category}</p>
            <div className="flex flex-col gap-0.5 ml-2">
              {items.map(({ href, label }) => (
                <Link key={href} href={href} onClick={onNavigate}>
                  <span className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                    location === href
                      ? "bg-highlight text-highlight-foreground font-medium"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  )}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Components */}
      <p className="text-sm text-muted-foreground mb-2 mt-6 uppercase tracking-wider font-medium">Components</p>
      <nav className="flex flex-col gap-0.5">
        <Link href="/design-system/components" onClick={onNavigate}>
          <span className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
            location === '/design-system/components'
              ? "bg-highlight text-highlight-foreground font-medium"
              : "text-foreground/70 hover:text-foreground hover:bg-muted"
          )}>
            Overview
          </span>
        </Link>
        {componentsNav.map(({ href, label }) => (
          <Link key={href} href={href} onClick={onNavigate}>
            <span className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
              location === href
                ? "bg-highlight text-highlight-foreground font-medium"
                : "text-foreground/70 hover:text-foreground hover:bg-muted"
            )}>
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}

// Persist sidebar scroll position across route changes
const sidebarScrollTop = { current: 0 };

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarScrollTop.current;
    }
  }, [location]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);

  const handleSidebarScroll = useCallback(() => {
    if (sidebarRef.current) {
      sidebarScrollTop.current = sidebarRef.current.scrollTop;
    }
  }, []);

  return (
    <div className="design-system-layout grid-12" style={{ height: 'calc(100vh - 7.5rem)' }}>
      {/* Desktop sidebar — 3 of 12 columns */}
      <aside ref={sidebarRef} onScroll={handleSidebarScroll} className="design-system-nav col-span-3 hidden md:block overflow-y-auto py-16">
        <SidebarNav location={location} />
      </aside>

      <main className="design-system-content col-span-12 md:col-span-9 min-w-0 overflow-y-auto py-16">
        <div className="md:max-w-[calc((100%-8*var(--grid-gutter))/9*8+7*var(--grid-gutter))]">
          {/* Mobile nav trigger — aligned with page heading */}
          <div className="md:hidden flex justify-start mb-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="tertiary" size="sm">
                  <Menu className="h-4 w-4 mr-1.5" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="sr-only">Design System Navigation</SheetTitle>
                </SheetHeader>
                <SidebarNav location={location} onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
