import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';

export default function ComponentOnboardingChecklist() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">OnboardingChecklist</h1>
          <p className="text-lg text-muted-foreground">
            A sidebar card that guides new users through their first steps on Syllabind. Shows a progress count and checklist of 4 onboarding tasks.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use OnboardingChecklist</strong> in the reader dashboard sidebar to help new users discover key features.</p>
            <p>The component auto-hides once all steps are completed and dismissed (persisted via localStorage).</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Behavior</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">4 checklist items:</strong> Fill in profile, Browse a binder, Build a binder, Enroll in a binder.</p>
            <p><strong className="text-foreground">Completion detection:</strong> Profile fields from user object, localStorage flag for browsing, binder ownership from store, enrollment data from store.</p>
            <p><strong className="text-foreground">Dismiss:</strong> When all 4 steps are done, shows a congrats message with a Dismiss button that writes to <code className="text-primary bg-muted px-1 rounded">syllabind_onboarding_dismissed</code> in localStorage.</p>
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
                  <td className="p-3 font-mono text-xs">syllabind_browsed_binder</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user views a binder in BinderOverview</td>
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
