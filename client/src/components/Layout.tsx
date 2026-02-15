import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { BookOpen, User, LogOut, Bug, Menu, X } from 'lucide-react';
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
  const { user, isAuthenticated, logout, completeActiveSyllabus } = useStore();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-text selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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
                        location === "/" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/catalog")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/catalog" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Catalog</span>
                    </button>
                    <button
                      onClick={() => handleMobileNavClick("/creator")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location.startsWith("/creator") ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">Curator Studio</span>
                    </button>
                    <div className="border-t my-4" />
                    <button
                      onClick={() => handleMobileNavClick("/profile")}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        location === "/profile" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">Edit Profile</span>
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            {/* Logo - always visible */}
            <Link href={isAuthenticated ? "/" : "/welcome"}>
              <span className="font-display text-2xl font-medium tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 md:gap-6 cursor-pointer">
                <BookOpen className="h-6 w-6 text-primary hidden md:block" />
                <span className="flex items-center gap-2">
                  <span>Syllabind</span>
                  <span className="text-[10px] font-text font-bold text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded-md align-middle">BETA</span>
                </span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated && (
                <>
                  <Link href="/">
                    <a className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" ? "text-primary" : "text-muted-foreground")}>
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/catalog">
                    <a className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/catalog" ? "text-primary" : "text-muted-foreground")}>
                      Catalog
                    </a>
                  </Link>
                  <Link href="/creator">
                    <a className={cn("text-sm font-medium transition-colors hover:text-primary", location.startsWith("/creator") ? "text-primary" : "text-muted-foreground")}>
                      Curator Studio
                    </a>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/50">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#ffffff]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={completeActiveSyllabus}>
                    <Bug className="mr-2 h-4 w-4" />
                    <span>Debug: Complete Syllabus</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                {location !== '/login' && (
                  <>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        const element = document.getElementById('curate');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.location.href = '/welcome#curate';
                        }
                      }}
                      className="hidden md:inline-flex"
                    >
                      Apply to Curate
                    </Button>
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
      <main className="container mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>
    </div>
  );
}
