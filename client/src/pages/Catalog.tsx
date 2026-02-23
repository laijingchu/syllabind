import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { SyllabindCard } from '@/components/SyllabindCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { Button } from '@/components/ui/button';
import { SyllabindFilterBar } from '@/components/sections/SyllabindFilterBar';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Syllabus, Category } from '@/lib/types';

const PAGE_SIZE = 12;

export default function Catalog() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    params.get('category') ? params.get('category')!.split(',') : []
  );
  const [selectedVisibility, setSelectedVisibility] = useState(params.get('visibility') || 'public');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'relevance'>(
    (params.get('sort') as any) || 'newest'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [syllabinds, setSyllabinds] = useState<Syllabus[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  // Sync URL query params
  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedQuery) p.set('q', debouncedQuery);
    if (selectedCategories.length > 0) p.set('category', selectedCategories.join(','));
    if (selectedVisibility !== 'public') p.set('visibility', selectedVisibility);
    if (sortBy !== 'newest') p.set('sort', sortBy);
    const qs = p.toString();
    const newUrl = `/catalog${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedQuery, selectedCategories, selectedVisibility, sortBy]);

  // Fetch catalog results
  const fetchCatalog = useCallback(async (loadMore = false) => {
    const currentOffset = loadMore ? offset + PAGE_SIZE : 0;
    if (!loadMore) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }

    const p = new URLSearchParams({ catalog: 'true', limit: String(PAGE_SIZE), offset: String(currentOffset) });
    if (debouncedQuery) p.set('q', debouncedQuery);
    if (selectedCategories.length > 0) p.set('category', selectedCategories.join(','));
    if (selectedVisibility) p.set('visibility', selectedVisibility);
    p.set('sort', debouncedQuery && sortBy === 'newest' ? 'relevance' : sortBy);

    try {
      const res = await fetch(`/api/syllabinds?${p.toString()}`);
      const data = await res.json();
      if (loadMore) {
        setSyllabinds(prev => [...prev, ...data.syllabinds]);
        setOffset(currentOffset);
      } else {
        setSyllabinds(data.syllabinds);
      }
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, selectedCategories, selectedVisibility, sortBy]);

  useEffect(() => {
    fetchCatalog(false);
  }, [debouncedQuery, selectedCategories, selectedVisibility, sortBy]);

  const hasMore = syllabinds.length < total;

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-display text-foreground">Course catalog</h1>
        <p className="text-lg text-muted-foreground">
          Learn by reading on the topic. Complete the course with a meaningful project and connect with peers and course creators.
        </p>
      </div>

      <SyllabindFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        visibility={selectedVisibility}
        onVisibilityChange={setSelectedVisibility}
        sortBy={sortBy}
        onSortChange={(v) => setSortBy(v as any)}
        sortOptions={[
          { value: 'newest', label: 'Newest' },
          { value: 'popular', label: 'Most Popular' },
          ...(debouncedQuery ? [{ value: 'relevance', label: 'Relevance' }] : []),
        ]}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        resultCount={total}
        isLoading={isLoading}
      />

      {/* Results grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : syllabinds.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-lg text-muted-foreground">No syllabinds found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabinds.map((syllabus, index) => (
              <AnimatedCard key={syllabus.id} delay={0.05 * Math.min(index, 6)} className="h-full">
                <SyllabindCard syllabus={syllabus} />
              </AnimatedCard>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchCatalog(true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </AnimatedPage>
  );
}
