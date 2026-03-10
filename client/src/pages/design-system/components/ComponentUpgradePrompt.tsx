import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import { Crown, Coins, Zap, BookOpen } from 'lucide-react';
import { ProFeaturesList, FreePlanFeaturesList } from '@/components/ProFeaturesList';

function DemoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export default function ComponentUpgradePrompt() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">UpgradePrompt</h1>
          <p className="text-lg text-muted-foreground">
            A modal dialog that prompts users to upgrade to Syllabind Pro or purchase additional
            credits. Supports 4 variants covering binder limits, enrollment gates, generic Pro
            feature locks, and insufficient credit balances.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use UpgradePrompt</strong> when a user action is blocked by plan limits — binder creation caps, enrollment gates, Pro-only features, or depleted AI credits.</p>
            <p><strong className="text-foreground">Do not use</strong> for informational upsells or banners. This component initiates Stripe checkout and should only appear when an action is genuinely blocked.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <p className="text-base text-muted-foreground">
            Each variant's dialog content rendered inline. In the product these appear as centered modals with a backdrop overlay. Checkout buttons are inert here.
          </p>
          <div className="space-y-8">

            {/* curator-limit */}
            <DemoCard label="variant=&quot;curator-limit&quot;">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-highlight p-2 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Upgrade to Syllabind Pro</h3>
                <p className="text-base text-muted-foreground">Upgrade to Pro for unlimited binders, enrollments, and 130 monthly AI credits.</p>
              </div>
              <ProFeaturesList />
              <div className="space-y-2">
                <Button className="w-full">Annual — $12.50/mo (save 17%)</Button>
                <Button className="w-full" variant="secondary">Monthly — $14.99/mo</Button>
              </div>
              <p className="text-center text-sm text-muted-foreground underline">See all plans</p>
            </DemoCard>

            {/* enrollment-gate */}
            <DemoCard label="variant=&quot;enrollment-gate&quot;">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-highlight p-2 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Syllabind Pro Required</h3>
                <p className="text-base text-muted-foreground">Free plan allows 1 active enrollment. Upgrade to Pro for unlimited enrollments and 130 monthly credits.</p>
              </div>
              <ProFeaturesList />
              <div className="space-y-2">
                <Button className="w-full">Annual — $12.50/mo (save 17%)</Button>
                <Button className="w-full" variant="secondary">Monthly — $14.99/mo</Button>
              </div>
              <p className="text-center text-sm text-muted-foreground underline">See all plans</p>
            </DemoCard>

            {/* insufficient-credits (Pro user) */}
            <DemoCard label="variant=&quot;insufficient-credits&quot; (Pro user)">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-warning-surface p-2 rounded-full">
                  <Coins className="h-5 w-5 text-warning" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Need More Credits</h3>
                <p className="text-base text-muted-foreground">This action costs 10 credits. You have 3 credits remaining.</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full justify-between" variant="secondary">
                  <span>100 credits</span>
                  <span className="font-semibold">$4.99</span>
                </Button>
                <Button className="w-full justify-between" variant="secondary">
                  <span>250 credits</span>
                  <span className="font-semibold">$9.99</span>
                </Button>
                <Button className="w-full justify-between" variant="secondary">
                  <span>550 credits</span>
                  <span className="font-semibold">$19.99</span>
                </Button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost">Cancel</Button>
              </div>
            </DemoCard>

            {/* insufficient-credits (Free user) */}
            <DemoCard label="variant=&quot;insufficient-credits&quot; (Free user)">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-warning-surface p-2 rounded-full">
                  <Coins className="h-5 w-5 text-warning" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Out of Credits</h3>
                <p className="text-base text-muted-foreground">You've used all your free credits. Upgrade to Pro for 130 monthly credits and the ability to purchase more.</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Annual — $12.50/mo (save 17%)
                </Button>
                <Button className="w-full" variant="secondary">Monthly — $14.99/mo</Button>
              </div>
              <p className="text-center text-sm text-muted-foreground underline">See all plans</p>
              <div className="flex justify-end">
                <Button variant="ghost">Maybe Later</Button>
              </div>
            </DemoCard>

            {/* Signed out — pro-feature */}
            <DemoCard label="variant=&quot;pro-feature&quot; isAuthenticated={false}">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-highlight p-2 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Unlock Pro Features</h3>
                <p className="text-base text-muted-foreground">Join an exclusive Slack community of learners taking this binder. Connect, discuss, and grow together.</p>
              </div>
              <ProFeaturesList />
              <div className="space-y-2">
                <Button className="w-full">Sign up</Button>
              </div>
            </DemoCard>

            {/* Signed out — enrollment-gate */}
            <DemoCard label="variant=&quot;enrollment-gate&quot; isAuthenticated={false}">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-highlight p-2 rounded-full">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Syllabind Pro Required</h3>
                <p className="text-base text-muted-foreground">Free plan allows 1 active enrollment. Upgrade to Pro for unlimited enrollments and 130 monthly credits.</p>
              </div>
              <ProFeaturesList />
              <div className="space-y-2">
                <Button className="w-full">Sign up</Button>
              </div>
            </DemoCard>

            {/* Signed out — enrollment-signup */}
            <DemoCard label="variant=&quot;enrollment-signup&quot;">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-highlight p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Start Learning Today</h3>
                <p className="text-base text-muted-foreground">Create a free account to enroll in this binder and start your learning journey. Track your progress week by week, complete exercises, and connect with fellow readers.</p>
              </div>
              <FreePlanFeaturesList />
              <div className="space-y-2">
                <Button className="w-full">Sign up</Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account? <span className="underline">Log in</span>
              </p>
            </DemoCard>

          </div>
        </section>

        {/* Variants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Variants</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">curator-limit</strong> — Free curator exceeded binder cap. Crown icon, Pro feature list, monthly/annual CTAs.</p>
            <p><strong className="text-foreground">enrollment-gate</strong> — Free reader at 1-enrollment limit. Same layout, reader-specific copy.</p>
            <p><strong className="text-foreground">pro-feature</strong> — Generic lock for Pro-only features. Neutral copy, same Pro CTAs.</p>
            <p><strong className="text-foreground">pro-feature (signed out)</strong> — Same as pro-feature but with a "Sign up" CTA instead of pricing buttons. Set via <code className="text-primary bg-muted px-1 rounded">isAuthenticated={'{false}'}</code>.</p>
            <p><strong className="text-foreground">enrollment-signup</strong> — Logged-out user clicks "Start this Binder". BookOpen icon, free account features list, Sign up CTA with "Log in" link.</p>
            <p><strong className="text-foreground">insufficient-credits (Pro)</strong> — Pro user needs more credits. Coins icon (amber), 3 credit packages ($4.99/$9.99/$19.99).</p>
            <p><strong className="text-foreground">insufficient-credits (Free)</strong> — Free user out of credits. Coins icon, upgrade-to-Pro CTAs with Zap icon.</p>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">open</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3">Controls dialog visibility.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">onOpenChange</td>
                  <td className="p-3 font-mono text-xs">{"(open: boolean) => void"}</td>
                  <td className="p-3">Callback when dialog open state changes.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">variant</td>
                  <td className="p-3 font-mono text-xs">{"'curator-limit' | 'enrollment-gate' | 'pro-feature' | 'insufficient-credits' | 'enrollment-signup'"}</td>
                  <td className="p-3">Determines title, description, and CTA layout.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">returnTo?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">URL to redirect back to after Stripe checkout. Defaults to current page.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">creditCost?</td>
                  <td className="p-3 font-mono text-xs">number</td>
                  <td className="p-3">Cost of the blocked action in credits. Shown in insufficient-credits variant messaging.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">customDescription?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">Overrides the default variant description. Used for context-specific messaging (e.g. Slack community, office hours).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs text-foreground">isAuthenticated?</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3">When false, replaces pricing CTAs with a "Sign up" button. Defaults to true.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Internal Composition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Internal Composition</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dialog</strong> — Radix-based modal with <code className="text-primary bg-muted px-1 rounded">sm:max-w-md</code> constraint.</p>
            <p><strong className="text-foreground">Button</strong> — Primary for main CTA, outline for secondary CTA, ghost for cancel/dismiss.</p>
            <p><strong className="text-foreground">Icons</strong> — <code className="text-primary bg-muted px-1 rounded">Crown</code> (primary tint) for upgrade variants, <code className="text-primary bg-muted px-1 rounded">Coins</code> (amber tint) for credit variants, <code className="text-primary bg-muted px-1 rounded">Zap</code> inline on the free-user credit CTA.</p>
            <p><strong className="text-foreground">ProFeaturesList</strong> — Shared component (<code className="text-primary bg-muted px-1 rounded">@/components/ProFeaturesList</code>) that renders the "Syllabind Pro includes:" box. Single source of truth — also consumed by the Pricing page. Edit feature lists via <code className="text-primary bg-muted px-1 rounded">PRO_READER_FEATURES</code> and <code className="text-primary bg-muted px-1 rounded">PRO_CURATOR_FEATURES</code> constants.</p>
            <p><strong className="text-foreground">Legal links</strong> — Terms of Service and Privacy Policy URLs fetched from <code className="text-primary bg-muted px-1 rounded">/api/site-settings</code> on open. Shown only on the 3 upgrade variants (not credit packages).</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { UpgradePrompt } from '@/components/UpgradePrompt';

// Curator hits binder creation limit
<UpgradePrompt
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  variant="curator-limit"
/>

// Reader hits enrollment limit on a binder page
<UpgradePrompt
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  variant="enrollment-gate"
  returnTo={\`/binder/\${binderId}\`}
/>

// Generic Pro feature gate
<UpgradePrompt
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  variant="pro-feature"
/>

// Not enough credits for an AI action
<UpgradePrompt
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  variant="insufficient-credits"
  creditCost={10}
/>`}</CodeBlock>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Triggered with <code className="text-primary bg-muted px-1 rounded">curator-limit</code> when a free curator tries to create a new binder beyond the plan cap.</p>
            <p><strong className="text-foreground">BinderOverview:</strong> Triggered with <code className="text-primary bg-muted px-1 rounded">enrollment-signup</code> when a logged-out user clicks "Start this Binder", and <code className="text-primary bg-muted px-1 rounded">enrollment-gate</code> when a free reader attempts to enroll while already at the 1-enrollment limit.</p>
            <p><strong className="text-foreground">WeekView:</strong> Triggered with <code className="text-primary bg-muted px-1 rounded">enrollment-gate</code> for the same enrollment limit scenario.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Triggered with <code className="text-primary bg-muted px-1 rounded">curator-limit</code> from the "Create Binder" action.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
