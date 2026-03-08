import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function UIAlertDialog() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Alert Dialog</h1>
          <p className="text-lg text-muted-foreground">
            A modal confirmation dialog for destructive or irreversible actions. Unlike Dialog,
            it cannot be dismissed by clicking the overlay or pressing Escape — the user must
            explicitly choose Cancel or the confirm action.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use AlertDialog</strong> for destructive actions like deleting a binder, removing an account, or any operation that cannot be undone. The user must make an explicit choice.</p>
            <p><strong className="text-foreground">Use Dialog</strong> instead for non-destructive interactions like editing a profile or viewing information, where dismissing via overlay click is acceptable.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Destructive confirmation</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Binder</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your binder
                      "Digital Minimalism" and remove all associated weeks, steps, and reader
                      enrollments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-danger-inverted text-foreground-inverted hover:bg-danger-inverted/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Non-destructive confirmation</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary">Unpublish Binder</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unpublish this binder?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the binder from the public catalog. Existing readers will
                      retain access, but no new enrollments will be accepted until you publish again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Unpublish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">Alert dialog content rendered directly on the page for visual reference.</p>
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Destructive confirmation</p>
              <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Are you absolutely sure?</h3>
                  <p className="text-base text-muted-foreground">
                    This action cannot be undone. This will permanently delete your binder
                    "Digital Minimalism" and remove all associated weeks, steps, and reader
                    enrollments.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button variant="secondary">Cancel</Button>
                  <Button className="bg-danger-inverted text-foreground-inverted hover:bg-danger-inverted/90">Delete</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Non-destructive confirmation</p>
              <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Unpublish this binder?</h3>
                  <p className="text-base text-muted-foreground">
                    This will remove the binder from the public catalog. Existing readers will
                    retain access, but no new enrollments will be accepted until you publish again.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button variant="secondary">Cancel</Button>
                  <Button>Unpublish</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 text-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Destructive</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete account?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete your account and all data.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-danger-inverted text-foreground-inverted hover:bg-danger-inverted/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground">Destructive action</p>
              </div>
              <div className="space-y-2 text-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" size="sm">Confirm</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm action</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to proceed?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground">Standard confirm</p>
              </div>
              <div className="space-y-2 text-center">
                <Button variant="secondary" size="sm" disabled>Disabled trigger</Button>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Open</strong> — Overlay fades in with <code className="text-primary bg-muted px-1 rounded">bg-black/80</code>. Content animates with zoom and slide from bottom.</p>
            <p><strong className="text-foreground">No dismiss on overlay:</strong> Unlike Dialog, clicking the overlay does not close AlertDialog. The user must use Cancel or the action button.</p>
            <p><strong className="text-foreground">Action button:</strong> Uses <code className="text-primary bg-muted px-1 rounded">buttonVariants()</code> by default. Override with destructive styling for delete actions.</p>
            <p><strong className="text-foreground">Cancel button:</strong> Uses <code className="text-primary bg-muted px-1 rounded">buttonVariants({'{'} variant: "secondary" {'}'})</code> styling.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--background" value="Alert dialog panel background color" />
            <TokenRow token="--foreground" value="Title and default text color" />
            <TokenRow token="--muted-foreground" value="Description text color" />
            <TokenRow token="--destructive" value="Destructive action button fill color" />
            <TokenRow token="--foreground-inverted" value="Text on destructive buttons" />
            <TokenRow token="--border" value="Border color for the dialog panel" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Destructive confirmation
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Binder</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently
        delete your binder and all associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-danger-inverted text-foreground-inverted
                   hover:bg-danger-inverted/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// Controlled alert dialog
const [open, setOpen] = useState(false);

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button>Confirm</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm action</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to proceed?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>
        Continue
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Focus trap:</strong> Focus is constrained to the alert dialog. Tab cycles between Cancel and Action buttons.</p>
            <p><strong className="text-foreground">Keyboard:</strong> Escape does not close the dialog (unlike Dialog). The user must press Cancel or the action button.</p>
            <p><strong className="text-foreground">ARIA:</strong> Radix applies <code className="text-primary bg-muted px-1 rounded">role="alertdialog"</code>, <code className="text-primary bg-muted px-1 rounded">aria-labelledby</code>, and <code className="text-primary bg-muted px-1 rounded">aria-describedby</code> automatically.</p>
            <p><strong className="text-foreground">Initial focus:</strong> Focus defaults to the Cancel button to prevent accidental destructive actions.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Confirm deleting a binder, removing a week, or discarding unsaved changes.</p>
            <p><strong className="text-foreground">Settings:</strong> Confirm account deletion or resetting profile data.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Confirm archiving or unpublishing a binder.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}