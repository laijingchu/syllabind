import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { SearchBar } from '@/components/sections/SearchBar';

export default function SectionSearchBar() {
  const [basic, setBasic] = useState('');
  const [withCount, setWithCount] = useState('');
  const [custom, setCustom] = useState('');

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">SearchBar</h1>
          <p className="text-muted-foreground">
            A search input paired with an icon button and an optional result count display.
            Designed as a reusable section component for filtering lists of content.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use SearchBar</strong> when you need a standalone search input with an explicit search action button. Good for pages where search is a primary interaction.</p>
            <p><strong className="text-foreground">Use BinderFilterBar instead</strong> when search is combined with other filter controls like visibility pills, sort dropdowns, or category filters.</p>
          </div>
        </section>

        {/* Demo - Basic */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Basic</h2>
          <div className="border border-border rounded-lg p-6">
            <SearchBar
              value={basic}
              onChange={setBasic}
              onSearch={() => alert(`Searching for: ${basic}`)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Default SearchBar with placeholder text and a search icon button.
          </p>
        </section>

        {/* Demo - With Count */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Result Count</h2>
          <div className="border border-border rounded-lg p-6">
            <SearchBar
              value={withCount}
              onChange={setWithCount}
              onSearch={() => {}}
              count={42}
              countLabel="binders"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Pass <code className="text-primary bg-primary/5 px-1 rounded">count</code> and <code className="text-primary bg-primary/5 px-1 rounded">countLabel</code> to display a result summary below the input.
          </p>
        </section>

        {/* Demo - Custom Placeholder */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Custom Placeholder</h2>
          <div className="border border-border rounded-lg p-6">
            <SearchBar
              value={custom}
              onChange={setCustom}
              onSearch={() => {}}
              placeholder="Find a curator..."
              count={7}
              countLabel="curators found"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Override the default placeholder with context-specific text.
          </p>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="value" value="string — Current search input value (default: '')" />
            <TokenRow token="onChange" value="(value: string) => void — Called on every keystroke" />
            <TokenRow token="onSearch" value="() => void — Called when the search button is clicked" />
            <TokenRow token="placeholder" value="string — Input placeholder text (default: 'Search...')" />
            <TokenRow token="count" value="number | undefined — Result count to display below input" />
            <TokenRow token="countLabel" value="string — Label after the count (default: 'results')" />
            <TokenRow token="className" value="string — Additional class names on the wrapper" />
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>SearchBar uses semantic class names (<code className="text-primary bg-primary/5 px-1 rounded">search-bar</code>, <code className="text-primary bg-primary/5 px-1 rounded">search-bar-input-group</code>, <code className="text-primary bg-primary/5 px-1 rounded">search-bar-count</code>) for easy targeting.</p>
            <p>The input uses the <code className="text-primary bg-primary/5 px-1 rounded">Input</code> primitive with <code className="text-primary bg-primary/5 px-1 rounded">bg-background</code> styling. The search button is an <code className="text-primary bg-primary/5 px-1 rounded">outline</code> variant <code className="text-primary bg-primary/5 px-1 rounded">icon</code>-sized Button.</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { SearchBar } from '@/components/sections/SearchBar';

// Basic
<SearchBar
  value={query}
  onChange={setQuery}
  onSearch={handleSearch}
/>

// With result count
<SearchBar
  value={query}
  onChange={setQuery}
  onSearch={handleSearch}
  count={results.length}
  countLabel="binders"
/>

// Custom placeholder
<SearchBar
  value={query}
  onChange={setQuery}
  onSearch={handleSearch}
  placeholder="Find a curator..."
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Input is focusable via Tab. The search button follows in tab order and activates on Enter or Space.</p>
            <p><strong className="text-foreground">Screen readers:</strong> The search button contains a Search icon from Lucide. Consider adding an <code className="text-primary bg-primary/5 px-1 rounded">aria-label="Search"</code> to the button for screen reader users.</p>
            <p><strong className="text-foreground">Result count:</strong> The count display is a live text element. For real-time updates, consider wrapping it in an <code className="text-primary bg-primary/5 px-1 rounded">aria-live="polite"</code> region.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>SearchBar is not currently imported in any page. It exists as a ready-to-use section component.</p>
            <p><strong className="text-foreground">Catalog:</strong> Could be used for searching published binders by title or topic.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Could be used for filtering a curator's own binders.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
