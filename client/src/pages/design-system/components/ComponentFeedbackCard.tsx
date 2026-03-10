import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareHeart } from 'lucide-react';

function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

export default function ComponentFeedbackCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">FeedbackCard</h1>
          <p className="text-lg text-muted-foreground">
            A sidebar card with a placeholder illustration that encourages learners to share feedback via a configurable URL from site settings.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use FeedbackCard</strong> in the reader dashboard sidebar to collect user feedback.</p>
            <p>The component self-hides when no <code className="text-primary bg-muted px-1 rounded">feedback_url_learners</code> site setting is configured.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="space-y-8">
            <DemoCard label="Default state">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/50 mb-2">
                    <MessageSquareHeart className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <CardTitle className="text-base">We'd love your feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Help us improve Syllabind by sharing your experience.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full">
                    Give Feedback
                  </Button>
                </CardContent>
              </Card>
            </DemoCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Source</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>Fetches the URL from <code className="text-primary bg-muted px-1 rounded">/api/site-settings/feedback_url_learners</code> on mount.</p>
            <p>The illustration area uses a dashed-border placeholder with a <code className="text-primary bg-muted px-1 rounded">MessageSquareHeart</code> icon, swappable for a real illustration later.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { FeedbackCard } from '@/components/FeedbackCard';

// In the dashboard sidebar
<FeedbackCard />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">External link:</strong> The CTA opens in a new tab with <code className="text-primary bg-muted px-1 rounded">rel="noopener noreferrer"</code>.</p>
            <p><strong className="text-foreground">Decorative icon:</strong> The placeholder illustration icon is decorative.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard sidebar:</strong> Shown when a learner feedback URL is configured in Admin Settings. Positioned after BinderReviewStatusCard.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
