import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function UISkeleton() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Skeleton</h1>
          <p className="text-lg text-muted-foreground">
            A placeholder element with a pulsing animation that indicates content is loading.
            Compose multiple skeletons to approximate the shape of the content being loaded.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Skeleton</strong> to show the layout structure while data is loading. This reduces perceived load time and prevents layout shift when content appears.</p>
            <p><strong className="text-foreground">Use a spinner</strong> instead for short, indeterminate actions where the content layout is unknown (e.g., form submissions).</p>
          </div>
        </section>

        {/* Demo - Text Skeleton */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Text Skeleton</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Mimic heading and paragraph shapes. Vary widths to create a natural text-like silhouette.
          </p>
        </section>

        {/* Demo - Avatar Skeleton */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Avatar Skeleton</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Use <code className="text-primary bg-primary/5 px-1 rounded">rounded-full</code> to match the avatar shape. Pair with text skeletons for user info rows.
          </p>
        </section>

        {/* Demo - Card Skeleton */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Card Skeleton</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-4">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-4">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Compose skeletons into card layouts that match the final content shape. Include image placeholders, text lines, and button areas.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-2 text-center">
                <Skeleton className="h-10 w-full" />
                <p className="text-sm text-muted-foreground">Pulsing (default)</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="h-10 w-full rounded-md bg-primary/10" />
                <p className="text-sm text-muted-foreground">Static (no animation)</p>
              </div>
              <div className="space-y-2 text-center">
                <Skeleton className="h-10 w-full rounded-full" />
                <p className="text-sm text-muted-foreground">Rounded</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The skeleton uses <code className="text-primary bg-primary/5 px-1 rounded">animate-pulse</code> by default. Override the shape with <code className="text-primary bg-primary/5 px-1 rounded">rounded-full</code> for circular elements or <code className="text-primary bg-primary/5 px-1 rounded">rounded-md</code> for card images.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Base color for skeleton background (used at 10% opacity)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Skeleton } from '@/components/ui/skeleton';

// Text placeholder
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />

// Avatar placeholder
<Skeleton className="h-10 w-10 rounded-full" />

// Card skeleton composition
<div className="space-y-4">
  <Skeleton className="h-32 w-full rounded-md" />
  <Skeleton className="h-5 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-1/2" />
</div>

// Inline with other content
<div className="flex items-center gap-4">
  <Skeleton className="h-10 w-10 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-3 w-24" />
  </div>
</div>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Reduced motion:</strong> The <code className="text-primary bg-primary/5 px-1 rounded">animate-pulse</code> animation respects the <code className="text-primary bg-primary/5 px-1 rounded">prefers-reduced-motion</code> media query via Tailwind defaults.</p>
            <p><strong className="text-foreground">Semantics:</strong> Skeletons are decorative divs. Wrap the loading region in an <code className="text-primary bg-primary/5 px-1 rounded">aria-busy="true"</code> container and use <code className="text-primary bg-primary/5 px-1 rounded">aria-live="polite"</code> on the parent to announce when content loads.</p>
            <p><strong className="text-foreground">Screen readers:</strong> Consider adding a visually hidden "Loading..." text near skeleton groups for non-visual users.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dashboard cards:</strong> Card skeletons while binder enrollment data loads on the reader Dashboard.</p>
            <p><strong className="text-foreground">Catalog grid:</strong> Grid of card skeletons matching the binder card layout during initial Catalog page load.</p>
            <p><strong className="text-foreground">BinderOverview content:</strong> Text and metadata skeletons while binder details, weeks, and steps are fetched.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
