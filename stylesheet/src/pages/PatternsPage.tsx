import { useState } from "react";
import {
  PageTitle,
  Section,
  BreakpointFrame,
  ThemeBlock,
} from "../lib/showcase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BREAKPOINTS = [
  { width: 1280, label: "Desktop" },
  { width: 768, label: "Tablet" },
  { width: 375, label: "Mobile" },
] as const;

/* ── Form Pattern ───────────────────────────────────────── */
function FormPattern({ state }: { state: "empty" | "filled" | "error" }) {
  return (
    <div className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Create Account</h3>
      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label>
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            defaultValue={state === "empty" ? "" : "Jane Smith"}
            placeholder="Enter your name"
            className={state === "error" ? "border-destructive" : ""}
          />
          {state === "error" && (
            <p className="text-sm text-destructive">Name is required</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label>
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            defaultValue={state === "filled" ? "jane@example.com" : state === "error" ? "invalid" : ""}
            placeholder="you@example.com"
            className={state === "error" ? "border-destructive" : ""}
          />
          {state === "error" && (
            <p className="text-sm text-destructive">
              Enter a valid email address
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label>Role</Label>
          <Select defaultValue={state !== "empty" ? "reader" : undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reader">Reader</SelectItem>
              <SelectItem value="curator">Curator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="terms"
            defaultChecked={state === "filled"}
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the terms and conditions
          </Label>
        </div>
        <Button className="w-full">Create Account</Button>
      </div>
    </div>
  );
}

/* ── Data Table Pattern ─────────────────────────────────── */
function DataTablePattern({ state }: { state: "data" | "empty" | "loading" }) {
  if (state === "loading") {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="rounded-lg border">
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Enrollments</h3>
          <Button size="sm">
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        <Empty className="border">
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No enrollments yet</EmptyTitle>
            <EmptyDescription>
              Enrollments will appear here once readers sign up.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enrollments</h3>
        <Button size="sm">
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reader</TableHead>
              <TableHead>Binder</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Alice Johnson</TableCell>
              <TableCell>Digital Minimalism</TableCell>
              <TableCell>75%</TableCell>
              <TableCell>
                <Badge variant="secondary">Active</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bob Smith</TableCell>
              <TableCell>Systems Thinking</TableCell>
              <TableCell>100%</TableCell>
              <TableCell>
                <Badge>Completed</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Carol Williams</TableCell>
              <TableCell>Digital Minimalism</TableCell>
              <TableCell>25%</TableCell>
              <TableCell>
                <Badge variant="outline">In Progress</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1-3 of 24</span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            1
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            2
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            3
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Page Header Pattern ────────────────────────────────── */
function PageHeaderPattern() {
  return (
    <div className="border-b p-6">
      <button className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display">Digital Minimalism</h1>
          <p className="mt-1 text-muted-foreground">
            A 4-week guide to reclaiming your attention
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Preview</Button>
          <Button>Publish</Button>
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> 4 weeks
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-4 w-4" /> 12 steps
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" /> 24 readers
        </span>
      </div>
    </div>
  );
}

/* ── Card Grid Pattern ──────────────────────────────────── */
function CardGridPattern({ width }: { width: number }) {
  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const cards = [
    {
      title: "Digital Minimalism",
      desc: "A 4-week guide to reclaiming your attention",
      weeks: 4,
      readers: 24,
    },
    {
      title: "Systems Thinking 101",
      desc: "Learn to see the forest and the trees",
      weeks: 6,
      readers: 18,
    },
    {
      title: "Creative Writing",
      desc: "Unlock your storytelling potential",
      weeks: 8,
      readers: 12,
    },
  ];

  return (
    <div className="p-6">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <Card key={card.title} className="hover-elevate">
            <div className="h-[120px] bg-muted" />
            <CardHeader>
              <CardTitle className="text-base">{card.title}</CardTitle>
              <CardDescription>{card.desc}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {card.weeks} weeks
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {card.readers} readers
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Filter Bar Pattern ─────────────────────────────────── */
function FilterBarPattern() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5">
          <button className="rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background">
            All
          </button>
          <button className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
            Public
          </button>
          <button className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
            Unlisted
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search binders..." className="pl-10" />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <button className="rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          All
        </button>
        {["Productivity", "Health", "Technology", "Art"].map((cat) => (
          <button
            key={cat}
            className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">12 binders found</div>
    </div>
  );
}

/* ── Navigation Header Pattern ──────────────────────────── */
function NavHeaderPattern({ width }: { width: number }) {
  const isMobile = width < 640;
  return (
    <div className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-display font-bold">Syllabind</span>
        {!isMobile && (
          <nav className="flex gap-4 text-sm">
            <a href="#" className="font-medium text-foreground">
              Dashboard
            </a>
            <a href="#" className="text-muted-foreground">
              Catalog
            </a>
            <a href="#" className="text-muted-foreground">
              Pricing
            </a>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isMobile ? (
          <Button variant="ghost" size="icon">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </>
        )}
      </div>
    </div>
  );
}

function PatternsContent() {
  return (
    <>
      {/* FORM PATTERN */}
      <Section title="Form Pattern">
        {(["empty", "filled", "error"] as const).map((state) => (
          <div key={state} className="mb-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {state}
            </div>
            <div className="flex flex-wrap gap-6">
              {BREAKPOINTS.map((bp) => (
                <BreakpointFrame
                  key={bp.width}
                  width={bp.width > 600 ? 400 : bp.width}
                  label={bp.label}
                >
                  <FormPattern state={state} />
                </BreakpointFrame>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* DATA TABLE */}
      <Section title="Data Table Pattern">
        {(["data", "empty", "loading"] as const).map((state) => (
          <div key={state} className="mb-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {state}
            </div>
            <div className="flex flex-wrap gap-6">
              {BREAKPOINTS.map((bp) => (
                <BreakpointFrame
                  key={bp.width}
                  width={Math.min(bp.width, 800)}
                  label={bp.label}
                >
                  <DataTablePattern state={state} />
                </BreakpointFrame>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* PAGE HEADER */}
      <Section title="Page Header Pattern">
        <div className="flex flex-wrap gap-6">
          {BREAKPOINTS.map((bp) => (
            <BreakpointFrame key={bp.width} width={bp.width} label={bp.label}>
              <PageHeaderPattern />
            </BreakpointFrame>
          ))}
        </div>
      </Section>

      {/* CARD GRID */}
      <Section title="Card Grid Pattern">
        <div className="flex flex-wrap gap-6">
          {BREAKPOINTS.map((bp) => (
            <BreakpointFrame key={bp.width} width={bp.width} label={bp.label}>
              <CardGridPattern width={bp.width} />
            </BreakpointFrame>
          ))}
        </div>
      </Section>

      {/* FILTER BAR */}
      <Section title="Filter Bar Pattern">
        <div className="flex flex-wrap gap-6">
          {BREAKPOINTS.map((bp) => (
            <BreakpointFrame key={bp.width} width={bp.width} label={bp.label}>
              <FilterBarPattern />
            </BreakpointFrame>
          ))}
        </div>
      </Section>

      {/* NAVIGATION HEADER */}
      <Section title="Navigation Header">
        <div className="flex flex-wrap gap-6">
          {BREAKPOINTS.map((bp) => (
            <BreakpointFrame key={bp.width} width={bp.width} label={bp.label}>
              <NavHeaderPattern width={bp.width} />
            </BreakpointFrame>
          ))}
        </div>
      </Section>

      {/* EMPTY STATE PATTERN */}
      <Section title="Empty State Pattern">
        <div className="flex flex-wrap gap-6">
          {BREAKPOINTS.map((bp) => (
            <BreakpointFrame key={bp.width} width={bp.width} label={bp.label}>
              <div className="p-6">
                <Empty className="border">
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No binders yet</EmptyTitle>
                    <EmptyDescription>
                      Get started by creating your first binder. You can add
                      weeks and steps to build a structured learning path.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Your First Binder
                  </Button>
                </Empty>
              </div>
            </BreakpointFrame>
          ))}
        </div>
      </Section>
    </>
  );
}

export function PatternsPage() {
  return (
    <div className="min-h-screen bg-background p-12 font-text text-foreground">
      <PageTitle subtitle="Composed Layouts at Desktop, Tablet & Mobile Breakpoints">
        Patterns
      </PageTitle>

      <ThemeBlock mode="light">
        <PatternsContent />
      </ThemeBlock>

      <div className="h-16" />

      <ThemeBlock mode="dark">
        <PatternsContent />
      </ThemeBlock>
    </div>
  );
}
