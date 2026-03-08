import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Checkbox } from '@/components/ui/checkbox';

export default function UICheckbox() {
  const [checked, setChecked] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Checkbox</h1>
          <p className="text-lg text-muted-foreground">
            A Radix-based checkbox with a check indicator. Used for toggling boolean values
            or selecting multiple options from a list.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Checkbox</strong> when users need to toggle a single boolean option or select multiple items from a list independently.</p>
            <p><strong className="text-foreground">Use RadioGroup</strong> instead when only one option can be selected from a set of mutually exclusive choices.</p>
            <p><strong className="text-foreground">Use Switch</strong> instead for instant on/off toggles where the change takes effect immediately.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="demo-checkbox"
                checked={checked}
                onCheckedChange={(val) => setChecked(val === true)}
              />
              <label htmlFor="demo-checkbox" className="text-sm cursor-pointer select-none">
                {checked ? 'Checked' : 'Unchecked'} — click to toggle
              </label>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-2 text-center flex flex-col items-center">
                <Checkbox />
                <p className="text-sm text-muted-foreground">Unchecked</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <Checkbox checked />
                <p className="text-sm text-muted-foreground">Checked</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <Checkbox disabled />
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Checkbox id="state-label" defaultChecked />
                  <label htmlFor="state-label" className="text-sm">Label</label>
                </div>
                <p className="text-sm text-muted-foreground">With Label</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Checked state fills with <code className="text-primary bg-muted px-1 rounded">--primary</code> and displays a check icon in <code className="text-primary bg-muted px-1 rounded">--primary-inverted</code>. Disabled state reduces opacity to 50%.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Border color and checked fill" />
            <TokenRow token="--primary-inverted" value="Check icon color when checked" />
            <TokenRow token="--ring" value="Focus ring color on keyboard navigation" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Checkbox } from '@/components/ui/checkbox';

// Basic
<Checkbox />

// Controlled
const [checked, setChecked] = useState(false);
<Checkbox checked={checked} onCheckedChange={setChecked} />

// With label
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <label htmlFor="terms">Accept terms</label>
</div>

// Disabled
<Checkbox disabled />

// Default checked
<Checkbox defaultChecked />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Focusable via Tab. Toggles on Space.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> 1px ring using <code className="text-primary bg-muted px-1 rounded">focus-visible:ring-1</code>. Only visible on keyboard navigation.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-muted px-1 rounded">disabled:cursor-not-allowed</code> and <code className="text-primary bg-muted px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">Label association:</strong> Always pair with a <code className="text-primary bg-muted px-1 rounded">label</code> element using matching <code className="text-primary bg-muted px-1 rounded">id</code> and <code className="text-primary bg-muted px-1 rounded">htmlFor</code> for screen reader support.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Settings:</strong> Notification preferences — users toggle individual notification types on or off.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Step completion toggles — curators can mark steps as required or optional.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
