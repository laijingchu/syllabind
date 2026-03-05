import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Trash2, Plus, Loader2 } from 'lucide-react';

export default function UIButton() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Button</h1>
          <p className="text-lg text-muted-foreground">
            The primary interactive element for triggering actions. Supports 6 visual variants
            and 4 sizes, with a flat elevation system for hover and active feedback.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Button</strong> for actions that change state, submit data, or navigate to a new context. Choose the variant based on emphasis level.</p>
            <p><strong className="text-foreground">Use a link</strong> instead when the action is purely navigational and doesn't change application state.</p>
          </div>
        </section>

        {/* Demo - Variants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Variants</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">default</strong> — Filled primary background. Main CTAs, "Enroll", form submissions.</p>
            <p><strong className="text-foreground">secondary</strong> — Muted fill. Supporting actions beside a primary button.</p>
            <p><strong className="text-foreground">outline</strong> — Transparent with border. "Cancel", filter toggles, secondary actions.</p>
            <p><strong className="text-foreground">ghost</strong> — No background or border. Icon buttons, back buttons, nav links.</p>
            <p><strong className="text-foreground">destructive</strong> — Red fill for irreversible actions. "Delete", "Remove".</p>
            <p><strong className="text-foreground">link</strong> — Styled as inline text link. "Learn more", inline navigation.</p>
          </div>
        </section>

        {/* Demo - Sizes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Sizes</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">sm</strong> — min-h-8, px-3, text-xs. Compact contexts like table rows.</p>
            <p><strong className="text-foreground">default</strong> — min-h-9, px-4, py-2. Standard button size.</p>
            <p><strong className="text-foreground">lg</strong> — min-h-10, px-8. Hero CTAs, onboarding flows.</p>
            <p><strong className="text-foreground">icon</strong> — h-9, w-9. Square button for icon-only actions.</p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <Button>Default</Button>
                <p className="text-sm text-muted-foreground">Resting</p>
              </div>
              <div className="space-y-2 text-center">
                <Button disabled>Disabled</Button>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
              <div className="space-y-2 text-center">
                <Button disabled><Loader2 className="h-4 w-4 animate-spin" />Loading</Button>
                <p className="text-sm text-muted-foreground">Loading</p>
              </div>
              <div className="space-y-2 text-center">
                <Button><Download className="h-4 w-4" />With Icon</Button>
                <p className="text-sm text-muted-foreground">With Icon</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Hover and active states use the elevation overlay system (<code className="text-primary bg-primary/5 px-1 rounded">hover-elevate</code> and <code className="text-primary bg-primary/5 px-1 rounded">active-elevate-2</code>) rather than color shifts. Disabled buttons reduce opacity to 50%.
          </p>
        </section>

        {/* With Icons */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Icons</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <Button><Plus className="h-4 w-4" />Create Binder</Button>
              <Button variant="outline">Next <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="destructive"><Trash2 className="h-4 w-4" />Delete</Button>
              <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Icons inside buttons are automatically sized to 16px and flex-shrunk via the <code className="text-primary bg-primary/5 px-1 rounded">[&_svg]:size-4</code> selector.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Main fill color for default variant" />
            <TokenRow token="--primary-foreground" value="Text on primary-colored buttons" />
            <TokenRow token="--primary-border" value="Subtle border on filled buttons" />
            <TokenRow token="--secondary" value="Fill for secondary variant" />
            <TokenRow token="--destructive" value="Fill for destructive variant" />
            <TokenRow token="--button-outline" value="Border color for outline variant" />
            <TokenRow token="--elevate-1" value="Hover overlay" />
            <TokenRow token="--elevate-2" value="Active/press overlay" />
            <TokenRow token="--ring" value="Focus ring color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Enroll Now</Button>
<Button variant="secondary">Save Draft</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Back</Button>
<Button variant="destructive">Delete Binder</Button>
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Get Started</Button>
<Button size="icon"><Plus /></Button>

// With icon
<Button><Plus className="h-4 w-4" />Create Binder</Button>

// As link (renders as <a> via Slot)
<Button asChild>
  <a href="/catalog">Browse Binders</a>
</Button>

// Disabled / Loading
<Button disabled>Disabled</Button>
<Button disabled><Loader2 className="animate-spin" />Saving...</Button>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Focusable via Tab. Activates on Enter or Space.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> 1px ring using <code className="text-primary bg-primary/5 px-1 rounded">focus-visible:ring-1</code>. Only visible on keyboard navigation.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-primary/5 px-1 rounded">disabled:pointer-events-none</code> and <code className="text-primary bg-primary/5 px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">asChild:</strong> Use the <code className="text-primary bg-primary/5 px-1 rounded">asChild</code> prop to render a different element (e.g., anchor tag) while keeping button styling and accessibility.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderOverview:</strong> "Enroll" CTA (default), "Preview" (outline).</p>
            <p><strong className="text-foreground">BinderEditor:</strong> "Publish" (default), "Save Draft" (secondary), "Delete Binder" (destructive).</p>
            <p><strong className="text-foreground">Dashboard:</strong> "Create New Binder" (default with Plus icon).</p>
            <p><strong className="text-foreground">Layout nav:</strong> Back buttons and menu triggers (ghost, icon size).</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
