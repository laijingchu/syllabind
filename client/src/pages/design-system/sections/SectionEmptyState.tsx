import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { EmptyState } from '@/components/sections/EmptyState';
import { Button } from '@/components/ui/button';
import { BookOpen, Inbox, Search, Plus } from 'lucide-react';

export default function SectionEmptyState() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">EmptyState</h1>
          <p className="text-lg text-muted-foreground">
            A centered placeholder shown when a list, page, or section has no content to display.
            Combines an optional icon, title, description, and action to guide the user toward their next step.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use EmptyState</strong> whenever a content area is empty -- no binders, no enrollments, no search results. It prevents blank screens and tells the user what to do next.</p>
            <p><strong className="text-foreground">Use inline text</strong> instead for minor empty sections within a larger populated page (e.g., "No comments yet" inside a discussion thread).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>

          <h3 className="text-sm font-medium text-foreground">Basic (title only)</h3>
          <div className="border border-border rounded-lg p-6">
            <EmptyState title="No binders found" />
          </div>

          <h3 className="text-sm font-medium text-foreground">With icon and description</h3>
          <div className="border border-border rounded-lg p-6">
            <EmptyState
              icon={Inbox}
              title="Your inbox is empty"
              description="When curators respond to your submissions, they'll appear here."
            />
          </div>

          <h3 className="text-sm font-medium text-foreground">With action button</h3>
          <div className="border border-border rounded-lg p-6">
            <EmptyState
              icon={BookOpen}
              title="No enrollments yet"
              description="Browse the catalog to find binders that interest you."
              action={<Button>Browse Catalog</Button>}
            />
          </div>

          <h3 className="text-sm font-medium text-foreground">Full (all props)</h3>
          <div className="border border-border rounded-lg p-6">
            <EmptyState
              icon={Search}
              iconClassName="bg-muted text-muted-foreground"
              title="No results match your search"
              description="Try adjusting your filters or searching with different keywords."
              action={<Button variant="outline">Clear Filters</Button>}
            />
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Default</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">icon</td>
                  <td className="p-3 font-mono text-xs">LucideIcon?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Lucide icon component displayed in a circular badge above the title</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">iconClassName</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">"bg-primary/10 text-primary"</td>
                  <td className="p-3 text-muted-foreground">Custom background and color classes for the icon badge</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">title</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 text-muted-foreground">required</td>
                  <td className="p-3 text-muted-foreground">Main heading text, rendered as h2</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">description</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Supporting paragraph below the title (max-width constrained)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">action</td>
                  <td className="p-3 font-mono text-xs">ReactNode?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Slot for a CTA button or link below the description</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">className</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">""</td>
                  <td className="p-3 text-muted-foreground">Additional CSS classes on the root wrapper</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token=".empty-state" value="Root wrapper, centered flex layout" />
            <TokenRow token=".empty-state-icon" value="Circular icon badge container with customizable background" />
            <TokenRow token=".empty-state-content" value="Title and description text group" />
            <TokenRow token="--primary/10" value="Default icon badge background opacity" />
            <TokenRow token="--primary" value="Default icon color" />
          </div>
          <p className="text-base text-muted-foreground">
            The icon renders at 32px (<code className="text-primary bg-primary/5 px-1 rounded">h-8 w-8</code>) inside a padded badge. The description is constrained to <code className="text-primary bg-primary/5 px-1 rounded">max-w-md</code> for comfortable reading width. Use <code className="text-primary bg-primary/5 px-1 rounded">iconClassName</code> to swap the badge color for contextual states (e.g., muted for search, destructive for errors).
          </p>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { EmptyState } from '@/components/sections/EmptyState';
import { Button } from '@/components/ui/button';
import { BookOpen, Inbox, Search } from 'lucide-react';

// Basic
<EmptyState title="No binders found" />

// With icon and description
<EmptyState
  icon={Inbox}
  title="Your inbox is empty"
  description="When curators respond, they'll appear here."
/>

// With action
<EmptyState
  icon={BookOpen}
  title="No enrollments yet"
  description="Browse the catalog to find binders."
  action={<Button>Browse Catalog</Button>}
/>

// Custom icon styling
<EmptyState
  icon={Search}
  iconClassName="bg-muted text-muted-foreground"
  title="No results match your search"
  description="Try different keywords."
  action={<Button variant="outline">Clear Filters</Button>}
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Heading level:</strong> Uses <code className="text-primary bg-primary/5 px-1 rounded">h2</code> for the title, appropriate as a section-level heading within a page that already has an h1.</p>
            <p><strong className="text-foreground">Icon:</strong> The icon is decorative and does not need alt text since the title conveys the message.</p>
            <p><strong className="text-foreground">Action slot:</strong> When an action button is present, it provides a clear next step, improving the experience for keyboard and screen reader users.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Empty dashboard:</strong> Shown when a reader has no enrollments, with a "Browse Catalog" CTA.</p>
            <p><strong className="text-foreground">Empty search results:</strong> Displayed in the catalog when filters return no binders.</p>
            <p><strong className="text-foreground">No enrollments:</strong> Curator analytics page when a binder has zero readers.</p>
          </div>
          <p className="text-base text-muted-foreground italic">
            Note: EmptyState is a ready-to-use section component not yet imported in any pages. It is designed to replace ad-hoc empty state patterns across the app.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
