import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Link } from 'wouter';

const components = [
  { href: '/design-system/components/avatar-upload', name: 'AvatarUpload', desc: 'Profile image uploader with drag-and-drop, preview, cropping area, and upload progress.' },
  { href: '/design-system/components/binder-card', name: 'BinderCard', desc: 'Displays a binder preview with cover image, title, curator info, metadata, and enrollment status. Used in the catalog and dashboard grids.' },
  { href: '/design-system/components/binder-filter-bar', name: 'BinderFilterBar', desc: 'Combines search, visibility pills, sort dropdown, and category filters for binder lists.' },
  { href: '/design-system/components/curator-binder-card', name: 'CuratorBinderCard', desc: 'Card for the curator studio binder list. Shows status badge, title, metadata, reader counts, and publish/edit/preview/analytics actions.' },
  { href: '/design-system/components/empty-state', name: 'EmptyState', desc: 'Displays a centered message with icon and optional CTA when a list or view has no content.' },
  { href: '/design-system/components/error-boundary', name: 'ErrorBoundary', desc: 'Catches rendering errors in a subtree and displays a fallback UI instead of crashing the entire page.' },
  { href: '/design-system/components/generating-week-placeholder', name: 'GeneratingWeekPlaceholder', desc: 'Animated skeleton placeholder shown while AI generates week content in the Binder Editor.' },
  { href: '/design-system/components/page-header', name: 'PageHeader', desc: 'Standardizes the top of every page with a title, optional back button, and action slot.' },
  { href: '/design-system/components/review-queue-card', name: 'ReviewQueueCard', desc: 'Card for the admin review queue showing a binder awaiting approval with curator avatar, metadata, and approve/reject actions.' },
  { href: '/design-system/components/search-bar', name: 'SearchBar', desc: 'Provides a search input with optional result count display.' },
  { href: '/design-system/components/share-dialog', name: 'ShareDialog', desc: 'Modal for sharing a binder via link, social media, or embed code. Handles URL generation and copy-to-clipboard.' },
  { href: '/design-system/components/upgrade-prompt', name: 'UpgradePrompt', desc: 'Contextual upsell card that appears when a user hits a plan limit. Shows the blocked feature and a CTA to upgrade.' },
];

export default function ComponentsOverview() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Components</h1>
          <p className="text-lg text-muted-foreground">
            Domain-specific compositions that combine UI primitives with product knowledge.
            Components understand Syllabind's concepts — binders, curators, readers, enrollments —
            and encode specific product behaviors into reusable units.
          </p>
        </div>

        {/* Definition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">What is a Component?</h2>
          <p className="text-base text-muted-foreground">
            A component is a self-contained piece of product UI that combines multiple UI
            primitives into a unit with domain meaning. Unlike a generic Card or Button,
            a BinderCard knows what a binder is, what fields to display, and how enrollment
            status affects its appearance. Components are where the design system meets the
            product.
          </p>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium">Defining characteristics</h3>
            <div className="space-y-2 text-base text-muted-foreground">
              <p>
                <strong className="text-foreground">Domain-aware:</strong> Components know about
                Syllabind's data model. A BinderCard accepts a binder object, not a generic title
                and description. A ShareDialog generates binder-specific share URLs, not arbitrary
                links.
              </p>
              <p>
                <strong className="text-foreground">Behavior-rich:</strong> Components can contain
                interaction logic beyond simple click handlers — copy-to-clipboard flows, upload
                progress tracking, error recovery, conditional rendering based on user roles.
              </p>
              <p>
                <strong className="text-foreground">Composition of UI primitives:</strong> Components
                are built from UI components (Card, Button, Avatar, Dialog), not from raw HTML.
                This ensures visual consistency without duplicating styling decisions.
              </p>
              <p>
                <strong className="text-foreground">Reusable within context:</strong> A component
                may appear on multiple pages, but its reuse is bounded by domain relevance. A
                BinderCard appears in the catalog and dashboard but wouldn't appear on a settings
                page.
              </p>
            </div>
          </div>
        </section>

        {/* How they differ */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Components vs. UI Components</h2>
          <p className="text-base text-muted-foreground">
            The key distinction is domain knowledge. UI components are generic building blocks
            that could exist in any product. Components are specific to Syllabind.
          </p>
          <div className="border border-border rounded-lg overflow-hidden text-base">
            {[
              { layer: 'UI Component', example: 'Card', knows: 'How to render a bordered container with padding', color: 'bg-primary/15' },
              { layer: 'Component', example: 'BinderCard', knows: 'What a binder is, which fields to show, how enrollment affects display', color: 'bg-primary/5' },
            ].map((l, i) => (
              <div key={i} className={`px-4 py-3 border-b border-border/50 last:border-0 ${l.color}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <span className="font-medium w-24 md:w-32 shrink-0">{l.layer}</span>
                  <div>
                    <span className="text-muted-foreground">
                      <code className="font-mono text-xs text-primary">{l.example}</code> — {l.knows}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* When to create */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Create a Component</h2>
          <div className="border border-border rounded-lg p-4 space-y-3 text-base">
            <div>
              <p className="font-medium">Extract into a component when:</p>
              <ul className="text-muted-foreground mt-1 ml-4 space-y-1 list-disc">
                <li>A domain-specific UI pattern appears on 2+ pages</li>
                <li>The pattern has non-trivial interaction logic (uploads, sharing, error recovery)</li>
                <li>The pattern represents a clear product concept (a binder card, a share flow)</li>
                <li>Testing the behavior in isolation would be valuable</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Keep it inline in the page when:</p>
              <ul className="text-muted-foreground mt-1 ml-4 space-y-1 list-disc">
                <li>The pattern only appears on one page</li>
                <li>It's mostly layout with minimal logic</li>
                <li>Extracting it would require passing 10+ props</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Architecture</h2>
          <p className="text-base text-muted-foreground">
            Components live alongside the pages that use them or in shared directories when
            used across multiple pages. They import from <code className="font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">@/components/ui/</code> for
            primitives and from each other for shared patterns.
          </p>
          <CodeBlock>{`// Typical component structure
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import type { Binder } from "@shared/schema"

interface BinderCardProps {
  binder: Binder;              // Domain object, not generic props
  showCurator?: boolean;
  onEnroll?: () => void;
}

export function BinderCard({ binder, showCurator, onEnroll }: BinderCardProps) {
  // Composes UI primitives with domain knowledge
  return (
    <Card>
      <Badge>{binder.status}</Badge>
      {showCurator && <Avatar ... />}
      ...
    </Card>
  )
}`}</CodeBlock>
        </section>

        {/* Catalog */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Component Catalog</h2>
          <p className="text-base text-muted-foreground">
            Each component page includes a live demo, prop reference, usage context, and
            the UI primitives it composes.
          </p>
          <div className="space-y-2">
            {components.map(c => (
              <Link key={c.href} href={c.href}>
                <div className="flex flex-wrap items-start gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer">
                  <span className="font-medium text-sm w-40 md:w-52 shrink-0">{c.name}</span>
                  <span className="text-base text-muted-foreground">{c.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
