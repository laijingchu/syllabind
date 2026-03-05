import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Link } from 'wouter';

const sections = [
  { href: '/design-system/sections/page-header', name: 'PageHeader', desc: 'Standardizes the top of every page with a title, optional back button, and action slot.' },
  { href: '/design-system/sections/empty-state', name: 'EmptyState', desc: 'Displays a centered message with icon and optional CTA when a list or view has no content.' },
  { href: '/design-system/sections/search-bar', name: 'SearchBar', desc: 'Provides a search input with optional result count display.' },
  { href: '/design-system/sections/binder-filter-bar', name: 'BinderFilterBar', desc: 'Combines search, visibility pills, sort dropdown, and category filters for binder lists.' },
];

export default function SectionsOverview() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Sections</h1>
          <p className="text-muted-foreground">
            Reusable layout patterns that standardize how recurring page structures look and
            behave. Sections sit between UI components and full pages — they compose multiple
            UI primitives into a consistent, recognizable pattern.
          </p>
        </div>

        {/* Definition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">What is a Section?</h2>
          <p className="text-sm text-muted-foreground">
            A section is a reusable layout fragment that solves a specific structural problem
            repeated across multiple pages. While UI components are individual elements (a button,
            an input), sections are arrangements of those elements into a recognizable pattern —
            like "the top of a page" or "what to show when a list is empty."
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">Defining characteristics</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Layout-focused:</strong> Sections define
                spatial relationships — where the title goes relative to the back button, how
                the search input aligns with the result count. They solve layout problems, not
                data problems.
              </p>
              <p>
                <strong className="text-foreground">Multi-page reuse:</strong> A section exists
                because the same layout pattern appears on three or more pages. If a pattern only
                appears once, it belongs inline in the page component.
              </p>
              <p>
                <strong className="text-foreground">Prop-driven content:</strong> Sections accept
                content through props (title strings, action slots, icon references) but never
                fetch their own data. The page decides what to display; the section decides how
                to display it.
              </p>
              <p>
                <strong className="text-foreground">Lightly opinionated:</strong> Sections enforce
                just enough structure to maintain consistency (spacing, alignment, typography
                hierarchy) while leaving room for page-specific customization through className
                overrides and render slots.
              </p>
            </div>
          </div>
        </section>

        {/* When to create a section vs. inline code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Create a Section</h2>
          <p className="text-sm text-muted-foreground">
            Not every repeated pattern needs to become a section. The threshold is intentionally
            high to prevent premature abstraction.
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium">Create a section when:</p>
              <ul className="text-muted-foreground mt-1 ml-4 space-y-1 list-disc">
                <li>The same layout pattern appears on 3+ pages</li>
                <li>Inconsistencies between those pages cause design drift</li>
                <li>The pattern has a clear, named concept ("page header", "empty state")</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Keep it inline when:</p>
              <ul className="text-muted-foreground mt-1 ml-4 space-y-1 list-disc">
                <li>The pattern only appears on 1-2 pages</li>
                <li>Each usage has significantly different structure</li>
                <li>The "pattern" is really just a few Tailwind classes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How sections differ */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Sections vs. UI Components vs. Components</h2>
          <div className="border border-border rounded-lg overflow-hidden text-sm">
            {[
              { q: 'Does it know about binders, readers, or curators?', ui: 'No', section: 'No', component: 'Yes' },
              { q: 'Does it compose multiple UI primitives?', ui: 'Rarely', section: 'Always', component: 'Always' },
              { q: 'Does it define page-level layout?', ui: 'No', section: 'Yes', component: 'Sometimes' },
              { q: 'Can it fetch data or call APIs?', ui: 'No', section: 'No', component: 'Yes' },
              { q: 'Is it used on 3+ pages?', ui: 'Usually', section: 'Always', component: 'Varies' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-4 border-b border-border/50 last:border-0">
                <span className="px-4 py-2.5 text-muted-foreground col-span-1">{row.q}</span>
                <span className="px-4 py-2.5 text-center">{row.ui}</span>
                <span className="px-4 py-2.5 text-center font-medium text-primary">{row.section}</span>
                <span className="px-4 py-2.5 text-center">{row.component}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 bg-muted/30 text-xs text-muted-foreground">
              <span className="px-4 py-2"></span>
              <span className="px-4 py-2 text-center">UI Component</span>
              <span className="px-4 py-2 text-center font-medium">Section</span>
              <span className="px-4 py-2 text-center">Component</span>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Architecture</h2>
          <p className="text-sm text-muted-foreground">
            All sections live in <code className="font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">client/src/components/sections/</code>.
            They follow a consistent prop pattern: required content props, optional layout
            modifiers, and a className escape hatch.
          </p>
          <CodeBlock>{`// Typical section structure
interface PageHeaderProps {
  title: string;           // Required: the page title
  subtitle?: string;       // Optional: supporting text
  backHref?: string;       // Optional: enables back button
  backLabel?: string;      // Optional: customizes back text
  actions?: ReactNode;     // Slot: right-aligned action buttons
  className?: string;      // Escape hatch: additional styling
}`}</CodeBlock>
          <p className="text-sm text-muted-foreground">
            Sections use semantic class names (e.g. <code className="font-mono text-xs">page-header</code>,
            <code className="font-mono text-xs"> empty-state</code>) as their first className for
            easy identification in devtools and design prompts.
          </p>
        </section>

        {/* Catalog */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Section Catalog</h2>
          <div className="space-y-2">
            {sections.map(s => (
              <Link key={s.href} href={s.href}>
                <div className="flex flex-wrap items-start gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer">
                  <span className="font-medium text-sm w-28 md:w-40 shrink-0">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
