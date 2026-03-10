import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { BookOpen, User, LogOut, Menu, X, Bug, Settings, CreditCard, Loader2, Sun, Moon, Mail } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, isLoggingOut, hasUnreadNotifications } = useStore();

  // Ctrl+Shift+G toggles baseline grid overlay
  // Ctrl+Shift+C toggles column grid overlay
  const [showBaseline, setShowBaseline] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setShowBaseline(prev => !prev);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowColumns(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bugReportUrl, setBugReportUrl] = useState<string | null>(null);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const [getPaidToTeachUrl, setGetPaidToTeachUrl] = useState<string | null>(null);
  const [wipBadgeUrl, setWipBadgeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/site-settings/bug_report_url')
        .then(res => res.json())
        .then(data => setBugReportUrl(data.value || null))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-settings/terms_of_service_url').then(r => r.json()),
      fetch('/api/site-settings/privacy_policy_url').then(r => r.json()),
      fetch('/api/site-settings/get_paid_to_teach_url').then(r => r.json()),
      fetch('/api/site-settings/wip_badge_url').then(r => r.json()),
    ])
      .then(([termsData, privacyData, teachData, wipData]) => {
        setTermsUrl(termsData.value || null);
        setPrivacyUrl(privacyData.value || null);
        setGetPaidToTeachUrl(teachData.value || null);
        setWipBadgeUrl(wipData.value || null);
      })
      .catch(() => {});
  }, []);

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-text selection:bg-highlight relative">
      {showBaseline && (
        <div
          aria-hidden
          className="absolute inset-0 z-[9999] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, hsl(200 80% 60% / 0.12) 0px, hsl(200 80% 60% / 0.12) 1px, transparent 1px, transparent 4px)',
          }}
        />
      )}
      {showColumns && (
        <div aria-hidden className="fixed inset-0 z-[9998] pointer-events-none">
          <div className="grid-container h-full">
            <div className="grid-12 h-full">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    background: 'hsl(340 80% 60% / 0.07)',
                    borderLeft: '1px solid hsl(340 80% 60% / 0.2)',
                    borderRight: '1px solid hsl(340 80% 60% / 0.2)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">
              Come back soon!<span className="inline-flex w-[1.5em]"><span className="animate-ellipsis" /></span>
            </span>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border">
        <div className="grid-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Mobile hamburger menu */}
            {isAuthenticated && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="-mr-5">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-display">Syllabind</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-8">
                    <button
                      onClick={() => handleMobileNavClick("/")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/" ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/catalog")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/catalog" ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Catalog</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/curator")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location.startsWith("/curator") ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Curator Studio</span>
                    </button>
                    <div className="border-t my-4" />
                    <button
                      onClick={() => handleMobileNavClick("/profile")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/profile" ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">Edit Profile</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/settings")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/settings" ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Account Settings</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/billing")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/billing" ? "bg-highlight text-primary" : "hover:bg-muted"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Billing</span>
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* Logo - always visible */}
            <Link href="/welcome">
              <span className="font-display text-2xl font-medium tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 md:gap-6 cursor-pointer">
                <BookOpen className="h-6 w-6 text-primary hidden md:block" />
                <span className="flex items-center gap-2">
                  <span>Syllabind</span>
                  {wipBadgeUrl ? (
                    <a href={wipBadgeUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-text font-bold text-warning bg-warning-surface border border-warning-border px-1.5 py-0.5 rounded-md align-middle hover:bg-warning-surface/80 transition-colors">WIP</a>
                  ) : (
                    <span className="text-[10px] font-text font-bold text-warning bg-warning-surface border border-warning-border px-1.5 py-0.5 rounded-md align-middle">WIP</span>
                  )}
                </span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated && (
                <>
                  <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" ? "text-primary" : "text-muted-foreground")}>
                    Dashboard
                  </Link>
                  <Link href="/catalog" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/catalog" ? "text-primary" : "text-muted-foreground")}>
                    Catalog
                  </Link>
                  <span className="relative">
                    <Link href="/curator" className={cn("text-sm font-medium transition-colors hover:text-primary", location.startsWith("/curator") ? "text-primary" : "text-muted-foreground")}>
                      Curator Studio
                    </Link>
                    {hasUnreadNotifications && (
                      <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-danger-inverted" />
                    )}
                  </span>
                </>
              )}
              {(user || !import.meta.env.PROD) && (
                <Link href="/pricing" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/pricing" ? "text-primary" : "text-muted-foreground")}>
                  Pricing
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-primary" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {isAuthenticated && user ? (
              <>
              {bugReportUrl && (
                <a href={bugReportUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" title="Report a bug">
                    <Bug className="h-4 w-4" />
                    <span className="sr-only">Report a bug</span>
                  </Button>
                </a>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback>{(user.name || user.username || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                  </Link>
                  {user.isAdmin && (
                    <>
                      <Link href="/admin/settings">
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Settings</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/emails">
                        <DropdownMenuItem className="cursor-pointer">
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Email Previews</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {location !== '/login' && (
                  <>
                    {getPaidToTeachUrl && (
                      <Button
                        variant="ghost"
                        onClick={() => window.open(getPaidToTeachUrl, '_blank', 'noopener,noreferrer')}
                        className="hidden md:inline-flex"
                      >
                        💰 Give feedback
                      </Button>
                    )}
                    <Link href="/login?mode=signup">
                      <Button>Sign up / Log in</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className={cn("grid-container animate-in fade-in slide-in-from-bottom-4 duration-700", location.startsWith('/design-system') ? "pt-0 pb-0" : "py-8 md:py-12")}>
        {children}
      </main>
      <footer className={cn("site-footer border-t border-border", location.startsWith('/design-system') ? "mt-0" : "mt-12")}>
        <div className="grid-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Syllabind. All rights reserved.</p>
          <nav className="footer-links flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <a href={termsUrl || "/terms"} {...(termsUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href={privacyUrl || "/privacy"} {...(privacyUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="mailto:support@syllabind.com" className="hover:text-foreground transition-colors">Contact Us</a>
            <Link href="/design-system" className="hover:text-foreground transition-colors">Design System</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
