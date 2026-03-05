import {
  PageTitle,
  Section,
  VariantRow,
  StateCell,
  StateGrid,
  ThemeBlock,
} from "../lib/showcase";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Info,
  Terminal,
  BookOpen,
  FileText,
  Settings,
  User,
  Search,
  Calculator,
  Calendar as CalendarIcon,
  Smile,
  CreditCard,
  Mail,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit,
  X,
} from "lucide-react";

function ComponentsContent() {
  return (
    <>
      {/* CARD */}
      <Section title="Card">
        <StateGrid columns={3}>
          <StateCell label="Default">
            <Card className="w-[280px]">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Card content with some text.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </StateCell>
          <StateCell label="With Image">
            <Card className="w-[280px] overflow-hidden">
              <div className="h-[140px] bg-muted" />
              <CardHeader>
                <CardTitle>Image Card</CardTitle>
                <CardDescription>Card with image placeholder</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Some content below the image.
                </p>
              </CardContent>
            </Card>
          </StateCell>
          <StateCell label="Loading (Skeleton)">
            <Card className="w-[280px]">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </CardContent>
            </Card>
          </StateCell>
        </StateGrid>
      </Section>

      {/* ACCORDION */}
      <Section title="Accordion">
        <StateGrid columns={2}>
          <StateCell label="All Collapsed">
            <Accordion type="multiple" className="w-[320px]">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that match the other
                  components.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>
                  Yes. It's animated by default.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </StateCell>
          <StateCell label="One Expanded">
            <Accordion
              type="multiple"
              defaultValue={["item-1"]}
              className="w-[320px]"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>
                  Yes. It's animated by default.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </StateCell>
        </StateGrid>
      </Section>

      {/* TABS */}
      <Section title="Tabs">
        <StateGrid columns={2}>
          <StateCell label="Tab 1 Active">
            <Tabs defaultValue="account" className="w-[320px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Make changes to your account here.
                </p>
              </TabsContent>
            </Tabs>
          </StateCell>
          <StateCell label="Tab 2 Active">
            <Tabs defaultValue="password" className="w-[320px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="password" className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Change your password here.
                </p>
              </TabsContent>
            </Tabs>
          </StateCell>
        </StateGrid>
      </Section>

      {/* DIALOG (static mockup) */}
      <Section title="Dialog (Static Mockup)">
        <StateGrid columns={2}>
          <StateCell label="Default Dialog">
            <div className="w-[400px] rounded-lg border bg-background p-6 shadow-lg">
              <div className="mb-1.5 text-lg font-semibold">Edit Profile</div>
              <p className="mb-4 text-sm text-muted-foreground">
                Make changes to your profile here. Click save when you're done.
              </p>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input defaultValue="Jane Smith" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Username</Label>
                  <Input defaultValue="@janesmith" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </div>
          </StateCell>
          <StateCell label="Destructive Dialog">
            <div className="w-[400px] rounded-lg border bg-background p-6 shadow-lg">
              <div className="mb-1.5 text-lg font-semibold">Are you sure?</div>
              <p className="mb-4 text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* ALERT */}
      <Section title="Alert">
        <StateGrid columns={2}>
          <StateCell label="Default">
            <Alert className="w-[400px]">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components to your app using the CLI.
              </AlertDescription>
            </Alert>
          </StateCell>
          <StateCell label="Destructive">
            <Alert variant="destructive" className="w-[400px]">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Your session has expired. Please log in again.
              </AlertDescription>
            </Alert>
          </StateCell>
        </StateGrid>
      </Section>

      {/* AVATAR */}
      <Section title="Avatar">
        <VariantRow label="Sizes & States">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {/* Fallback */}
          <Avatar className="h-10 w-10">
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10">
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </VariantRow>
        <VariantRow label="Avatar Group (overlapping)">
          <div className="flex -space-x-3">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarFallback className="text-xs">+3</AvatarFallback>
            </Avatar>
          </div>
        </VariantRow>
      </Section>

      {/* TABLE */}
      <Section title="Table">
        <div className="w-full max-w-[600px] rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">Alice Johnson</TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell>
                  <Checkbox defaultChecked />
                </TableCell>
                <TableCell className="font-medium">Bob Smith</TableCell>
                <TableCell>
                  <Badge variant="outline">Pending</Badge>
                </TableCell>
                <TableCell className="text-right">$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">Carol Williams</TableCell>
                <TableCell>
                  <Badge variant="destructive">Overdue</Badge>
                </TableCell>
                <TableCell className="text-right">$350.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* BREADCRUMB */}
      <Section title="Breadcrumb">
        <StateGrid columns={2}>
          <StateCell label="2-level">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </StateCell>
          <StateCell label="4-level with truncation">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </StateCell>
        </StateGrid>
      </Section>

      {/* TOOLTIP (static mockup) */}
      <Section title="Tooltip (Static Mockup)">
        <VariantRow>
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <div
              key={side}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {side}
              </span>
              <div className="relative inline-block">
                <Button variant="outline" size="sm">
                  Hover me
                </Button>
                <div
                  className={`absolute z-10 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md ${
                    side === "top"
                      ? "bottom-full left-1/2 mb-2 -translate-x-1/2"
                      : side === "bottom"
                        ? "left-1/2 top-full mt-2 -translate-x-1/2"
                        : side === "left"
                          ? "right-full top-1/2 mr-2 -translate-y-1/2"
                          : "left-full top-1/2 ml-2 -translate-y-1/2"
                  }`}
                >
                  Tooltip {side}
                </div>
              </div>
            </div>
          ))}
        </VariantRow>
      </Section>

      {/* POPOVER (static mockup) */}
      <Section title="Popover (Static Mockup)">
        <div className="inline-block">
          <div className="w-[320px] rounded-lg border bg-popover p-4 shadow-md">
            <div className="mb-4 space-y-1">
              <h4 className="font-medium leading-none">Dimensions</h4>
              <p className="text-sm text-muted-foreground">
                Set the dimensions for the layer.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Width</Label>
                <Input defaultValue="100%" className="col-span-2" />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Height</Label>
                <Input defaultValue="25px" className="col-span-2" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* SHEET (static mockup) */}
      <Section title="Sheet (Static Mockup — Right Panel)">
        <div className="relative h-[300px] w-full max-w-[600px] overflow-hidden rounded-lg border bg-muted/30">
          {/* Dim background */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Sheet panel */}
          <div className="absolute right-0 top-0 h-full w-[300px] border-l bg-background p-6 shadow-lg">
            <button className="absolute right-4 top-4 rounded-sm opacity-70">
              <X className="h-4 w-4" />
            </button>
            <div className="mb-1.5 text-lg font-semibold">Sheet Title</div>
            <p className="mb-4 text-sm text-muted-foreground">
              Sheet description and content goes here.
            </p>
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input defaultValue="Jane Smith" />
              </div>
              <Button className="w-full">Save</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* DROPDOWN MENU (static mockup) */}
      <Section title="Dropdown Menu (Static Mockup)">
        <StateGrid columns={2}>
          <StateCell label="Standard Menu">
            <div className="w-[220px] rounded-md border bg-popover p-1 shadow-md">
              <div className="px-2 py-1.5 text-sm font-semibold">
                My Account
              </div>
              <Separator className="my-1" />
              <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                <User className="mr-2 h-4 w-4" /> Profile
              </button>
              <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                <CreditCard className="mr-2 h-4 w-4" /> Billing
              </button>
              <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </button>
              <Separator className="my-1" />
              <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </button>
            </div>
          </StateCell>
          <StateCell label="With Checkboxes & Radio">
            <div className="w-[220px] rounded-md border bg-popover p-1 shadow-md">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Appearance
              </div>
              <Separator className="my-1" />
              <div className="flex items-center rounded-sm px-2 py-1.5 text-sm">
                <Checkbox className="mr-2" defaultChecked /> Status Bar
              </div>
              <div className="flex items-center rounded-sm px-2 py-1.5 text-sm">
                <Checkbox className="mr-2" /> Activity Bar
              </div>
              <div className="flex items-center rounded-sm px-2 py-1.5 text-sm">
                <Checkbox className="mr-2" defaultChecked /> Panel
              </div>
              <Separator className="my-1" />
              <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                <Mail className="mr-2 h-4 w-4" /> Disabled Item
              </button>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* CALENDAR */}
      <Section title="Calendar">
        <StateGrid columns={2}>
          <StateCell label="Current Month">
            <Calendar className="rounded-md border" />
          </StateCell>
          <StateCell label="Selected Date">
            <Calendar
              selected={new Date(2026, 2, 15)}
              className="rounded-md border"
            />
          </StateCell>
        </StateGrid>
      </Section>

      {/* COMMAND */}
      <Section title="Command Palette">
        <div className="w-[400px] rounded-lg border shadow-md">
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                </CommandItem>
                <CommandItem>
                  <Smile className="mr-2 h-4 w-4" /> Search Emoji
                </CommandItem>
                <CommandItem>
                  <Calculator className="mr-2 h-4 w-4" /> Calculator
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <User className="mr-2 h-4 w-4" /> Profile
                </CommandItem>
                <CommandItem>
                  <CreditCard className="mr-2 h-4 w-4" /> Billing
                </CommandItem>
                <CommandItem>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>

      {/* EMPTY STATE */}
      <Section title="Empty State">
        <StateGrid columns={2}>
          <StateCell label="Icon Variant">
            <Empty className="w-[320px] border">
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No binders yet</EmptyTitle>
                <EmptyDescription>
                  Get started by creating your first binder.
                </EmptyDescription>
              </EmptyHeader>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Binder
              </Button>
            </Empty>
          </StateCell>
          <StateCell label="Default Variant">
            <Empty className="w-[320px] border">
              <EmptyMedia>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search or filter criteria.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </StateCell>
        </StateGrid>
      </Section>

      {/* SCROLL AREA */}
      <Section title="Scroll Area">
        <ScrollArea className="h-[200px] w-[300px] rounded-md border p-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="py-2 text-sm">
              Item {i + 1} — Scrollable content line
            </div>
          ))}
        </ScrollArea>
      </Section>

      {/* TOAST (static mockup) */}
      <Section title="Toast (Static Mockup)">
        <StateGrid columns={2}>
          <StateCell label="Success">
            <div className="w-[360px] rounded-lg border bg-background p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold">Success</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Your changes have been saved.
                  </div>
                </div>
                <button className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </StateCell>
          <StateCell label="Error with Action">
            <div className="w-[360px] rounded-lg border border-destructive bg-background p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-destructive">
                    Error
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Something went wrong. Please try again.
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            </div>
          </StateCell>
        </StateGrid>
      </Section>
    </>
  );
}

export function ComponentsPage() {
  return (
    <div className="min-h-screen bg-background p-12 font-text text-foreground">
      <PageTitle subtitle="Cards, Dialogs, Accordions, Tables & Overlays — All States">
        Components
      </PageTitle>

      <ThemeBlock mode="light">
        <ComponentsContent />
      </ThemeBlock>

      <div className="h-16" />

      <ThemeBlock mode="dark">
        <ComponentsContent />
      </ThemeBlock>
    </div>
  );
}
