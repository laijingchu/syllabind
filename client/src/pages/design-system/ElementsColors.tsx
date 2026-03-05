import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const coreColors = [
  { name: 'background', token: '--background', tw: 'bg-background', desc: 'The base canvas color for every page.' },
  { name: 'foreground', token: '--foreground', tw: 'text-foreground', desc: 'Default text color. Used for headings and body copy.' },
  { name: 'card', token: '--card', tw: 'bg-card', desc: 'Surface color for cards, panels, and elevated containers.' },
  { name: 'card-foreground', token: '--card-foreground', tw: 'text-card-foreground', desc: 'Text color inside cards.' },
  { name: 'popover', token: '--popover', tw: 'bg-popover', desc: 'Surface color for dropdown menus, tooltips, and popovers.' },
  { name: 'popover-foreground', token: '--popover-foreground', tw: 'text-popover-foreground', desc: 'Text color inside popovers.' },
];

const semanticColors = [
  { name: 'primary', token: '--primary', tw: 'bg-primary', desc: 'Main call-to-action. Enroll buttons, active navigation, focus rings.' },
  { name: 'primary-foreground', token: '--primary-foreground', tw: 'text-primary-foreground', desc: 'Text placed on a primary-colored surface (e.g., button labels).' },
  { name: 'secondary', token: '--secondary', tw: 'bg-secondary', desc: 'Supporting actions. Used when a second button sits beside a primary CTA.' },
  { name: 'secondary-foreground', token: '--secondary-foreground', tw: 'text-secondary-foreground', desc: 'Text on secondary surfaces.' },
  { name: 'muted', token: '--muted', tw: 'bg-muted', desc: 'Low-emphasis backgrounds. Code blocks, sidebar sections, skeleton loaders.' },
  { name: 'muted-foreground', token: '--muted-foreground', tw: 'text-muted-foreground', desc: 'De-emphasized text. Descriptions, timestamps, helper text, placeholders.' },
  { name: 'accent', token: '--accent', tw: 'bg-accent', desc: 'Soft highlight. Used sparingly for hovered navigation items and active filters.' },
  { name: 'accent-foreground', token: '--accent-foreground', tw: 'text-accent-foreground', desc: 'Text on accent surfaces.' },
  { name: 'destructive', token: '--destructive', tw: 'bg-destructive', desc: 'Danger and irreversible actions. Delete buttons, error states, form validation.' },
  { name: 'destructive-foreground', token: '--destructive-foreground', tw: 'text-destructive-foreground', desc: 'Text on destructive surfaces.' },
];

const borderColors = [
  { name: 'border', token: '--border', tw: 'border-border', desc: 'Default dividers and card edges. The most common border color.' },
  { name: 'input', token: '--input', tw: 'border-input', desc: 'Form input outlines — text fields, selects, textareas.' },
  { name: 'ring', token: '--ring', tw: 'ring-ring', desc: 'Focus ring color. Appears when tabbing or clicking into interactive elements.' },
  { name: 'primary-border', token: '--primary-border', tw: 'border-primary-border', desc: 'Auto-generated border for filled primary buttons. Slightly darker than the fill.' },
  { name: 'accent-border', token: '--accent-border', tw: 'border-accent-border', desc: 'Auto-generated border for accent surfaces.' },
  { name: 'destructive-border', token: '--destructive-border', tw: 'border-destructive-border', desc: 'Auto-generated border for destructive buttons and alerts.' },
];

const chartColors = [
  { name: 'chart-1', token: '--chart-1', tw: 'bg-chart-1' },
  { name: 'chart-2', token: '--chart-2', tw: 'bg-chart-2' },
  { name: 'chart-3', token: '--chart-3', tw: 'bg-chart-3' },
  { name: 'chart-4', token: '--chart-4', tw: 'bg-chart-4' },
  { name: 'chart-5', token: '--chart-5', tw: 'bg-chart-5' },
];

const overlayTokens = [
  { name: 'button-outline', token: '--button-outline', desc: 'Subtle outline around outline-variant buttons. Visible enough to define shape, light enough to not compete.' },
  { name: 'badge-outline', token: '--badge-outline', desc: 'Even lighter outline for badges and tags. Just enough definition against the background.' },
  { name: 'elevate-1', token: '--elevate-1', desc: 'Hover feedback. A barely-visible overlay that says "this is interactive."' },
  { name: 'elevate-2', token: '--elevate-2', desc: 'Press/active and toggle-on feedback. Stronger overlay for click confirmation and selected states.' },
];

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
          <p className="text-muted-foreground max-w-2xl">
            The color system is built around named roles, not specific hex values. Each role describes
            <em> what the color is for</em> — "primary" for main actions, "muted" for de-emphasized areas —
            so the palette can evolve without updating individual components.
          </p>
        </div>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">How Color Tokens Work</h2>
          <p className="text-sm text-muted-foreground">
            Colors are stored as HSL values (hue, saturation, lightness) in named tokens. This format
            makes it easy to adjust a color's brightness or create transparent variants for overlays
            and backgrounds. When you see a color in the UI, it always traces back to one of these token names.
          </p>
          <CodeBlock>{`/* Token definition */
--primary: 240 5.9% 10%;              /* the color value */

/* How engineers reference it */
<Button className="bg-primary" />       /* solid fill */
<Badge className="bg-primary/10" />     /* 10% opacity variant */
<Link className="text-primary" />       /* as text color */`}</CodeBlock>
        </section>

        {/* Core Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Surface & Text Colors</h2>
          <p className="text-sm text-muted-foreground">
            These set the overall tone of the interface. Background defines the page canvas, foreground
            defines the default text. Card and popover surfaces sit on top of the background with their
            own text colors for contrast.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreColors.map(c => (
              <div key={c.name} className="space-y-2">
                <ColorSwatch name={c.name} token={c.token} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                  <code className="text-xs font-mono text-primary">{c.tw}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Semantic Colors</h2>
          <p className="text-sm text-muted-foreground">
            These colors carry meaning. Each one maps to a specific type of UI element or user action.
            Every semantic color comes in a pair: the fill color and a foreground color for text placed on top.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { bg: semanticColors[0], fg: semanticColors[1] },
              { bg: semanticColors[2], fg: semanticColors[3] },
              { bg: semanticColors[4], fg: semanticColors[5] },
              { bg: semanticColors[6], fg: semanticColors[7] },
              { bg: semanticColors[8], fg: semanticColors[9] },
            ].map(({ bg, fg }) => (
              <div key={bg.name} className="rounded-lg border border-border overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between"
                  style={{ backgroundColor: `hsl(var(${bg.token}))`, color: `hsl(var(${fg.token}))` }}
                >
                  <span className="font-medium">{bg.name}</span>
                  <span className="text-sm opacity-80">{fg.name}</span>
                </div>
                <div className="p-3 text-xs space-y-1 bg-card">
                  <p className="text-muted-foreground">{bg.desc}</p>
                  <p className="font-mono text-primary">{bg.tw} / {fg.tw}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Border Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Border & Focus Colors</h2>
          <p className="text-sm text-muted-foreground">
            Borders define edges and separation. Some are set manually (like the default border),
            while others are auto-generated from their parent color — for example, a primary button's
            border is automatically a slightly darker shade of primary, ensuring it always looks correct
            even if the primary color changes.
          </p>
          <div className="space-y-1">
            {borderColors.map(c => (
              <TokenRow key={c.name} token={c.token} value={c.desc}>
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-8 w-20 rounded border-2"
                    style={{ borderColor: `hsl(var(${c.token}))` }}
                  />
                </div>
              </TokenRow>
            ))}
          </div>
          <CodeBlock>{`/* Auto-computed borders */
/* In light mode, button borders are slightly darker than the fill */
/* In dark mode, button borders are slightly lighter than the fill */
/* This is controlled by a single intensity variable: */

--opaque-button-border-intensity: -8;  /* light mode: darken */
--opaque-button-border-intensity:  9;  /* dark mode: lighten */`}</CodeBlock>
        </section>

        {/* Chart Colors */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Visualization</h2>
          <p className="text-sm text-muted-foreground">
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
              </div>
            ))}
          </div>
        </section>

        {/* Overlay & Elevation Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Overlay & Interaction Tokens</h2>
          <p className="text-sm text-muted-foreground">
            These semi-transparent values are used for subtle outlines and interactive feedback.
            They use black (light mode) or white (dark mode) at very low opacities, so they work
            on any background without introducing new hues.
          </p>
          <div className="space-y-1">
            {overlayTokens.map(t => (
              <TokenRow key={t.name} token={t.token} value={t.desc}>
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-8 w-20 rounded border border-border"
                    style={{ backgroundColor: `var(${t.token})` }}
                  />
                </div>
              </TokenRow>
            ))}
          </div>
        </section>

        {/* Dark mode */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Light & Dark Mode</h2>
          <p className="text-sm text-muted-foreground">
            The color system supports both modes automatically. Components never reference
            specific light or dark values — they reference token names like "primary" and "background",
            which resolve to the correct value based on the active mode. This means a design specified
            using token names works in both modes without any extra work.
          </p>
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
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
