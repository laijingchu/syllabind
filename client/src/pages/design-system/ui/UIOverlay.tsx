import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';

export default function UIOverlay() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Overlay</h1>
          <p className="text-lg text-muted-foreground">
            A full-screen dark backdrop that sits behind modals, sheets, drawers, and alert dialogs.
            Defined once as a shared primitive and consumed by all overlay components for visual
            consistency.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Used automatically</strong> by Dialog, AlertDialog, Sheet, and Drawer — you do not render it manually in most cases.</p>
            <p><strong className="text-foreground">Use the standalone Overlay</strong> component when you need a backdrop outside of Radix primitives (e.g., a custom lightbox or full-screen loading state).</p>
          </div>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-base text-muted-foreground">The overlay rendered in a contained box for visual reference. In production it covers the full viewport.</p>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">bg-black/80 (default)</p>
              <div className="relative rounded-lg overflow-hidden h-40 border border-border">
                <div className="absolute inset-0 p-4 text-base text-muted-foreground">
                  <p>Page content behind the overlay</p>
                  <p className="mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
                </div>
                <div className="absolute inset-0 bg-black/80 rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background border border-border rounded-lg p-6 shadow-lg max-w-xs text-center space-y-2">
                    <p className="font-semibold text-sm">Dialog content</p>
                    <p className="text-sm text-muted-foreground">The overlay dims the background to focus attention here.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Opacity comparison</p>
              <div className="grid grid-cols-3 gap-3">
                {[60, 80, 90].map(opacity => (
                  <div key={opacity} className="space-y-1">
                    <div className="relative rounded-lg overflow-hidden h-24 border border-border">
                      <div className="absolute inset-0 p-2 text-sm text-muted-foreground">
                        <p>Background text</p>
                      </div>
                      <div className={`absolute inset-0 bg-black/${opacity}`} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">bg-black/{opacity}</p>
                  </div>
                ))}
              </div>
              <p className="text-base text-muted-foreground">
                Syllabind uses <code className="text-primary bg-primary/5 px-1 rounded">bg-black/80</code> as the standard. This provides enough contrast to focus attention on the overlay content while keeping the page context partially visible.
              </p>
            </div>
          </div>
        </section>

        {/* Variants */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Variants</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Export</th>
                  <th className="text-left p-3 font-medium">Animation</th>
                  <th className="text-left p-3 font-medium">Used by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">OVERLAY_ANIMATED</td>
                  <td className="p-3 text-muted-foreground">Fade in/out on <code className="text-primary bg-primary/5 px-1 rounded">data-[state]</code></td>
                  <td className="p-3 text-muted-foreground">Dialog, AlertDialog, Sheet</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">OVERLAY_BASE</td>
                  <td className="p-3 text-muted-foreground">None (Vaul handles animation)</td>
                  <td className="p-3 text-muted-foreground">Drawer</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">Overlay</td>
                  <td className="p-3 text-muted-foreground">Animated by default, configurable via <code className="text-primary bg-primary/5 px-1 rounded">animated</code> prop</td>
                  <td className="p-3 text-muted-foreground">Standalone use</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Consumers */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Consumers</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dialog</strong> — imports <code className="text-primary bg-primary/5 px-1 rounded">OVERLAY_ANIMATED</code>, applies to <code className="text-primary bg-primary/5 px-1 rounded">DialogPrimitive.Overlay</code>.</p>
            <p><strong className="text-foreground">AlertDialog</strong> — imports <code className="text-primary bg-primary/5 px-1 rounded">OVERLAY_ANIMATED</code>, applies to <code className="text-primary bg-primary/5 px-1 rounded">AlertDialogPrimitive.Overlay</code>.</p>
            <p><strong className="text-foreground">Sheet</strong> — imports <code className="text-primary bg-primary/5 px-1 rounded">OVERLAY_ANIMATED</code>, applies to <code className="text-primary bg-primary/5 px-1 rounded">SheetPrimitive.Overlay</code>.</p>
            <p><strong className="text-foreground">Drawer</strong> — imports <code className="text-primary bg-primary/5 px-1 rounded">OVERLAY_BASE</code> (Vaul manages its own animation), applies to <code className="text-primary bg-primary/5 px-1 rounded">DrawerPrimitive.Overlay</code>.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="bg-black/80" value="Overlay background — black at 80% opacity" />
            <TokenRow token="z-50" value="Stacking order — same layer as the overlay content" />
            <TokenRow token="fade-in-0 / fade-out-0" value="Entry/exit animation (animated variant only)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`// overlay.tsx exports:
import { OVERLAY_BASE, OVERLAY_ANIMATED, Overlay } from '@/components/ui/overlay';

// OVERLAY_BASE — class string without animations
// "fixed inset-0 z-50 bg-black/80"

// OVERLAY_ANIMATED — class string with Radix data-state animations
// "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in ..."

// How Dialog, AlertDialog, and Sheet consume it:
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(OVERLAY_ANIMATED, className)}
    {...props}
  />
));

// How Drawer consumes it (Vaul handles animation):
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(OVERLAY_BASE, className)}
    {...props}
  />
));

// Standalone usage (no Radix primitive needed):
<Overlay onClick={handleClose} />
<Overlay animated={false} /> // No animation`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Click to dismiss:</strong> Dialog and Sheet close when the overlay is clicked. AlertDialog intentionally does not — the user must choose an explicit action.</p>
            <p><strong className="text-foreground">Scroll lock:</strong> Radix automatically prevents body scroll while an overlay is visible.</p>
            <p><strong className="text-foreground">Contrast:</strong> The 80% opacity ensures the foreground content meets WCAG contrast requirements against the dimmed background.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
