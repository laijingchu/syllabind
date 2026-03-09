import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';

export default function ComponentBinderReviewStatusCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">BinderReviewStatusCard</h1>
          <p className="text-lg text-muted-foreground">
            A sidebar card that shows the user's binders currently pending review, with status badges, submission dates, and any reviewer notes.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use BinderReviewStatusCard</strong> in the reader dashboard sidebar to notify curators about binders awaiting review.</p>
            <p>The component self-hides (returns <code className="text-primary bg-muted px-1 rounded">null</code>) when the user has no binders with <code className="text-primary bg-muted px-1 rounded">status === 'pending_review'</code>.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Source</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>Filters binders from the store where <code className="text-primary bg-muted px-1 rounded">curatorId === user.username && status === 'pending_review'</code>.</p>
            <p>Each item displays: title (linked to the editor), "Pending Review" badge (warning variant), submitted date, and optional reviewer note.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { BinderReviewStatusCard } from '@/components/BinderReviewStatusCard';

// In the dashboard sidebar — conditionally rendered
<BinderReviewStatusCard />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Links:</strong> Each binder title links to the binder editor for quick access.</p>
            <p><strong className="text-foreground">Badge:</strong> Uses the warning variant for visual distinction of pending status.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard sidebar:</strong> Only visible when the user has binders pending review. Positioned after CreditsCard.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
