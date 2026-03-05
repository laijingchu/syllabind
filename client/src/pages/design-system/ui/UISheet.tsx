import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UISheet() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Sheet</h1>
          <p className="text-lg text-muted-foreground">
            A panel that slides in from an edge of the screen, built on Radix UI Dialog.
            Useful for supplementary content that doesn't require a full page navigation,
            such as forms, filters, or detail views.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Sheet</strong> for side panels that contain forms, navigation menus, or detail views that should overlay the current page without replacing it.</p>
            <p><strong className="text-foreground">Use Dialog</strong> instead when the content is centered and not tied to a screen edge.</p>
            <p><strong className="text-foreground">Use Drawer</strong> instead on mobile for bottom-sliding panels with swipe-to-dismiss behavior.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 flex items-center justify-center min-h-[120px]">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit Profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you're done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" defaultValue="Jane Smith" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">Username</Label>
                    <Input id="username" defaultValue="@janesmith" className="col-span-3" />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button>Save changes</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-base text-muted-foreground">
            Default side is <code className="text-primary bg-primary/5 px-1 rounded">right</code>. The sheet slides in with animation and includes a dark overlay behind it. A close button (X) is automatically rendered in the top-right corner.
          </p>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">Sheet content rendered directly on the page for visual reference.</p>
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground">Right sheet with form</p>
            <div className="border border-l-2 border-border rounded-lg bg-background p-6 max-w-sm space-y-4 shadow-lg relative">
              <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span className="sr-only">Close</span>
              </button>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Edit Profile</h3>
                <p className="text-base text-muted-foreground">Make changes to your profile here. Click save when you're done.</p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Name</Label>
                  <Input defaultValue="Jane Smith" className="col-span-3" readOnly />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Username</Label>
                  <Input defaultValue="@janesmith" className="col-span-3" readOnly />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">Right</Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Right Sheet</SheetTitle>
                      <SheetDescription>Slides in from the right edge.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
                <p className="text-sm text-muted-foreground">side="right"</p>
              </div>
              <div className="space-y-2 text-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">Left</Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Left Sheet</SheetTitle>
                      <SheetDescription>Slides in from the left edge.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
                <p className="text-sm text-muted-foreground">side="left"</p>
              </div>
              <div className="space-y-2 text-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">Top</Button>
                  </SheetTrigger>
                  <SheetContent side="top">
                    <SheetHeader>
                      <SheetTitle>Top Sheet</SheetTitle>
                      <SheetDescription>Slides down from the top edge.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
                <p className="text-sm text-muted-foreground">side="top"</p>
              </div>
              <div className="space-y-2 text-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">Bottom</Button>
                  </SheetTrigger>
                  <SheetContent side="bottom">
                    <SheetHeader>
                      <SheetTitle>Bottom Sheet</SheetTitle>
                      <SheetDescription>Slides up from the bottom edge.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
                <p className="text-sm text-muted-foreground">side="bottom"</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The <code className="text-primary bg-primary/5 px-1 rounded">side</code> prop controls the edge the sheet slides from. Left and right sheets are constrained to <code className="text-primary bg-primary/5 px-1 rounded">w-3/4 sm:max-w-sm</code>. Top and bottom sheets span the full width.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--background" value="Sheet panel background" />
            <TokenRow token="--foreground" value="Text color inside the sheet" />
            <TokenRow token="--border" value="Border on the sheet edge facing the page" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Sheet, SheetTrigger, SheetContent,
  SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetClose,
} from '@/components/ui/sheet';

// Basic usage (slides from right by default)
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Supporting text.</SheetDescription>
    </SheetHeader>
    <div className="py-4">Content here</div>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="outline">Cancel</Button>
      </SheetClose>
      <Button>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>

// Slide from a different edge
<SheetContent side="left">...</SheetContent>
<SheetContent side="top">...</SheetContent>
<SheetContent side="bottom">...</SheetContent>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Opens on Enter or Space when trigger is focused. Closes on Escape.</p>
            <p><strong className="text-foreground">Focus trap:</strong> Focus is trapped inside the sheet while open, preventing interaction with the page behind it.</p>
            <p><strong className="text-foreground">Close button:</strong> An X button with <code className="text-primary bg-primary/5 px-1 rounded">sr-only</code> "Close" label is automatically included.</p>
            <p><strong className="text-foreground">ARIA:</strong> Built on Radix Dialog, so it sets <code className="text-primary bg-primary/5 px-1 rounded">role="dialog"</code>, <code className="text-primary bg-primary/5 px-1 rounded">aria-modal="true"</code>, and links title/description via <code className="text-primary bg-primary/5 px-1 rounded">aria-labelledby</code> / <code className="text-primary bg-primary/5 px-1 rounded">aria-describedby</code>.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Mobile navigation:</strong> The main nav menu slides in from the left on small screens.</p>
            <p><strong className="text-foreground">Filters panel:</strong> Catalog filter options in a right-side sheet on mobile viewports.</p>
            <p><strong className="text-foreground">Detail views on mobile:</strong> Binder or step details shown in a slide-over panel instead of navigating to a new page.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}