import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Check, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UISelect() {
  const [value, setValue] = useState('');
  const [disabledValue] = useState('banana');

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Select</h1>
          <p className="text-lg text-muted-foreground">
            A dropdown menu for choosing a single value from a list. Built on Radix UI Select with
            support for groups, labels, separators, and scroll buttons.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Select</strong> when the user must pick exactly one option from a predefined list of 5+ items. The collapsed trigger saves space compared to radio buttons.</p>
            <p><strong className="text-foreground">Use radio buttons</strong> instead when there are fewer than 5 options and all should be visible at once.</p>
          </div>
        </section>

        {/* Demo - Grouped Select */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="w-64">
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tropical</SelectLabel>
                    <SelectItem value="mango">Mango</SelectItem>
                    <SelectItem value="pineapple">Pineapple</SelectItem>
                    <SelectItem value="papaya">Papaya</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Temperate</SelectLabel>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="pear">Pear</SelectItem>
                    <SelectItem value="cherry">Cherry</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Selected: <code className="text-primary bg-primary/5 px-1 rounded">{value || 'none'}</code>
            </p>
          </div>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">The select trigger and expanded dropdown rendered statically for visual reference.</p>
          <div className="border border-border rounded-lg p-6 space-y-3">
            {/* Static trigger */}
            <div className="w-64 flex h-auto items-center justify-between border-b border-input bg-transparent px-1 py-2 text-xl font-display">
              <span className="text-muted-foreground">Select a fruit</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
            {/* Static dropdown content */}
            <div className="w-64 rounded-md border bg-popover text-popover-foreground shadow-md">
              <div className="p-1">
                <div className="px-2 py-1.5 text-sm font-semibold">Tropical</div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm bg-accent text-accent-foreground">
                  Mango
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Pineapple</div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Papaya</div>
                <div className="-mx-1 my-1 h-px bg-muted" />
                <div className="px-2 py-1.5 text-sm font-semibold">Temperate</div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Apple</div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Pear</div>
                <div className="relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm">Cherry</div>
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Option A</SelectItem>
                    <SelectItem value="b">Option B</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground text-center">Default</p>
              </div>
              <div className="space-y-2">
                <Select value={disabledValue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banana">Banana</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground text-center">With value</p>
              </div>
              <div className="space-y-2">
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Disabled" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Option A</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground text-center">Disabled</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The trigger shows a placeholder when no value is selected. Disabled state reduces opacity to 50% and prevents interaction. Focused items in the dropdown use <code className="text-primary bg-primary/5 px-1 rounded">bg-accent</code>.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--popover" value="Background color for the dropdown content" />
            <TokenRow token="--popover-foreground" value="Text color inside the dropdown" />
            <TokenRow token="--accent" value="Background on focused/hovered items" />
            <TokenRow token="--border" value="Trigger bottom border and content border" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectLabel, SelectSeparator,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Group A</SelectLabel>
      <SelectItem value="one">Option One</SelectItem>
      <SelectItem value="two">Option Two</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Group B</SelectLabel>
      <SelectItem value="three">Option Three</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// Disabled
<Select disabled>
  <SelectTrigger>
    <SelectValue placeholder="Disabled" />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Open with Enter, Space, or Arrow Down. Navigate items with Arrow Up/Down. Select with Enter. Close with Escape.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> Trigger shows a border color change on focus. Items highlight with accent background.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-primary/5 px-1 rounded">disabled:pointer-events-none</code> and <code className="text-primary bg-primary/5 px-1 rounded">disabled:opacity-50</code> on both trigger and individual items.</p>
            <p><strong className="text-foreground">Screen readers:</strong> Radix provides full ARIA listbox semantics including <code className="text-primary bg-primary/5 px-1 rounded">role="listbox"</code>, <code className="text-primary bg-primary/5 px-1 rounded">aria-selected</code>, and group labels.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Week count selector for choosing the number of weeks in a binder.</p>
            <p><strong className="text-foreground">Settings:</strong> Language and locale preference selectors.</p>
            <p><strong className="text-foreground">Filters:</strong> Catalog filtering by category, difficulty, or duration.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
