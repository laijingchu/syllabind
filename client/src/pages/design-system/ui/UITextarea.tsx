import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Textarea } from '@/components/ui/textarea';

export default function UITextarea() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Textarea</h1>
          <p className="text-lg text-muted-foreground">
            A multi-line text input with an underline border-bottom style matching the Input component.
            Uses the display font at xl size for a clean, editorial feel.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Textarea</strong> for multi-line content entry: descriptions, bios, long-form responses, and exercise submissions.</p>
            <p><strong className="text-foreground">Use Input</strong> instead for single-line values like names, emails, or titles.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">With placeholder</p>
              <Textarea placeholder="Describe your binder..." />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">With value</p>
              <Textarea defaultValue="A 4-week deep dive into digital minimalism, exploring how to build a more intentional relationship with technology." />
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Textarea placeholder="Default state" />
                <p className="text-sm text-muted-foreground">Default</p>
              </div>
              <div className="space-y-2">
                <Textarea placeholder="Click to focus" />
                <p className="text-sm text-muted-foreground">Focus (click to see)</p>
              </div>
              <div className="space-y-2">
                <Textarea defaultValue="Some existing content" />
                <p className="text-sm text-muted-foreground">With value</p>
              </div>
              <div className="space-y-2">
                <Textarea disabled placeholder="Cannot edit" />
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The underline style uses <code className="text-primary bg-muted px-1 rounded">border-b border-input</code> at rest and transitions to <code className="text-primary bg-muted px-1 rounded">focus-visible:border-primary</code> on focus. No box shadow or ring is applied. Disabled state reduces opacity to 50%.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--input" value="Bottom border color at rest" />
            <TokenRow token="--primary" value="Bottom border color on focus" />
            <TokenRow token="--foreground" value="Text color for entered value" />
            <TokenRow token="--muted-foreground" value="Placeholder text color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Textarea } from '@/components/ui/textarea';

// Basic
<Textarea placeholder="Describe your binder..." />

// With default value
<Textarea defaultValue="Existing description text" />

// Controlled
const [value, setValue] = useState('');
<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Write your response..."
/>

// Disabled
<Textarea disabled placeholder="Cannot edit" />

// Custom rows
<Textarea rows={6} placeholder="Long-form content..." />

// With className override
<Textarea className="text-sm font-sans" placeholder="Smaller text" />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Focusable via Tab. Standard text editing keys work (Enter for newline, etc.).</p>
            <p><strong className="text-foreground">Focus indicator:</strong> Bottom border changes to primary color via <code className="text-primary bg-muted px-1 rounded">focus-visible:border-primary</code>. Ring is suppressed with <code className="text-primary bg-muted px-1 rounded">focus-visible:ring-0</code>.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-muted px-1 rounded">disabled:cursor-not-allowed</code> and <code className="text-primary bg-muted px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">Labels:</strong> Always pair with a Label component or <code className="text-primary bg-muted px-1 rounded">aria-label</code> for screen reader context.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Binder description and week summary fields.</p>
            <p><strong className="text-foreground">Profile:</strong> User bio editing in profile settings.</p>
            <p><strong className="text-foreground">Submissions:</strong> Reader responses to exercise prompts within binder steps.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
