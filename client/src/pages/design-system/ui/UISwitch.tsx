import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Switch } from '@/components/ui/switch';

export default function UISwitch() {
  const [enabled, setEnabled] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Switch</h1>
          <p className="text-muted-foreground">
            A Radix-based toggle switch with h-5 w-9 sizing. Used for binary on/off settings
            where the change takes effect immediately.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Switch</strong> for settings that take effect immediately when toggled, like enabling notifications or toggling a publish state.</p>
            <p><strong className="text-foreground">Use Checkbox</strong> instead when the change requires a form submission to take effect, or when selecting from multiple independent options.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="demo-switch"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <label htmlFor="demo-switch" className="text-sm cursor-pointer select-none">
                {enabled ? 'On' : 'Off'} — click to toggle
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
                <Switch />
                <p className="text-xs text-muted-foreground">Off</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <Switch checked />
                <p className="text-xs text-muted-foreground">On</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <Switch disabled />
                <p className="text-xs text-muted-foreground">Disabled</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <Switch id="state-label" defaultChecked />
                  <label htmlFor="state-label" className="text-sm">Label</label>
                </div>
                <p className="text-xs text-muted-foreground">With Label</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The thumb slides from left to right on check. Off state uses <code className="text-primary bg-primary/5 px-1 rounded">--input</code> background; on state uses <code className="text-primary bg-primary/5 px-1 rounded">--primary</code>. The thumb uses <code className="text-primary bg-primary/5 px-1 rounded">--background</code>. Disabled state reduces opacity to 50%.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Track fill when checked (on)" />
            <TokenRow token="--input" value="Track fill when unchecked (off)" />
            <TokenRow token="--background" value="Thumb color and ring offset" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Switch } from '@/components/ui/switch';

// Basic
<Switch />

// Controlled
const [enabled, setEnabled] = useState(false);
<Switch checked={enabled} onCheckedChange={setEnabled} />

// With label
<div className="flex items-center gap-3">
  <Switch id="notifications" />
  <label htmlFor="notifications">Enable notifications</label>
</div>

// Disabled
<Switch disabled />

// Default checked
<Switch defaultChecked />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Role:</strong> Renders as <code className="text-primary bg-primary/5 px-1 rounded">role="switch"</code> with <code className="text-primary bg-primary/5 px-1 rounded">aria-checked</code> managed by Radix.</p>
            <p><strong className="text-foreground">Keyboard:</strong> Focusable via Tab. Toggles on Space.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> 2px ring using <code className="text-primary bg-primary/5 px-1 rounded">focus-visible:ring-2</code> with ring offset for clear visibility.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-primary/5 px-1 rounded">disabled:cursor-not-allowed</code> and <code className="text-primary bg-primary/5 px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">Label association:</strong> Always pair with a <code className="text-primary bg-primary/5 px-1 rounded">label</code> element using matching <code className="text-primary bg-primary/5 px-1 rounded">id</code> and <code className="text-primary bg-primary/5 px-1 rounded">htmlFor</code>.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Settings:</strong> Toggle preferences — email notifications, dark mode, privacy settings.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Publish toggle — curators switch a binder between draft and published state.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
