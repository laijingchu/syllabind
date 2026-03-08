import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export default function UISpinner() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Spinner</h1>
          <p className="text-lg text-muted-foreground">
            An animated loading indicator built on the Lucide <code className="text-primary bg-muted px-1 rounded">Loader2</code> icon.
            Includes <code className="text-primary bg-muted px-1 rounded">role="status"</code> and an accessible label for screen readers.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Spinner</strong> for indeterminate loading states — page loads, async operations, or form submissions where progress percentage is unknown.</p>
            <p><strong className="text-foreground">Use Progress</strong> instead when the completion percentage is known and can be communicated to the user.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-4" />
                <p className="text-sm text-muted-foreground">Default (16px)</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-3" />
                <p className="text-sm text-muted-foreground">Small (12px)</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-8" />
                <p className="text-sm text-muted-foreground">Large (32px)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-base text-muted-foreground">Loading your binders...</span>
            </div>
            <div className="flex items-center gap-3">
              <Button disabled>
                <Spinner className="size-4" />
                Saving...
              </Button>
              <Button variant="secondary" disabled>
                <Spinner className="size-4" />
                Publishing...
              </Button>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-4" />
                <p className="text-sm text-muted-foreground">Default</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Muted</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-4 text-primary" />
                <p className="text-sm text-muted-foreground">Primary</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-4 text-destructive" />
                <p className="text-sm text-muted-foreground">Destructive</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The spinner inherits the current text color by default. Override with utility classes like <code className="text-primary bg-muted px-1 rounded">text-muted-foreground</code> or <code className="text-primary bg-muted px-1 rounded">text-primary</code> for contextual coloring.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Color when styled with text-primary" />
            <TokenRow token="--muted-foreground" value="Subdued spinner for secondary contexts" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Spinner } from '@/components/ui/spinner';

// Default (16px)
<Spinner />

// Small
<Spinner className="size-3" />

// Large
<Spinner className="size-8" />

// Inline with text
<div className="flex items-center gap-2">
  <Spinner className="size-4" />
  <span>Loading your binders...</span>
</div>

// Inside a disabled button
<Button disabled>
  <Spinner className="size-4" />
  Saving...
</Button>

// Custom color
<Spinner className="size-4 text-muted-foreground" />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">ARIA role:</strong> The component sets <code className="text-primary bg-muted px-1 rounded">role="status"</code> so screen readers announce the loading state.</p>
            <p><strong className="text-foreground">Accessible label:</strong> An <code className="text-primary bg-muted px-1 rounded">aria-label="Loading"</code> attribute provides a text alternative for the spinning icon.</p>
            <p><strong className="text-foreground">Motion sensitivity:</strong> The CSS <code className="text-primary bg-muted px-1 rounded">animate-spin</code> animation respects <code className="text-primary bg-muted px-1 rounded">prefers-reduced-motion</code> when configured in Tailwind.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Button loading states:</strong> Shown inside disabled buttons during form submissions like "Enroll", "Publish", and "Save Draft".</p>
            <p><strong className="text-foreground">Page loading:</strong> Centered spinner displayed while page data is being fetched (Dashboard, Catalog, BinderOverview).</p>
            <p><strong className="text-foreground">Form submission feedback:</strong> Replaces the submit button label during async operations to signal that the action is in progress.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
