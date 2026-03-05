import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, ChevronRight, User, Settings, LogOut, Mail, MessageSquare, PlusCircle } from 'lucide-react';

export default function UIDropdownMenu() {
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showActivityBar, setShowActivityBar] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Dropdown Menu</h1>
          <p className="text-muted-foreground">
            A contextual menu triggered by a button press. Built on Radix UI, it supports items,
            checkbox items, radio groups, sub-menus, labels, separators, and keyboard shortcuts.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use DropdownMenu</strong> when you need to present a list of actions or options that don't need to be visible at all times. Ideal for overflow menus, user account menus, and contextual actions.</p>
            <p><strong className="text-foreground">Use a Select</strong> instead when the user is choosing a single value for a form field.</p>
          </div>
        </section>

        {/* Demo - Basic */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Basic menu with items</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    My Account <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4" />
                    Profile
                    <DropdownMenuShortcut>Shift+P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4" />
                    Settings
                    <DropdownMenuShortcut>Cmd+,</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Mail className="h-4 w-4" />
                      Invite readers
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <PlusCircle className="h-4 w-4" />
                        More...
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="h-4 w-4" />
                    Log out
                    <DropdownMenuShortcut>Cmd+Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

        {/* Inline Preview */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Inline Preview</h2>
          <p className="text-sm text-muted-foreground">The dropdown menu rendered statically for visual reference. Shows items, icons, shortcuts, a sub-menu indicator, and disabled state.</p>
          <div className="border border-border rounded-lg p-6">
            <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <div className="px-2 py-1.5 text-sm font-semibold">My Account</div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm bg-accent text-accent-foreground">
                <User className="h-4 w-4" />
                Profile
                <span className="ml-auto text-xs tracking-widest opacity-60">Shift+P</span>
              </div>
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
                <Settings className="h-4 w-4" />
                Settings
                <span className="ml-auto text-xs tracking-widest opacity-60">Cmd+,</span>
              </div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
                <Mail className="h-4 w-4" />
                Invite readers
                <ChevronRight className="ml-auto h-4 w-4" />
              </div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-50">
                <LogOut className="h-4 w-4" />
                Disabled item
              </div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              {/* Checkbox items */}
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
                Status Bar
              </div>
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">
                Activity Bar
              </div>
            </div>
          </div>
        </section>

        {/* Demo - Checkbox Items */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Checkbox Items</h2>
          <div className="border border-border rounded-lg p-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  View Options <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showStatusBar}
                  onCheckedChange={setShowStatusBar}
                >
                  Status Bar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showActivityBar}
                  onCheckedChange={setShowActivityBar}
                >
                  Activity Bar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showPanel}
                  onCheckedChange={setShowPanel}
                >
                  Panel
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-muted-foreground mt-3">
              Status Bar: {showStatusBar ? 'on' : 'off'}, Activity Bar: {showActivityBar ? 'on' : 'off'}, Panel: {showPanel ? 'on' : 'off'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Checkbox items maintain their own checked state. Use <code className="text-primary bg-primary/5 px-1 rounded">onCheckedChange</code> to update local state.
          </p>
          <div className="border border-border rounded-lg p-6">
            <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <div className="px-2 py-1.5 text-sm font-semibold">Appearance</div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
                Status Bar
              </div>
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm bg-accent text-accent-foreground">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
                Activity Bar
              </div>
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">
                Panel
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  States Demo <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Item States</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Normal item</DropdownMenuItem>
                <DropdownMenuItem disabled>Disabled item</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Checked item</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Unchecked item</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Focus</strong> — Items highlight with <code className="text-primary bg-primary/5 px-1 rounded">bg-accent</code> on hover or keyboard focus.</p>
            <p><strong className="text-foreground">Disabled</strong> — Reduces opacity to 50% and prevents interaction.</p>
            <p><strong className="text-foreground">Checked</strong> — Checkbox and radio items show a check/circle indicator on the left.</p>
          </div>
          <div className="border border-border rounded-lg p-6">
            <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <div className="px-2 py-1.5 text-sm font-semibold">Item States</div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm">Normal item</div>
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm bg-accent text-accent-foreground">Focused item</div>
              <div className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-50">Disabled item</div>
              <div className="-mx-1 my-1 h-px bg-muted" />
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
                Checked item
              </div>
              <div className="relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm">Unchecked item</div>
            </div>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--popover" value="Background color for menu content" />
            <TokenRow token="--popover-foreground" value="Text color inside the menu" />
            <TokenRow token="--accent" value="Highlight color for focused items" />
            <TokenRow token="--accent-foreground" value="Text color for focused items" />
            <TokenRow token="--border" value="Border color for the menu container" />
            <TokenRow token="--muted" value="Separator line color" />
            <TokenRow token="--muted-foreground" value="Shortcut and secondary text color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

// Basic menu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Settings className="h-4 w-4" />
      Settings
      <DropdownMenuShortcut>Cmd+,</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Checkbox items
<DropdownMenuCheckboxItem
  checked={checked}
  onCheckedChange={setChecked}
>
  Toggle option
</DropdownMenuCheckboxItem>

// Sub-menu
<DropdownMenuSub>
  <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>Sub item</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Opens with Enter/Space on trigger. Arrow keys navigate items. Enter selects. Escape closes.</p>
            <p><strong className="text-foreground">Focus management:</strong> Focus is trapped within the menu while open. Focus returns to trigger on close.</p>
            <p><strong className="text-foreground">ARIA:</strong> Radix provides <code className="text-primary bg-primary/5 px-1 rounded">role="menu"</code>, <code className="text-primary bg-primary/5 px-1 rounded">role="menuitem"</code>, and <code className="text-primary bg-primary/5 px-1 rounded">role="menuitemcheckbox"</code> automatically.</p>
            <p><strong className="text-foreground">Sub-menus:</strong> Arrow right opens a sub-menu, arrow left closes it.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Layout header:</strong> User account menu with profile, settings, and logout options.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> "More actions" overflow menu for duplicate, archive, and export.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Per-binder action menus for edit, analytics, and delete.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}