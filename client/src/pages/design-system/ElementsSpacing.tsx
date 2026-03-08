import { Link } from 'wouter';
import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const radiusTokens = [
  { token: '--radius-sm', value: 'calc(var(--radius) - 4px)', resolved: '4px', tw: 'rounded-sm', usage: 'Inline elements: badges, tags, code snippets' },
  { token: '--radius-md', value: 'calc(var(--radius) - 2px)', resolved: '6px', tw: 'rounded-md', usage: 'Buttons, inputs, small interactive elements' },
  { token: '--radius-lg', value: 'var(--radius)', resolved: '8px', tw: 'rounded-lg', usage: 'Cards, dialogs, panels, dropdown menus' },
  { token: '--radius-xl', value: 'calc(var(--radius) + 4px)', resolved: '12px', tw: 'rounded-xl', usage: 'Large containers, hero sections, featured content' },
];

const spacingExamples = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];

export default function ElementsSpacing() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Spacing & Radius</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Consistent spacing creates visual rhythm. Consistent corner rounding creates cohesion.
            Both are controlled by a small set of values that scale across the entire interface.
          </p>
        </div>

        {/* Spacing */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Spacing Scale</h2>
          <p className="text-base text-muted-foreground">
            All spacing — padding, margins, gaps between elements — is based on a 4px grid.
            The number in a spacing class is a multiplier: 1 = 4px, 4 = 16px, 8 = 32px.
            This constraint ensures elements align predictably and layouts feel intentional
            rather than eyeballed.
          </p>
          <div className="space-y-2">
            {spacingExamples.map(n => (
              <div key={n} className="flex items-center gap-4">
                <code className="text-xs font-mono text-primary w-8 text-right shrink-0">{n}</code>
                <span className="text-sm text-muted-foreground w-20 shrink-0">{n * 4}px</span>
                <div
                  className="h-4 rounded-sm bg-primary-surface border border-border"
                  style={{ width: `${n * 4}px` }}
                />
              </div>
            ))}
          </div>
          <div className="border border-border rounded-lg p-4 text-base text-muted-foreground">
            <p>
              <strong className="text-foreground">Common spacing patterns:</strong> Card padding is typically
              16–24px (4–6 units). Gap between list items is 8–12px (2–3 units). Page margins are 16px on
              mobile, 32px+ on desktop.
            </p>
          </div>
        </section>

        {/* Border Radius */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Corner Radius</h2>
          <p className="text-base text-muted-foreground">
            All corner radii derive from a single base value (currently 8px). Smaller elements get
            less rounding, larger elements get more. Changing the base value reshapes every corner
            in the product at once — useful for exploring rounder or sharper visual directions.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {radiusTokens.map(r => (
              <div key={r.token} className="space-y-2">
                <div
                  className="h-20 w-full bg-primary-surface border-2 border-border mx-auto"
                  style={{ borderRadius: r.resolved }}
                />
                <div className="text-center">
                  <code className="text-xs font-mono text-primary block">{r.tw}</code>
                  <p className="text-sm text-muted-foreground">{r.resolved}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">{r.usage}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Radius reference */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Full Radius Reference</h2>
          <p className="text-base text-muted-foreground">
            Beyond the four main tiers, sharp corners and fully circular shapes are also available.
            Avatars and status indicators use <code className="bg-muted px-1 rounded">rounded-full</code>.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {[
              { label: 'rounded-none', radius: '0px', usage: 'No rounding' },
              { label: 'rounded-sm', radius: '4px', usage: 'Badges, tags' },
              { label: 'rounded-md', radius: '6px', usage: 'Buttons, inputs' },
              { label: 'rounded-lg', radius: '8px', usage: 'Cards, panels' },
              { label: 'rounded-xl', radius: '12px', usage: 'Large containers' },
              { label: 'rounded-2xl', radius: '16px', usage: 'Hero sections' },
              { label: 'rounded-full', radius: '9999px', usage: 'Avatars, pills' },
            ].map(r => (
              <div key={r.label} className="text-center space-y-2">
                <div
                  className="h-16 w-16 bg-primary-surface border border-border mx-auto"
                  style={{ borderRadius: r.radius }}
                />
                <p className="text-xs font-mono">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.usage}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-reference to Layout page */}
        <section className="border border-border rounded-lg p-4 text-base text-muted-foreground">
          <p>
            For page-width tokens and baseline grid documentation, see the{' '}
            <Link href="/design-system/layout" className="text-primary underline underline-offset-2 hover:text-foreground transition-colors">
              Layout Grid
            </Link>{' '}
            page.
          </p>
        </section>

        {/* Design guidance */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Usage Guidance</h2>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div>
              <p className="font-medium">Spacing should create grouping</p>
              <p className="text-lg text-muted-foreground">
                Elements that are related should be closer together. Elements that are distinct should have
                more space between them. Use spacing to communicate structure, not just to fill gaps.
              </p>
            </div>
            <div>
              <p className="font-medium">Match radius to element size</p>
              <p className="text-lg text-muted-foreground">
                Small elements (buttons, inputs) use sm or md rounding. Large elements (cards, modals) use
                lg or xl. This keeps the visual weight proportional. A tiny badge with xl rounding looks odd,
                and a large card with sm rounding looks harsh.
              </p>
            </div>
            <div>
              <p className="font-medium">Inner radius should be smaller than outer</p>
              <p className="text-lg text-muted-foreground">
                When nesting rounded elements (e.g., a badge inside a card), the inner element should use a
                smaller radius than the container. This prevents concentric corners from looking thick or uneven.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
