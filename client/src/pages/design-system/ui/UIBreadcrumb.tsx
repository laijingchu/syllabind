import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';

export default function UIBreadcrumb() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Breadcrumb</h1>
          <p className="text-muted-foreground">
            A semantic navigation component that shows the user's current location within a
            page hierarchy. Composed of Breadcrumb, BreadcrumbList, BreadcrumbItem,
            BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage, and BreadcrumbEllipsis.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Breadcrumb</strong> on pages that are nested more than one level deep, providing a trail back to parent pages. Helps readers understand where they are in the binder structure.</p>
            <p><strong className="text-foreground">Use a back button</strong> instead when the hierarchy is simple (one level) or when the user's path is linear rather than hierarchical.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Standard breadcrumb</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Digital Minimalism</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Week 3: Attention Economy</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">With ellipsis (collapsed middle)</p>
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
                    <BreadcrumbLink href="#">Week 3</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Step 2: Read Chapter 5</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Link vs current page</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Clickable Link</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Current Page (not clickable)</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <p className="text-xs text-muted-foreground">Links use muted-foreground and transition to foreground on hover. The current page renders in foreground with aria-current="page".</p>
            </div>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--muted-foreground" value="Link text and separator color" />
            <TokenRow token="--foreground" value="Current page text and link hover color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/binder/1">Digital Minimalism</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Week 3</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

// With React Router (asChild)
<BreadcrumbLink asChild>
  <Link to="/dashboard">Dashboard</Link>
</BreadcrumbLink>

// With ellipsis for deep hierarchies
<BreadcrumbItem>
  <BreadcrumbEllipsis />
</BreadcrumbItem>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Landmark:</strong> Renders as a <code className="text-primary bg-primary/5 px-1 rounded">&lt;nav&gt;</code> element with <code className="text-primary bg-primary/5 px-1 rounded">aria-label="breadcrumb"</code> for screen reader identification.</p>
            <p><strong className="text-foreground">Current page:</strong> The final item uses <code className="text-primary bg-primary/5 px-1 rounded">aria-current="page"</code> and <code className="text-primary bg-primary/5 px-1 rounded">aria-disabled="true"</code> to indicate the current location.</p>
            <p><strong className="text-foreground">Separators:</strong> Chevron separators are marked with <code className="text-primary bg-primary/5 px-1 rounded">role="presentation"</code> and <code className="text-primary bg-primary/5 px-1 rounded">aria-hidden="true"</code> so they are skipped by screen readers.</p>
            <p><strong className="text-foreground">Ellipsis:</strong> The collapsed indicator includes a <code className="text-primary bg-primary/5 px-1 rounded">sr-only</code> "More" label for assistive technology.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">WeekView:</strong> Shows the trail from Dashboard to Binder to the current Week, letting readers navigate back up the hierarchy.</p>
            <p><strong className="text-foreground">Nested page navigation:</strong> Used in deeply nested curator pages (e.g., Binder Builder &gt; Week &gt; Step editing) to maintain orientation.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
