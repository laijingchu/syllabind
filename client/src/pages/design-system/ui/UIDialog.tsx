import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UIDialog() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Dialog</h1>
          <p className="text-lg text-muted-foreground">
            A modal overlay that focuses the user's attention on a single task or piece of content.
            Built on Radix UI, it traps focus, blocks background interaction, and supports
            accessible close via the X button, Escape key, or overlay click.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Dialog</strong> for collecting input, showing details, or confirming non-destructive actions that require the user's full attention before proceeding.</p>
            <p><strong className="text-foreground">Use AlertDialog</strong> instead for destructive or irreversible confirmations where the user must explicitly choose an action (no dismiss via overlay click).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Basic dialog with form</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" defaultValue="Jane Smith" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">Username</Label>
                      <Input id="username" defaultValue="janesmith" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Simple informational dialog</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Details</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Binder published</DialogTitle>
                    <DialogDescription>
                      Your binder "Digital Minimalism" has been published and is now visible in the catalog. Readers can enroll immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Got it</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">Dialog content rendered directly on the page for visual reference.</p>
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Dialog with form</p>
              <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg relative">
                <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </button>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Edit profile</h3>
                  <p className="text-base text-muted-foreground">Make changes to your profile here. Click save when you're done.</p>
                </div>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input defaultValue="Jane Smith" className="col-span-3" readOnly />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Username</Label>
                    <Input defaultValue="janesmith" className="col-span-3" readOnly />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save changes</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Informational dialog</p>
              <div className="border border-border rounded-lg bg-background p-6 max-w-md space-y-4 shadow-lg relative">
                <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </button>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Binder published</h3>
                  <p className="text-base text-muted-foreground">Your binder "Digital Minimalism" has been published and is now visible in the catalog. Readers can enroll immediately.</p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button>Got it</Button>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Open</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Open state</DialogTitle>
                      <DialogDescription>This dialog is in its open state with the overlay visible behind it.</DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
              <div className="space-y-2 text-center">
                <Button variant="outline" size="sm" disabled>Trigger disabled</Button>
                <p className="text-sm text-muted-foreground">Disabled trigger</p>
              </div>
              <div className="space-y-2 text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">With footer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm action</DialogTitle>
                      <DialogDescription>Are you sure you want to proceed?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-muted-foreground">With footer</p>
              </div>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Open</strong> — Content animates in with fade and zoom. Overlay fades in with <code className="text-primary bg-primary/5 px-1 rounded">bg-black/80</code>.</p>
            <p><strong className="text-foreground">Closing</strong> — Reverse animation with slide-out-to-bottom and fade-out.</p>
            <p><strong className="text-foreground">Close button</strong> — X icon in top-right corner, always present via <code className="text-primary bg-primary/5 px-1 rounded">DialogContent</code>.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--background" value="Dialog panel background color" />
            <TokenRow token="--foreground" value="Default text color inside the dialog" />
            <TokenRow token="--border" value="Border color for the dialog panel" />
            <TokenRow token="--muted-foreground" value="Description and secondary text color" />
            <TokenRow token="--ring" value="Focus ring color for close button and interactive elements" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Basic dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        A description of what this dialog is for.
      </DialogDescription>
    </DialogHeader>
    {/* Dialog body content */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled dialog
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
      <DialogDescription>
        Use open and onOpenChange for programmatic control.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Focus trap:</strong> Focus is constrained to the dialog while open. Tab cycles through interactive elements.</p>
            <p><strong className="text-foreground">Keyboard:</strong> Escape closes the dialog. Enter/Space activates buttons.</p>
            <p><strong className="text-foreground">ARIA:</strong> Radix applies <code className="text-primary bg-primary/5 px-1 rounded">role="dialog"</code>, <code className="text-primary bg-primary/5 px-1 rounded">aria-labelledby</code> (from DialogTitle), and <code className="text-primary bg-primary/5 px-1 rounded">aria-describedby</code> (from DialogDescription) automatically.</p>
            <p><strong className="text-foreground">Close button:</strong> The X button includes a <code className="text-primary bg-primary/5 px-1 rounded">sr-only</code> "Close" label for screen readers.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Confirm publish action, edit binder metadata, and manage week settings.</p>
            <p><strong className="text-foreground">Profile:</strong> Edit profile details such as display name, bio, and social links.</p>
            <p><strong className="text-foreground">Settings:</strong> Confirmation dialogs for non-destructive account changes.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}