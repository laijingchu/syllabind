import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Link } from 'wouter';

const categories = [
  { name: 'Buttons & Actions', items: ['Button', 'Badge', 'Pill'], desc: 'Interactive elements that trigger actions or display status.' },
  { name: 'Form Inputs', items: ['Input', 'Textarea', 'Label', 'Checkbox', 'Switch', 'Radio Group', 'Select', 'Calendar'], desc: 'Controls for collecting user data in forms.' },
  { name: 'Layout', items: ['Card', 'Separator', 'Table'], desc: 'Structural components for organizing content.' },
  { name: 'Navigation', items: ['Tabs', 'Breadcrumb', 'Dropdown Menu'], desc: 'Wayfinding components that help users move through the app.' },
  { name: 'Overlays', items: ['Dialog', 'Alert Dialog', 'Popover', 'Sheet', 'Drawer', 'Tooltip'], desc: 'Floating surfaces that appear above the page content.' },
  { name: 'Data Display', items: ['Avatar', 'Skeleton', 'Progress', 'Spinner'], desc: 'Components for presenting data and loading states.' },
  { name: 'Feedback', items: ['Alert', 'Toast', 'Accordion'], desc: 'Components that communicate status or reveal content.' },
  { name: 'Advanced', items: ['Animated Container', 'Rich Text Editor'], desc: 'Specialized components with complex behavior.' },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export default function UIOverview() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">UI Components</h1>
          <p className="text-lg text-muted-foreground">
            The atomic building blocks of the interface. UI components are generic, reusable
            primitives that carry no domain-specific knowledge — they don't know what a "binder"
            or a "curator" is. They only know how to render a button, display a card, or collect
            text input.
          </p>
        </div>

        {/* Definition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">What is a UI Component?</h2>
          <p className="text-base text-muted-foreground">
            A UI component is a self-contained, context-free element that implements a single
            interaction pattern. It accepts props for content and behavior but never fetches data,
            calls APIs, or contains business logic. Think of them as the words in your design
            vocabulary — individually simple, but combinable into any sentence.
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">Defining characteristics</h3>
            <div className="space-y-2 text-base text-muted-foreground">
              <p>
                <strong className="text-foreground">Context-free:</strong> A Button doesn't know
                if it enrolls a reader or deletes a binder. It just renders a clickable element
                with a variant and fires an onClick.
              </p>
              <p>
                <strong className="text-foreground">Composable:</strong> UI components combine
                freely. A Card can contain Buttons, Badges, Avatars, and Inputs in any arrangement.
                No component dictates what goes inside it.
              </p>
              <p>
                <strong className="text-foreground">Variant-driven:</strong> Visual variations
                (size, color, emphasis) are expressed through named variants, not one-off class
                overrides. This keeps the design language consistent.
              </p>
              <p>
                <strong className="text-foreground">Accessible by default:</strong> Every
                interactive UI component includes keyboard navigation, focus management, and
                ARIA attributes via Radix UI primitives.
              </p>
            </div>
          </div>
        </section>

        {/* How they differ from Sections and Components */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">UI Components vs. Sections vs. Components</h2>
          <p className="text-base text-muted-foreground">
            The design system has three layers of abstraction. Understanding where each lives
            prevents duplication and keeps the codebase organized.
          </p>
          <div className="border border-border rounded-lg overflow-hidden text-base">
            {[
              { layer: 'UI Components', desc: 'Generic primitives. A Button, a Card, an Input. No domain knowledge. Used everywhere.', path: 'client/src/components/ui/' },
              { layer: 'Sections', desc: 'Reusable layout patterns. A PageHeader, an EmptyState. Standardize recurring page structures.', path: 'client/src/components/sections/' },
              { layer: 'Components', desc: 'Domain-specific compositions. A BinderCard, a ShareDialog. Combine UI components with product logic.', path: 'client/src/components/ + pages/' },
            ].map((l, i) => (
              <div key={i} className={`px-4 py-3 border-b border-border/50 last:border-0 ${i % 2 === 0 ? 'bg-primary/5' : ''}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-medium w-28 md:w-40 shrink-0">{l.layer}</span>
                  <span className="text-muted-foreground flex-1">{l.desc}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 md:ml-40 md:pl-4">
                  <code className="font-mono">{l.path}</code>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Architecture</h2>
          <p className="text-base text-muted-foreground">
            UI components are built on <strong>shadcn/ui</strong> — a copy-paste component library
            that lives inside the codebase rather than in node_modules. Each component is a single
            file that wraps a Radix UI primitive with Tailwind styling and design tokens.
          </p>
          <CodeBlock>{`// Typical UI component structure
//
// 1. Import Radix primitive (handles a11y, keyboard, focus)
// 2. Define variants with class-variance-authority (cva)
// 3. Forward ref + merge className for overrides
// 4. Export named component

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const DialogContent = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn("bg-background rounded-lg shadow-lg ...", className)}
    {...props}
  />
))`}</CodeBlock>
          <p className="text-base text-muted-foreground">
            Because the components are owned code, any aspect can be modified — default styles,
            animation behavior, prop interfaces — without waiting on library updates.
          </p>
        </section>

        {/* Component catalog */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Component Catalog</h2>
          <p className="text-base text-muted-foreground">
            Each component page includes a live demo, variant breakdown, relevant design tokens,
            a code snippet, accessibility notes, and where it's used in the product.
          </p>
        </section>

        <div className="space-y-8">
          {categories.map(cat => (
            <section key={cat.name} className="space-y-3">
              <h2 className="font-display text-xl font-medium">{cat.name}</h2>
              <p className="text-base text-muted-foreground">{cat.desc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cat.items.map(item => (
                  <Link key={item} href={`/design-system/ui/${slugify(item)}`}>
                    <span className="block px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
                      {item}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </DesignSystemLayout>
  );
}
