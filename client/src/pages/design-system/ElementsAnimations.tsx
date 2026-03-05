import { useState } from 'react';
import DesignSystemLayout, { CodeBlock } from './DesignSystemLayout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function ElementsAnimations() {
  const [shimmerKey, setShimmerKey] = useState(0);
  const [stepKey, setStepKey] = useState(0);

  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Motion & Animation</h1>
          <p className="text-muted-foreground max-w-2xl">
            Motion in Syllabind is functional, not decorative. Animations communicate system status
            (loading, generating, processing), guide attention to new content, and provide micro-feedback
            for interactions. Everything moves quickly — most durations are under 400ms — so the
            interface feels responsive without making users wait.
          </p>
        </div>

        {/* Shimmer */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Shimmer — Content Loading</h2>
          <p className="text-sm text-muted-foreground">
            Shimmer replaces content while it loads. The sweeping gradient tells users that data is
            being fetched and gives an approximate sense of what the content will look like (text lines,
            cards). It's used wherever content loads asynchronously — binder lists, step content, profiles.
          </p>
          <div className="border border-border rounded-lg p-6 space-y-3 bg-card">
            <div key={shimmerKey} className="animate-shimmer h-4 w-3/4 rounded" />
            <div key={`${shimmerKey}-b`} className="animate-shimmer h-4 w-1/2 rounded" style={{ animationDelay: '0.3s' }} />
            <div key={`${shimmerKey}-c`} className="animate-shimmer h-4 w-2/3 rounded" style={{ animationDelay: '0.6s' }} />
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShimmerKey(k => k + 1)}>
              Restart
            </Button>
          </div>
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">When to use:</strong> Any time content is loading and you
              can predict the approximate shape (text block, card grid, header). Prefer shimmer over
              a generic spinner when the layout is known.
            </p>
          </div>
        </section>

        {/* Pulse Border */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Pulse Border — Active Generation</h2>
          <p className="text-sm text-muted-foreground">
            A pulsing glow around an element's border indicates active AI generation or a long-running
            process. Unlike shimmer (which replaces content), pulse border wraps existing content to
            show it's being worked on. Currently used in the binder editor when AI generates step content.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="animate-generating border-2 rounded-lg p-6 text-center">
              <p className="text-sm font-medium">Generating step content</p>
              <p className="text-xs text-muted-foreground mt-1">The border breathes between subtle and visible</p>
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">When to use:</strong> Processes that produce a result inside
              a container — AI content generation, import processing, batch operations. The pulsing rhythm
              suggests "working on it" rather than "stuck."
            </p>
          </div>
        </section>

        {/* Step Slide In */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Step Slide-In — Sequential Reveal</h2>
          <p className="text-sm text-muted-foreground">
            Items slide up and fade in with staggered timing, creating a cascade effect.
            This draws attention to newly added items and gives a sense of progression. Used when
            steps are revealed inside a binder week view and when streaming content arrives from the server.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div key={stepKey} className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`step-enter step-delay-${i} border border-border rounded-md p-3`}
                >
                  <p className="text-sm">Step {i} — appears after {i * 100}ms</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setStepKey(k => k + 1)}>
              Replay
            </Button>
          </div>
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">When to use:</strong> Lists of items appearing as a group
              (page load, expanding a section) or one-by-one (streaming). The stagger should feel brisk —
              100ms between items keeps it snappy, 200ms+ starts to feel slow.
            </p>
          </div>
        </section>

        {/* Animated Ellipsis */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Animated Ellipsis — Inline Loading</h2>
          <p className="text-sm text-muted-foreground">
            A lightweight, text-level indicator for short waits. Three dots cycle after a label
            to show something is in progress without taking up visual space. Used in the logout
            transition ("Come back soon...") and inline loading states.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card flex items-center gap-8">
            <div>
              <span className="text-sm">Loading</span>
              <span className="animate-ellipsis" />
            </div>
            <div>
              <span className="text-sm">Thinking</span>
              <span className="animate-ellipsis" />
            </div>
            <div>
              <span className="text-sm">Come back soon!</span>
              <span className="animate-ellipsis" />
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">When to use:</strong> Short inline messages where a
              spinner would be too heavy. Best for conversational moments ("Saving...", "Processing...")
              rather than page-level loading. Pair with descriptive text so the user knows what's happening.
            </p>
          </div>
        </section>

        {/* Tailwind Built-ins */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Standard Spinners & Indicators</h2>
          <p className="text-sm text-muted-foreground">
            Built-in animation utilities for common loading and attention patterns. The spin animation
            is the most-used — it appears on the Loader2 icon inside buttons during form submissions
            and page transitions.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <div>
                <p className="text-xs font-medium">Spin</p>
                <p className="text-xs text-muted-foreground">Button loading, page transitions</p>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-medium">Pulse</p>
                <p className="text-xs text-muted-foreground">Subtle attention draw, skeleton placeholders</p>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-6 w-6 rounded-full bg-primary animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-medium">Bounce</p>
                <p className="text-xs text-muted-foreground">Playful emphasis (use sparingly)</p>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-6 w-6 rounded-full bg-primary animate-ping" />
              </div>
              <div>
                <p className="text-xs font-medium">Ping</p>
                <p className="text-xs text-muted-foreground">Notification dots, unread indicators</p>
              </div>
            </div>
          </div>
        </section>

        {/* Accordion */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accordion Expand/Collapse</h2>
          <p className="text-sm text-muted-foreground">
            Accordions open and close with a smooth height transition (0.2s ease-out). This motion
            helps users understand where content came from and where it went — without it, the sudden
            appearance/disappearance of content can be disorienting. Used in binder week sections on
            the overview page.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Week 1: Digital Audit</AccordionTrigger>
                <AccordionContent>
                  Content slides down smoothly when opened and retracts when closed.
                  The animation holds its final state — collapsed items stay at zero height
                  instead of snapping back.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Week 2: Intentional Defaults</AccordionTrigger>
                <AccordionContent>
                  Each accordion operates independently. Opening one doesn't close others
                  unless explicitly configured to do so (single mode vs. multiple mode).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Week 3: Mindful Consumption</AccordionTrigger>
                <AccordionContent>
                  The chevron icon rotates 180 degrees in sync with the content animation,
                  giving a consistent visual cue for open/closed state.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Motion principles */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Motion Principles</h2>
          <div className="border border-border rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium">Motion should inform, not entertain</p>
              <p className="text-muted-foreground">
                Every animation answers a question: "Is it loading?", "Where did that come from?",
                "Did my action register?" If an animation doesn't serve one of these, it shouldn't exist.
              </p>
            </div>
            <div>
              <p className="font-medium">Fast by default</p>
              <p className="text-muted-foreground">
                Most transitions are 200–400ms. The interface should feel instant. Loading
                indicators (shimmer, ellipsis) are the exception — they run continuously until
                content arrives.
              </p>
            </div>
            <div>
              <p className="font-medium">Ease-out for entering, ease-in for exiting</p>
              <p className="text-muted-foreground">
                Content that appears should decelerate into place (ease-out). Content that disappears
                should accelerate away (ease-in). This matches how physical objects move and feels natural.
              </p>
            </div>
            <div>
              <p className="font-medium">Stagger for groups, instant for singles</p>
              <p className="text-muted-foreground">
                When multiple items appear together, stagger them for a cascade effect. When a single
                element updates, it should change immediately without added motion.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
