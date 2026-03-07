import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComponentErrorBoundary() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ErrorBoundary</h1>
          <p className="text-lg text-muted-foreground">
            A React class component that catches JavaScript errors in its child component tree,
            logs them, and renders a fallback UI instead of crashing the entire application.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use ErrorBoundary</strong> to wrap component subtrees that might throw during rendering. It prevents a single broken component from taking down the whole page.</p>
            <p><strong className="text-foreground">Use at the app root</strong> as a last-resort catch-all. Use around specific subtrees (e.g., a binder editor, a data visualization) for more granular recovery.</p>
            <p><strong className="text-foreground">Use useErrorHandler</strong> to surface async errors from functional components into the nearest ErrorBoundary.</p>
          </div>
        </section>

        {/* Anatomy / Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Fallback UI</h2>
          <p className="text-base text-muted-foreground">
            The ErrorBoundary cannot be demonstrated live without triggering an actual error. Below is a static replica of the default fallback UI that appears when an error is caught.
          </p>
          <div className="border border-border rounded-lg p-6 bg-background">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
                <CardDescription>
                  The application encountered an error. This has been logged and we'll look into it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-mono text-sm text-destructive">
                    Error: Cannot read properties of undefined (reading 'title')
                  </p>
                </div>

                <details className="bg-muted rounded-lg p-4">
                  <summary className="cursor-pointer font-medium mb-2">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 font-mono text-muted-foreground">
{`    at BinderCard (BinderCard.tsx:12)
    at div
    at DashboardPage (Dashboard.tsx:45)
    at ErrorBoundary (ErrorBoundary.tsx:16)
    at App (App.tsx:8)`}
                  </pre>
                </details>

                <div className="flex gap-3">
                  <Button disabled>Reload Page</Button>
                  <Button variant="outline" disabled>Go Back</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Error message</strong> — Shown in a destructive-tinted box with monospace font.</p>
            <p><strong className="text-foreground">Stack trace</strong> — Collapsed by default inside a details/summary element. Only rendered when <code className="text-primary bg-primary/5 px-1 rounded">NODE_ENV === 'development'</code>.</p>
            <p><strong className="text-foreground">Recovery actions</strong> — "Reload Page" calls <code className="text-primary bg-primary/5 px-1 rounded">window.location.reload()</code>. "Go Back" calls <code className="text-primary bg-primary/5 px-1 rounded">window.history.back()</code>.</p>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">children</td>
                  <td className="p-3 font-mono text-xs">ReactNode</td>
                  <td className="p-3 text-muted-foreground">The component subtree to wrap. Rendered normally when no error is present.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">fallback</td>
                  <td className="p-3 font-mono text-xs">ReactNode?</td>
                  <td className="p-3 text-muted-foreground">Optional custom fallback UI. When provided, replaces the default Card-based error screen.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* useErrorHandler Hook */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">useErrorHandler Hook</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>
              The module also exports a <code className="text-primary bg-primary/5 px-1 rounded">useErrorHandler</code> hook for functional components.
              It returns a <code className="text-primary bg-primary/5 px-1 rounded">setError</code> function that, when called with an Error, re-throws it during render so the nearest ErrorBoundary catches it.
            </p>
            <p>
              This is useful for surfacing errors from async operations (API calls, event handlers) that React's error boundary lifecycle methods cannot catch on their own.
            </p>
          </div>
          <CodeBlock>{`import { useErrorHandler } from '@/components/ErrorBoundary';

function DataLoader() {
  const throwError = useErrorHandler();

  async function fetchData() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to load data');
    } catch (err) {
      throwError(err as Error); // Caught by nearest ErrorBoundary
    }
  }
}`}</CodeBlock>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { ErrorBoundary } from '@/components/ErrorBoundary';

// Wrap the entire app (root-level catch-all)
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap a specific subtree
<ErrorBoundary>
  <BinderEditor binderId={id} />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<p>This section failed to load.</p>}>
  <DataVisualization data={chartData} />
</ErrorBoundary>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Focus management:</strong> When the fallback UI renders, the "Reload Page" and "Go Back" buttons are immediately focusable via Tab.</p>
            <p><strong className="text-foreground">Semantic structure:</strong> The default fallback uses Card with CardTitle (heading) and CardDescription for screen reader context.</p>
            <p><strong className="text-foreground">Stack trace disclosure:</strong> Uses native <code className="text-primary bg-primary/5 px-1 rounded">&lt;details&gt;</code> / <code className="text-primary bg-primary/5 px-1 rounded">&lt;summary&gt;</code> elements, which are natively accessible and keyboard-operable.</p>
            <p><strong className="text-foreground">Dev-only content:</strong> Stack traces are hidden in production, reducing noise for end users and screen readers.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">App.tsx:</strong> Wraps the entire application at the root level as a last-resort error catch. Prevents a white screen if any page throws during render.</p>
            <p><strong className="text-foreground">Component subtrees:</strong> Can be placed around any isolated feature (editor, dashboard widget) to contain failures without affecting the rest of the page.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
