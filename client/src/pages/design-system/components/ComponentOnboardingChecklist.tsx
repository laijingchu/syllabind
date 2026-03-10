import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PartyPopper, MessageSquareHeart } from 'lucide-react';

function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

export default function ComponentOnboardingChecklist() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">OnboardingChecklist</h1>
          <p className="text-lg text-muted-foreground">
            A sidebar card that guides new users through their first steps on Syllabind. Shows a progress count and checklist of onboarding tasks.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use OnboardingChecklist</strong> in the reader dashboard sidebar to help new users discover key features.</p>
            <p>The component auto-hides once all steps are completed and dismissed (persisted via localStorage).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <p className="text-base text-muted-foreground">
            Static previews — the real component reads completion state from the store and localStorage.
          </p>
          <div className="space-y-8">
            <DemoCard label="In progress (2 of 5 complete)">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Getting Started</CardTitle>
                  <p className="text-sm text-muted-foreground">2 of 5 complete</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {[
                      { label: 'Fill in your profile', done: true },
                      { label: 'Check out 3 interesting binders', done: true },
                      { label: 'Enroll in a binder', done: false },
                      { label: 'Build your own binder', done: false },
                      { label: 'Share Syllabind with a friend', done: false },
                    ].map(item => (
                      <li key={item.label} className={`flex items-center gap-2.5 text-sm rounded-md px-2 py-1.5 -mx-2 ${item.done ? 'text-muted-foreground line-through' : ''}`}>
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        )}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </DemoCard>

            <DemoCard label="All complete (congrats state)">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Getting Started</CardTitle>
                  <p className="text-sm text-muted-foreground">5 of 5 complete</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col items-center text-center gap-2 py-2">
                    <PartyPopper className="h-6 w-6 text-primary" />
                    <p className="text-sm font-medium">You're all set!</p>
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <MessageSquareHeart className="h-3.5 w-3.5" />
                      Give Feedback
                    </Button>
                    <Button variant="ghost" size="sm">Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            </DemoCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Behavior</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Checklist items:</strong> Fill in profile, Check out 3 interesting binders, Enroll in a binder, Build your own binder, Share Syllabind with a friend, Submit a feature binder (conditional).</p>
            <p><strong className="text-foreground">Completion detection:</strong> Profile fields from user object, localStorage array of visited binder IDs (requires 3 distinct binders), binder ownership from store, enrollment data from store.</p>
            <p><strong className="text-foreground">Dismiss:</strong> When all steps are done, shows a congrats message with a Dismiss button that writes to <code className="text-primary bg-muted px-1 rounded">syllabind_onboarding_dismissed</code> in localStorage.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">localStorage Keys</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-3 font-medium">Key</th>
                  <th className="text-left p-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">syllabind_browsed_binders</td>
                  <td className="p-3 text-muted-foreground">JSON array of visited binder IDs; item completes when 3 distinct binders have been viewed</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">syllabind_onboarding_dismissed</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user dismisses the completed checklist</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { OnboardingChecklist } from '@/components/OnboardingChecklist';

// In the dashboard sidebar
<OnboardingChecklist />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Semantic list:</strong> Uses an unordered list for checklist items.</p>
            <p><strong className="text-foreground">Links:</strong> Each uncompleted item links to the relevant page so users can navigate via keyboard.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard sidebar:</strong> Shown to all users until dismissed. Replaces the old first-time welcome state with an always-visible, progressive onboarding flow.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
