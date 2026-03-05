import { useState } from "react";
import {
  PageTitle,
  Section,
  VariantRow,
  StateCell,
  StateGrid,
  ThemeBlock,
} from "../lib/showcase";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react";

function ElementsContent() {
  return (
    <>
      {/* BUTTONS */}
      <Section title="Buttons">
        {(
          [
            "default",
            "secondary",
            "destructive",
            "outline",
            "ghost",
            "link",
          ] as const
        ).map((variant) => (
          <div key={variant} className="mb-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {variant}
            </div>
            {/* Sizes */}
            <VariantRow label="Sizes">
              <Button variant={variant} size="sm">
                Small
              </Button>
              <Button variant={variant} size="default">
                Default
              </Button>
              <Button variant={variant} size="lg">
                Large
              </Button>
              <Button variant={variant} size="icon">
                <Plus />
              </Button>
            </VariantRow>
            {/* States */}
            <StateGrid columns={4}>
              <StateCell label="Default">
                <Button variant={variant}>Button</Button>
              </StateCell>
              <StateCell label="Hover (simulated)">
                <div className="[&>button]:after:bg-[var(--elevate-1)] [&>button]:relative [&>button]:after:absolute [&>button]:after:inset-0 [&>button]:after:rounded-[inherit]">
                  <Button variant={variant}>Button</Button>
                </div>
              </StateCell>
              <StateCell label="Focus Visible">
                <Button
                  variant={variant}
                  className="outline-none ring-1 ring-ring"
                >
                  Button
                </Button>
              </StateCell>
              <StateCell label="Disabled">
                <Button variant={variant} disabled>
                  Button
                </Button>
              </StateCell>
            </StateGrid>
          </div>
        ))}

        {/* Special button variations */}
        <VariantRow label="With Icon">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button variant="ghost">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </VariantRow>

        <VariantRow label="Loading">
          <Button disabled>
            <Spinner className="mr-2" /> Loading...
          </Button>
          <Button variant="secondary" disabled>
            <Spinner className="mr-2" /> Saving...
          </Button>
        </VariantRow>
      </Section>

      {/* BADGES */}
      <Section title="Badges">
        <VariantRow>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </VariantRow>
      </Section>

      {/* INPUTS */}
      <Section title="Inputs">
        <StateGrid columns={3}>
          <StateCell label="Placeholder">
            <Input placeholder="Enter text..." className="max-w-[280px]" />
          </StateCell>
          <StateCell label="Filled">
            <Input defaultValue="Hello world" className="max-w-[280px]" />
          </StateCell>
          <StateCell label="Focused">
            <Input
              defaultValue="Focused input"
              className="max-w-[280px] border-primary"
            />
          </StateCell>
          <StateCell label="Disabled">
            <Input
              disabled
              defaultValue="Disabled"
              className="max-w-[280px]"
            />
          </StateCell>
          <StateCell label="With Label">
            <div className="grid w-full max-w-[280px] gap-1.5">
              <Label htmlFor="demo-input">Email</Label>
              <Input id="demo-input" placeholder="you@example.com" />
            </div>
          </StateCell>
          <StateCell label="Error">
            <div className="grid w-full max-w-[280px] gap-1.5">
              <Label htmlFor="error-input">Email</Label>
              <Input
                id="error-input"
                aria-invalid="true"
                className="border-destructive"
                defaultValue="invalid@"
              />
              <p className="text-sm text-destructive">
                Please enter a valid email
              </p>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* TEXTAREA */}
      <Section title="Textarea">
        <StateGrid columns={3}>
          <StateCell label="Placeholder">
            <Textarea
              placeholder="Write something..."
              className="max-w-[280px]"
            />
          </StateCell>
          <StateCell label="Filled">
            <Textarea
              defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore."
              className="max-w-[280px]"
            />
          </StateCell>
          <StateCell label="Disabled">
            <Textarea
              disabled
              defaultValue="Disabled textarea"
              className="max-w-[280px]"
            />
          </StateCell>
        </StateGrid>
      </Section>

      {/* CHECKBOX */}
      <Section title="Checkbox">
        <StateGrid columns={5}>
          <StateCell label="Unchecked">
            <div className="flex items-center gap-2">
              <Checkbox id="c1" />
              <Label htmlFor="c1">Accept terms</Label>
            </div>
          </StateCell>
          <StateCell label="Checked">
            <div className="flex items-center gap-2">
              <Checkbox id="c2" defaultChecked />
              <Label htmlFor="c2">Accept terms</Label>
            </div>
          </StateCell>
          <StateCell label="Indeterminate">
            <div className="flex items-center gap-2">
              <Checkbox id="c3" checked="indeterminate" />
              <Label htmlFor="c3">Select all</Label>
            </div>
          </StateCell>
          <StateCell label="Disabled Unchecked">
            <div className="flex items-center gap-2">
              <Checkbox id="c4" disabled />
              <Label htmlFor="c4" className="opacity-50">
                Disabled
              </Label>
            </div>
          </StateCell>
          <StateCell label="Disabled Checked">
            <div className="flex items-center gap-2">
              <Checkbox id="c5" defaultChecked disabled />
              <Label htmlFor="c5" className="opacity-50">
                Disabled
              </Label>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* RADIO GROUP */}
      <Section title="Radio Group">
        <StateGrid columns={3}>
          <StateCell label="Unselected">
            <RadioGroup>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="r1a" />
                <Label htmlFor="r1a">Option A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="r1b" />
                <Label htmlFor="r1b">Option B</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="c" id="r1c" />
                <Label htmlFor="r1c">Option C</Label>
              </div>
            </RadioGroup>
          </StateCell>
          <StateCell label="Selected">
            <RadioGroup defaultValue="b">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="r2a" />
                <Label htmlFor="r2a">Option A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="r2b" />
                <Label htmlFor="r2b">Option B</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="c" id="r2c" />
                <Label htmlFor="r2c">Option C</Label>
              </div>
            </RadioGroup>
          </StateCell>
          <StateCell label="Disabled">
            <RadioGroup defaultValue="a" disabled>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="r3a" />
                <Label htmlFor="r3a" className="opacity-50">
                  Option A
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="r3b" />
                <Label htmlFor="r3b" className="opacity-50">
                  Option B
                </Label>
              </div>
            </RadioGroup>
          </StateCell>
        </StateGrid>
      </Section>

      {/* SWITCH */}
      <Section title="Switch">
        <StateGrid columns={4}>
          <StateCell label="Off">
            <div className="flex items-center gap-2">
              <Switch id="s1" />
              <Label htmlFor="s1">Notifications</Label>
            </div>
          </StateCell>
          <StateCell label="On">
            <div className="flex items-center gap-2">
              <Switch id="s2" defaultChecked />
              <Label htmlFor="s2">Notifications</Label>
            </div>
          </StateCell>
          <StateCell label="Disabled Off">
            <div className="flex items-center gap-2">
              <Switch id="s3" disabled />
              <Label htmlFor="s3" className="opacity-50">
                Disabled
              </Label>
            </div>
          </StateCell>
          <StateCell label="Disabled On">
            <div className="flex items-center gap-2">
              <Switch id="s4" defaultChecked disabled />
              <Label htmlFor="s4" className="opacity-50">
                Disabled
              </Label>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* SELECT */}
      <Section title="Select">
        <StateGrid columns={3}>
          <StateCell label="Default">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select option..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </Select>
          </StateCell>
          <StateCell label="With Value">
            <Select defaultValue="b">
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </Select>
          </StateCell>
          <StateCell label="Disabled">
            <Select disabled>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Disabled" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
              </SelectContent>
            </Select>
          </StateCell>
        </StateGrid>
      </Section>

      {/* SLIDER */}
      <Section title="Slider">
        <StateGrid columns={3}>
          <StateCell label="Empty">
            <Slider defaultValue={[0]} max={100} className="w-[200px]" />
          </StateCell>
          <StateCell label="Mid">
            <Slider defaultValue={[50]} max={100} className="w-[200px]" />
          </StateCell>
          <StateCell label="Full">
            <Slider defaultValue={[100]} max={100} className="w-[200px]" />
          </StateCell>
          <StateCell label="Range (two handles)">
            <Slider
              defaultValue={[25, 75]}
              max={100}
              className="w-[200px]"
            />
          </StateCell>
          <StateCell label="Disabled">
            <Slider
              defaultValue={[50]}
              max={100}
              disabled
              className="w-[200px]"
            />
          </StateCell>
        </StateGrid>
      </Section>

      {/* TOGGLE / TOGGLE GROUP */}
      <Section title="Toggle & Toggle Group">
        <VariantRow label="Single Toggle">
          <Toggle aria-label="Bold">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Bold" data-state="on" className="toggle-elevate toggle-elevated">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Bold" disabled>
            <Bold className="h-4 w-4" />
          </Toggle>
        </VariantRow>

        <VariantRow label="Outline Toggle">
          <Toggle variant="outline" aria-label="Bold">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            variant="outline"
            aria-label="Bold"
            data-state="on"
            className="toggle-elevate toggle-elevated"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
        </VariantRow>

        <VariantRow label="Toggle Group">
          <ToggleGroup type="multiple" defaultValue={["bold"]}>
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </VariantRow>

        <VariantRow label="Toggle Group (single)">
          <ToggleGroup type="single" defaultValue="left">
            <ToggleGroupItem value="left" aria-label="Align Left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align Center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align Right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </VariantRow>
      </Section>

      {/* SEPARATOR */}
      <Section title="Separator">
        <VariantRow label="Horizontal">
          <div className="w-full max-w-[400px]">
            <div className="text-sm">Above separator</div>
            <Separator className="my-4" />
            <div className="text-sm">Below separator</div>
          </div>
        </VariantRow>
        <VariantRow label="Vertical">
          <div className="flex h-8 items-center gap-4">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Right</span>
          </div>
        </VariantRow>
      </Section>

      {/* SKELETON */}
      <Section title="Skeleton">
        <StateGrid columns={3}>
          <StateCell label="Card Skeleton">
            <div className="w-[200px] space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </StateCell>
          <StateCell label="Text Skeleton">
            <div className="w-[200px] space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </StateCell>
          <StateCell label="Avatar + Text">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
          </StateCell>
        </StateGrid>
      </Section>

      {/* SPINNER */}
      <Section title="Spinner">
        <VariantRow>
          <Spinner className="size-4" />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
        </VariantRow>
      </Section>

      {/* KBD */}
      <Section title="Kbd">
        <VariantRow>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>⇧</Kbd>
            <Kbd>⌘</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
        </VariantRow>
      </Section>

      {/* LABEL */}
      <Section title="Label">
        <StateGrid columns={3}>
          <StateCell label="Default">
            <Label>Default Label</Label>
          </StateCell>
          <StateCell label="Required">
            <Label>
              Email <span className="text-destructive">*</span>
            </Label>
          </StateCell>
          <StateCell label="Disabled">
            <Label className="opacity-50">Disabled Label</Label>
          </StateCell>
        </StateGrid>
      </Section>

      {/* PROGRESS */}
      <Section title="Progress">
        <StateGrid columns={5}>
          <StateCell label="0%">
            <Progress value={0} className="w-[160px]" />
          </StateCell>
          <StateCell label="25%">
            <Progress value={25} className="w-[160px]" />
          </StateCell>
          <StateCell label="50%">
            <Progress value={50} className="w-[160px]" />
          </StateCell>
          <StateCell label="75%">
            <Progress value={75} className="w-[160px]" />
          </StateCell>
          <StateCell label="100%">
            <Progress value={100} className="w-[160px]" />
          </StateCell>
        </StateGrid>
      </Section>

      {/* ACCESSIBILITY — Focus Indicators */}
      <Section title="Accessibility — Focus Indicators">
        <VariantRow label="Focus ring on interactive elements">
          <Button className="ring-1 ring-ring ring-offset-2 ring-offset-background">
            Button
          </Button>
          <Input
            defaultValue="Input"
            className="max-w-[180px] border-primary"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="focus-check"
              className="ring-1 ring-ring ring-offset-2"
            />
            <Label htmlFor="focus-check">Checkbox</Label>
          </div>
          <Switch className="ring-1 ring-ring ring-offset-2" />
        </VariantRow>
      </Section>
    </>
  );
}

export function ElementsPage() {
  return (
    <div className="min-h-screen bg-background p-12 font-text text-foreground">
      <PageTitle subtitle="Buttons, Inputs, Badges & Form Controls — All States">
        UI Elements
      </PageTitle>

      <ThemeBlock mode="light">
        <ElementsContent />
      </ThemeBlock>

      <div className="h-16" />

      <ThemeBlock mode="dark">
        <ElementsContent />
      </ThemeBlock>
    </div>
  );
}
