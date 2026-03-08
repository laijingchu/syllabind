import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export default function UIToast() {
  const { toast } = useToast();

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Toast</h1>
          <p className="text-lg text-muted-foreground">
            A non-blocking notification that appears temporarily at the bottom-right of the viewport.
            Built on Radix UI Toast primitives with slide-in/out animations and swipe-to-dismiss.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Toast</strong> for transient success confirmations, error feedback, or undo prompts that don't require the user to take action before continuing.</p>
            <p><strong className="text-foreground">Use Alert or Dialog</strong> instead when the message is critical and the user must acknowledge it before proceeding.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={() =>
                  toast({
                    title: 'Binder published',
                    description: 'Your binder is now visible in the catalog.',
                  })
                }
              >
                Default Toast
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  toast({
                    title: 'Failed to save',
                    description: 'Could not reach the server. Please try again.',
                    variant: 'destructive',
                  })
                }
              >
                Destructive Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast({
                    title: 'Step removed',
                    description: 'The step has been deleted.',
                    action: <ToastAction altText="Undo">Undo</ToastAction>,
                  })
                }
              >
                Toast with Action
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Click the buttons above to trigger live toasts.</p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Default:</strong> White/dark background with standard border. Used for success and informational messages.</p>
            <p><strong className="text-foreground">Destructive:</strong> Red background with foreground-inverted text. Used for errors and failure states.</p>
            <p><strong className="text-foreground">With action:</strong> Includes an inline action button (e.g., "Undo") rendered to the right of the message.</p>
            <p><strong className="text-foreground">Dismissed:</strong> Fades out and slides to the right on close. Swipe-to-dismiss is supported on touch devices.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--background" value="Toast surface color (default variant)" />
            <TokenRow token="--foreground" value="Toast text color (default variant)" />
            <TokenRow token="--destructive" value="Background for destructive variant" />
            <TokenRow token="--foreground-inverted" value="Text color for destructive variant" />
            <TokenRow token="--border" value="Toast border color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

function MyComponent() {
  const { toast } = useToast();

  // Simple success toast
  toast({
    title: 'Enrolled successfully',
    description: 'You are now enrolled in this binder.',
  });

  // Destructive error toast
  toast({
    title: 'Save failed',
    description: 'Could not save your changes.',
    variant: 'destructive',
  });

  // Toast with undo action
  toast({
    title: 'Step deleted',
    description: 'The step was removed from this week.',
    action: <ToastAction altText="Undo">Undo</ToastAction>,
  });
}

// The <Toaster /> component must be rendered once in your
// app root (already included in Layout.tsx).`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">ARIA role:</strong> Toasts use <code className="text-primary bg-muted px-1 rounded">role="status"</code> and <code className="text-primary bg-muted px-1 rounded">aria-live="polite"</code> so screen readers announce them without interrupting the current task.</p>
            <p><strong className="text-foreground">Keyboard:</strong> The close button is focusable and activates on Enter or Space. Action buttons are also keyboard-accessible.</p>
            <p><strong className="text-foreground">Swipe to dismiss:</strong> Radix handles swipe gestures on touch devices, allowing users to dismiss by swiping right.</p>
            <p><strong className="text-foreground">Auto-dismiss:</strong> Toasts remain visible until manually closed (long timeout), ensuring users have time to read the message.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">RichTextEditor:</strong> "Writing improved" success toast after AI text enhancement; destructive toast on failure.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Save confirmation and publish success toasts.</p>
            <p><strong className="text-foreground">Enrollment:</strong> Success confirmation when a reader enrolls in a binder.</p>
            <p><strong className="text-foreground">Error feedback:</strong> Destructive toasts for network errors, validation failures, and insufficient credits.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
