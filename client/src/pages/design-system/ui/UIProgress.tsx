import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Progress } from '@/components/ui/progress';

export default function UIProgress() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Progress</h1>
          <p className="text-lg text-muted-foreground">
            A horizontal bar that communicates completion percentage. Built on Radix UI Progress
            with an animated indicator and support for custom indicator styling via <code className="text-primary bg-muted px-1 rounded">indicatorClassName</code>.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Progress</strong> to show determinate completion of a task or journey, such as binder progress, step completion, or multi-step forms.</p>
            <p><strong className="text-foreground">Use Spinner</strong> instead when the duration is indeterminate or the operation has no measurable progress.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">0% — Not started</p>
              <Progress value={0} />
            </div>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">33% — In progress</p>
              <Progress value={33} />
            </div>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">66% — More than half</p>
              <Progress value={66} />
            </div>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">100% — Complete</p>
              <Progress value={100} />
            </div>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">Custom indicator color (green)</p>
              <Progress value={75} indicatorClassName="bg-success" />
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Progress value={0} />
                <p className="text-sm text-muted-foreground text-center">Empty (0%)</p>
              </div>
              <div className="space-y-2">
                <Progress value={50} />
                <p className="text-sm text-muted-foreground text-center">Partial (50%)</p>
              </div>
              <div className="space-y-2">
                <Progress value={100} />
                <p className="text-sm text-muted-foreground text-center">Complete (100%)</p>
              </div>
              <div className="space-y-2">
                <Progress value={40} className="h-4" />
                <p className="text-sm text-muted-foreground text-center">Taller bar (h-4)</p>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            The indicator slides using a <code className="text-primary bg-muted px-1 rounded">translateX</code> transform with <code className="text-primary bg-muted px-1 rounded">transition-all</code> for smooth animation when the value changes. The track defaults to <code className="text-primary bg-muted px-1 rounded">h-2</code> and <code className="text-primary bg-muted px-1 rounded">rounded-full</code>.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Indicator fill color (bg-primary)" />
            <TokenRow token="--muted" value="Track background (bg-highlight)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Progress } from '@/components/ui/progress';

// Basic usage
<Progress value={33} />

// Full width with percentage label
<div className="space-y-1">
  <Progress value={66} />
  <p className="text-base text-muted-foreground">66% complete</p>
</div>

// Custom indicator color
<Progress value={75} indicatorClassName="bg-success" />

// Custom height
<Progress value={50} className="h-4" />

// Zero / complete
<Progress value={0} />
<Progress value={100} />`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">ARIA role:</strong> Radix automatically applies <code className="text-primary bg-muted px-1 rounded">role="progressbar"</code> with <code className="text-primary bg-muted px-1 rounded">aria-valuenow</code>, <code className="text-primary bg-muted px-1 rounded">aria-valuemin</code>, and <code className="text-primary bg-muted px-1 rounded">aria-valuemax</code>.</p>
            <p><strong className="text-foreground">Screen readers:</strong> Announce the current percentage. No additional labeling needed unless the context is ambiguous — in that case add an <code className="text-primary bg-muted px-1 rounded">aria-label</code>.</p>
            <p><strong className="text-foreground">Color contrast:</strong> The primary indicator on the primary/20 track meets WCAG contrast guidelines.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Enrollment progress:</strong> Shows how far a reader has progressed through an enrolled binder on the Dashboard.</p>
            <p><strong className="text-foreground">Binder completion tracking:</strong> Displays overall completion percentage on BinderOverview and enrollment cards.</p>
            <p><strong className="text-foreground">WeekView step progress:</strong> Indicates how many steps in a week have been completed.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
