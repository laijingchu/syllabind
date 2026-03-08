import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, AlertCircle } from 'lucide-react';

export default function UIAlert() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Alert</h1>
          <p className="text-lg text-muted-foreground">
            A callout component for displaying important messages. Supports two variants — <code className="text-primary bg-muted px-1 rounded">default</code> for
            informational notices and <code className="text-primary bg-muted px-1 rounded">destructive</code> for errors and warnings. Composed
            of <code className="text-primary bg-muted px-1 rounded">Alert</code>, <code className="text-primary bg-muted px-1 rounded">AlertTitle</code>,
            and <code className="text-primary bg-muted px-1 rounded">AlertDescription</code>.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Alert</strong> to surface contextual messages that the user should notice but that don't interrupt their workflow — validation errors, system status, or informational banners.</p>
            <p><strong className="text-foreground">Use a toast</strong> instead for transient feedback after an action (e.g., "Saved successfully") that should auto-dismiss.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components to your app using the CLI.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Your session has expired. Please log in again.
              </AlertDescription>
            </Alert>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">default</strong> — Neutral border and background. Informational messages, tips, system notices.</p>
            <p><strong className="text-foreground">destructive</strong> — Red-tinted border and text. Errors, validation failures, critical warnings.</p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>With icon, title, and description</AlertTitle>
                <AlertDescription>Full composition with all three sub-components.</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">Full composition</p>
            </div>
            <div className="space-y-2">
              <Alert>
                <AlertTitle>Title only, no icon</AlertTitle>
                <AlertDescription>Description text without a leading icon.</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">Without icon</p>
            </div>
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Destructive with icon</AlertTitle>
                <AlertDescription>Something went wrong. Please try again.</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">Destructive variant</p>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Icons are absolutely positioned to the left via <code className="text-primary bg-muted px-1 rounded">{"[&>svg]:absolute"}</code> and sibling content is offset
            with <code className="text-primary bg-muted px-1 rounded">{"[&>svg~*]:pl-7"}</code>. Omitting the icon removes the left padding automatically.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--foreground" value="Text and icon color for default variant" />
            <TokenRow token="--destructive" value="Text, icon, and border tint for destructive variant" />
            <TokenRow token="--border" value="Border color for default variant" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, AlertCircle } from 'lucide-react';

// Default (informational)
<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the CLI.
  </AlertDescription>
</Alert>

// Destructive (error)
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>

// Without icon
<Alert>
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>
    This binder is still in draft mode.
  </AlertDescription>
</Alert>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">ARIA role:</strong> The component renders with <code className="text-primary bg-muted px-1 rounded">role="alert"</code>, which causes screen readers to announce the content immediately when it appears.</p>
            <p><strong className="text-foreground">Semantic heading:</strong> <code className="text-primary bg-muted px-1 rounded">AlertTitle</code> renders as an <code className="text-primary bg-muted px-1 rounded">&lt;h5&gt;</code>. Ensure it fits within the page heading hierarchy or override the element if needed.</p>
            <p><strong className="text-foreground">Icon decorative:</strong> Icons inside Alert are decorative — the title and description carry the semantic meaning. Add <code className="text-primary bg-muted px-1 rounded">aria-hidden="true"</code> on the icon if it duplicates the text content.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Form validation errors:</strong> Destructive alert shown above forms when submission fails (login, binder editor, profile settings).</p>
            <p><strong className="text-foreground">System announcements:</strong> Default alert for platform-wide notices such as maintenance windows or new features.</p>
            <p><strong className="text-foreground">Draft binder warnings:</strong> Informational alert on BinderOverview indicating the binder is unpublished and only visible to the curator.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
