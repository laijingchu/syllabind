import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

export default function UILabel() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Label</h1>
          <p className="text-lg text-muted-foreground">
            An accessible label built on Radix UI's Label primitive. Automatically associates
            with form controls and supports peer-disabled styling for coordinated disabled states.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Label</strong> to identify form controls (inputs, textareas, checkboxes, switches). It provides click-to-focus behavior and screen reader association.</p>
            <p><strong className="text-foreground">Use plain text</strong> instead for non-interactive descriptions or headings that don't correspond to a specific form control.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="demo-input">Binder Title</Label>
              <Input id="demo-input" placeholder="Enter a title..." />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="demo-checkbox" />
              <Label htmlFor="demo-checkbox">Mark as complete</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="demo-switch" />
              <Label htmlFor="demo-switch">Enable notifications</Label>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state-default">Email Address</Label>
                <Input id="state-default" placeholder="you@example.com" />
                <p className="text-sm text-muted-foreground">Default</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state-disabled" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</Label>
                <Input id="state-disabled" disabled placeholder="Cannot edit" className="peer" />
                <p className="text-sm text-muted-foreground">With disabled input</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="state-check" />
                <Label htmlFor="state-check">Inline with checkbox</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="state-switch" />
                <Label htmlFor="state-switch">Inline with switch</Label>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            When a sibling form control is disabled, the label automatically applies <code className="text-primary bg-muted px-1 rounded">peer-disabled:cursor-not-allowed</code> and <code className="text-primary bg-muted px-1 rounded">peer-disabled:opacity-70</code> for a coordinated disabled appearance.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--foreground" value="Label text color (inherits from body)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Label } from '@/components/ui/label';

// With text input
<Label htmlFor="title">Binder Title</Label>
<Input id="title" placeholder="Enter a title..." />

// With checkbox (inline)
<div className="flex items-center space-x-2">
  <Checkbox id="complete" />
  <Label htmlFor="complete">Mark as complete</Label>
</div>

// With switch (inline)
<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>

// Disabled coordination (peer pattern)
<Input id="name" disabled className="peer" />
<Label htmlFor="name">Full Name</Label>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Association:</strong> Uses Radix UI's Label primitive which renders a native <code className="text-primary bg-muted px-1 rounded">&lt;label&gt;</code> element. Connect to controls via <code className="text-primary bg-muted px-1 rounded">htmlFor</code>.</p>
            <p><strong className="text-foreground">Click behavior:</strong> Clicking the label focuses or toggles the associated form control.</p>
            <p><strong className="text-foreground">Screen readers:</strong> Properly announces the label text when the associated control receives focus.</p>
            <p><strong className="text-foreground">Disabled:</strong> The <code className="text-primary bg-muted px-1 rounded">peer-disabled</code> utilities provide visual coordination but do not change the label's own enabled state.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Login:</strong> Labels for email and password fields in the authentication forms.</p>
            <p><strong className="text-foreground">Profile:</strong> Labels for display name, bio, and social link fields.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Labels for binder title, description, week names, and step configuration.</p>
            <p><strong className="text-foreground">Settings:</strong> Labels for toggles and preference controls throughout the app.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
