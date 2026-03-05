import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { CuratorBinderCard } from '@/components/CuratorBinderCard';
import type { Binder } from '@/lib/types';
import { useState } from 'react';

const demoBinders: Binder[] = [
  {
    id: 1,
    title: 'Introduction to Philosophy',
    description: 'A deep dive into the foundations of Western philosophy.',
    audienceLevel: 'Beginner',
    durationWeeks: 2,
    status: 'pending_review',
    visibility: 'public',
    weeks: [],
    curatorId: 'janesmith',
    curator: { username: 'janesmith', name: 'Jane Smith', avatarUrl: null, bio: null, expertise: null, profileTitle: null, linkedin: null, twitter: null, threads: null, website: null, schedulingUrl: null },
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    title: 'Systems Thinking 101',
    description: 'Understand feedback loops and mental models.',
    audienceLevel: 'Intermediate',
    durationWeeks: 3,
    status: 'published',
    visibility: 'public',
    weeks: [],
    curatorId: 'janesmith',
    curator: { username: 'janesmith', name: 'Jane Smith', avatarUrl: null, bio: null, expertise: null, profileTitle: null, linkedin: null, twitter: null, threads: null, website: null, schedulingUrl: null },
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3,
    title: 'Digital Minimalism',
    description: 'Intentional technology use for a focused life.',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    status: 'draft',
    visibility: 'public',
    weeks: [],
    curatorId: 'janesmith',
    curator: { username: 'janesmith', name: 'Jane Smith', avatarUrl: null, bio: null, expertise: null, profileTitle: null, linkedin: null, twitter: null, threads: null, website: null, schedulingUrl: null },
    reviewNote: 'Please add more reading resources to week 3.',
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function ComponentCuratorBinderCard() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const noop = () => {};

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-4xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CuratorBinderCard</h1>
          <p className="text-muted-foreground">
            A row component for the curator studio binder list. Displays status badge, title, metadata,
            reader counts, and action buttons (publish, edit, preview, analytics). Supports multi-select
            for batch operations.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CuratorBinderCard</strong> in the curator studio dashboard to display each binder the curator owns or manages. It handles all status states (draft, pending review, published) and their corresponding actions.</p>
            <p><strong className="text-foreground">Use BinderCard</strong> instead for reader-facing surfaces like the catalog or dashboard where binders are shown as browsable grid cards.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-4 space-y-3">
            {demoBinders.map(binder => (
              <CuratorBinderCard
                key={binder.id}
                binder={binder}
                selected={selectedIds.includes(binder.id)}
                onToggleSelect={handleToggleSelect}
                readerCount={{ total: binder.id * 3, active: binder.id }}
                isAdmin={false}
                isOtherCurator={false}
                hasApprovalNotification={binder.id === 2}
                onPublish={noop}
                onUnpublish={noop}
                onWithdraw={noop}
                onRequestReview={noop}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Click the checkbox to select rows. The entire card is a link to the binder editor, with action buttons elevated above via z-index.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Draft:</strong> Shows "Draft" secondary badge. Publish dropdown with Public/Unlisted/Private options. Review feedback banner if present.</p>
            <p><strong className="text-foreground">Pending Review:</strong> Amber "Pending Review" badge. Non-admin curators see "Withdraw from Review" button.</p>
            <p><strong className="text-foreground">Published:</strong> "Published", "Unlisted", or "Private" badge. "Unpublish" button replaces the publish dropdown. Green approval notification if just approved.</p>
            <p><strong className="text-foreground">Selected:</strong> Blue ring highlight (<code className="text-primary bg-primary/5 px-1 rounded">ring-2 ring-primary</code>).</p>
          </div>
        </section>

        {/* Anatomy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Anatomy</h2>
          <div className="border border-border rounded-lg p-6 space-y-4 text-sm">
            <div className="space-y-3">
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">1. Selection checkbox</p>
                <p className="text-muted-foreground">Enables batch operations (delete). Sits at the left edge of the content area.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">2. Status badge row</p>
                <p className="text-muted-foreground">Badge showing current status + optional "by curator" badge for admin view of other curators' binders.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">3. Title + metadata</p>
                <p className="text-muted-foreground">Binder title, duration, audience level, and last updated time. Review feedback banner shown when applicable.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">4. Reader count (desktop)</p>
                <p className="text-muted-foreground">Total readers and active readers, right-aligned. Hidden on mobile; shown inline below metadata on small screens.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">5. Action buttons</p>
                <p className="text-muted-foreground">Publish/Unpublish/Withdraw + Edit (pencil) + Preview (eye) + Analytics (bar chart). All elevated above the card link via z-index.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="p-3 font-mono text-xs">binder</td><td className="p-3 font-mono text-xs">Binder</td><td className="p-3 text-muted-foreground">Full binder object with status, visibility, curator info.</td></tr>
                <tr><td className="p-3 font-mono text-xs">selected</td><td className="p-3 font-mono text-xs">boolean</td><td className="p-3 text-muted-foreground">Whether the row's checkbox is checked.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onToggleSelect</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called when the checkbox is toggled.</td></tr>
                <tr><td className="p-3 font-mono text-xs">readerCount?</td><td className="p-3 font-mono text-xs">{"{ total; active }"}</td><td className="p-3 text-muted-foreground">Reader stats shown on desktop and mobile.</td></tr>
                <tr><td className="p-3 font-mono text-xs">isAdmin?</td><td className="p-3 font-mono text-xs">boolean</td><td className="p-3 text-muted-foreground">Admin users can publish directly without review.</td></tr>
                <tr><td className="p-3 font-mono text-xs">isOtherCurator?</td><td className="p-3 font-mono text-xs">boolean</td><td className="p-3 text-muted-foreground">Shows "by curator" badge in admin view.</td></tr>
                <tr><td className="p-3 font-mono text-xs">hasApprovalNotification?</td><td className="p-3 font-mono text-xs">boolean</td><td className="p-3 text-muted-foreground">Shows green "Approved" banner.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onPublish</td><td className="p-3 font-mono text-xs">{"(id, visibility) => void"}</td><td className="p-3 text-muted-foreground">Called with binder ID and target visibility.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onUnpublish</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called to unpublish a published binder.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onWithdraw</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called to withdraw from review (non-admin).</td></tr>
                <tr><td className="p-3 font-mono text-xs">onRequestReview</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called when non-admin selects "Public" (triggers review flow).</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Selected ring color, primary action button" />
            <TokenRow token="--secondary" value="Draft/Private/Unlisted badge, Unpublish button" />
            <TokenRow token="--muted-foreground" value="Metadata text, reader counts" />
            <TokenRow token="--border" value="Card border" />
            <TokenRow token="amber-50/700/200" value="Pending Review badge, review feedback banner" />
            <TokenRow token="green-50/700/200" value="Approval notification banner" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { CuratorBinderCard } from '@/components/CuratorBinderCard';

<CuratorBinderCard
  binder={binder}
  selected={selectedIds.includes(binder.id)}
  onToggleSelect={handleToggleSelect}
  readerCount={readerCounts[binder.id]}
  isAdmin={isAdmin}
  isOtherCurator={adminView === 'others'}
  hasApprovalNotification={hasNotification}
  onPublish={handlePublish}
  onUnpublish={handleUnpublish}
  onWithdraw={handleWithdraw}
  onRequestReview={(id) => openReviewDialog(id)}
/>`}</CodeBlock>
        </section>

        {/* Internal Composition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Internal Composition</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Card, CardContent</strong> — Structural container with hover shadow and selection ring.</p>
            <p><strong className="text-foreground">Checkbox</strong> — Multi-select for batch operations.</p>
            <p><strong className="text-foreground">Badge</strong> — Status indicator (outline/secondary variants).</p>
            <p><strong className="text-foreground">DropdownMenu</strong> — Publish visibility picker (Public/Unlisted/Private).</p>
            <p><strong className="text-foreground">Button</strong> — Action buttons (publish, edit, preview, analytics).</p>
            <p><strong className="text-foreground">Link (wouter)</strong> — Full-card background link to binder editor + individual action links.</p>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Card link:</strong> The entire card is wrapped in a background Link with an <code className="text-primary bg-primary/5 px-1 rounded">aria-label</code> describing the target.</p>
            <p><strong className="text-foreground">Z-index layering:</strong> Interactive controls (checkbox, buttons) are elevated above the card link so they remain independently clickable.</p>
            <p><strong className="text-foreground">Keyboard:</strong> All interactive elements are natively focusable (checkbox, buttons, links).</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Curator Studio:</strong> Primary list view for "My Binders" and admin "Others" tabs. Used with AnimatedCard wrapper for staggered entrance animations.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
