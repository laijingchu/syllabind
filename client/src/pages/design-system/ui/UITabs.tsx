import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function UITabs() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Tabs</h1>
          <p className="text-muted-foreground">
            A set of layered panels that display one content section at a time. Built on Radix UI
            Tabs with TabsList, TabsTrigger, and TabsContent subcomponents.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Tabs</strong> to organize related content into switchable views within the same page context. Ideal when content categories are parallel and users need to compare or alternate between them.</p>
            <p><strong className="text-foreground">Use separate pages</strong> instead when the content sections are unrelated or when each section is complex enough to warrant its own URL.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="p-4 text-sm text-muted-foreground">
                <p>The overview panel shows a summary of the binder, including description, enrollment count, and publication status.</p>
              </TabsContent>
              <TabsContent value="content" className="p-4 text-sm text-muted-foreground">
                <p>The content panel displays weeks and steps, allowing curators to manage learning materials and exercises.</p>
              </TabsContent>
              <TabsContent value="settings" className="p-4 text-sm text-muted-foreground">
                <p>The settings panel provides controls for visibility, cohort management, and binder metadata.</p>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Active vs inactive triggers</p>
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Active Tab</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive Tab</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">Active trigger gets a white background with shadow; inactive triggers use muted text.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Disabled trigger</p>
              <Tabs defaultValue="enabled">
                <TabsList>
                  <TabsTrigger value="enabled">Enabled</TabsTrigger>
                  <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">Disabled triggers reduce to 50% opacity and prevent interaction.</p>
            </div>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--muted" value="TabsList background fill" />
            <TokenRow token="--muted-foreground" value="Inactive trigger text color" />
            <TokenRow token="--background" value="Active trigger background (elevated)" />
            <TokenRow token="--foreground" value="Active trigger text color" />
            <TokenRow token="--ring" value="Focus ring color on keyboard navigation" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content here.
  </TabsContent>
  <TabsContent value="content">
    Content management here.
  </TabsContent>
  <TabsContent value="settings">
    Settings panel here.
  </TabsContent>
</Tabs>

// Controlled
const [tab, setTab] = useState("overview");
<Tabs value={tab} onValueChange={setTab}>
  ...
</Tabs>

// With disabled tab
<TabsTrigger value="locked" disabled>Locked</TabsTrigger>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Arrow keys move focus between triggers. Tab moves focus into the active content panel. Enter or Space activates a trigger.</p>
            <p><strong className="text-foreground">ARIA:</strong> Built on Radix UI, which provides <code className="text-primary bg-primary/5 px-1 rounded">role="tablist"</code>, <code className="text-primary bg-primary/5 px-1 rounded">role="tab"</code>, and <code className="text-primary bg-primary/5 px-1 rounded">role="tabpanel"</code> automatically.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> 2px ring using <code className="text-primary bg-primary/5 px-1 rounded">focus-visible:ring-2</code> with ring offset. Only visible on keyboard navigation.</p>
            <p><strong className="text-foreground">Disabled:</strong> Sets <code className="text-primary bg-primary/5 px-1 rounded">disabled:pointer-events-none</code> and <code className="text-primary bg-primary/5 px-1 rounded">disabled:opacity-50</code> on triggers.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Dashboard:</strong> Switches between reader and curator views, showing enrolled binders or managed binders respectively.</p>
            <p><strong className="text-foreground">BinderEditor:</strong> Separates content editing from settings configuration, letting curators manage weeks/steps in one tab and metadata/visibility in another.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
