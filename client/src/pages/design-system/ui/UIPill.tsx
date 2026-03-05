import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Pill } from '@/components/ui/pill';
import { useState } from 'react';

const visibilityOptions = ['All', 'Public', 'Unlisted', 'Private'];
const categories = ['Design', 'Engineering', 'Philosophy', 'Science', 'Writing'];

export default function UIPill() {
  const [activeVisibility, setActiveVisibility] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Pill</h1>
          <p className="text-muted-foreground">
            A compact, rounded toggle button for filtering and selection. Pills use <code className="text-primary bg-primary/5 px-1 rounded">rounded-full</code> styling
            with a high-contrast active state to clearly indicate selection. Available in default (solid) and outline variants.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Pill</strong> for inline filter controls where the user selects one or more options from a visible set. Pills work best with short labels (1-2 words) and small option counts (under ~10).</p>
            <p><strong className="text-foreground">Use Badge</strong> instead for non-interactive status indicators.</p>
            <p><strong className="text-foreground">Use Tabs</strong> instead for switching between content panels.</p>
            <p><strong className="text-foreground">Use Select</strong> instead when the option list is long or space is limited.</p>
          </div>
        </section>

        {/* Demo: Single-select */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Single-Select</h2>
          <p className="text-sm text-muted-foreground">
            Click a pill to select it. Only one pill is active at a time.
          </p>
          <div className="border border-border rounded-lg p-6">
            <div className="flex gap-1.5">
              {visibilityOptions.map(opt => (
                <Pill
                  key={opt}
                  active={activeVisibility === opt}
                  onClick={() => setActiveVisibility(opt)}
                >
                  {opt}
                </Pill>
              ))}
            </div>
          </div>
        </section>

        {/* Demo: Multi-select */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Multi-Select</h2>
          <p className="text-sm text-muted-foreground">
            Multiple pills can be active simultaneously. Clicking toggles each independently.
          </p>
          <div className="border border-border rounded-lg p-6">
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <Pill
                  key={cat}
                  active={selectedCategories.includes(cat)}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </Pill>
              ))}
            </div>
          </div>
        </section>

        {/* Variants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Variants</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">variant="default" (solid)</p>
              <div className="flex gap-1.5">
                <Pill active>Active</Pill>
                <Pill>Inactive</Pill>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">variant="outline"</p>
              <div className="flex gap-1.5">
                <Pill variant="outline" active>Active</Pill>
                <Pill variant="outline">Inactive</Pill>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Default:</strong> Solid fill. Active = <code className="text-primary bg-primary/5 px-1 rounded">bg-foreground text-background</code>, Inactive = <code className="text-primary bg-primary/5 px-1 rounded">bg-muted text-muted-foreground</code>. Used for primary filter controls.</p>
            <p><strong className="text-foreground">Outline:</strong> Bordered. Active = <code className="text-primary bg-primary/5 px-1 rounded">bg-primary/15 border-primary/60</code>, Inactive = <code className="text-primary bg-primary/5 px-1 rounded">border-primary/30 text-primary</code>. Used for secondary actions like demo topic chips.</p>
          </div>
        </section>

        {/* Sizes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Sizes</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">size="default" — text-sm, px-3 py-1.5</p>
              <div className="flex gap-1.5">
                <Pill active>Default</Pill>
                <Pill>Default</Pill>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">size="sm" — text-xs, px-2.5 py-1</p>
              <div className="flex gap-1.5">
                <Pill size="sm" active>Small</Pill>
                <Pill size="sm">Small</Pill>
              </div>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Default</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">active?</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 font-mono text-xs">false</td>
                  <td className="p-3 text-muted-foreground">Whether the pill is in its selected/active state.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">variant?</td>
                  <td className="p-3 font-mono text-xs">"default" | "outline"</td>
                  <td className="p-3 font-mono text-xs">"default"</td>
                  <td className="p-3 text-muted-foreground">Visual style. Default is solid, outline uses a border.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">size?</td>
                  <td className="p-3 font-mono text-xs">"default" | "sm"</td>
                  <td className="p-3 font-mono text-xs">"default"</td>
                  <td className="p-3 text-muted-foreground">Size preset. Default is text-sm, sm is text-xs.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">className?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 font-mono text-xs">—</td>
                  <td className="p-3 text-muted-foreground">Additional classes merged via cn().</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">...rest</td>
                  <td className="p-3 font-mono text-xs">ButtonHTMLAttributes</td>
                  <td className="p-3 font-mono text-xs">—</td>
                  <td className="p-3 text-muted-foreground">All native button props (onClick, disabled, etc.) are forwarded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--foreground" value="Active pill background (default variant)" />
            <TokenRow token="--background" value="Active pill text (default variant)" />
            <TokenRow token="--muted" value="Inactive pill background (default variant)" />
            <TokenRow token="--muted-foreground" value="Inactive pill text (default variant)" />
            <TokenRow token="--primary" value="Outline variant text and border color" />
            <TokenRow token="--ring" value="Focus ring color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Pill } from '@/components/ui/pill';

// Single-select filter
<div className="flex gap-1.5">
  {options.map(opt => (
    <Pill
      key={opt.value}
      active={selected === opt.value}
      onClick={() => setSelected(opt.value)}
    >
      {opt.label}
    </Pill>
  ))}
</div>

// Multi-select filter
<div className="flex gap-1.5 flex-wrap">
  {categories.map(cat => (
    <Pill
      key={cat.slug}
      active={selectedCats.includes(cat.slug)}
      onClick={() => toggleCategory(cat.slug)}
    >
      {cat.name}
    </Pill>
  ))}
</div>

// Outline action chips
<Pill variant="outline" size="sm" onClick={handleClick}>
  Topic Name
</Pill>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">aria-pressed:</strong> Each pill sets <code className="text-primary bg-primary/5 px-1 rounded">aria-pressed</code> based on its <code className="text-primary bg-primary/5 px-1 rounded">active</code> prop, enabling screen readers to announce toggle state.</p>
            <p><strong className="text-foreground">data-state:</strong> Exposes <code className="text-primary bg-primary/5 px-1 rounded">data-state="on"</code> or <code className="text-primary bg-primary/5 px-1 rounded">"off"</code> for CSS targeting.</p>
            <p><strong className="text-foreground">Focus ring:</strong> Visible focus ring via <code className="text-primary bg-primary/5 px-1 rounded">focus-visible:ring-1 focus-visible:ring-ring</code>.</p>
            <p><strong className="text-foreground">Native button:</strong> Uses <code className="text-primary bg-primary/5 px-1 rounded">{"<button type=\"button\">"}</code> for keyboard accessibility (Enter/Space to activate, Tab to navigate).</p>
          </div>
        </section>

        {/* Pill vs Badge vs Toggle */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Pill vs Badge vs Toggle</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Component</th>
                  <th className="text-left p-3 font-medium">Interactive</th>
                  <th className="text-left p-3 font-medium">Shape</th>
                  <th className="text-left p-3 font-medium">Use case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-medium">Pill</td>
                  <td className="p-3 text-muted-foreground">Yes</td>
                  <td className="p-3 text-muted-foreground">rounded-full</td>
                  <td className="p-3 text-muted-foreground">Filter controls, category selectors</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Badge</td>
                  <td className="p-3 text-muted-foreground">No</td>
                  <td className="p-3 text-muted-foreground">rounded-md</td>
                  <td className="p-3 text-muted-foreground">Status labels, counts, tags</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Toggle</td>
                  <td className="p-3 text-muted-foreground">Yes</td>
                  <td className="p-3 text-muted-foreground">rounded-md</td>
                  <td className="p-3 text-muted-foreground">Toolbar actions (bold, italic)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderFilterBar:</strong> Visibility filter pills (single-select: All/Public/Unlisted/Private) and category filter pills (multi-select).</p>
            <p><strong className="text-foreground">Binder Editor:</strong> Demo topic chips (outline variant, sm size) for guest users to quick-start with a template.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
