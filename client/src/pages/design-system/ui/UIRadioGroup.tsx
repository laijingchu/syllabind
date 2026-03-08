import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function UIRadioGroup() {
  const [value, setValue] = useState('comfortable');

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">RadioGroup</h1>
          <p className="text-lg text-muted-foreground">
            A Radix-based radio group with circular indicators. Used for selecting exactly
            one option from a set of mutually exclusive choices.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use RadioGroup</strong> when users must pick exactly one option from a small, visible set of choices (2-5 options).</p>
            <p><strong className="text-foreground">Use Select</strong> instead when the list of options is long (6+) or space is limited.</p>
            <p><strong className="text-foreground">Use Checkbox</strong> instead when users can select multiple options independently.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <RadioGroup value={value} onValueChange={setValue}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="compact" id="demo-compact" />
                <label htmlFor="demo-compact" className="text-sm cursor-pointer select-none">Compact</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="comfortable" id="demo-comfortable" />
                <label htmlFor="demo-comfortable" className="text-sm cursor-pointer select-none">Comfortable</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="spacious" id="demo-spacious" />
                <label htmlFor="demo-spacious" className="text-sm cursor-pointer select-none">Spacious</label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">Selected: {value}</p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-2 text-center flex flex-col items-center">
                <RadioGroup>
                  <RadioGroupItem value="unselected" />
                </RadioGroup>
                <p className="text-sm text-muted-foreground">Unselected</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <RadioGroup defaultValue="selected">
                  <RadioGroupItem value="selected" />
                </RadioGroup>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <RadioGroup disabled>
                  <RadioGroupItem value="disabled" />
                </RadioGroup>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
              <div className="space-y-2 text-center flex flex-col items-center">
                <RadioGroup defaultValue="labeled">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="labeled" id="state-label" />
                    <label htmlFor="state-label" className="text-sm">Label</label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">With Label</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Selected state shows a filled <code className="text-primary bg-muted px-1 rounded">--primary</code> circle indicator. The outer ring uses <code className="text-primary bg-muted px-1 rounded">--border</code> via the border-primary class. Disabled state reduces opacity to 50%.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Border color and filled circle indicator" />
            <TokenRow token="--ring" value="Focus ring color on keyboard navigation" />
            <TokenRow token="--border" value="Outer ring border (via border-primary)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Basic with labels
<RadioGroup defaultValue="option-1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-1" id="option-1" />
    <label htmlFor="option-1">Option 1</label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-2" id="option-2" />
    <label htmlFor="option-2">Option 2</label>
  </div>
</RadioGroup>

// Controlled
const [value, setValue] = useState('option-1');
<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-1" id="r1" />
    <label htmlFor="r1">Option 1</label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-2" id="r2" />
    <label htmlFor="r2">Option 2</label>
  </div>
</RadioGroup>

// Disabled
<RadioGroup disabled>
  <RadioGroupItem value="disabled" />
</RadioGroup>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Role:</strong> Renders as <code className="text-primary bg-muted px-1 rounded">role="radiogroup"</code> with individual items as <code className="text-primary bg-muted px-1 rounded">role="radio"</code>.</p>
            <p><strong className="text-foreground">Keyboard:</strong> Tab focuses the group. Arrow keys move between options. Space selects the focused option.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> 1px ring using <code className="text-primary bg-muted px-1 rounded">focus-visible:ring-1</code>. Only visible on keyboard navigation.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-muted px-1 rounded">disabled:cursor-not-allowed</code> and <code className="text-primary bg-muted px-1 rounded">disabled:opacity-50</code>.</p>
            <p><strong className="text-foreground">Label association:</strong> Each RadioGroupItem should be paired with a <code className="text-primary bg-muted px-1 rounded">label</code> element using matching <code className="text-primary bg-muted px-1 rounded">id</code> and <code className="text-primary bg-muted px-1 rounded">htmlFor</code>.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Settings:</strong> Theme selection — users choose between light, dark, or system theme.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Visibility options — curators select public, unlisted, or private for their binder.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
