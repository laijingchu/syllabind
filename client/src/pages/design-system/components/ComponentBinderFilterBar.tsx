import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { BinderFilterBar } from '@/components/BinderFilterBar';
import type { Category } from '@/lib/types';

const MOCK_CATEGORIES: Category[] = [
  { id: 1, slug: 'productivity', name: 'Productivity', displayOrder: 1 },
  { id: 2, slug: 'mindfulness', name: 'Mindfulness', displayOrder: 2 },
  { id: 3, slug: 'technology', name: 'Technology', displayOrder: 3 },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ComponentBinderFilterBar() {
  // Search only demo
  const [searchOnly, setSearchOnly] = useState('');

  // Visibility demo
  const [visSearch, setVisSearch] = useState('');
  const [visibility, setVisibility] = useState('public');

  // Sort demo
  const [sortSearch, setSortSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Full demo
  const [fullSearch, setFullSearch] = useState('');
  const [fullVis, setFullVis] = useState('public');
  const [fullSort, setFullSort] = useState('newest');
  const [fullCats, setFullCats] = useState<string[]>([]);

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">BinderFilterBar</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive filter bar combining search input, visibility pills, sort dropdown,
            category pills, and result count. Each feature is opt-in via props, so the bar
            adapts from a simple search to a full filtering experience.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use BinderFilterBar</strong> for pages that list binders and need filtering capabilities. It is designed to compose multiple filter dimensions in a single, consistent bar.</p>
            <p><strong className="text-foreground">Use SearchBar instead</strong> when you only need a standalone search input without visibility, sort, or category controls.</p>
          </div>
        </section>

        {/* Demo - Search Only */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Search Only</h2>
          <div className="border border-border rounded-lg p-6">
            <BinderFilterBar
              searchQuery={searchOnly}
              onSearchChange={setSearchOnly}
              searchPlaceholder="Search binders..."
            />
          </div>
          <p className="text-base text-muted-foreground">
            At minimum, BinderFilterBar provides a search input with an inline search icon. The <code className="text-primary bg-primary/5 px-1 rounded">searchQuery</code> and <code className="text-primary bg-primary/5 px-1 rounded">onSearchChange</code> props are required.
          </p>
        </section>

        {/* Demo - With Visibility Pills */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Visibility Pills</h2>
          <div className="border border-border rounded-lg p-6">
            <BinderFilterBar
              searchQuery={visSearch}
              onSearchChange={setVisSearch}
              visibility={visibility}
              onVisibilityChange={setVisibility}
            />
          </div>
          <p className="text-base text-muted-foreground">
            Pass <code className="text-primary bg-primary/5 px-1 rounded">visibility</code> and <code className="text-primary bg-primary/5 px-1 rounded">onVisibilityChange</code> to show Public / Unlisted / Private pill toggles. Custom options can be provided via <code className="text-primary bg-primary/5 px-1 rounded">visibilityOptions</code>.
          </p>
        </section>

        {/* Demo - With Sort */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Sort Dropdown</h2>
          <div className="border border-border rounded-lg p-6">
            <BinderFilterBar
              searchQuery={sortSearch}
              onSearchChange={setSortSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={SORT_OPTIONS}
            />
          </div>
          <p className="text-base text-muted-foreground">
            Pass <code className="text-primary bg-primary/5 px-1 rounded">sortBy</code>, <code className="text-primary bg-primary/5 px-1 rounded">onSortChange</code>, and <code className="text-primary bg-primary/5 px-1 rounded">sortOptions</code> to add a sort dropdown via the Select primitive.
          </p>
        </section>

        {/* Demo - Full */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Full Filter Bar</h2>
          <div className="border border-border rounded-lg p-6">
            <BinderFilterBar
              searchQuery={fullSearch}
              onSearchChange={setFullSearch}
              visibility={fullVis}
              onVisibilityChange={setFullVis}
              sortBy={fullSort}
              onSortChange={setFullSort}
              sortOptions={SORT_OPTIONS}
              categories={MOCK_CATEGORIES}
              selectedCategories={fullCats}
              onCategoriesChange={setFullCats}
              resultCount={12}
            />
          </div>
          <p className="text-base text-muted-foreground">
            All features enabled: visibility pills, sort dropdown, search, category multi-select pills, and result count. Category pills include an "All" reset button.
          </p>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="searchQuery" value="string (required) — Current search input value" />
            <TokenRow token="onSearchChange" value="(q: string) => void (required) — Called on every keystroke" />
            <TokenRow token="searchPlaceholder" value="string — Input placeholder (default: 'Search binders...')" />
            <TokenRow token="visibility" value="string — Active visibility filter value" />
            <TokenRow token="onVisibilityChange" value="(v: string) => void — Enables visibility pills when provided" />
            <TokenRow token="visibilityOptions" value="{ value, label }[] — Custom pill options (default: Public/Unlisted/Private)" />
            <TokenRow token="sortBy" value="string — Active sort value" />
            <TokenRow token="onSortChange" value="(v: string) => void — Enables sort dropdown when provided" />
            <TokenRow token="sortOptions" value="{ value, label }[] — Sort dropdown options" />
            <TokenRow token="categories" value="Category[] — List of categories for pill filters" />
            <TokenRow token="selectedCategories" value="string[] — Currently selected category slugs" />
            <TokenRow token="onCategoriesChange" value="(cats: string[]) => void — Enables category pills when provided" />
            <TokenRow token="resultCount" value="number — Shows result count text when provided" />
            <TokenRow token="isLoading" value="boolean — Shows 'Searching...' instead of count" />
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p>The bar uses semantic class names: <code className="text-primary bg-primary/5 px-1 rounded">binder-filter-bar</code>, <code className="text-primary bg-primary/5 px-1 rounded">catalog-search-row</code>, <code className="text-primary bg-primary/5 px-1 rounded">catalog-visibility</code>, and <code className="text-primary bg-primary/5 px-1 rounded">catalog-categories</code>.</p>
            <p>Pills toggle between <code className="text-primary bg-primary/5 px-1 rounded">bg-foreground text-background</code> (active) and <code className="text-primary bg-primary/5 px-1 rounded">bg-muted text-muted-foreground</code> (inactive) with a smooth transition.</p>
            <p>The search input has an inline Search icon positioned absolutely at <code className="text-primary bg-primary/5 px-1 rounded">left-3</code> with <code className="text-primary bg-primary/5 px-1 rounded">pl-10</code> padding on the input.</p>
            <p>On small screens, the top row stacks vertically via <code className="text-primary bg-primary/5 px-1 rounded">flex-col</code> and switches to a horizontal layout at <code className="text-primary bg-primary/5 px-1 rounded">sm:</code> breakpoint.</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { BinderFilterBar } from '@/components/BinderFilterBar';

// Search only (minimum)
<BinderFilterBar
  searchQuery={query}
  onSearchChange={setQuery}
/>

// With visibility pills
<BinderFilterBar
  searchQuery={query}
  onSearchChange={setQuery}
  visibility={visibility}
  onVisibilityChange={setVisibility}
/>

// Full filter bar
<BinderFilterBar
  searchQuery={query}
  onSearchChange={setQuery}
  visibility={visibility}
  onVisibilityChange={setVisibility}
  sortBy={sortBy}
  onSortChange={setSortBy}
  sortOptions={[
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
  ]}
  categories={categories}
  selectedCategories={selectedCats}
  onCategoriesChange={setSelectedCats}
  resultCount={filteredBinders.length}
  isLoading={isSearching}
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> All interactive elements (input, pills, dropdown) are focusable via Tab. Pills activate on Enter or Space.</p>
            <p><strong className="text-foreground">Pill toggles:</strong> Visibility and category pills are rendered as native <code className="text-primary bg-primary/5 px-1 rounded">&lt;button&gt;</code> elements. Consider adding <code className="text-primary bg-primary/5 px-1 rounded">aria-pressed</code> for toggle state communication.</p>
            <p><strong className="text-foreground">Sort dropdown:</strong> Uses the Radix Select primitive which provides full keyboard navigation, ARIA roles, and screen reader announcements out of the box.</p>
            <p><strong className="text-foreground">Result count:</strong> Consider wrapping in an <code className="text-primary bg-primary/5 px-1 rounded">aria-live="polite"</code> region so screen readers announce updated counts.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Catalog:</strong> Uses search input and category pills to help readers browse published binders.</p>
            <p><strong className="text-foreground">CuratorDashboard:</strong> Uses search input and visibility pills so curators can filter their own binders by status.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
