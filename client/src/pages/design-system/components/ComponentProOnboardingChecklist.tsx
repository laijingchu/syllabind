import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';

export default function ComponentProOnboardingChecklist() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ProOnboardingChecklist</h1>
          <p className="text-lg text-muted-foreground">
            A sidebar card that guides Pro users through exclusive features after upgrading. Appears only for Pro subscribers and complements the standard OnboardingChecklist.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use ProOnboardingChecklist</strong> in the reader dashboard sidebar, below the standard OnboardingChecklist.</p>
            <p>The component only renders for Pro users (<code className="text-primary bg-muted px-1 rounded">isPro === true</code>) and auto-hides once dismissed via localStorage.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Behavior</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">4 checklist items:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Join exclusive community</strong> — Fetches Slack URL from site settings, opens in new tab, sets localStorage flag.</li>
              <li><strong className="text-foreground">Build more binders with AI</strong> — Links to binder creator. Completes when user has 2+ binders.</li>
              <li><strong className="text-foreground">Enroll in another binder</strong> — Links to catalog. Completes when user has 2+ total enrollments (active + completed).</li>
              <li><strong className="text-foreground">Book 1:1 with featured curator</strong> — Opens an info dialog with a static demo of the curator card. Completes on dialog acknowledgment.</li>
            </ol>
            <p><strong className="text-foreground">Dismiss:</strong> When all 4 steps are done, shows a congrats message with a Dismiss button.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">OfficeHourInfoDialog</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>An inline modal triggered by the "Book 1:1" checklist item. Shows a read-only demo of the "Meet the Curator" card with a highlighted "1:1 Office Hour" button. Clicking "Got it" sets the localStorage flag and closes the dialog.</p>
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
                  <td className="p-3 font-mono text-xs">syllabind_pro_onboarding_dismissed</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user dismisses the completed checklist</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">syllabind_joined_community</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user clicks the Slack community link</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">syllabind_pro_enrolled_another</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user enrolls in a 2nd+ binder (set in BinderOverview)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">syllabind_office_hour_clicked</td>
                  <td className="p-3 text-muted-foreground">Set to "true" when user acknowledges the office hour info dialog</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { ProOnboardingChecklist } from '@/components/ProOnboardingChecklist';

// In the dashboard sidebar, below OnboardingChecklist
<ProOnboardingChecklist />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Semantic list:</strong> Uses an unordered list for checklist items.</p>
            <p><strong className="text-foreground">Links vs buttons:</strong> Items with custom onClick handlers use semantic buttons; standard navigation items use links.</p>
            <p><strong className="text-foreground">Dialog:</strong> The OfficeHourInfoDialog uses Radix Dialog with proper title/description for screen readers.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">Reader Dashboard sidebar:</strong> Rendered below the standard OnboardingChecklist. Only visible to Pro subscribers. Self-hides when not applicable or dismissed.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
