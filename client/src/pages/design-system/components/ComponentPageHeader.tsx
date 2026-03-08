import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

export default function ComponentPageHeader() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">PageHeader</h1>
          <p className="text-lg text-muted-foreground">
            A consistent page-level header used across all top-level views. Provides a title,
            optional subtitle, optional back navigation, and an actions slot for contextual buttons.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use PageHeader</strong> at the top of every page-level view to establish hierarchy and provide consistent navigation. It standardizes the title area so pages feel unified.</p>
            <p><strong className="text-foreground">Use a custom header</strong> instead when the page needs a highly specialized layout (e.g., the marketing landing page hero).</p>
          </div>
        </section>

        {/* Demo - Basic */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>

          <h3 className="text-sm font-medium text-foreground">Basic (title only)</h3>
          <div className="border border-border rounded-lg p-6">
            <PageHeader title="My Dashboard" />
          </div>

          <h3 className="text-sm font-medium text-foreground">With subtitle</h3>
          <div className="border border-border rounded-lg p-6">
            <PageHeader
              title="Binder Builder"
              subtitle="Create and manage your learning binders"
            />
          </div>

          <h3 className="text-sm font-medium text-foreground">With back button</h3>
          <div className="border border-border rounded-lg p-6">
            <PageHeader
              title="Edit Binder"
              backHref="/curator"
              backLabel="Back to Dashboard"
            />
          </div>

          <h3 className="text-sm font-medium text-foreground">With actions</h3>
          <div className="border border-border rounded-lg p-6">
            <PageHeader
              title="Curator Dashboard"
              actions={
                <Button><Plus className="h-4 w-4" />New Binder</Button>
              }
            />
          </div>

          <h3 className="text-sm font-medium text-foreground">Full (all props)</h3>
          <div className="border border-border rounded-lg p-6">
            <PageHeader
              title="Digital Minimalism"
              subtitle="Manage your binder content and settings"
              backHref="/curator"
              backLabel="Dashboard"
              actions={
                <div className="flex gap-2">
                  <Button variant="secondary"><Settings className="h-4 w-4" />Settings</Button>
                  <Button>Publish</Button>
                </div>
              }
            />
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Default</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">title</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 text-muted-foreground">required</td>
                  <td className="p-3 text-muted-foreground">Page heading text, rendered as h1</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">subtitle</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Supporting text below the title</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">backHref</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">URL for back navigation link; shows ArrowLeft icon button when set</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">backLabel</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">"Back"</td>
                  <td className="p-3 text-muted-foreground">Label text for the back button</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">actions</td>
                  <td className="p-3 font-mono text-xs">ReactNode?</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Slot for action buttons placed at the end of the header</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">className</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">""</td>
                  <td className="p-3 text-muted-foreground">Additional CSS classes on the root wrapper</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token=".page-header" value="Root wrapper with semantic class name" />
            <TokenRow token=".page-header-content" value="Contains back button and title group" />
            <TokenRow token=".page-header-titles" value="Title and subtitle container" />
            <TokenRow token=".page-header-back" value="Ghost button with ArrowLeft icon" />
            <TokenRow token=".page-header-actions" value="Actions slot aligned to the end" />
          </div>
          <p className="text-base text-muted-foreground">
            PageHeader uses semantic class names (no Tailwind layout utilities on the root) so page-level layout can be controlled via the design system stylesheet. The title uses <code className="text-primary bg-muted px-1 rounded">font-display</code> at 3xl.
          </p>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Basic
<PageHeader title="My Dashboard" />

// With subtitle
<PageHeader
  title="Binder Builder"
  subtitle="Create and manage your learning binders"
/>

// With back navigation
<PageHeader
  title="Edit Binder"
  backHref="/curator"
  backLabel="Back to Dashboard"
/>

// With actions
<PageHeader
  title="Curator Dashboard"
  actions={<Button><Plus />New Binder</Button>}
/>

// Full example
<PageHeader
  title="Digital Minimalism"
  subtitle="Manage your binder content"
  backHref="/curator"
  backLabel="Dashboard"
  actions={
    <div className="flex gap-2">
      <Button variant="secondary">Settings</Button>
      <Button>Publish</Button>
    </div>
  }
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Heading hierarchy:</strong> Renders an <code className="text-primary bg-muted px-1 rounded">h1</code> element, so there should only be one PageHeader per page to maintain proper document structure.</p>
            <p><strong className="text-foreground">Back navigation:</strong> The back button is a ghost Button wrapped in a Link, fully keyboard accessible via Tab and Enter.</p>
            <p><strong className="text-foreground">Actions slot:</strong> Buttons placed in the actions slot inherit standard Button accessibility (focus ring, keyboard activation).</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dashboard:</strong> Title with "New Binder" action button.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> "Binder Builder" title with subtitle and create action.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Binder name as title, back link to dashboard, publish/settings actions.</p>
            <p><strong className="text-foreground">Profile pages:</strong> "Your Profile" title with optional edit action.</p>
          </div>
          <p className="text-base text-muted-foreground italic">
            Note: PageHeader is a ready-to-use component not yet imported in any pages. It is designed to replace ad-hoc header patterns across the app.
          </p>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
