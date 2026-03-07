import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Separator } from '@/components/ui/separator';

export default function UISeparator() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Separator</h1>
          <p className="text-lg text-muted-foreground">
            A visual divider between content sections. Built on Radix UI Separator with horizontal
            and vertical orientations. Renders as a 1px line using the border color token.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Separator</strong> to visually divide groups of related content, menu items, or sidebar sections. Prefer it over manual border utilities for semantic correctness.</p>
            <p><strong className="text-foreground">Use spacing alone</strong> when the visual gap between sections is sufficient and an explicit line would add noise.</p>
          </div>
        </section>

        {/* Demo - Horizontal */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Horizontal</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Section One</h3>
                <p className="text-base text-muted-foreground">Content above the separator.</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Section Two</h3>
                <p className="text-base text-muted-foreground">Content below the separator.</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Section Three</h3>
                <p className="text-base text-muted-foreground">Another section below.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo - Vertical */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Vertical</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex items-center gap-4 h-6">
              <span className="text-sm">Home</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Catalog</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Dashboard</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Settings</span>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Vertical separators require a parent with a defined height (or <code className="text-primary bg-primary/5 px-1 rounded">h-full</code> context) since
            the separator uses <code className="text-primary bg-primary/5 px-1 rounded">h-full w-[1px]</code>.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <Separator />
              <p className="text-sm text-muted-foreground">Default (decorative) — hidden from screen readers</p>
            </div>
            <div className="space-y-2">
              <Separator decorative={false} />
              <p className="text-sm text-muted-foreground">Non-decorative — announced by screen readers with <code className="text-primary bg-primary/5 px-1 rounded">role="separator"</code></p>
            </div>
            <div className="space-y-2">
              <Separator className="bg-primary" />
              <p className="text-sm text-muted-foreground">Custom color via className override</p>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            By default, separators are decorative (<code className="text-primary bg-primary/5 px-1 rounded">role="none"</code>). Set <code className="text-primary bg-primary/5 px-1 rounded">decorative=&#123;false&#125;</code> when the
            separator conveys meaningful structure to assistive technologies.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--border" value="Line color for both horizontal and vertical separators" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Separator } from '@/components/ui/separator';

// Horizontal (default)
<Separator />

// Vertical (needs parent height)
<div className="flex items-center h-6 gap-4">
  <span>Item A</span>
  <Separator orientation="vertical" />
  <span>Item B</span>
</div>

// Non-decorative (announced by screen readers)
<Separator decorative={false} />

// Custom color
<Separator className="bg-primary" />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Decorative (default):</strong> Renders with <code className="text-primary bg-primary/5 px-1 rounded">role="none"</code>, completely hidden from the accessibility tree.</p>
            <p><strong className="text-foreground">Non-decorative:</strong> Renders with <code className="text-primary bg-primary/5 px-1 rounded">role="separator"</code> and appropriate <code className="text-primary bg-primary/5 px-1 rounded">aria-orientation</code>.</p>
            <p><strong className="text-foreground">When to use non-decorative:</strong> Use when the separator marks a meaningful boundary between distinct sections, such as between navigation groups in a sidebar.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Content sections:</strong> Divides week sections and step groups within binder views.</p>
            <p><strong className="text-foreground">Sidebar dividers:</strong> Separates navigation groups in the layout sidebar.</p>
            <p><strong className="text-foreground">Dropdown menus:</strong> Used via SelectSeparator inside select dropdowns to divide option groups.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
