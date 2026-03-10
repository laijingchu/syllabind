import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { ProFeaturesList, FreePlanFeaturesList } from '@/components/ProFeaturesList';

export default function ComponentProFeaturesList() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ProFeaturesList</h1>
          <p className="text-lg text-muted-foreground">
            Single source of truth for Pro and Free plan features. Renders styled feature lists used
            in the UpgradePrompt modal and referenced by the Pricing page.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use ProFeaturesList</strong> anywhere you need to display what Syllabind Pro includes — upgrade modals, pricing cards, marketing sections.</p>
            <p><strong className="text-foreground">Use FreePlanFeaturesList</strong> when showing what the free account includes — the enrollment-signup modal for logged-out users.</p>
            <p><strong className="text-foreground">Use the exported constants</strong> (<code className="text-primary bg-muted px-1 rounded">PRO_READER_FEATURES</code>, <code className="text-primary bg-muted px-1 rounded">PRO_CURATOR_FEATURES</code>, <code className="text-primary bg-muted px-1 rounded">FREE_READER_FEATURES</code>, <code className="text-primary bg-muted px-1 rounded">FREE_CURATOR_FEATURES</code>) when you need the raw data for custom layouts like the Pricing page cards.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">ProFeaturesList — variant="compact" (default)</p>
              <div className="max-w-md">
                <ProFeaturesList />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">FreePlanFeaturesList</p>
              <div className="max-w-md">
                <FreePlanFeaturesList />
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
                <tr className="border-b bg-muted">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">className?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">Additional CSS classes for the container.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs text-foreground">variant?</td>
                  <td className="p-3 font-mono text-xs">'compact' | 'full'</td>
                  <td className="p-3">Compact renders a flat list. Defaults to 'compact'.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Exported Constants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Exported Constants</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">FREE_READER_FEATURES</strong> — Free plan reader features (1 active enrollment).</p>
            <p><strong className="text-foreground">FREE_CURATOR_FEATURES</strong> — Free plan curator features (lifetime credits, manual binders, 4-week AI binders, unlisted publishing).</p>
            <p><strong className="text-foreground">getAllFreeFeatures()</strong> — Returns a flat string array of all free reader + curator features.</p>
            <p><strong className="text-foreground">PRO_READER_FEATURES</strong> — Reader-facing features (unlimited enrollments, learning community, 1:1 calls).</p>
            <p><strong className="text-foreground">PRO_CURATOR_FEATURES</strong> — Curator-facing features (AI credits, unlimited binders, featured listing).</p>
            <p><strong className="text-foreground">PRO_BOTTOM_FEATURES</strong> — Bottom-card features (paid video sessions, no platform fee).</p>
            <p><strong className="text-foreground">getAllProFeatures()</strong> — Returns a flat string array of all Pro reader + curator features.</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  ProFeaturesList,
  FreePlanFeaturesList,
  PRO_READER_FEATURES,
  PRO_CURATOR_FEATURES,
  FREE_READER_FEATURES,
  FREE_CURATOR_FEATURES,
} from '@/components/ProFeaturesList';

// Pro features in a modal
<ProFeaturesList />

// Free features in a modal
<FreePlanFeaturesList />

// Use raw constants for custom layouts (e.g. Pricing page)
const freeReader = FREE_READER_FEATURES;
const freeCurator = FREE_CURATOR_FEATURES;
const proReader = PRO_READER_FEATURES;
const proCurator = PRO_CURATOR_FEATURES;`}</CodeBlock>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">UpgradePrompt:</strong> Uses <code className="text-primary bg-muted px-1 rounded">{'<ProFeaturesList />'}</code> for Pro upgrade variants and <code className="text-primary bg-muted px-1 rounded">{'<FreePlanFeaturesList />'}</code> for the enrollment-signup variant.</p>
            <p><strong className="text-foreground">Pricing:</strong> Uses <code className="text-primary bg-muted px-1 rounded">FREE_READER_FEATURES</code> / <code className="text-primary bg-muted px-1 rounded">FREE_CURATOR_FEATURES</code> for the Free card and <code className="text-primary bg-muted px-1 rounded">PRO_READER_FEATURES</code> / <code className="text-primary bg-muted px-1 rounded">PRO_CURATOR_FEATURES</code> / <code className="text-primary bg-muted px-1 rounded">PRO_BOTTOM_FEATURES</code> for the Pro card.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
