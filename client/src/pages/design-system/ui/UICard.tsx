import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UICard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Card</h1>
          <p className="text-muted-foreground">
            A container for grouping related content with a consistent surface, border, and padding structure.
            Composed of 5 subcomponents: Header, Title, Description, Content, and Footer.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Card</strong> to visually group related content — a binder preview, a settings section, a stat block, or a form group.</p>
            <p><strong className="text-foreground">Skip the Card</strong> when content flows naturally on the page without needing a visual boundary (e.g., inline text sections).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            {/* Full card */}
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>Digital Minimalism</CardTitle>
                <CardDescription>A 4-week guided exploration of intentional technology use.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">12 steps across 4 weeks. Created by janesmith.</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Enroll</Button>
                <Button size="sm" variant="outline">Preview</Button>
              </CardFooter>
            </Card>

            {/* Minimal card */}
            <Card className="max-w-sm">
              <CardContent className="pt-6">
                <p className="text-sm">A minimal card using only CardContent with top padding.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subcomponents */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Subcomponents</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Card</strong> — Outer container. <code className="text-primary bg-primary/5 px-1 rounded">rounded-xl border bg-card</code>.</p>
            <p><strong className="text-foreground">CardHeader</strong> — Top section with vertical spacing. <code className="text-primary bg-primary/5 px-1 rounded">p-6</code>, flex-col, gap-1.5.</p>
            <p><strong className="text-foreground">CardTitle</strong> — Heading text. Semibold, tight tracking, no explicit size (inherits).</p>
            <p><strong className="text-foreground">CardDescription</strong> — Subtitle below title. <code className="text-primary bg-primary/5 px-1 rounded">text-sm text-muted-foreground</code>.</p>
            <p><strong className="text-foreground">CardContent</strong> — Main body area. <code className="text-primary bg-primary/5 px-1 rounded">p-6 pt-0</code> (no top padding, butts against header).</p>
            <p><strong className="text-foreground">CardFooter</strong> — Bottom action row. <code className="text-primary bg-primary/5 px-1 rounded">flex items-center p-6 pt-0</code>.</p>
          </div>
        </section>

        {/* Composition patterns */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Composition Patterns</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stat card */}
              <Card>
                <CardHeader>
                  <CardDescription>Total Readers</CardDescription>
                  <CardTitle className="text-2xl">1,284</CardTitle>
                </CardHeader>
              </Card>

              {/* Settings card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>Receive updates when readers enroll.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button size="sm" variant="outline">Configure</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Stat card</strong> — Reverse Title/Description order, larger title text.</p>
            <p><strong className="text-foreground">Settings card</strong> — Smaller title, description, and footer action.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--card" value="Surface background color" />
            <TokenRow token="--card-foreground" value="Text color on card surfaces" />
            <TokenRow token="--border" value="Card border color" />
            <TokenRow token="--radius" value="Base radius (card uses rounded-xl)" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent, CardFooter
} from '@/components/ui/card';

// Full card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Body content here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Minimal card (content only)
<Card>
  <CardContent className="pt-6">
    <p>Simple content without header/footer.</p>
  </CardContent>
</Card>

// Clickable card (add hover styles)
<Card className="hover-elevate cursor-pointer">
  ...
</Card>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Semantic HTML:</strong> Card renders as a <code className="text-primary bg-primary/5 px-1 rounded">&lt;div&gt;</code>. For landmark semantics, wrap in <code className="text-primary bg-primary/5 px-1 rounded">&lt;section&gt;</code> or <code className="text-primary bg-primary/5 px-1 rounded">&lt;article&gt;</code> as needed.</p>
            <p><strong className="text-foreground">Heading levels:</strong> CardTitle renders as a div — add an explicit heading tag inside if the card introduces a new content section for screen reader navigation.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Catalog:</strong> Binder preview cards in the grid layout.</p>
            <p><strong className="text-foreground">Dashboard:</strong> Enrollment cards with progress indicators.</p>
            <p><strong className="text-foreground">BinderOverview:</strong> Enrollment sidebar CTA card.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Analytics stat cards and binder management cards.</p>
            <p><strong className="text-foreground">Settings:</strong> Settings section cards with action footers.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
