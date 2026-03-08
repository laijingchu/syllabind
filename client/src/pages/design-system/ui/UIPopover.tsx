import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function UIPopover() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Popover</h1>
          <p className="text-lg text-muted-foreground">
            A floating panel anchored to a trigger element, built on Radix UI Popover.
            Use for interactive content that needs to appear contextually without navigating
            away from the current view.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Popover</strong> for interactive floating content like date pickers, filter forms, or settings panels that are anchored to a trigger element.</p>
            <p><strong className="text-foreground">Use Tooltip</strong> instead for non-interactive, brief hover hints.</p>
            <p><strong className="text-foreground">Use Dialog</strong> instead when the content requires full user attention or is not tied to a specific trigger position.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 flex items-center justify-center min-h-[120px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-base text-muted-foreground">Set the dimensions for the layer.</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="width">Width</Label>
                      <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="height">Height</Label>
                      <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-base text-muted-foreground">
            The popover is portaled to the document body and positioned relative to the trigger.
            It supports <code className="text-primary bg-muted px-1 rounded">align</code> (start, center, end) and <code className="text-primary bg-muted px-1 rounded">side</code> (top, right, bottom, left) props for placement control.
          </p>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">Popover content rendered directly on the page for visual reference.</p>
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground">Popover with form inputs</p>
            <div className="border border-border rounded-lg bg-popover text-popover-foreground p-4 w-80 shadow-md">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Dimensions</h4>
                  <p className="text-base text-muted-foreground">Set the dimensions for the layer.</p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Width</Label>
                    <Input defaultValue="100%" className="col-span-2 h-8" readOnly />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Height</Label>
                    <Input defaultValue="25px" className="col-span-2 h-8" readOnly />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 text-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm">Default</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <p className="text-sm">Default popover content.</p>
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">Click to open</p>
              </div>
              <div className="space-y-2 text-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm">Align Start</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <p className="text-sm">Aligned to start of trigger.</p>
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">align="start"</p>
              </div>
              <div className="space-y-2 text-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm">Align End</Button>
                  </PopoverTrigger>
                  <PopoverContent align="end">
                    <p className="text-sm">Aligned to end of trigger.</p>
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">align="end"</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Opens with fade-in and zoom animations. Closes on outside click or Escape. Collision-aware positioning automatically flips the popover when it would overflow the viewport.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--popover" value="Background color of the popover panel" />
            <TokenRow token="--popover-foreground" value="Text color inside the popover" />
            <TokenRow token="--border" value="Border color of the popover" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Basic usage
<Popover>
  <PopoverTrigger asChild>
    <Button variant="secondary">Open</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Popover content here.</p>
  </PopoverContent>
</Popover>

// With alignment and side offset
<PopoverContent align="start" sideOffset={8}>
  ...
</PopoverContent>

// Custom width
<PopoverContent className="w-80">
  ...
</PopoverContent>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Opens on Enter or Space when trigger is focused. Closes on Escape.</p>
            <p><strong className="text-foreground">Focus management:</strong> Focus moves into the popover content when opened and returns to the trigger on close.</p>
            <p><strong className="text-foreground">Dismiss:</strong> Clicking outside the popover or pressing Escape closes it.</p>
            <p><strong className="text-foreground">ARIA:</strong> The trigger uses <code className="text-primary bg-muted px-1 rounded">aria-expanded</code> and <code className="text-primary bg-muted px-1 rounded">aria-haspopup</code>. Content is linked via <code className="text-primary bg-muted px-1 rounded">aria-controls</code>.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Date pickers:</strong> Calendar widgets that appear anchored to date input fields.</p>
            <p><strong className="text-foreground">Filter dropdowns:</strong> Multi-option filter panels in catalog and dashboard views.</p>
            <p><strong className="text-foreground">Info tooltips with interactive content:</strong> Rich content panels with links or actions that go beyond a simple tooltip.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}