import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export default function UIDrawer() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Drawer</h1>
          <p className="text-lg text-muted-foreground">
            A mobile-friendly bottom sheet powered by Vaul. Supports swipe-to-dismiss gestures
            and scales the background content for a native app-like feel.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Drawer</strong> for mobile-first bottom panels such as action sheets, confirmation prompts, or compact forms that benefit from swipe-to-dismiss.</p>
            <p><strong className="text-foreground">Use Sheet</strong> instead when you need a side panel (left/right) or when the content is more complex and needs a full sidebar layout.</p>
            <p><strong className="text-foreground">Use Dialog</strong> instead on desktop when a centered modal is more appropriate.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 flex items-center justify-center min-h-[120px]">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Confirm Action</DrawerTitle>
                  <DrawerDescription>
                    Are you sure you want to mark this binder as complete? This will update your progress.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Confirm</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <p className="text-base text-muted-foreground">
            The drawer slides up from the bottom with a drag handle at the top. Swipe down to dismiss. The background content scales down slightly when <code className="text-primary bg-primary/5 px-1 rounded">shouldScaleBackground</code> is true (the default).
          </p>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">Drawer content rendered directly on the page for visual reference.</p>
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Confirmation drawer</p>
              <div className="border border-border rounded-t-lg bg-background max-w-md shadow-lg">
                <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                <div className="p-4 pb-0 text-center space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Confirm Action</h3>
                  <p className="text-base text-muted-foreground">Are you sure you want to mark this binder as complete? This will update your progress.</p>
                </div>
                <div className="p-4 space-y-2">
                  <Button className="w-full">Confirm</Button>
                  <Button variant="outline" className="w-full">Cancel</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Action sheet drawer</p>
              <div className="border border-border rounded-t-lg bg-background max-w-md shadow-lg">
                <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                <div className="p-4 pb-0 text-center space-y-1.5">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">Choose an Option</h3>
                  <p className="text-base text-muted-foreground">Select one of the actions below.</p>
                </div>
                <div className="px-4 py-2 space-y-2">
                  <Button variant="ghost" className="w-full justify-start">Share binder</Button>
                  <Button variant="ghost" className="w-full justify-start">Duplicate binder</Button>
                  <Button variant="ghost" className="w-full justify-start text-destructive">Delete binder</Button>
                </div>
                <div className="p-4 pt-2">
                  <Button variant="outline" className="w-full">Cancel</Button>
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
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">Basic</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Basic Drawer</DrawerTitle>
                      <DrawerDescription>A simple drawer with just a header.</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <p className="text-sm text-muted-foreground">Header only</p>
              </div>
              <div className="space-y-2 text-center">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">With Content</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Choose an Option</DrawerTitle>
                      <DrawerDescription>Select one of the actions below.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-2 space-y-2">
                      <Button variant="ghost" className="w-full justify-start">Share binder</Button>
                      <Button variant="ghost" className="w-full justify-start">Duplicate binder</Button>
                      <Button variant="ghost" className="w-full justify-start text-destructive">Delete binder</Button>
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <p className="text-sm text-muted-foreground">Action sheet</p>
              </div>
              <div className="space-y-2 text-center">
                <Drawer shouldScaleBackground={false}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">No Scale</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>No Background Scale</DrawerTitle>
                      <DrawerDescription>The background stays at full size.</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <p className="text-sm text-muted-foreground">shouldScaleBackground=false</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The drag handle (a muted rounded bar) is always rendered at the top of the drawer content. Height is determined by content — the drawer grows to fit but won't exceed the viewport.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--background" value="Drawer panel background" />
            <TokenRow token="--foreground" value="Text color inside the drawer" />
            <TokenRow token="--border" value="Top border of the drawer panel" />
            <TokenRow token="--muted" value="Color of the drag handle indicator" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Drawer, DrawerTrigger, DrawerContent,
  DrawerHeader, DrawerTitle, DrawerDescription,
  DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';

// Basic bottom drawer
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Open</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Title</DrawerTitle>
      <DrawerDescription>Description text.</DrawerDescription>
    </DrawerHeader>
    <div className="px-4">Custom content here</div>
    <DrawerFooter>
      <Button>Confirm</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>

// Disable background scaling
<Drawer shouldScaleBackground={false}>
  ...
</Drawer>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Opens on Enter or Space. Closes on Escape.</p>
            <p><strong className="text-foreground">Focus trap:</strong> Focus is contained within the drawer while open.</p>
            <p><strong className="text-foreground">Touch gestures:</strong> Swipe down on the drawer or drag handle to dismiss. Built into Vaul by default.</p>
            <p><strong className="text-foreground">ARIA:</strong> Uses <code className="text-primary bg-primary/5 px-1 rounded">role="dialog"</code> with proper labelling from DrawerTitle and DrawerDescription.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Mobile action sheets:</strong> Context menus for binder actions (share, duplicate, delete) on touch devices.</p>
            <p><strong className="text-foreground">Confirmation prompts on mobile:</strong> "Mark as complete" or "Unenroll" confirmations that feel native on phones.</p>
            <p><strong className="text-foreground">Quick forms:</strong> Short input forms like adding a note or leaving feedback, presented as a bottom drawer on mobile.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}