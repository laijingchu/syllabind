import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { ShareDialog } from '@/components/ShareDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy } from 'lucide-react';

export default function ComponentShareDialog() {
  const [open, setOpen] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ShareDialog</h1>
          <p className="text-muted-foreground">
            A dialog for sharing the current page URL with one-click copy-to-clipboard. Built on
            Dialog, Input, and Button primitives with toast feedback and PostHog analytics tracking.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use ShareDialog</strong> when a page has sharable content and the user should be able to copy its URL. Pair with a trigger button (typically ghost or outline variant with a Share icon).</p>
            <p><strong className="text-foreground">Use a direct copy button</strong> instead if the share action is inline and a dialog would be too heavy (e.g. sharing a single step link).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Share2 className="h-4 w-4" />
              Share this page
            </Button>
            <ShareDialog open={open} onOpenChange={setOpen} />
            <p className="text-xs text-muted-foreground">Click the button to open the share dialog. It will display the current page URL with a copy button.</p>
          </div>

          <p className="text-xs text-muted-foreground">Inline preview of the dialog content:</p>
          <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Share this page</h3>
              <p className="text-sm text-muted-foreground">Share this link with a friend to invite them to learn together.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={window.location.href}
                readOnly
                className="flex-1 text-sm"
              />
              <Button size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Default</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">open</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Controlled open state of the dialog.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onOpenChange</td>
                  <td className="p-3 font-mono text-xs">(open: boolean) =&gt; void</td>
                  <td className="p-3 text-muted-foreground">--</td>
                  <td className="p-3 text-muted-foreground">Callback when open state changes (close via overlay click, Escape, or X button).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">title?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 font-mono text-xs">"Share this page"</td>
                  <td className="p-3 text-muted-foreground">Custom dialog title text.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Max width:</strong> Dialog content is constrained to <code className="text-primary bg-primary/5 px-1 rounded">sm:max-w-md</code> for a compact, focused layout.</p>
            <p><strong className="text-foreground">Copy button state:</strong> The copy button switches from outline variant to default (filled) variant after a successful copy, with the icon changing from Copy to Check for 2 seconds.</p>
            <p><strong className="text-foreground">URL input:</strong> A read-only Input displaying <code className="text-primary bg-primary/5 px-1 rounded">window.location.href</code>. The user can still select and manually copy if the clipboard API fails.</p>
            <p><strong className="text-foreground">Toast feedback:</strong> Uses the app's toast system to confirm "Link Copied!" or show a destructive toast on failure.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Copy button fill on success state" />
            <TokenRow token="--primary-foreground" value="Check icon color on success state" />
            <TokenRow token="--border" value="Input border, dialog border" />
            <TokenRow token="--background" value="Dialog content background" />
            <TokenRow token="--foreground" value="Dialog title and description text" />
            <TokenRow token="--muted-foreground" value="Description subtitle text" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { useState } from 'react';
import { ShareDialog } from '@/components/ShareDialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

function MyPage() {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShareOpen(true)}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}

// With custom title
<ShareDialog
  open={shareOpen}
  onOpenChange={setShareOpen}
  title="Share this binder"
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dialog semantics:</strong> Built on Radix Dialog which provides <code className="text-primary bg-primary/5 px-1 rounded">role="dialog"</code>, <code className="text-primary bg-primary/5 px-1 rounded">aria-labelledby</code> (title), and <code className="text-primary bg-primary/5 px-1 rounded">aria-describedby</code> (description) automatically.</p>
            <p><strong className="text-foreground">Focus management:</strong> Focus is trapped within the dialog when open. On close, focus returns to the trigger element.</p>
            <p><strong className="text-foreground">Keyboard:</strong> Escape closes the dialog. Tab cycles through the URL input and copy button. Enter or Space activates the copy button.</p>
            <p><strong className="text-foreground">Clipboard fallback:</strong> If the Clipboard API fails (e.g. insecure context), a destructive toast prompts the user to copy manually. The read-only input remains selectable.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderOverview:</strong> Share button in the page header opens the dialog with the binder's public URL.</p>
            <p><strong className="text-foreground">WeekView:</strong> Share button lets readers share a specific week's URL with classmates or friends.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
