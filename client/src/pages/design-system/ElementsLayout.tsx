import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const widthTokens = [
  { token: 'max-w-page-max', css: '--width-page-max', value: '64rem (1024px)', px: '1024px', usage: 'Marketing, Catalog, BinderReaders' },
  { token: 'max-w-page-wide', css: '--width-page-wide', value: '56rem (896px)', px: '896px', usage: 'Curator Dashboard, Pricing, Analytics' },
  { token: 'max-w-page-default', css: '--width-page-default', value: '48rem (768px)', px: '768px', usage: 'Binder Editor, Binder Overview, Dashboard' },
  { token: 'max-w-page-narrow', css: '--width-page-narrow', value: '42rem (672px)', px: '672px', usage: 'Week View, reading-focused layouts' },
  { token: 'max-w-page-prose', css: '--width-page-prose', value: '36rem (576px)', px: '576px', usage: 'Settings, Billing, Profile forms' },
];

const baselineTable = [
  { scale: 'text-xs', font: '12px', lineHeight: '16px', ratio: '1.33' },
  { scale: 'text-sm', font: '14px', lineHeight: '20px', ratio: '1.43' },
  { scale: 'text-base', font: '16px', lineHeight: '24px', ratio: '1.50' },
  { scale: 'text-lg', font: '18px', lineHeight: '28px', ratio: '1.56' },
  { scale: 'text-xl', font: '20px', lineHeight: '28px', ratio: '1.40' },
];

export default function ElementsLayout() {
  const [showBaseline, setShowBaseline] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Layout Grid</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Page widths, baseline grid, and vertical rhythm — the structural foundation
            that keeps every page feeling cohesive and aligned.
          </p>
        </div>

        {/* Page Width Tiers */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Page Width Tiers</h2>
          <p className="text-base text-muted-foreground">
            Five semantic width tokens replace ad-hoc <code className="bg-muted px-1 rounded">max-w-*</code> classes
            for page-level containers. Each tier is 8rem apart and maps to a content type:
            wider for browsing, narrower for reading.
          </p>
          <div className="space-y-3">
            {widthTokens.map(t => (
              <div key={t.token} className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded">{t.token}</code>
                  <span className="text-sm text-muted-foreground">{t.value}</span>
                </div>
                <div
                  className="h-3 rounded-sm bg-primary-surface border border-border transition-all"
                  style={{ width: t.px, maxWidth: '100%' }}
                />
                <p className="text-sm text-muted-foreground">{t.usage}</p>
              </div>
            ))}
          </div>
          <CodeBlock>{`/* CSS tokens in @theme inline (--container-* maps to max-w-*) */
--container-page-max: 64rem;       /* 1024px */
--container-page-wide: 56rem;      /* 896px  */
--container-page-default: 48rem;   /* 768px  */
--container-page-narrow: 42rem;    /* 672px  */
--container-page-prose: 36rem;     /* 576px  */`}</CodeBlock>
          <CodeBlock>{`{/* Page container — use semantic token, not raw max-w */}
<div className="max-w-page-default mx-auto">
  {/* page content */}
</div>

{/* Text constraining (paragraphs, descriptions) — keep using max-w-2xl etc. */}
<p className="max-w-2xl text-muted-foreground">...</p>`}</CodeBlock>
        </section>

        {/* Responsive Behavior */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Responsive Behavior</h2>
          <p className="text-base text-muted-foreground">
            Page width tokens define the <em>maximum</em> width — on smaller viewports the
            container naturally shrinks to fit. The Layout shell
            applies <code className="bg-muted px-1 rounded">container mx-auto px-4</code> which
            provides 16px horizontal padding at all breakpoints.
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Breakpoint</th>
                  <th className="text-left px-4 py-2 font-medium">Width</th>
                  <th className="text-left px-4 py-2 font-medium">Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">{'< 640px'}</code></td>
                  <td className="px-4 py-2 text-muted-foreground">Mobile</td>
                  <td className="px-4 py-2 text-muted-foreground">Full width minus px-4 gutters. Single column layouts.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">640–768px</code></td>
                  <td className="px-4 py-2 text-muted-foreground">Tablet</td>
                  <td className="px-4 py-2 text-muted-foreground">Content fills available width. Grids may shift to 2-col.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">768–1024px</code></td>
                  <td className="px-4 py-2 text-muted-foreground">Small desktop</td>
                  <td className="px-4 py-2 text-muted-foreground">Max-width tokens begin capping content. Sidebars appear.</td>
                </tr>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-2"><code className="text-primary">{'> 1024px'}</code></td>
                  <td className="px-4 py-2 text-muted-foreground">Large desktop</td>
                  <td className="px-4 py-2 text-muted-foreground">Content is max-width capped and centered. White space grows on sides.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock>{`{/* Responsive column pattern */}
<div className="max-w-page-max mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Cards stack on mobile, 2-col on tablet, 3-col on desktop */}
  </div>
</div>`}</CodeBlock>
          <div className="border border-border rounded-lg p-4 text-base text-muted-foreground">
            <p>
              <strong className="text-foreground">Rule of thumb:</strong> Page-level containers
              use semantic <code className="bg-muted px-1 rounded">max-w-page-*</code> tokens.
              Inner elements (text paragraphs, dialog content, description blocks) keep using
              standard Tailwind widths like <code className="bg-muted px-1 rounded">max-w-2xl</code> or <code className="bg-muted px-1 rounded">max-w-sm</code>.
            </p>
          </div>
        </section>

        {/* Baseline Grid */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Baseline Grid</h2>
          <p className="text-base text-muted-foreground">
            All line-heights snap to multiples of 4px, matching the spacing base
            (<code className="bg-muted px-1 rounded">--spacing: 0.25rem</code>).
            This ensures text and UI elements align vertically across the page.
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Scale</th>
                  <th className="text-left px-4 py-2 font-medium">Font Size</th>
                  <th className="text-left px-4 py-2 font-medium">Line Height</th>
                  <th className="text-left px-4 py-2 font-medium">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {baselineTable.map(row => (
                  <tr key={row.scale} className="border-b border-border last:border-0">
                    <td className="px-4 py-2"><code className="text-primary">{row.scale}</code></td>
                    <td className="px-4 py-2 text-muted-foreground">{row.font}</td>
                    <td className="px-4 py-2 font-mono">{row.lineHeight}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live overlay demo */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBaseline(prev => !prev)}
              className="text-sm text-primary underline underline-offset-2"
            >
              {showBaseline ? 'Hide' : 'Show'} baseline grid overlay
            </button>
            <div className={`relative border border-border rounded-lg p-6 space-y-4 overflow-hidden ${showBaseline ? 'debug-baseline' : ''}`}>
              <p className="text-xs">Text xs — 12px / 16px line-height</p>
              <p className="text-sm">Text sm — 14px / 20px line-height</p>
              <p className="text-base">Text base — 16px / 24px line-height</p>
              <p className="text-lg">Text lg — 18px / 28px line-height</p>
              <p className="text-xl">Text xl — 20px / 28px line-height</p>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Dev shortcut:</strong> Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border">Ctrl+Shift+G</kbd> anywhere
              in development to toggle the baseline grid overlay on the full page.
            </p>
          </div>
        </section>

        {/* Vertical Rhythm */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Vertical Rhythm</h2>
          <p className="text-base text-muted-foreground">
            Vertical spacing between sections, headings, and paragraphs should use multiples of the
            4px base. Common patterns:
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[100px]">space-y-1</code>
              <span className="text-muted-foreground">4px — tight grouping (label + input)</span>
            </div>
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[100px]">space-y-2</code>
              <span className="text-muted-foreground">8px — related items (list items, form fields)</span>
            </div>
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[100px]">space-y-4</code>
              <span className="text-muted-foreground">16px — section content (heading + body)</span>
            </div>
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[100px]">space-y-8</code>
              <span className="text-muted-foreground">32px — between sections on a page</span>
            </div>
            <div className="flex items-center gap-4">
              <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded min-w-[100px]">space-y-12</code>
              <span className="text-muted-foreground">48px — major page divisions</span>
            </div>
          </div>
        </section>

        {/* Gutters & Padding */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Gutters &amp; Padding</h2>
          <p className="text-base text-muted-foreground">
            Page-level horizontal padding is <code className="bg-muted px-1 rounded">px-4</code> (16px)
            at all breakpoints, applied by the <code className="bg-muted px-1 rounded">container mx-auto px-4</code> pattern
            in the Layout shell. Individual pages should not add their own horizontal padding unless
            they need additional inset (e.g., mobile-specific adjustments).
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div>
              <p className="font-medium">Card padding</p>
              <p className="text-muted-foreground">16–24px (4–6 spacing units). Consistent across Card components.</p>
            </div>
            <div>
              <p className="font-medium">Grid gaps</p>
              <p className="text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">gap-4</code> (16px) for tight grids,
                <code className="bg-muted px-1 rounded">gap-6</code> (24px) for standard card grids,
                <code className="bg-muted px-1 rounded">gap-8</code> (32px) for spacious layouts.
              </p>
            </div>
          </div>
        </section>

        {/* Column Patterns */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Column Patterns</h2>
          <p className="text-base text-muted-foreground">
            The app uses CSS Grid / Flexbox rather than a fixed 12-column grid.
            Common column patterns:
          </p>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">2-column (cards, features)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 rounded-lg bg-primary-surface border border-border" />
                <div className="h-12 rounded-lg bg-primary-surface border border-border" />
              </div>
              <code className="text-xs font-mono text-muted-foreground">grid grid-cols-1 md:grid-cols-2 gap-6</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">3-column (catalog, pricing)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 rounded-lg bg-primary-surface border border-border" />
                <div className="h-12 rounded-lg bg-primary-surface border border-border" />
                <div className="h-12 rounded-lg bg-primary-surface border border-border" />
              </div>
              <code className="text-xs font-mono text-muted-foreground">grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Sidebar + content (design system)</p>
              <div className="flex gap-4">
                <div className="h-12 w-1/4 rounded-lg bg-primary-surface border border-border shrink-0" />
                <div className="h-12 flex-1 rounded-lg bg-primary-surface border border-border" />
              </div>
              <code className="text-xs font-mono text-muted-foreground">flex gap-8 — sidebar w-56 shrink-0 + flex-1</code>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
