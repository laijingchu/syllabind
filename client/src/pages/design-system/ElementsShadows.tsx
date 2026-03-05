import DesignSystemLayout, { CodeBlock } from './DesignSystemLayout';

const shadowScale = [
  { token: '--shadow-2xs', tw: 'shadow-2xs', label: '2xs' },
  { token: '--shadow-xs', tw: 'shadow-xs', label: 'xs' },
  { token: '--shadow-sm', tw: 'shadow-sm', label: 'sm' },
  { token: '--shadow', tw: 'shadow', label: 'default' },
  { token: '--shadow-md', tw: 'shadow-md', label: 'md' },
  { token: '--shadow-lg', tw: 'shadow-lg', label: 'lg' },
  { token: '--shadow-xl', tw: 'shadow-xl', label: 'xl' },
  { token: '--shadow-2xl', tw: 'shadow-2xl', label: '2xl' },
];

export default function ElementsShadows() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Shadows & Elevation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Syllabind uses a flat visual language. Instead of drop shadows to show depth, the interface
            relies on borders, background color shifts, and subtle overlays to communicate what's
            interactive and what state it's in. This creates a clean, minimal aesthetic that keeps
            focus on the content.
          </p>
        </div>

        {/* Shadow Scale */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Shadow Scale (Currently Disabled)</h2>
          <p className="text-base text-muted-foreground">
            A full shadow scale exists in the tokens but is set to 0% opacity — effectively invisible.
            This is a deliberate design choice for flat aesthetics. The tokens are ready if the direction
            shifts toward using shadows for depth.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {shadowScale.map(s => (
              <div key={s.token} className="text-center space-y-3">
                <div className={`h-20 bg-card rounded-lg border border-border ${s.tw}`} />
                <div>
                  <code className="text-xs font-mono text-primary">{s.tw}</code>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-lg p-4 text-base text-muted-foreground">
            <p>
              <strong className="text-foreground">Design note:</strong> All eight shadow tiers render identically
              right now (flat). If we decide to introduce depth via shadows — for example, for floating elements
              like dialogs or sticky headers — we can enable them per-tier without changing any component code.
            </p>
          </div>
        </section>

        {/* Elevation System */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Elevation System</h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            This is the primary way the interface communicates interactivity and state. Instead of shadows,
            a semi-transparent overlay appears on top of (or behind) an element to shift its brightness.
            In light mode, interactive surfaces get slightly darker on hover. In dark mode, they get slightly lighter.
            This works on any background color without introducing new hues or requiring manual color matching.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium">Two Intensity Levels</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-20 rounded border border-border relative" style={{ backgroundColor: 'var(--elevate-1)' }} />
                  <div>
                    <p className="text-sm font-medium">Level 1 — Hover</p>
                    <p className="text-sm text-muted-foreground">Barely visible. Tells the user "this responds to interaction."</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-20 rounded border border-border relative" style={{ backgroundColor: 'var(--elevate-2)' }} />
                  <div>
                    <p className="text-sm font-medium">Level 2 — Active / Selected</p>
                    <p className="text-sm text-muted-foreground">Noticeable. Confirms a press or marks a toggled-on state.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-base font-medium">Adapts to Mode Automatically</h3>
              <div className="text-base space-y-2 text-muted-foreground">
                <p>
                  In <strong className="text-foreground">light mode</strong>, overlays are black at low opacity — surfaces darken on interaction.
                </p>
                <p>
                  In <strong className="text-foreground">dark mode</strong>, overlays are white at low opacity — surfaces lighten on interaction.
                </p>
                <p>
                  This contrast-aware behavior means interactive feedback works on any surface color
                  without any per-element configuration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive demos */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Try It: Interactive States</h2>
          <p className="text-base text-muted-foreground">
            Hover, click, and compare these elements to see the elevation system in action.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="hover-elevate border border-border rounded-lg p-6 text-center cursor-pointer relative">
                <p className="text-sm font-medium">Hover</p>
                <p className="text-sm text-muted-foreground mt-1">Subtle brightness shift on mouse-over</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Used on: nav items, list rows, card actions
              </p>
            </div>
            <div className="space-y-2">
              <div className="hover-elevate-2 border border-border rounded-lg p-6 text-center cursor-pointer relative">
                <p className="text-sm font-medium">Hover (Strong)</p>
                <p className="text-sm text-muted-foreground mt-1">More visible for important interactive areas</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Used on: toolbar buttons, prominent clickable areas
              </p>
            </div>
            <div className="space-y-2">
              <div className="active-elevate border border-border rounded-lg p-6 text-center cursor-pointer relative">
                <p className="text-sm font-medium">Press</p>
                <p className="text-sm text-muted-foreground mt-1">Click and hold to see the active state</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Used on: buttons, toggles, any clickable element
              </p>
            </div>
            <div className="space-y-2">
              <div className="toggle-elevate toggle-elevated border border-border rounded-lg p-6 text-center cursor-pointer relative">
                <p className="text-sm font-medium">Selected / On</p>
                <p className="text-sm text-muted-foreground mt-1">Persistent elevation for active state</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Used on: active tabs, selected filters, toggle buttons
              </p>
            </div>
            <div className="space-y-2">
              <div className="toggle-elevate border border-border rounded-lg p-6 text-center cursor-pointer relative">
                <p className="text-sm font-medium">Unselected / Off</p>
                <p className="text-sm text-muted-foreground mt-1">No elevation — the default resting state</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                The baseline for toggleable elements
              </p>
            </div>
          </div>
        </section>

        {/* How states compound */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States Compound</h2>
          <p className="text-base text-muted-foreground max-w-2xl">
            Elevation states layer on top of each other. A toggled-on element still shows hover and
            press feedback, so users always get interaction cues regardless of the current state.
            This is handled automatically — selected states use a background layer, hover/press use
            a foreground layer, and they stack without conflict.
          </p>
          <CodeBlock>{`/* State combinations (automatic) */

Unselected + resting:   no overlay
Unselected + hover:     hover overlay
Unselected + pressing:  press overlay

Selected + resting:     toggle overlay
Selected + hover:       toggle overlay + hover overlay (stacked)
Selected + pressing:    toggle overlay + press overlay (stacked)

/* Six distinct visual states from two simple layers */`}</CodeBlock>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
