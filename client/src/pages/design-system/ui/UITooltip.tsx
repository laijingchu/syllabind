import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Info, Settings, Trash2, Copy } from 'lucide-react';

export default function UITooltip() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Tooltip</h1>
          <p className="text-muted-foreground">
            A small overlay that displays additional context when hovering or focusing a trigger element.
            Built on Radix UI Tooltip with animated entry/exit and directional awareness.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Tooltip</strong> to label icon-only buttons, explain truncated text, or surface keyboard shortcuts. Tooltips are supplemental and should never contain essential information.</p>
            <p><strong className="text-foreground">Use a Popover</strong> instead when the overlay needs interactive content like links, buttons, or forms.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <TooltipProvider>
              <div className="flex flex-wrap gap-4 items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon"><Info className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More information</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete binder</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Hover or focus any icon button above to see the tooltip. The <code className="text-primary bg-primary/5 px-1 rounded">sideOffset</code> prop controls the gap between trigger and tooltip (default 4px).
          </p>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-sm text-muted-foreground">Tooltip rendered directly on the page for visual reference.</p>
          <div className="border border-border rounded-lg p-6 flex items-center justify-center min-h-[100px]">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                More information
              </div>
              <svg className="text-primary -mt-1" width="10" height="5" viewBox="0 0 10 5"><polygon fill="currentColor" points="0,0 10,0 5,5" /></svg>
              <Button variant="outline" size="icon"><Info className="h-4 w-4" /></Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The tooltip uses <code className="text-primary bg-primary/5 px-1 rounded">--primary</code> as background and <code className="text-primary bg-primary/5 px-1 rounded">--primary-foreground</code> as text color. The arrow points toward the trigger element.
          </p>
        </section>

        {/* Placement */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Placement</h2>
          <div className="border border-border rounded-lg p-6">
            <TooltipProvider>
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Top (default)</Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Top tooltip</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Bottom</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Bottom tooltip</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Left</Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Left tooltip</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Right</Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Right tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the <code className="text-primary bg-primary/5 px-1 rounded">side</code> prop to control placement. The tooltip will automatically flip if there is not enough room.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <TooltipProvider>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon"><Info className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Hover me</p></TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">Closed (default)</p>
                </div>
                <div className="space-y-2 text-center">
                  <Tooltip defaultOpen>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon"><Info className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Visible</p></TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div className="space-y-2 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" disabled><Info className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Disabled trigger</p></TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">Disabled trigger</p>
                </div>
              </div>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Tooltips animate in with <code className="text-primary bg-primary/5 px-1 rounded">fade-in</code> and <code className="text-primary bg-primary/5 px-1 rounded">zoom-in-95</code>, and slide from the opposite side of their placement.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Tooltip background color" />
            <TokenRow token="--primary-foreground" value="Tooltip text color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Tooltip, TooltipTrigger,
  TooltipContent, TooltipProvider
} from '@/components/ui/tooltip';

// Wrap your app or section in TooltipProvider
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>More information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// Custom offset and placement
<TooltipContent side="bottom" sideOffset={8}>
  <p>Below the trigger</p>
</TooltipContent>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Tooltip opens on focus and closes on blur. No additional keyboard interaction needed.</p>
            <p><strong className="text-foreground">Screen readers:</strong> The tooltip content is associated with the trigger via <code className="text-primary bg-primary/5 px-1 rounded">aria-describedby</code>, automatically managed by Radix.</p>
            <p><strong className="text-foreground">Timing:</strong> TooltipProvider accepts a <code className="text-primary bg-primary/5 px-1 rounded">delayDuration</code> prop (default 700ms) to prevent accidental triggers.</p>
            <p><strong className="text-foreground">Escape:</strong> Pressing Escape dismisses an open tooltip.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Icon buttons:</strong> Labeling icon-only actions like "Settings", "Delete", "Copy link" across the app.</p>
            <p><strong className="text-foreground">Truncated text:</strong> Showing full binder titles or curator names when text is clipped with ellipsis.</p>
            <p><strong className="text-foreground">Keyboard shortcuts:</strong> Displaying shortcut hints alongside toolbar actions in the Binder Editor.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
