import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useState } from 'react';

export default function UIRichTextEditor() {
  const [value, setValue] = useState('<p>Select some text to see the bubble menu with <strong>bold</strong>, <em>italic</em>, list, and link options.</p>');
  const [emptyValue, setEmptyValue] = useState('');

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Rich Text Editor</h1>
          <p className="text-muted-foreground">
            A TipTap/ProseMirror-based WYSIWYG editor with a floating bubble menu for inline
            formatting. Supports bold, italic, bullet lists, and links. Includes an optional
            AI-powered "Improve writing" feature.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use RichTextEditor</strong> when curators need to author formatted content -- step descriptions, binder descriptions, or exercise instructions that benefit from bold, lists, and links.</p>
            <p><strong className="text-foreground">Use Textarea</strong> instead for plain-text inputs like titles, short descriptions, or comments where formatting is unnecessary.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <RichTextEditor
              value={value}
              onChange={setValue}
              placeholder="Start writing..."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Select text to reveal the bubble menu. The editor outputs HTML via the <code className="text-primary bg-primary/5 px-1 rounded">onChange</code> callback.
          </p>
        </section>

        {/* With Placeholder */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Placeholder</h2>
          <div className="border border-border rounded-lg p-6">
            <RichTextEditor
              value={emptyValue}
              onChange={setEmptyValue}
              placeholder="Describe what readers will learn this week..."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            The <code className="text-primary bg-primary/5 px-1 rounded">placeholder</code> prop displays hint text when the editor is empty. Defaults to "Start writing..." if not provided.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Empty:</strong> Shows placeholder text. The "Improve writing" button is hidden.</p>
            <p><strong className="text-foreground">Editing:</strong> Content is editable. Selecting text reveals the floating bubble menu with bold, italic, list, and link controls.</p>
            <p><strong className="text-foreground">Bubble menu:</strong> Dark toolbar appears above selected text with toggle buttons. Active formats are highlighted with a lighter background.</p>
            <p><strong className="text-foreground">Saving:</strong> Optional save indicator appears on hover/focus via <code className="text-primary bg-primary/5 px-1 rounded">isSaving</code> and <code className="text-primary bg-primary/5 px-1 rounded">lastSaved</code> props.</p>
            <p><strong className="text-foreground">Improving:</strong> When "Improve writing" is clicked, a spinner replaces the sparkle icon while the AI request is in progress.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--input" value="Bottom border color (underline style)" />
            <TokenRow token="--primary" value="Focus border color and link text color" />
            <TokenRow token="--muted-foreground" value="Placeholder text and action button text" />
            <TokenRow token="--foreground" value="Editor content text color" />
            <TokenRow token="font-display" value="Editor content uses the display font family" />
          </div>
          <p className="text-sm text-muted-foreground">
            The bubble menu uses hardcoded zinc colors (<code className="text-primary bg-primary/5 px-1 rounded">bg-zinc-900</code>, <code className="text-primary bg-primary/5 px-1 rounded">text-zinc-50</code>) for a dark toolbar regardless of theme.
          </p>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { RichTextEditor } from '@/components/ui/rich-text-editor';

// Basic usage
const [content, setContent] = useState('');

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Describe this step..."
/>

// With save status indicator
<RichTextEditor
  value={content}
  onChange={setContent}
  isSaving={isSaving}
  lastSaved={lastSavedDate}
/>

// With AI improve callback
<RichTextEditor
  value={content}
  onChange={setContent}
  onCreditUsed={() => refetchCredits()}
/>

// Props:
// value: string          - HTML content
// onChange: (html) => void
// placeholder?: string   - Empty state hint text
// className?: string     - Additional editor classes
// isSaving?: boolean     - Show saving indicator
// lastSaved?: Date|null  - Show "Saved at..." timestamp
// onCreditUsed?: () => void - Callback after AI improve`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Standard text editing shortcuts work (Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic). Tab moves focus out of the editor.</p>
            <p><strong className="text-foreground">Bubble menu:</strong> Toolbar buttons are keyboard-accessible but the menu itself is triggered by text selection, which requires mouse or touch interaction.</p>
            <p><strong className="text-foreground">Screen readers:</strong> ProseMirror's contenteditable region is announced as an editable text field. Formatted content uses semantic HTML (strong, em, ul/li, a).</p>
            <p><strong className="text-foreground">Link dialog:</strong> Uses a native <code className="text-primary bg-primary/5 px-1 rounded">window.prompt()</code> for URL input, which is accessible but not styled.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Primary use -- curators write step content (readings and exercise instructions) using the rich text editor with save status and AI improve.</p>
            <p><strong className="text-foreground">Binder descriptions:</strong> Curators can format binder-level descriptions with bold, links, and lists.</p>
            <p><strong className="text-foreground">Submissions:</strong> Could be extended for reader exercise submissions requiring formatted responses.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
