import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { ReviewQueueCard } from '@/components/ReviewQueueCard';
import type { ReviewQueueBinder } from '@/components/ReviewQueueCard';

const demoQueue: ReviewQueueBinder[] = [
  {
    id: 1,
    title: 'Introduction to Philosophy',
    description: 'A deep dive into Western philosophy.',
    audienceLevel: 'Beginner',
    durationWeeks: 3,
    visibility: 'public',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    curator: { name: 'Jane Smith', username: 'janesmith', avatarUrl: null },
  },
  {
    id: 2,
    title: 'Advanced Machine Learning',
    description: 'Neural networks, transformers, and beyond.',
    audienceLevel: 'Advanced',
    durationWeeks: 6,
    visibility: 'public',
    submittedAt: new Date(Date.now() - 259200000).toISOString(),
    curator: { name: 'Alex Rivera', username: 'alexr', avatarUrl: null },
  },
];

export default function ComponentReviewQueueCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-4xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ReviewQueueCard</h1>
          <p className="text-muted-foreground">
            A card for the admin review queue showing a binder awaiting approval. Displays curator avatar,
            binder title, metadata badges, and action buttons for editing, previewing, approving, or rejecting.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use ReviewQueueCard</strong> in the admin review queue tab of the curator studio. Each card represents a binder submitted for public catalog inclusion.</p>
            <p><strong className="text-foreground">Use CuratorBinderCard</strong> instead for the curator's own binder list where they manage drafts, publishing, and analytics.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-4 space-y-3">
            {demoQueue.map(binder => (
              <ReviewQueueCard
                key={binder.id}
                binder={binder}
                actionInProgress={false}
                onApprove={() => {}}
                onReject={() => {}}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            The card shows curator identity prominently with avatar, name, visibility and audience badges, and submission timestamp. Action buttons are right-aligned on desktop and wrap below on mobile.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Default:</strong> All action buttons enabled. Approve uses primary style, Reject uses destructive.</p>
            <p><strong className="text-foreground">Action in progress:</strong> Both Approve and Reject buttons are disabled. Approve shows a spinner icon instead of the checkmark.</p>
          </div>
        </section>

        {/* Anatomy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Anatomy</h2>
          <div className="border border-border rounded-lg p-6 space-y-4 text-sm">
            <div className="space-y-3">
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">1. Curator avatar</p>
                <p className="text-muted-foreground">10x10 Avatar with DiceBear fallback. Only shown when curator data is present.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">2. Title + metadata row</p>
                <p className="text-muted-foreground">Binder title (truncated), "by curator" text, visibility badge, audience level badge, and relative submission time.</p>
              </div>
              <div className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-medium text-foreground">3. Action buttons</p>
                <p className="text-muted-foreground">Edit (pencil icon), Preview (outline with label), Approve (primary with checkmark), Reject (destructive with X icon).</p>
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
                <tr><td className="p-3 font-mono text-xs">binder</td><td className="p-3 font-mono text-xs">ReviewQueueBinder</td><td className="p-3 text-muted-foreground">Binder data including nested curator profile.</td></tr>
                <tr><td className="p-3 font-mono text-xs">actionInProgress?</td><td className="p-3 font-mono text-xs">boolean</td><td className="p-3 text-muted-foreground">Disables buttons and shows spinner on Approve.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onApprove</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called with binder ID when Approve is clicked.</td></tr>
                <tr><td className="p-3 font-mono text-xs">onReject</td><td className="p-3 font-mono text-xs">{"(id: number) => void"}</td><td className="p-3 text-muted-foreground">Called with binder ID when Reject is clicked.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Approve button background" />
            <TokenRow token="--primary-foreground" value="Approve button text" />
            <TokenRow token="--destructive" value="Reject button background" />
            <TokenRow token="--destructive-foreground" value="Reject button text" />
            <TokenRow token="--muted-foreground" value="Curator name, timestamp text" />
            <TokenRow token="--border" value="Card border, badge outlines" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { ReviewQueueCard } from '@/components/ReviewQueueCard';
import type { ReviewQueueBinder } from '@/components/ReviewQueueCard';

<ReviewQueueCard
  binder={binder}
  actionInProgress={reviewActionInProgress === binder.id}
  onApprove={handleReviewApprove}
  onReject={(id) => openRejectDialog(id)}
/>

// ReviewQueueBinder shape
interface ReviewQueueBinder {
  id: number;
  title: string;
  description: string;
  audienceLevel: string;
  durationWeeks: number;
  visibility: string;
  submittedAt: string | null;
  curator?: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}`}</CodeBlock>
        </section>

        {/* Internal Composition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Internal Composition</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Card, CardContent</strong> — Structural container.</p>
            <p><strong className="text-foreground">Avatar + AvatarImage + AvatarFallback</strong> — Curator identity with DiceBear fallback.</p>
            <p><strong className="text-foreground">Badge (outline)</strong> — Visibility and audience level indicators.</p>
            <p><strong className="text-foreground">Button</strong> — Edit (outline icon), Preview (outline labeled), Approve (primary), Reject (destructive).</p>
            <p><strong className="text-foreground">Link (wouter)</strong> — Navigates to binder editor and preview pages.</p>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Button states:</strong> Disabled buttons during action progress prevent double-submission. Spinner provides visual feedback for async operations.</p>
            <p><strong className="text-foreground">Responsive layout:</strong> Stacks vertically on mobile with buttons below content, side-by-side on desktop.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Admin Review Queue:</strong> The "Review" tab in the curator studio displays all binders submitted for public catalog review. Admins approve or reject with optional feedback.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
