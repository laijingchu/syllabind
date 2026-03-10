import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked, Send, Star, ArrowRight } from 'lucide-react';

function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default function ComponentCuratorRecruitCard() {
  const steps = [
    { icon: BookMarked, label: 'Create a binder with your vetted resources', description: 'Showcase books, articles, and audiovisual content you\'ve personally vetted' },
    { icon: Send, label: 'Submit for review', description: 'Our team reviews your binder for quality and fit' },
    { icon: Star, label: 'Get featured, get paid fairly', description: 'Show your scheduling link on any binder, and keep 100% of what you earn' },
  ];

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CuratorRecruitCard</h1>
          <p className="text-lg text-muted-foreground">
            A full-width card that pitches users to become curators. Explains the 3-step process (create, submit, get featured) with a nested section showcasing currently featured binders as social proof.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CuratorRecruitCard</strong> at the bottom of the reader dashboard, spanning all 12 grid columns, to recruit new curators.</p>
            <p>The component self-hides when the user already has a featured (demo) binder, unless they are an admin.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="space-y-8">
            <DemoCard label="Default state">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Become a Curator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground max-w-lg">
                    Share your expertise with the Syllabind community. Build a structured learning binder on a topic you know well, submit it for review, and reach learners across the platform. Add your paid scheduling link with no platform fees.
                  </p>

                  <ol className="space-y-3">
                    {steps.map(({ icon: Icon, label, description }) => (
                      <li key={label} className="flex items-start gap-3">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-highlight text-primary shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="flex gap-3">
                    <Button className="gap-2">
                      Craft Your Binder
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            </DemoCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Layout</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Two-column on desktop:</strong> Left side has the pitch copy and 3-step process. Right side shows featured binders with curator avatars as social proof.</p>
            <p><strong className="text-foreground">Single column on mobile:</strong> Stacks vertically with featured binders below the pitch.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { CuratorRecruitCard } from '@/components/CuratorRecruitCard';

// Full-width inside the dashboard grid
<AnimatedCard className="col-span-12">
  <CuratorRecruitCard />
</AnimatedCard>`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard:</strong> Spans all 12 columns at the bottom of the dashboard grid, below both the primary content and sidebar. Replaces the previous sidebar-only FeaturedBinderCard.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
