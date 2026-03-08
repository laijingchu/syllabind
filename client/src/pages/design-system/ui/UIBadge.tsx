import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Badge } from '@/components/ui/badge';

export default function UIBadge() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Badge</h1>
          <p className="text-lg text-muted-foreground">
            A compact label for status, category, or metadata. Supports 9 visual variants
            including inverted and surface combos for danger, warning, and success states,
            with the hover-elevate system for interactive contexts.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Badge</strong> to display short status labels, category tags, or counts. Badges are non-interactive by default but support hover elevation when placed inside clickable containers.</p>
            <p><strong className="text-foreground">Use plain text</strong> instead when the label doesn't need visual emphasis or distinction from surrounding content.</p>
          </div>
        </section>

        {/* Demo - Variants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Variants</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Neutral</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="tertiary">Tertiary</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Danger</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="danger-surface">Danger Surface</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Warning</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="warning-inverted">Warning Inverted</Badge>
                <Badge variant="warning-surface">Warning Surface</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Success</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="success-inverted">Success Inverted</Badge>
                <Badge variant="success-surface">Success Surface</Badge>
              </div>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">default</strong> — Primary fill with shadow. Published status, active states.</p>
            <p><strong className="text-foreground">secondary</strong> — Border only, no fill. Draft status, low-emphasis labels, filter chips.</p>
            <p><strong className="text-foreground">tertiary</strong> — Muted fill without shadow. Category tags, neutral metadata.</p>
            <p><strong className="text-foreground">destructive</strong> — Red inverted fill with shadow. Error counts, critical alerts.</p>
            <p><strong className="text-foreground">danger-surface</strong> — Tinted red surface with red border. Lower-emphasis danger labels.</p>
            <p><strong className="text-foreground">warning-inverted</strong> — Amber inverted fill with shadow. Urgent notices, expiring items.</p>
            <p><strong className="text-foreground">warning-surface</strong> — Tinted amber surface with amber border. Mild cautions, pending states.</p>
            <p><strong className="text-foreground">success-inverted</strong> — Green inverted fill with shadow. Completed, verified, active.</p>
            <p><strong className="text-foreground">success-surface</strong> — Tinted green surface with green border. Lower-emphasis positive labels.</p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 text-center">
                <Badge>Published</Badge>
                <p className="text-sm text-muted-foreground">Default</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="secondary">Draft</Badge>
                <p className="text-sm text-muted-foreground">Secondary</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="tertiary">Category</Badge>
                <p className="text-sm text-muted-foreground">Tertiary</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="destructive">Failed</Badge>
                <p className="text-sm text-muted-foreground">Destructive</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="danger-surface">At Risk</Badge>
                <p className="text-sm text-muted-foreground">Danger Surface</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="warning-inverted">Expiring</Badge>
                <p className="text-sm text-muted-foreground">Warning Inverted</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="warning-surface">Pending</Badge>
                <p className="text-sm text-muted-foreground">Warning Surface</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="success-inverted">Completed</Badge>
                <p className="text-sm text-muted-foreground">Success Inverted</p>
              </div>
              <div className="space-y-2 text-center">
                <Badge variant="success-surface">On Track</Badge>
                <p className="text-sm text-muted-foreground">Success Surface</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Hover state uses the <code className="text-primary bg-muted px-1 rounded">hover-elevate</code> overlay system. Badges are rendered as <code className="text-primary bg-muted px-1 rounded">div</code> elements and do not support a disabled state natively.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary-inverted" value="Fill for default variant" />
            <TokenRow token="--badge-outline" value="Border for secondary variant" />
            <TokenRow token="--secondary" value="Fill for tertiary variant" />
            <TokenRow token="--danger-inverted" value="Fill for destructive variant" />
            <TokenRow token="--danger-surface / --danger-border" value="Surface fill and border for danger-surface variant" />
            <TokenRow token="--warning-inverted" value="Fill for warning-inverted variant" />
            <TokenRow token="--warning-surface / --warning-border" value="Surface fill and border for warning-surface variant" />
            <TokenRow token="--success-inverted" value="Fill for success-inverted variant" />
            <TokenRow token="--success-surface / --success-border" value="Surface fill and border for success-surface variant" />
            <TokenRow token="--elevate-1" value="Hover overlay via hover-elevate" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Badge } from '@/components/ui/badge';

// Neutral variants
<Badge variant="default">Published</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="tertiary">Design</Badge>

// Danger
<Badge variant="destructive">Failed</Badge>
<Badge variant="danger-surface">At Risk</Badge>

// Warning
<Badge variant="warning-inverted">Expiring</Badge>
<Badge variant="warning-surface">Pending</Badge>

// Success
<Badge variant="success-inverted">Completed</Badge>
<Badge variant="success-surface">On Track</Badge>

// Custom className
<Badge className="text-[10px]">Tiny</Badge>

// Inside a clickable card (hover-elevate activates)
<Card>
  <Badge>Active</Badge>
</Card>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Semantics:</strong> Rendered as a <code className="text-primary bg-muted px-1 rounded">div</code>. For status indicators, add <code className="text-primary bg-muted px-1 rounded">role="status"</code> or <code className="text-primary bg-muted px-1 rounded">aria-label</code> when the badge text alone may be ambiguous.</p>
            <p><strong className="text-foreground">Focus:</strong> Supports <code className="text-primary bg-muted px-1 rounded">focus:ring-2</code> and <code className="text-primary bg-muted px-1 rounded">focus:ring-offset-2</code> for the rare cases where a badge is made focusable.</p>
            <p><strong className="text-foreground">Color contrast:</strong> All variants maintain WCAG AA contrast ratios between text and background.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderOverview:</strong> Status badges showing "Published" or "Draft" next to the binder title.</p>
            <p><strong className="text-foreground">Catalog:</strong> Category tags on binder cards for filtering and visual grouping.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Draft/published status indicators on binder list items.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
