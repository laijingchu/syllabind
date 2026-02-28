import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BinderCard } from '@/components/BinderCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BinderFilterBar } from '@/components/sections/BinderFilterBar';
import { Loader2, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import type { Binder, Category } from '@/lib/types';

const PAGE_SIZE = 12;

export default function Catalog() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    params.get('category') ? params.get('category')!.split(',') : []
  );
  const [selectedVisibility, setSelectedVisibility] = useState(params.get('visibility') || 'public');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'relevance'>(
    (params.get('sort') as any) || (user ? 'newest' : 'popular')
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newBinderTitle, setNewBinderTitle] = useState('');

  const handleCreate = () => {
    const titleParam = newBinderTitle.trim() ? `?title=${encodeURIComponent(newBinderTitle.trim())}` : '';
    if (user) {
      setLocation(`/curator/binder/new${titleParam}`);
    } else {
      setLocation(`/create${titleParam}`);
    }
  };

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
      const res = await fetch(`/api/binders?${p.toString()}`);
      const data = await res.json();
      if (loadMore) {
        setBinders(prev => [...prev, ...data.binders]);
        setOffset(currentOffset);
      } else {
        setBinders(data.binders);
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

  const hasMore = binders.length < total;

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-display text-foreground">Pick a binder</h1>
        <p className="text-lg text-muted-foreground">
          Learn by reading on the topic. Complete the course with a meaningful project and connect with peers and course curators.
        </p>
      </div>

      <BinderFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        {...(user ? {
          visibility: selectedVisibility,
          onVisibilityChange: setSelectedVisibility,
          sortBy,
          onSortChange: (v: string) => setSortBy(v as any),
          sortOptions: [
            { value: 'newest', label: 'Newest' },
            { value: 'popular', label: 'Most Popular' },
            ...(debouncedQuery ? [{ value: 'relevance', label: 'Relevance' }] : []),
          ],
        } : {})}
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
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard delay={0} className="h-full">
              <Card className="create-binder-card group flex flex-col h-full border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors">
                <div className="flex flex-col justify-center flex-1 p-6 space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-lg font-display font-medium text-foreground">Create your own</h3>
                    <p className="text-sm text-muted-foreground">Start with a topic and let AI build your binder</p>
                  </div>
                  <Input
                    value={newBinderTitle}
                    onChange={e => setNewBinderTitle(e.target.value)}
                    placeholder="e.g. Intro to Systems Thinking"
                    className="text-base"
                    onKeyDown={e => e.key === 'Enter' && newBinderTitle.trim() && handleCreate()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleCreate}
                    disabled={!newBinderTitle.trim()}
                    className="gap-2 w-fit group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:border-primary transition-colors"
                  >
                    Create
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-medium gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                  </Button>
                </div>
              </Card>
            </AnimatedCard>
            {binders.length === 0 ? (
              <div className="flex items-center justify-center col-span-full py-8">
                <p className="text-muted-foreground">No other binders found. Try adjusting your search or filters.</p>
              </div>
            ) : binders.map((binder, index) => (
              <AnimatedCard key={binder.id} delay={0.05 * Math.min(index + 1, 6)} className="h-full">
                <BinderCard binder={binder} />
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
