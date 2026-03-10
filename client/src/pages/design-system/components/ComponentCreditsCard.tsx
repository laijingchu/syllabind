import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

export default function ComponentCreditsCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CreditsCard</h1>
          <p className="text-lg text-muted-foreground">
            A compact sidebar card with an inline binder creation input and AI credit balance display.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CreditsCard</strong> in the reader dashboard sidebar to give users a quick way to start a binder and see their credit balance.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="space-y-8">
            <DemoCard label="Default state (87 credits)">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Start a syllabus binder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="group relative flex items-center rounded-full border border-border bg-card shadow-sm px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      placeholder="e.g. Intro to Systems Thinking"
                      className="flex-1 bg-transparent border-0 outline-none text-sm px-2 py-0.5 placeholder:text-muted-foreground"
                      readOnly
                    />
                  </div>
                  <Button size="sm" className="w-full">Build binder</Button>
                  <p className="text-xs text-muted-foreground text-center">87 AI credits left, or just create manually.</p>
                </CardContent>
              </Card>
            </DemoCard>

            <DemoCard label="Admin (unlimited credits)">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Start a syllabus binder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="group relative flex items-center rounded-full border border-border bg-card shadow-sm px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      placeholder="e.g. Intro to Systems Thinking"
                      className="flex-1 bg-transparent border-0 outline-none text-sm px-2 py-0.5 placeholder:text-muted-foreground"
                      readOnly
                    />
                  </div>
                  <Button size="sm" className="w-full">Build binder</Button>
                  <p className="text-xs text-muted-foreground text-center">Unlimited AI credits left, or just create manually.</p>
                </CardContent>
              </Card>
            </DemoCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Data Source</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>Reads <code className="text-primary bg-muted px-1 rounded">creditBalance</code> and <code className="text-primary bg-muted px-1 rounded">user.isAdmin</code> from the central store.</p>
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
            <p><strong className="text-foreground">Heading:</strong> Uses CardTitle for the section label.</p>
            <p><strong className="text-foreground">Input:</strong> The text input supports Enter key to submit.</p>
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
