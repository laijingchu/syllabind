import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';

export default function ComponentCreditsCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CreditsCard</h1>
          <p className="text-lg text-muted-foreground">
            A compact sidebar card displaying the user's AI credit balance with a contextual CTA button for upgrading or purchasing more credits.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CreditsCard</strong> in the reader dashboard sidebar to give users a quick glance at their AI credit balance.</p>
            <p>The card adapts its CTA based on subscription status: "Upgrade" for free users, "Get More" for Pro users.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Source</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>Reads <code className="text-primary bg-muted px-1 rounded">creditBalance</code> and <code className="text-primary bg-muted px-1 rounded">isPro</code> from the central store.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { CreditsCard } from '@/components/CreditsCard';

// In the dashboard sidebar
<CreditsCard />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Heading:</strong> Uses CardTitle for the "AI Credits" label.</p>
            <p><strong className="text-foreground">Monospace balance:</strong> The large credit number uses <code className="text-primary bg-muted px-1 rounded">font-mono</code> for consistent digit width.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard sidebar:</strong> Always visible, positioned below the OnboardingChecklist.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
