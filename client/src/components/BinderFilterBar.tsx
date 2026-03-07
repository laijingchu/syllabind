import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/pill';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { Category } from '@/lib/types';

interface BinderFilterBarProps {
  // Search (always shown)
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  // Visibility pills (optional)
  visibility?: string;
  onVisibilityChange?: (v: string) => void;
  visibilityOptions?: { value: string; label: string }[];
  // Sort dropdown (optional)
  sortBy?: string;
  onSortChange?: (v: string) => void;
  sortOptions?: { value: string; label: string }[];
  // Category pills (optional)
  categories?: Category[];
  selectedCategories?: string[];
  onCategoriesChange?: (cats: string[]) => void;
  // Result count (optional)
  resultCount?: number;
  isLoading?: boolean;
}

const DEFAULT_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

export function BinderFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search binders...',
  visibility,
  onVisibilityChange,
  visibilityOptions = DEFAULT_VISIBILITY_OPTIONS,
  sortBy,
  onSortChange,
  sortOptions,
  categories,
  selectedCategories,
  onCategoriesChange,
  resultCount,
  isLoading,
}: BinderFilterBarProps) {
  const toggleCategory = (slug: string) => {
    if (!onCategoriesChange || !selectedCategories) return;
    onCategoriesChange(
      selectedCategories.includes(slug)
        ? selectedCategories.filter(s => s !== slug)
        : [...selectedCategories, slug]
    );
  };

  return (
    <div className="binder-filter-bar space-y-4">
      {/* Top row: Visibility pills + Sort + Search */}
      <div className="catalog-search-row flex flex-col sm:flex-row sm:items-center gap-3">
        {onVisibilityChange && visibility !== undefined && (
          <div className="catalog-visibility flex gap-1.5 shrink-0">
            {visibilityOptions.map(opt => (
              <Pill
                key={opt.value}
                active={visibility === opt.value}
                onClick={() => onVisibilityChange(opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        )}
        {onSortChange && sortBy !== undefined && sortOptions && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px] text-base shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative sm:flex-1 sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 text-base"
          />
        </div>
      </div>

      {/* Category pills (multi-select) */}
      {onCategoriesChange && categories && selectedCategories && (
        <div className="catalog-categories flex gap-1.5 flex-wrap">
          <Pill
            active={selectedCategories.length === 0}
            onClick={() => onCategoriesChange([])}
          >
            All
          </Pill>
          {categories.map(cat => (
            <Pill
              key={cat.slug}
              active={selectedCategories.includes(cat.slug)}
              onClick={() => toggleCategory(cat.slug)}
            >
              {cat.name}
            </Pill>
          ))}
        </div>
      )}

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {isLoading ? 'Searching...' : `${resultCount} binder${resultCount !== 1 ? 's' : ''} found`}
        </div>
      )}
    </div>
  );
}
