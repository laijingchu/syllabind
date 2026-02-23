import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { SyllabindCard } from '@/components/SyllabindCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { Syllabus, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const AUDIENCE_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const PAGE_SIZE = 12;

export default function Catalog() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState(params.get('level') || '');
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
    if (selectedCategory) p.set('category', selectedCategory);
    if (selectedLevel) p.set('level', selectedLevel);
    if (sortBy !== 'newest') p.set('sort', sortBy);
    const qs = p.toString();
    const newUrl = `/catalog${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedQuery, selectedCategory, selectedLevel, sortBy]);

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
    if (selectedCategory) p.set('category', selectedCategory);
    if (selectedLevel) p.set('level', selectedLevel);
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
  }, [debouncedQuery, selectedCategory, selectedLevel, sortBy]);

  useEffect(() => {
    fetchCatalog(false);
  }, [debouncedQuery, selectedCategory, selectedLevel, sortBy]);

  const hasMore = syllabinds.length < total;

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-display text-foreground">Course catalog</h1>
        <p className="text-lg text-muted-foreground">
          Learn by reading on the topic. Complete the course with a meaningful project and connect with peers and course creators.
        </p>
      </div>

      {/* Search bar */}
      <div className="catalog-search relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search syllabinds..."
          className="pl-10 text-base"
        />
      </div>

      {/* Category pills */}
      <div className="catalog-categories flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat.slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="catalog-filters flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {AUDIENCE_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level === 'All' ? '' : level)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                (level === 'All' && !selectedLevel) || selectedLevel === level
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              {debouncedQuery && <SelectItem value="relevance">Relevance</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? 'Searching...' : `${total} syllabind${total !== 1 ? 's' : ''} found`}
      </div>

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
