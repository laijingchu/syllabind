import DesignSystemLayout, { CodeBlock } from './DesignSystemLayout';

export default function ElementsOverview() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Design System Overview</h1>
          <p className="text-lg text-muted-foreground">
            This guide explains how visual decisions in the design system translate into code.
            Whether you're reviewing a mockup, specifying a new component, or auditing consistency,
            this is the shared vocabulary between design and engineering.
          </p>
        </div>

        {/* Philosophy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Philosophy</h2>
          <p className="text-base text-muted-foreground">
            Syllabind's visual language is intentionally restrained. The interface uses a flat, borderless
            depth model with subtle overlays instead of drop shadows, a neutral color palette that stays
            out of the reader's way, and two typefaces that balance personality with readability.
            Every visual choice supports the core experience: focused, distraction-free learning.
          </p>
        </section>

        {/* How it all connects */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">How Design Becomes Code</h2>
          <p className="text-base text-muted-foreground">
            The design system is built in layers. Each layer handles a different concern, and they
            all connect so that a design decision made at the token level automatically ripples
            through every component and page.
          </p>
          <div className="border border-border rounded-lg overflow-hidden text-base">
            {[
              { layer: 'Design Tokens', desc: 'The source of truth. Colors, fonts, spacing, and radius values defined as named variables.', detail: 'One CSS file defines every visual primitive.', color: 'bg-muted' },
              { layer: 'Tailwind CSS', desc: 'Translates tokens into usable style utilities. When a token changes, every utility updates.', detail: 'No config file needed — reads tokens directly.', color: 'bg-muted' },
              { layer: 'Component Variants', desc: 'Each component (Button, Card, Badge) defines named variants like "primary", "secondary", "ghost".', detail: 'Variants map design intent to specific token combinations.', color: 'bg-muted' },
              { layer: 'Accessible Primitives', desc: 'Radix UI handles keyboard navigation, screen readers, and focus management invisibly.', detail: 'Accessibility is built in — not bolted on.', color: 'bg-muted' },
              { layer: 'UI Components', desc: '50+ ready-made components combining all the above. Buttons, dialogs, accordions, forms.', detail: 'Owned code — fully customizable, not a library.', color: 'bg-muted' },
              { layer: 'Pages & Features', desc: 'Compose components together with layout utilities to build complete experiences.', detail: 'Where the product takes shape.', color: 'bg-muted' },
            ].map((l, i) => (
              <div key={i} className={`px-4 py-3 border-b border-border last:border-0 ${l.color}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-medium w-32 md:w-48 shrink-0">{l.layer}</span>
                  <span className="text-muted-foreground flex-1">{l.desc}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 md:ml-48 md:pl-4">{l.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Token system for designers */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens: The Single Source of Truth</h2>
          <p className="text-base text-muted-foreground">
            Every color, font, spacing value, and corner radius in the product traces back to a named
            <strong> design token</strong>. Tokens are like Figma styles or variables — they give a meaningful
            name to a specific value, so everyone refers to the same thing.
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">Why this matters for designers</h3>
            <div className="space-y-2 text-base text-muted-foreground">
              <p>
                <strong className="text-foreground">Consistency:</strong> When you say "use the primary color,"
                every engineer references the same token. No hex codes to copy, no mismatches.
              </p>
              <p>
                <strong className="text-foreground">Global updates:</strong> Changing a token value (say, adjusting
                the primary hue) instantly updates every button, link, and focus ring across the entire product.
              </p>
              <p>
                <strong className="text-foreground">Dark mode for free:</strong> Each token has a light and dark
                variant. Components never reference raw colors — they reference tokens that automatically
                swap when the mode changes.
              </p>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            In code, tokens live in a single CSS file. Here's what the mapping looks like — the token name
            on the left is what engineers use, the value on the right is what you see:
          </p>
          <CodeBlock>{`/* Token name        → Value (dark mode, default) */
--primary:           0 0% 98%          /* Near-white for primary actions */
--background:        240 10% 12%       /* Dark page background */
--muted-foreground:  240 5% 64.9%      /* Grey for secondary text */
--radius:            0.5rem            /* 8px corner radius */

/* Light mode swaps only the values, not the names */
.light {
  --primary:         240 5.9% 10%      /* Near-black */
  --background:      0 0% 100%         /* White */
}`}</CodeBlock>
        </section>

        {/* Component model */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Component Model</h2>
          <p className="text-base text-muted-foreground">
            The UI is built from <strong>shadcn/ui</strong> components — a library of 50+ pre-built elements
            (buttons, cards, dialogs, form inputs) that have been customized for Syllabind's visual language.
            Unlike external UI kits, these components live inside our codebase and can be freely modified.
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">How components work in practice</h3>
            <div className="space-y-2 text-base text-muted-foreground">
              <p>
                <strong className="text-foreground">Variants</strong> map directly to design intent.
                A Button has variants like <em>default</em> (filled, high-emphasis),
                <em> outline</em> (bordered, medium-emphasis), and <em>ghost</em> (transparent, low-emphasis).
                When specifying a design, you can reference these variant names.
              </p>
              <p>
                <strong className="text-foreground">Accessibility is automatic.</strong> Every interactive component
                includes keyboard navigation, focus indicators, screen reader labels, and proper ARIA roles.
                These behaviors come from Radix UI and don't need to be designed separately.
              </p>
              <p>
                <strong className="text-foreground">Overrides are safe.</strong> Any component's default styling
                can be overridden per-instance without breaking other uses. This means one-off design needs
                don't require creating a new component.
              </p>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Here's what a Button looks like under the hood — each variant is a named set of visual properties
            drawn from the design tokens:
          </p>
          <CodeBlock>{`Button variants:

  default   →  Filled primary background, white text, subtle border
               Used for: main CTAs, form submissions, "Enroll" actions

  outline   →  Transparent background, thin border, inherits text color
               Used for: secondary actions, "Cancel", filter toggles

  secondary →  Muted filled background, dark text, subtle border
               Used for: supporting actions alongside a primary button

  ghost     →  Fully transparent, no border
               Used for: icon buttons, navigation links, "Back" buttons

  destructive → Red-toned fill for irreversible actions
               Used for: "Delete", "Remove", confirmation dialogs

  link      →  Styled as an inline text link with underline on hover
               Used for: inline navigation, "Learn more" links`}</CodeBlock>
        </section>

        {/* Interaction model */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Interaction & Depth Model</h2>
          <p className="text-base text-muted-foreground">
            Instead of drop shadows to convey depth, Syllabind uses a <strong>flat elevation system</strong>.
            Interactive elements respond to hover and press with subtle brightness shifts — a light
            overlay appears on top of the element, making it slightly brighter (dark mode) or dimmer (light mode).
          </p>
          <div className="border border-border rounded-lg p-4 space-y-2 text-base text-muted-foreground">
            <p>
              <strong className="text-foreground">Hover:</strong> A barely-visible overlay tells the user
              "this is clickable" without changing layout or color.
            </p>
            <p>
              <strong className="text-foreground">Press/Active:</strong> A stronger overlay provides tactile
              feedback during a click or tap.
            </p>
            <p>
              <strong className="text-foreground">Toggle/Selected:</strong> A persistent overlay indicates
              the "on" state for toggle buttons, selected tabs, and active filters.
            </p>
            <p>
              These states compound — a toggled-on item still shows hover and press feedback on top of
              its selected state, so users always know where they are.
            </p>
          </div>
        </section>

        {/* Key files */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Where Things Live</h2>
          <p className="text-base text-muted-foreground">
            A quick reference for design/engineering conversations about where to find or change things:
          </p>
          <div className="space-y-1 text-base">
            {[
              { file: 'client/src/index.css', desc: 'All design tokens — colors, fonts, spacing, radius, animations. The single source of truth.' },
              { file: 'client/src/components/ui/', desc: '50+ UI components — buttons, cards, dialogs, inputs. Each one is a self-contained, customizable file.' },
              { file: 'client/src/components/', desc: 'Reusable components — PageHeader, EmptyState, BinderCard, SearchBar. Domain-specific compositions and layout patterns.' },
              { file: 'client/src/pages/', desc: 'Full page layouts — Dashboard, Catalog, BinderOverview, etc. Where components are composed into features.' },
            ].map(f => (
              <div key={f.file} className="flex gap-4 py-2 border-b border-border last:border-0">
                <code className="text-primary font-mono text-xs bg-primary-surface px-2 py-0.5 rounded shrink-0">{f.file}</code>
                <span className="text-muted-foreground">{f.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Making changes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Requesting Design Changes</h2>
          <p className="text-base text-muted-foreground">
            When specifying changes, it helps to frame them in terms of the system:
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div>
              <p className="font-medium">Changing a color globally</p>
              <p className="text-lg text-muted-foreground">
                "Update the primary color" — one token change, every component updates instantly.
                No need to list every place it's used.
              </p>
            </div>
            <div>
              <p className="font-medium">Adjusting roundness across the product</p>
              <p className="text-lg text-muted-foreground">
                "Make everything slightly rounder" — a single radius token controls all four size tiers.
                Change one number, all corners update.
              </p>
            </div>
            <div>
              <p className="font-medium">Adding a new color role</p>
              <p className="text-lg text-muted-foreground">
                "We need a 'success' color" — define what it looks like in light and dark mode,
                and an engineer adds two token values. Then it's available everywhere.
              </p>
            </div>
            <div>
              <p className="font-medium">Modifying a specific component</p>
              <p className="text-lg text-muted-foreground">
                "Make the outline button have a visible shadow" — each component's variants can be
                adjusted individually without affecting others.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
