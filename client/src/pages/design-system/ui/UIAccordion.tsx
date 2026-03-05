import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export default function UIAccordion() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Accordion</h1>
          <p className="text-lg text-muted-foreground">
            A vertically stacked set of collapsible sections. Built on Radix UI Accordion
            with smooth height animations and a chevron rotation indicator.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Accordion</strong> to progressively disclose content in sections, reducing visual clutter while keeping information accessible. Ideal for FAQs, settings groups, and multi-section content.</p>
            <p><strong className="text-foreground">Use Tabs</strong> instead when sections are peer-level and the user is expected to switch between them frequently rather than expand multiple.</p>
          </div>
        </section>

        {/* Demo - Single Collapsible */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <Accordion type="single" collapsible defaultValue="week-1" className="w-full">
              <AccordionItem value="week-1">
                <AccordionTrigger>Week 1: Getting Started</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Introduction to the core concepts. Read chapters 1-3 and complete the reflection exercise.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="week-2">
                <AccordionTrigger>Week 2: Deep Dive</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Explore advanced techniques. Complete the hands-on workshop and peer review assignment.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="week-3">
                <AccordionTrigger>Week 3: Integration</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Bring it all together with a final project. Submit your capstone piece for curator feedback.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <p className="text-base text-muted-foreground">
            <code className="text-primary bg-primary/5 px-1 rounded">type="single" collapsible</code> allows one section open at a time, and clicking the open section collapses it.
          </p>
        </section>

        {/* Multiple */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Multiple Mode</h2>
          <div className="border border-border rounded-lg p-6">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>What is a Binder?</AccordionTrigger>
                <AccordionContent>
                  A Binder is a curated multi-week learning experience created by a curator. It contains weekly sections with readings and exercises.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>Can I enroll in multiple Binders?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can enroll in as many Binders as you like and track your progress independently for each one.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger>How do I become a curator?</AccordionTrigger>
                <AccordionContent>
                  Toggle the curator mode from your profile settings. You can then create and publish your own Binders.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <p className="text-base text-muted-foreground">
            <code className="text-primary bg-primary/5 px-1 rounded">type="multiple"</code> allows multiple sections to be open simultaneously.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Collapsed:</strong> Trigger text visible with a right-aligned chevron pointing down. Bottom border separates items.</p>
            <p><strong className="text-foreground">Expanded:</strong> Content slides down with <code className="text-primary bg-primary/5 px-1 rounded">animate-accordion-down</code>. Chevron rotates 180 degrees to point up.</p>
            <p><strong className="text-foreground">Collapsing:</strong> Content slides up with <code className="text-primary bg-primary/5 px-1 rounded">animate-accordion-up</code>. Smooth height transition via <code className="text-primary bg-primary/5 px-1 rounded">overflow-hidden</code>.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--border" value="Bottom border separating accordion items" />
            <TokenRow token="--foreground" value="Trigger text color" />
            <TokenRow token="--muted-foreground" value="Chevron icon color and content text" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// Single collapsible (one open at a time)
<Accordion type="single" collapsible>
  <AccordionItem value="week-1">
    <AccordionTrigger>Week 1: Getting Started</AccordionTrigger>
    <AccordionContent>
      Introduction to the core concepts...
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="week-2">
    <AccordionTrigger>Week 2: Deep Dive</AccordionTrigger>
    <AccordionContent>
      Explore advanced techniques...
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple open sections
<Accordion type="multiple">
  <AccordionItem value="faq-1">
    <AccordionTrigger>Question?</AccordionTrigger>
    <AccordionContent>Answer.</AccordionContent>
  </AccordionItem>
</Accordion>

// With default open item
<Accordion type="single" collapsible defaultValue="week-1">
  ...
</Accordion>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Arrow Up/Down moves focus between triggers. Enter or Space toggles the focused section. Home/End jump to first/last trigger.</p>
            <p><strong className="text-foreground">ARIA:</strong> Each trigger has <code className="text-primary bg-primary/5 px-1 rounded">aria-expanded</code> and <code className="text-primary bg-primary/5 px-1 rounded">aria-controls</code> linking to its content panel. Content panels have <code className="text-primary bg-primary/5 px-1 rounded">role="region"</code>.</p>
            <p><strong className="text-foreground">Focus management:</strong> Radix handles focus trapping within the accordion group, following the WAI-ARIA Accordion pattern.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderOverview:</strong> Week sections are rendered as accordion items, letting readers expand individual weeks to see steps and readings.</p>
            <p><strong className="text-foreground">FAQ sections:</strong> Multiple-mode accordion for frequently asked questions on public pages.</p>
            <p><strong className="text-foreground">Settings groups:</strong> Collapsible preference sections in profile and account settings.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
