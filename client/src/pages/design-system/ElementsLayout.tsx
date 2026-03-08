import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const widthTokens = [
  { token: 'max-w-page-max', css: '--container-page-max', value: '72rem (1152px)', px: '1152px', usage: 'Marketing, Catalog, BinderReaders' },
  { token: 'max-w-page-wide', css: '--container-page-wide', value: '64rem (1024px)', px: '1024px', usage: 'Curator Dashboard, Pricing, Analytics' },
  { token: 'max-w-page-default', css: '--container-page-default', value: '56rem (896px)', px: '896px', usage: 'Binder Editor, Binder Overview, Dashboard' },
  { token: 'max-w-page-narrow', css: '--container-page-narrow', value: '48rem (768px)', px: '768px', usage: 'Week View, reading-focused layouts' },
  { token: 'max-w-page-prose', css: '--container-page-prose', value: '42rem (672px)', px: '672px', usage: 'Settings, Billing, Profile forms' },
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
  const [showColumns, setShowColumns] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Layout Grid</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A 12-column grid system with responsive margins, consistent gutters,
            and semantic width tiers for page-level content.
          </p>
        </div>

        {/* 12-Column Grid System */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">12-Column Grid</h2>
          <p className="text-base text-muted-foreground">
            The entire app is built on a 12-column grid. The Layout shell
            applies <code className="bg-muted px-1 rounded">grid-container</code> to header, main,
            and footer — constraining content to 72rem max-width with responsive margins.
            Inside, use <code className="bg-muted px-1 rounded">grid-12</code> for the 12-column
            CSS grid with 24px gutters.
          </p>

          {/* Live 12-col demo */}
          <div className="space-y-2">
            <button
              onClick={() => setShowColumns(prev => !prev)}
              className="text-sm text-primary underline underline-offset-2"
            >
              {showColumns ? 'Hide' : 'Show'} column grid overlay
            </button>
            <div className="relative border border-border rounded-lg p-6 overflow-hidden">
              {showColumns && (
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '1.5rem',
                    padding: '0 1.5rem',
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'hsl(340 80% 60% / 0.07)',
                        borderLeft: '1px solid hsl(340 80% 60% / 0.2)',
                        borderRight: '1px solid hsl(340 80% 60% / 0.2)',
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="grid-12">
                {/* 4 x 3-col cards */}
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="col-span-3 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                    col-span-3
                  </div>
                ))}
                {/* 3 x 4-col cards */}
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={`m-${i}`} className="col-span-4 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                    col-span-4
                  </div>
                ))}
                {/* 2 x 6-col cards */}
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={`l-${i}`} className="col-span-6 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                    col-span-6
                  </div>
                ))}
                {/* 8 + 4 */}
                <div className="col-span-8 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  col-span-8
                </div>
                <div className="col-span-4 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  col-span-4
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Shortcut:</strong> Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border">Ctrl+Shift+C</kbd> anywhere
              to toggle the 12-column grid overlay on the full page.
            </p>
          </div>

          <CodeBlock>{`/* Grid system tokens (index.css @theme) */
--grid-columns: 12;
--grid-gutter: 1.5rem;     /* 24px between columns */
--grid-margin: 1rem;       /* 16px on mobile, 24px tablet, 32px desktop */
--grid-max-width: 72rem;   /* 1152px max content width */`}</CodeBlock>

          <CodeBlock>{`{/* Layout shell — stretches full width, content in grid-container */}
<header className="w-full bg-background border-b">
  <div className="grid-container flex items-center h-16">...</div>
</header>

<main className="grid-container py-8">
  {/* Page content lives here */}
</main>

{/* Card grid — 12 columns, responsive col-spans */}
<div className="grid-12">
  {cards.map(card => (
    <Card className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3" />
  ))}
</div>`}</CodeBlock>
        </section>

        {/* Responsive Column Patterns */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Responsive Patterns</h2>
          <p className="text-base text-muted-foreground">
            Card grids use responsive <code className="bg-muted px-1 rounded">col-span-*</code> classes
            to adapt from 1 column on mobile to 4 columns on xl screens.
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Breakpoint</th>
                  <th className="text-left px-4 py-2 font-medium">Margin</th>
                  <th className="text-left px-4 py-2 font-medium">Card Columns</th>
                  <th className="text-left px-4 py-2 font-medium">Col Span</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">{'< 768px'}</code></td>
                  <td className="px-4 py-2 text-muted-foreground">16px</td>
                  <td className="px-4 py-2 text-muted-foreground">1 card per row</td>
                  <td className="px-4 py-2"><code className="text-primary">col-span-12</code></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">768px+ (md)</code></td>
                  <td className="px-4 py-2 text-muted-foreground">24px</td>
                  <td className="px-4 py-2 text-muted-foreground">2 cards per row</td>
                  <td className="px-4 py-2"><code className="text-primary">md:col-span-6</code></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2"><code className="text-primary">1024px+ (lg)</code></td>
                  <td className="px-4 py-2 text-muted-foreground">32px</td>
                  <td className="px-4 py-2 text-muted-foreground">3 cards per row</td>
                  <td className="px-4 py-2"><code className="text-primary">lg:col-span-4</code></td>
                </tr>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-2"><code className="text-primary">1280px+ (xl)</code></td>
                  <td className="px-4 py-2 text-muted-foreground">32px</td>
                  <td className="px-4 py-2 text-muted-foreground">4 cards per row</td>
                  <td className="px-4 py-2"><code className="text-primary">xl:col-span-3</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Live responsive demo */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">4 cards (responsive: 1 → 2 → 3 → 4 per row)</p>
              <div className="grid-12">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3 h-12 rounded-lg bg-primary/10 border border-primary/20" />
                ))}
              </div>
              <code className="text-xs font-mono text-muted-foreground">col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Sidebar + content (8 + 4)</p>
              <div className="grid-12">
                <div className="col-span-12 lg:col-span-8 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  col-span-8
                </div>
                <div className="col-span-12 lg:col-span-4 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  col-span-4
                </div>
              </div>
              <code className="text-xs font-mono text-muted-foreground">col-span-12 lg:col-span-8 + col-span-12 lg:col-span-4</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">3-column equal (pricing, metric cards)</p>
              <div className="grid-12">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="col-span-12 md:col-span-4 h-12 rounded-lg bg-primary/10 border border-primary/20" />
                ))}
              </div>
              <code className="text-xs font-mono text-muted-foreground">col-span-12 md:col-span-4</code>
            </div>
          </div>
        </section>

        {/* Page Width Tiers */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Page Width Tiers</h2>
          <p className="text-base text-muted-foreground">
            Within the 12-column grid container, individual pages can constrain their content
            further using semantic <code className="bg-muted px-1 rounded">max-w-page-*</code> tokens.
            These are useful for reading-focused or form-heavy pages.
          </p>
          <div className="space-y-3">
            {widthTokens.map((t, i) => (
              <div key={t.token} className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="text-sm font-mono text-primary bg-muted px-2 py-0.5 rounded">{t.token}</code>
                  <span className="text-sm text-muted-foreground">{t.value}</span>
                </div>
                <div
                  className="h-3 rounded-sm transition-all"
                  style={{
                    width: t.px,
                    maxWidth: '100%',
                    backgroundColor: `hsl(var(--primary) / ${0.12 - i * 0.015})`,
                    border: '1px solid hsl(var(--primary) / 0.2)',
                  }}
                />
                <p className="text-sm text-muted-foreground">{t.usage}</p>
              </div>
            ))}
          </div>
          <CodeBlock>{`{/* Narrow page — content constrained within grid-container */}
<div className="max-w-page-prose mx-auto">
  {/* Form content */}
</div>

{/* Full-width card grid — uses all 12 columns */}
<div className="grid-12">
  {cards.map(card => (
    <Card className="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3" />
  ))}
</div>`}</CodeBlock>
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
            <div className="relative border border-border rounded-lg p-6 space-y-4 overflow-hidden">
              {showBaseline && (
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to bottom, hsl(200 80% 60% / 0.12) 0px, hsl(200 80% 60% / 0.12) 1px, transparent 1px, transparent 4px)',
                  }}
                />
              )}
              <p className="text-xs">Text xs — 12px / 16px line-height</p>
              <p className="text-sm">Text sm — 14px / 20px line-height</p>
              <p className="text-base">Text base — 16px / 24px line-height</p>
              <p className="text-lg">Text lg — 18px / 28px line-height</p>
              <p className="text-xl">Text xl — 20px / 28px line-height</p>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Shortcut:</strong> Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border">Ctrl+Shift+G</kbd> anywhere
              to toggle the baseline grid overlay on the full page.
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
            The <code className="bg-muted px-1 rounded">grid-container</code> class applies responsive
            margins: 16px on mobile, 24px on tablet (md), 32px on desktop (lg). Column gutters
            are a fixed 24px (<code className="bg-muted px-1 rounded">--grid-gutter</code>).
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div>
              <p className="font-medium">Card padding</p>
              <p className="text-muted-foreground">16–24px (4–6 spacing units). Consistent across Card components.</p>
            </div>
            <div>
              <p className="font-medium">Grid gaps</p>
              <p className="text-muted-foreground">
                The <code className="bg-muted px-1 rounded">grid-12</code> class uses 24px gaps by default.
                For non-grid layouts, use <code className="bg-muted px-1 rounded">gap-4</code> (16px) for tight,
                <code className="bg-muted px-1 rounded">gap-6</code> (24px) standard,
                <code className="bg-muted px-1 rounded">gap-8</code> (32px) spacious.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
