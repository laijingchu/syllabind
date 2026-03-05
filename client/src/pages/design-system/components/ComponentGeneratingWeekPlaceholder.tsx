import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { GeneratingWeekPlaceholder } from '@/components/GeneratingWeekPlaceholder';
import type { Step } from '@/lib/types';

const sampleSteps: Step[] = [
  {
    id: 1,
    weekId: 1,
    position: 1,
    type: 'reading',
    title: 'The Art of Focused Attention',
    author: 'Cal Newport',
    url: 'https://example.com/focused-attention',
    mediaType: 'Blog/Article',
  },
  {
    id: 2,
    weekId: 1,
    position: 2,
    type: 'exercise',
    title: 'Reflection: Your Current Habits',
    promptText: 'Write about three habits you currently have that help or hinder your focus throughout the day.',
  },
];

export default function ComponentGeneratingWeekPlaceholder() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">GeneratingWeekPlaceholder</h1>
          <p className="text-lg text-muted-foreground">
            A skeleton loading state shown while AI generates week content for a binder. Supports
            progressive reveal &mdash; real steps fade in as they stream from the server while
            remaining slots stay as animated skeleton placeholders.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use GeneratingWeekPlaceholder</strong> as a drop-in replacement for the week editor panel while the backend is streaming AI-generated content. It provides visual feedback and progressive reveal of steps as they arrive.</p>
            <p><strong className="text-foreground">Do not use</strong> for generic loading states. Use Skeleton directly for simpler loading patterns.</p>
          </div>
        </section>

        {/* Demo - Empty state */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo: Initial State</h2>
          <p className="text-base text-muted-foreground">
            When generation begins, all fields are skeleton placeholders. The status banner shows
            the current generation phase.
          </p>
          <div className="border border-border rounded-lg p-6">
            <GeneratingWeekPlaceholder weekIndex={1} status="Generating Week 1..." />
          </div>
        </section>

        {/* Demo - Progressive reveal */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo: Progressive Reveal</h2>
          <p className="text-base text-muted-foreground">
            As steps stream in, they replace skeleton slots with real content. The title and
            description also fill in when available. Remaining slots keep their shimmer animation.
          </p>
          <div className="border border-border rounded-lg p-6">
            <GeneratingWeekPlaceholder
              weekIndex={1}
              status="Generating steps..."
              title="Building Focus Habits"
              description="This week explores the science of attention and practical exercises to build sustainable focus habits."
              currentSteps={sampleSteps}
            />
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">weekIndex</td>
                  <td className="p-3 font-mono text-xs">number</td>
                  <td className="p-3">1-based week number. Used in the fallback status text.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">status</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">Current generation phase displayed in the status banner.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">title?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">Week title. Shows skeleton when absent, real text when provided.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs text-foreground">description?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3">Week summary (HTML). Shows skeleton when absent, rendered HTML when provided.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs text-foreground">currentSteps?</td>
                  <td className="p-3 font-mono text-xs">Step[]</td>
                  <td className="p-3">Steps received so far. Real step cards replace skeleton slots progressively. Defaults to empty array; expects up to 4 steps total.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { GeneratingWeekPlaceholder } from '@/components/GeneratingWeekPlaceholder';

// Initial loading state (all skeletons)
<GeneratingWeekPlaceholder
  weekIndex={1}
  status="Generating Week 1..."
/>

// Progressive reveal with streamed content
<GeneratingWeekPlaceholder
  weekIndex={1}
  status="Generating steps..."
  title="Building Focus Habits"
  description="This week explores the science of attention."
  currentSteps={receivedSteps}
/>`}</CodeBlock>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderEditor:</strong> Rendered in place of the week editor panel during AI binder generation. Each week tab shows this placeholder while the server streams generated content. As steps arrive via the streaming response, <code className="text-primary bg-primary/5 px-1 rounded">currentSteps</code> is updated and real step cards progressively replace the skeletons.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
