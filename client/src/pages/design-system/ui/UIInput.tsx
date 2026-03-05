import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UIInput() {
  const [value, setValue] = useState('');

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Input</h1>
          <p className="text-muted-foreground">
            A single-line text field with a bottom-border underline style. Uses a display font at xl size,
            designed for prominent form fields like binder titles and search.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Input</strong> for single-line text entry — names, titles, emails, search queries.</p>
            <p><strong className="text-foreground">Use Textarea</strong> for multi-line content like descriptions or long-form text.</p>
            <p><strong className="text-foreground">Use Select</strong> when the user chooses from a predefined set of options.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="demo-title" className="text-sm mb-2 block">Binder Title</Label>
                <Input
                  id="demo-title"
                  placeholder="Enter a title..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="demo-email" className="text-sm mb-2 block">Email</Label>
                <Input id="demo-email" type="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="demo-search" className="text-sm mb-2 block">Search</Label>
                <Input id="demo-search" type="search" placeholder="Search binders..." />
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Default</p>
                <Input placeholder="Placeholder text" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">With value</p>
                <Input defaultValue="Digital Minimalism" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Disabled</p>
                <Input disabled placeholder="Cannot edit" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File input</p>
                <Input type="file" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Focus state changes the bottom border to primary color via <code className="text-primary bg-primary/5 px-1 rounded">focus-visible:border-primary</code>.
            No ring is shown — the underline style uses border-only focus indication.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--input" value="Bottom border color (resting)" />
            <TokenRow token="--primary" value="Bottom border color (focused)" />
            <TokenRow token="--foreground" value="Text color" />
            <TokenRow token="--muted-foreground" value="Placeholder text color" />
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>The Input uses a distinctive <strong className="text-foreground">underline style</strong> rather than a full border box:</p>
            <p>- <code className="text-primary bg-primary/5 px-1 rounded">border-b</code> only (no left/right/top borders)</p>
            <p>- <code className="text-primary bg-primary/5 px-1 rounded">rounded-none</code> to prevent border-radius on the underline</p>
            <p>- <code className="text-primary bg-primary/5 px-1 rounded">text-xl font-display</code> for a prominent, editorial feel</p>
            <p>- <code className="text-primary bg-primary/5 px-1 rounded">bg-transparent</code> to sit flush against any background</p>
            <p>Override these defaults per-instance via className when a standard boxed input is needed.</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Basic
<Input placeholder="Enter title..." />

// With label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// Controlled
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// File input
<Input type="file" />

// Disabled
<Input disabled placeholder="Read-only" />

// Override underline style for boxed input
<Input className="border rounded-md text-sm font-sans" />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Label association:</strong> Always pair with a <code className="text-primary bg-primary/5 px-1 rounded">&lt;Label&gt;</code> using matching <code className="text-primary bg-primary/5 px-1 rounded">htmlFor</code>/<code className="text-primary bg-primary/5 px-1 rounded">id</code> attributes.</p>
            <p><strong className="text-foreground">Focus:</strong> Visible bottom-border color change on focus-visible. No ring to avoid doubling the underline visual.</p>
            <p><strong className="text-foreground">Disabled:</strong> Applies <code className="text-primary bg-primary/5 px-1 rounded">disabled:cursor-not-allowed</code> and <code className="text-primary bg-primary/5 px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">Type support:</strong> Accepts all native input types (text, email, password, search, file, etc.).</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Binder title input (large, underline style).</p>
            <p><strong className="text-foreground">Login/Register:</strong> Email and password fields.</p>
            <p><strong className="text-foreground">Profile:</strong> Name, bio, and social link inputs.</p>
            <p><strong className="text-foreground">Catalog search:</strong> Search binders input with SearchBar section component.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
