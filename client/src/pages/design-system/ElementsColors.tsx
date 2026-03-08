import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const neutralRampSteps = ['50','100','150','200','250','300','350','400','450','500','550','600','650','700','750','800','850','900','950'];
const semanticRampSteps = ['50','100','200','300','400','500','600','700','800','900'];

const surfaceColors = [
  { name: 'background', token: '--background', tw: 'bg-background', desc: 'The base canvas color for every page.', light: '--warm-50', dark: '--cool-800' },
  { name: 'card', token: '--card', tw: 'bg-card', desc: 'Surface color for cards, panels, and elevated containers.', light: '--warm-50', dark: '--cool-800' },
  { name: 'popover', token: '--popover', tw: 'bg-popover', desc: 'Surface color for dropdown menus, tooltips, and popovers.', light: '--warm-50', dark: '--cool-800' },
  { name: 'muted', token: '--muted', tw: 'bg-muted', desc: 'Most passive variant surface. Tab lists, code blocks, separators, skeleton loaders.', light: '--warm-100', dark: '--cool-750' },
  { name: 'highlight', token: '--highlight', tw: 'bg-highlight', desc: 'Mid-level highlight. Active navigation items, calendar today, selected states.', light: '--warm-150', dark: '--cool-700' },
  { name: 'secondary', token: '--secondary', tw: 'bg-secondary', desc: 'Most prominent variant surface. Secondary buttons, badges, interactive fills.', light: '--warm-200', dark: '--cool-650' },
  { name: 'primary-inverted', token: '--primary-inverted', tw: 'bg-primary-inverted', desc: 'Solid primary fill. Primary buttons, tooltips, badges, checkboxes. The strong counterpart to primary-surface.', light: '--warm-900', dark: '--cool-50' },
];

const semanticSurfaceColors = [
  { name: 'primary-surface', token: '--primary-surface', tw: 'bg-primary-surface', desc: 'Tinted background for primary highlights, active nav items, selected states, and icon containers.', light: '--warm-150', dark: '--cool-700' },
  { name: 'warning-surface', token: '--warning-surface', tw: 'bg-warning-surface', desc: 'Tinted background for warning banners, badges, and icon containers.', light: '--warning-50', dark: '--warning-900' },
  { name: 'success-surface', token: '--success-surface', tw: 'bg-success-surface', desc: 'Tinted background for success banners, approval notices, and positive states.', light: '--success-50', dark: '--success-900' },
  { name: 'danger-surface', token: '--danger-surface', tw: 'bg-danger-surface', desc: 'Tinted background for error boxes, destructive action highlights.', light: '--danger-50', dark: '--danger-900' },
  { name: 'danger-inverted', token: '--danger-inverted', tw: 'bg-danger-inverted', desc: 'Solid danger fill. The strong counterpart to danger-surface — delete buttons, error badges, destructive actions.', light: '--danger-500', dark: '--danger-500' },
  { name: 'warning-inverted', token: '--warning-inverted', tw: 'bg-warning-inverted', desc: 'Solid warning fill. The strong counterpart to warning-surface — urgent alerts, caution badges, credit warnings.', light: '--warning-600', dark: '--warning-400' },
  { name: 'success-inverted', token: '--success-inverted', tw: 'bg-success-inverted', desc: 'Solid success fill. The strong counterpart to success-surface — completion badges, approval buttons, valid states.', light: '--success-600', dark: '--success-400' },
];

const elevationTokens = [
  { name: 'elevate-1', token: '--elevate-1', desc: 'Hover feedback. A barely-visible overlay that says "this is interactive."', light: 'var(--highlight)', dark: 'var(--highlight)' },
  { name: 'elevate-2', token: '--elevate-2', desc: 'Press/active and toggle-on feedback. Stronger overlay for click confirmation and selected states.', light: 'var(--secondary)', dark: 'var(--secondary)' },
];

const foregroundTextColors = [
  { name: 'foreground', token: '--foreground', tw: 'text-foreground', desc: 'Default text color. card-foreground and popover-foreground are aliases.', light: '--warm-950', dark: '--cool-50' },
  { name: 'muted-foreground', token: '--muted-foreground', tw: 'text-muted-foreground', desc: 'De-emphasized text. Descriptions, timestamps, helper text, placeholders.', light: '--warm-500', dark: '--cool-400' },
  { name: 'secondary-foreground', token: '--secondary-foreground', tw: 'text-secondary-foreground', desc: 'Text on secondary surfaces.', light: '--warm-850', dark: '--cool-50', bg: '--secondary' },
  { name: 'highlight-foreground', token: '--highlight-foreground', tw: 'text-highlight-foreground', desc: 'Text on highlight surfaces.', light: '--warm-850', dark: '--cool-50', bg: '--highlight' },
  { name: 'foreground-inverted', token: '--foreground-inverted', tw: 'text-foreground-inverted', desc: 'Text on inverted surfaces (primary-inverted, danger-inverted). Lightest neutral swatch.', light: '--warm-50', dark: '--cool-50', bg: '--danger-inverted' },
  { name: 'foreground-warning-inverted', token: '--foreground-warning-inverted', tw: 'text-foreground-warning-inverted', desc: 'Text on warning-inverted surfaces.', light: '--warm-50', dark: '--warning-900', bg: '--warning-inverted' },
  { name: 'foreground-success-inverted', token: '--foreground-success-inverted', tw: 'text-foreground-success-inverted', desc: 'Text on success-inverted surfaces.', light: '--warm-50', dark: '--success-900', bg: '--success-inverted' },
];


const borderTokens = [
  { name: 'border', token: '--border', tw: 'border-border', desc: 'Default dividers and card edges. Picked from the warm/cool ramp.', light: '--warm-200', dark: '--cool-750' },
  { name: 'input', token: '--input', tw: 'border-input', desc: 'Form input outlines — text fields, selects, textareas.', light: '--warm-200', dark: '--cool-750' },
  { name: 'ring', token: '--ring', tw: 'ring-ring', desc: 'Focus ring color. Appears when tabbing or clicking into interactive elements.', light: '--warm-800', dark: '--cool-200' },
  { name: 'warning-border', token: '--warning-border', tw: 'border-warning-border', desc: 'Border for warning banners and badges. Picked from the warning ramp.', light: '--warning-200', dark: '--warning-800', bg: '--warning-surface' },
  { name: 'success-border', token: '--success-border', tw: 'border-success-border', desc: 'Border for success banners and badges. Picked from the success ramp.', light: '--success-200', dark: '--success-800', bg: '--success-surface' },
  { name: 'danger-border', token: '--danger-border', tw: 'border-danger-border', desc: 'Border for destructive banners, badges, and alerts. Picked from the danger ramp.', light: '--danger-200', dark: '--danger-800', bg: '--danger-surface' },
  { name: 'button-outline', token: '--button-outline', desc: 'Subtle outline around outline-variant buttons. Picked from the ramp.', light: '--warm-300', dark: '--cool-600' },
  { name: 'badge-outline', token: '--badge-outline', desc: 'Even lighter outline for badges and tags. Picked from the ramp.', light: '--warm-200', dark: '--cool-700' },
];


const chartColors = [
  { name: 'chart-1', token: '--chart-1', tw: 'bg-chart-1', light: '12 76% 61%', dark: '220 70% 50%' },
  { name: 'chart-2', token: '--chart-2', tw: 'bg-chart-2', light: '173 58% 39%', dark: '160 60% 45%' },
  { name: 'chart-3', token: '--chart-3', tw: 'bg-chart-3', light: '197 37% 24%', dark: '30 80% 55%' },
  { name: 'chart-4', token: '--chart-4', tw: 'bg-chart-4', light: '43 74% 66%', dark: '280 65% 60%' },
  { name: 'chart-5', token: '--chart-5', tw: 'bg-chart-5', light: '27 87% 67%', dark: '340 75% 55%' },
];

function PrimitiveRef({ light, dark }: { light: string; dark: string }) {
  const format = (v: string) => v.startsWith('--') ? `var(${v})` : v;
  return (
    <span className="text-xs font-mono text-muted-foreground">
      <span className="text-muted-foreground">L:</span> <span>{format(light)}</span>
      <span className="mx-1.5 text-border">|</span>
      <span className="text-muted-foreground">D:</span> <span>{format(dark)}</span>
    </span>
  );
}

function ColorSwatch({ name, token }: { name: string; token: string }) {
  return (
    <div
      className="h-12 w-full rounded-md border border-border"
      style={{ backgroundColor: `hsl(var(${token}))` }}
      title={name}
    />
  );
}

export default function ElementsColors() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Colors</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            The color system is built around a surface/foreground model. Surface tokens control
            backgrounds and containers. Foreground tokens control text, borders, and outlines.
            Both categories draw from shared primitive ramps, so the palette stays consistent
            as it evolves.
          </p>
        </div>

        {/* Primitive Ramps */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Primitive Color Ramps</h2>
          <p className="text-base text-muted-foreground">
            Raw scales used as a palette to pick semantic tokens from. Neutral ramps use half-steps
            (50-step increments), semantic ramps use full steps (100-step increments).
          </p>

          {/* Neutral ramps */}
          {['warm', 'cool'].map(ramp => (
            <div key={ramp}>
              <p className="text-sm font-medium mb-2 capitalize">{ramp} neutral</p>
              <div className="flex gap-0.5">
                {neutralRampSteps.map(step => (
                  <div key={step} className="flex-1 text-center">
                    <div
                      className="h-10 rounded-sm"
                      style={{ backgroundColor: `hsl(var(--${ramp}-${step}))` }}
                    />
                    <p className="text-[10px] font-mono mt-1 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Semantic ramps */}
          {[
            { name: 'success', label: 'Success (green)' },
            { name: 'danger', label: 'Danger (red)' },
            { name: 'warning', label: 'Warning (amber)' },
          ].map(ramp => (
            <div key={ramp.name}>
              <p className="text-sm font-medium mb-2">{ramp.label}</p>
              <div className="flex gap-0.5">
                {semanticRampSteps.map(step => (
                  <div key={step} className="flex-1 text-center">
                    <div
                      className="h-10 rounded-sm"
                      style={{ backgroundColor: `hsl(var(--${ramp.name}-${step}))` }}
                    />
                    <p className="text-[10px] font-mono mt-1 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">How Color Tokens Work</h2>
          <p className="text-base text-muted-foreground">
            Colors are stored as HSL values (hue, saturation, lightness) in named tokens. Semantic
            tokens reference primitive ramps via <code className="text-primary">var(--ramp-step)</code>,
            so changing a ramp value propagates everywhere. Both light and dark modes use the same
            pattern — light mode picks from the warm ramp, dark mode picks from the cool ramp.
          </p>
          <CodeBlock>{`/* Primitive ramp */
--warm-300: 8 16% 82%;

/* Semantic token references the ramp */
--border: var(--warm-300);              /* light mode */
--border: var(--cool-700);              /* dark mode */

/* How engineers use it */
<Card className="border-border" />      /* default divider */
<Badge className="bg-primary-surface" />     /* 10% opacity variant */`}</CodeBlock>
        </section>

        {/* Surface Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Surface Colors</h2>
          <p className="text-base text-muted-foreground">
            Backgrounds and containers. In light mode, surfaces use a warm off-white (hue 8°)
            for a softer feel. In dark mode, the page canvas is a deep cool blue-gray.
            Muted, highlight, and secondary form a three-step progression away from the background —
            muted is closest to the canvas (most passive), highlight is a noticeable highlight,
            and secondary is the most prominent variant surface.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surfaceColors.map(c => (
              <div key={c.name} className="space-y-2">
                <ColorSwatch name={c.name} token={c.token} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <code className="text-xs font-mono text-primary">{c.tw}</code>
                  <div className="mt-1">
                    <PrimitiveRef light={c.light} dark={c.dark} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Elevation sub-section */}
          <h3 className="font-display text-lg font-medium pt-4">Elevation Overlays</h3>
          <p className="text-base text-muted-foreground">
            Elevation tokens reference surface tokens (highlight and secondary) directly.
            The utility CSS applies opacity when consuming them, so they blend subtly
            over any underlying surface.
          </p>
          <div className="space-y-1">
            {elevationTokens.map(t => (
              <TokenRow key={t.name} token={t.token} value={t.desc}>
                <PrimitiveRef light={t.light} dark={t.dark} />
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-8 w-20 rounded border border-border"
                    style={{ backgroundColor: `hsl(var(${t.token}))` }}
                  />
                </div>
              </TokenRow>
            ))}
          </div>

          {/* Semantic surfaces */}
          <h3 className="font-display text-lg font-medium pt-4">Semantic Surfaces</h3>
          <p className="text-base text-muted-foreground">
            Tinted backgrounds for banners, badges, and status indicators. These replace
            ad-hoc opacity patterns like <code className="text-xs bg-muted px-1 py-0.5 rounded">bg-warning/10</code> with
            opaque ramp-based tokens that stay consistent across themes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {semanticSurfaceColors.map(c => (
              <div key={c.name} className="space-y-2">
                <ColorSwatch name={c.name} token={c.token} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <code className="text-xs font-mono text-primary">{c.tw}</code>
                  <div className="mt-1">
                    <PrimitiveRef light={c.light} dark={c.dark} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Foreground Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Foreground Colors</h2>
          <p className="text-base text-muted-foreground">
            Text, borders, and outlines. Everything that sits on top of a surface.
          </p>

          {/* Text colors */}
          <h3 className="font-display text-lg font-medium pt-2">Text</h3>
          <div className="space-y-1">
            {foregroundTextColors.map(c => (
              <TokenRow key={c.name} token={c.token} value={c.desc}>
                <PrimitiveRef light={c.light} dark={c.dark} />
                <div className="flex-1 flex justify-end">
                  <span
                    className="text-sm font-medium px-3 py-1 rounded"
                    style={{
                      color: `hsl(var(${c.token}))`,
                      ...(c.bg ? { backgroundColor: `hsl(var(${c.bg}))` } : {}),
                    }}
                  >
                    Sample text
                  </span>
                </div>
              </TokenRow>
            ))}
          </div>

          {/* Borders & outlines */}
          <h3 className="font-display text-lg font-medium pt-4">Borders & Outlines</h3>
          <p className="text-base text-muted-foreground">
            Dividers, form edges, and focus indicators. All picked directly from the
            primitive ramp — warm in light mode, cool in dark mode.
          </p>
          <div className="space-y-1">
            {borderTokens.map(c => (
              <TokenRow key={c.name} token={c.token} value={c.desc}>
                <PrimitiveRef light={c.light} dark={c.dark} />
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-8 w-20 rounded border-2"
                    style={{
                      borderColor: `hsl(var(${c.token}))`,
                      ...(c.bg ? { backgroundColor: `hsl(var(${c.bg}))` } : {}),
                    }}
                  />
                </div>
              </TokenRow>
            ))}
          </div>

        </section>

        {/* Chart Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Visualization</h2>
          <p className="text-base text-muted-foreground">
            A five-color palette for charts, graphs, and progress indicators. These are selected for
            sufficient contrast between adjacent data series and work in both light and dark modes.
            Currently used in binder analytics and reader progress views.
          </p>
          <div className="flex gap-2">
            {chartColors.map(c => (
              <div key={c.name} className="flex-1 space-y-2">
                <div
                  className="h-16 rounded-md"
                  style={{ backgroundColor: `hsl(var(${c.token}))` }}
                />
                <p className="text-xs font-mono text-center">{c.name}</p>
                <div className="text-center">
                  <PrimitiveRef light={c.light} dark={c.dark} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dark mode */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Light & Dark Mode</h2>
          <p className="text-base text-muted-foreground">
            Both modes use the same semantic structure. Light mode draws from the warm ramp,
            dark mode from the cool ramp. Components reference token names like "primary" and
            "background" — they never reference specific light or dark values. This means a
            design specified with token names works in both modes without extra work.
          </p>
          <div className="border border-border rounded-lg p-4 text-base text-muted-foreground">
            <p>
              <strong className="text-foreground">Design tip:</strong> When specifying colors in mockups,
              use token names (primary, muted, destructive) rather than hex values. This ensures the
              implementation matches both modes and stays consistent as the palette evolves.
            </p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
