import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { ItemListCard, ItemList, ItemListItem } from '@/components/ItemList';

const sampleItems = [
  { id: 1, href: '#', title: 'Digital Minimalism', subtitle: 'Jane Smith · 4w', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jane', avatarFallback: 'J' },
  { id: 2, href: '#', title: 'Systems Thinking 101', subtitle: 'Alex Chen · 6w', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex', avatarFallback: 'A' },
  { id: 3, href: '#', title: 'Creative Writing Fundamentals', subtitle: 'Maria Lopez · 5w', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maria', avatarFallback: 'M' },
];

export default function ComponentItemList() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">ItemList</h1>
          <p className="text-lg text-muted-foreground">
            A compact, avatar-led list for linking to items. Comes in three forms: <code className="text-primary bg-muted px-1 rounded">ItemListCard</code> (standalone card), <code className="text-primary bg-muted px-1 rounded">ItemList</code> (bare list for embedding), and <code className="text-primary bg-muted px-1 rounded">ItemListItem</code> (single row).
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">ItemListCard</strong> — standalone card with a header and optional action link. Use when the list is its own section (e.g., "Suggested Binders" on the dashboard).</p>
            <p><strong className="text-foreground">ItemList</strong> — bare list with an optional label. Use when embedding inside another card (e.g., featured binders inside the CuratorRecruitCard).</p>
            <p><strong className="text-foreground">ItemListItem</strong> — a single row. Use when you need full control over the list container.</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-xl font-medium">Live Demo</h2>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ItemListCard</p>
            <div className="max-w-md">
              <ItemListCard
                title="Suggested Binders"
                action={{ label: 'Browse Catalog →', href: '#' }}
                items={sampleItems}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ItemList (bare)</p>
            <div className="max-w-md border border-border rounded-xl p-6">
              <ItemList label="Featured on Syllabind" items={sampleItems} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Single ItemListItem</p>
            <div className="max-w-md border border-border rounded-xl p-6">
              <ItemListItem item={sampleItems[0]} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="text-base text-muted-foreground space-y-4">
            <div>
              <p className="font-medium text-foreground">ItemListEntry (shared data shape)</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li><code className="text-primary bg-muted px-1 rounded">id</code> — unique key (string | number)</li>
                <li><code className="text-primary bg-muted px-1 rounded">href</code> — link destination</li>
                <li><code className="text-primary bg-muted px-1 rounded">title</code> — primary label</li>
                <li><code className="text-primary bg-muted px-1 rounded">subtitle</code> — secondary label (optional)</li>
                <li><code className="text-primary bg-muted px-1 rounded">avatarUrl</code> — avatar image URL (optional)</li>
                <li><code className="text-primary bg-muted px-1 rounded">avatarFallback</code> — fallback initial (optional, defaults to first char of title)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">ItemListCard</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li><code className="text-primary bg-muted px-1 rounded">title</code> — card header title</li>
                <li><code className="text-primary bg-muted px-1 rounded">action</code> — optional <code className="text-primary bg-muted px-1 rounded">{'{label, href}'}</code> link in the header</li>
                <li><code className="text-primary bg-muted px-1 rounded">items</code> — array of ItemListEntry</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">ItemList</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li><code className="text-primary bg-muted px-1 rounded">label</code> — optional uppercase label above the list</li>
                <li><code className="text-primary bg-muted px-1 rounded">items</code> — array of ItemListEntry</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { ItemListCard, ItemList, ItemListItem } from '@/components/ItemList';

// Standalone card
<ItemListCard
  title="Suggested Binders"
  action={{ label: 'Browse Catalog →', href: '/catalog' }}
  items={[
    { id: 1, href: '/binder/1', title: 'Digital Minimalism', subtitle: 'Jane · 4w', avatarUrl: '...' },
  ]}
/>

// Bare list inside another card
<ItemList label="Featured on Syllabind" items={items} />

// Single item
<ItemListItem item={{ id: 1, href: '/binder/1', title: 'My Binder' }} />`}</CodeBlock>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Reader Dashboard:</strong> <code className="text-primary bg-muted px-1 rounded">ItemListCard</code> used for "Suggested Binders" in the primary column.</p>
            <p><strong className="text-foreground">Embeddable:</strong> <code className="text-primary bg-muted px-1 rounded">ItemList</code> can be dropped inside any card that needs a compact linked list with avatars.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
