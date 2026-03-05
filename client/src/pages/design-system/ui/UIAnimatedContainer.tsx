import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { AnimatedCard, AnimatedList, AnimatedPage } from '@/components/ui/animated-container';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function UIAnimatedContainer() {
  const [cardKey, setCardKey] = useState(0);
  const [listKey, setListKey] = useState(0);
  const [pageKey, setPageKey] = useState(0);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Animated Container</h1>
          <p className="text-muted-foreground">
            A set of Framer Motion wrappers for common entrance animations. Provides three components:
            AnimatedCard (single element slide-up), AnimatedList (staggered children), and AnimatedPage
            (subtle page-level fade).
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use AnimatedCard</strong> to animate a single element (card, section, hero block) sliding in from below on mount. Accepts a <code className="text-primary bg-primary/5 px-1 rounded">delay</code> prop for sequencing multiple cards.</p>
            <p><strong className="text-foreground">Use AnimatedList</strong> to animate a list of items with staggered delays. Each child fades in and slides up in sequence. Accepts <code className="text-primary bg-primary/5 px-1 rounded">staggerDelay</code> and <code className="text-primary bg-primary/5 px-1 rounded">initialDelay</code> props.</p>
            <p><strong className="text-foreground">Use AnimatedPage</strong> as a lightweight page-level wrapper for a subtle fade-and-slide entrance on route transitions.</p>
            <p><strong className="text-foreground">Avoid</strong> using these for elements that are already visible or for frequent re-renders -- they animate on every mount.</p>
          </div>
        </section>

        {/* Demo - AnimatedCard */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">AnimatedCard</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <Button variant="outline" size="sm" onClick={() => setCardKey(k => k + 1)}>
              <RefreshCw className="h-4 w-4" /> Replay Animation
            </Button>
            <div className="flex gap-4" key={cardKey}>
              <AnimatedCard delay={0} className="flex-1 border border-border rounded-lg p-4 bg-card">
                <p className="text-sm font-medium">Card 1</p>
                <p className="text-xs text-muted-foreground">delay=0</p>
              </AnimatedCard>
              <AnimatedCard delay={0.15} className="flex-1 border border-border rounded-lg p-4 bg-card">
                <p className="text-sm font-medium">Card 2</p>
                <p className="text-xs text-muted-foreground">delay=0.15</p>
              </AnimatedCard>
              <AnimatedCard delay={0.3} className="flex-1 border border-border rounded-lg p-4 bg-card">
                <p className="text-sm font-medium">Card 3</p>
                <p className="text-xs text-muted-foreground">delay=0.3</p>
              </AnimatedCard>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Each card slides up 20px and fades in over 400ms with an easeOutQuad curve. Use the <code className="text-primary bg-primary/5 px-1 rounded">delay</code> prop to stagger manually.
          </p>
        </section>

        {/* Demo - AnimatedList */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">AnimatedList</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <Button variant="outline" size="sm" onClick={() => setListKey(k => k + 1)}>
              <RefreshCw className="h-4 w-4" /> Replay Animation
            </Button>
            <AnimatedList key={listKey} className="space-y-2" staggerDelay={0.1} initialDelay={0}>
              {['Digital Minimalism', 'Systems Thinking 101', 'Creative Writing', 'Data Literacy'].map(title => (
                <div key={title} className="border border-border rounded-lg p-3 bg-card">
                  <p className="text-sm font-medium">{title}</p>
                </div>
              ))}
            </AnimatedList>
          </div>
          <p className="text-sm text-muted-foreground">
            Children are staggered by <code className="text-primary bg-primary/5 px-1 rounded">staggerDelay</code> (default 100ms). Each child slides up 20px and fades in. The <code className="text-primary bg-primary/5 px-1 rounded">children</code> prop must be an array.
          </p>
        </section>

        {/* Demo - AnimatedPage */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">AnimatedPage</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <Button variant="outline" size="sm" onClick={() => setPageKey(k => k + 1)}>
              <RefreshCw className="h-4 w-4" /> Replay Animation
            </Button>
            <AnimatedPage key={pageKey} className="border border-border rounded-lg p-6 bg-card">
              <p className="text-sm font-medium mb-1">Page Content</p>
              <p className="text-xs text-muted-foreground">This block fades in and slides up 10px over 300ms. More subtle than AnimatedCard for page-level transitions.</p>
            </AnimatedPage>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Initial:</strong> Content is invisible (<code className="text-primary bg-primary/5 px-1 rounded">opacity: 0</code>) and offset downward (y: 10-20px).</p>
            <p><strong className="text-foreground">Animate:</strong> Content transitions to full opacity and its final position over 300-400ms.</p>
            <p><strong className="text-foreground">Complete:</strong> No ongoing animation. The wrapper div remains in the DOM as a plain container.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="duration" value="AnimatedCard/List: 400ms, AnimatedPage: 300ms" />
            <TokenRow token="ease" value="easeOutQuad [0.25, 0.46, 0.45, 0.94]" />
            <TokenRow token="y offset" value="AnimatedCard/List: 20px, AnimatedPage: 10px" />
            <TokenRow token="staggerDelay" value="AnimatedList default: 100ms between items" />
          </div>
          <p className="text-sm text-muted-foreground">
            These components use Framer Motion inline values rather than CSS custom properties. Adjust via props or by editing the component source.
          </p>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  AnimatedCard,
  AnimatedList,
  AnimatedPage,
} from '@/components/ui/animated-container';

// Single card with delay
<AnimatedCard delay={0.2} className="p-4">
  <h3>Welcome</h3>
</AnimatedCard>

// Staggered list of items
<AnimatedList staggerDelay={0.1} initialDelay={0.2}>
  {items.map(item => (
    <Card key={item.id}>{item.title}</Card>
  ))}
</AnimatedList>

// Page-level wrapper
<AnimatedPage>
  <Dashboard />
</AnimatedPage>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Reduced motion:</strong> Framer Motion respects the <code className="text-primary bg-primary/5 px-1 rounded">prefers-reduced-motion</code> media query. When enabled, animations are instant (no duration).</p>
            <p><strong className="text-foreground">No layout shift:</strong> Elements animate from their final position (offset is purely visual via transform), so no CLS impact.</p>
            <p><strong className="text-foreground">Semantic neutrality:</strong> All wrappers render plain <code className="text-primary bg-primary/5 px-1 rounded">div</code> elements with no ARIA roles, keeping the semantic structure of children intact.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dashboard:</strong> AnimatedList staggers binder cards as they load, creating a cascading entrance effect.</p>
            <p><strong className="text-foreground">Page transitions:</strong> AnimatedPage wraps top-level page content for a subtle fade-in on navigation.</p>
            <p><strong className="text-foreground">BinderOverview:</strong> AnimatedCard wraps the enrollment sidebar and curator card for entrance animation.</p>
            <p><strong className="text-foreground">Catalog:</strong> AnimatedList staggers catalog results as they appear after filtering or search.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
