import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { BinderCard } from '@/components/BinderCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';
import { Button } from '@/components/ui/button';
import { BinderFilterBar } from '@/components/BinderFilterBar';
import { Loader2, Sparkles } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
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
  const [demoBinders, setDemoBinders] = useState<Array<{ id: number; title: string }>>([]);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);

  const taglines = [
    'If you could teach the world anything, what would you teach?',
    'If you could learn anything under the sun, what would you want to learn?',
    'Build a syllabus yourself, or with AI\'s help.',
    'Connect the dots between fragmented information.',
    'Learn by reading and doing, not just watching.',
    'Gain validation and feedback from fellow learners and teachers.',
  ];
  const taglineTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch demo binders for pills
  useEffect(() => {
    fetch('/api/demo-binders')
      .then(res => res.json())
      .then(data => setDemoBinders(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cycle = () => {
      setTaglineFading(true);
      taglineTimer.current = setTimeout(() => {
        setTaglineIndex(i => (i + 1) % taglines.length);
        setTaglineFading(false);
      }, 400);
    };
    const interval = setInterval(cycle, 4000);
    return () => { clearInterval(interval); clearTimeout(taglineTimer.current); };
  }, []);

  const handleCreate = () => {
    const titleParam = newBinderTitle.trim() ? `?title=${encodeURIComponent(newBinderTitle.trim())}` : '';
    if (user) {
      setLocation(`/curator/binder/new/edit${titleParam}`);
    } else {
      setLocation(`/create${titleParam}`);
    }
  };

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setCategories(Array.isArray(data) ? data : []))
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
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (loadMore) {
        setBinders(prev => [...prev, ...(data.binders ?? [])]);
        setOffset(currentOffset);
      } else {
        setBinders(data.binders ?? []);
      }
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      if (!loadMore) setBinders([]);
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
    <>
      {/* Hero section */}
      <div className="hero-section flex flex-col items-center gap-5 mx-auto py-32">
        <h1 className="font-display text-7xl text-foreground text-center">Curate a syllabus on anything</h1>
        <p className={`text-lg text-muted-foreground transition-opacity duration-400 ${taglineFading ? 'opacity-0' : 'opacity-100'}`}>
          {taglines[taglineIndex]}
        </p>
        <div className="create-binder-bar group relative w-full max-w-xl flex items-center rounded-full border border-border bg-card shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow px-5 py-2">
          <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            value={newBinderTitle}
            onChange={e => setNewBinderTitle(e.target.value)}
            placeholder="e.g. Intro to Systems Thinking"
            className="flex-1 bg-transparent border-0 outline-none text-base px-3 py-1 placeholder:text-muted-foreground"
            onKeyDown={e => e.key === 'Enter' && newBinderTitle.trim() && handleCreate()}
          />
          {newBinderTitle.trim() && (
            <Button
              size="sm"
              onClick={handleCreate}
              className="rounded-full h-8 px-4 text-sm"
            >
              Create
            </Button>
          )}
        </div>
        {demoBinders.length > 0 && (
          <div className="demo-topic-chips flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium shimmer-text">Try a demo:</span>
            {demoBinders.map((demo) => (
              <Pill
                key={demo.id}
                variant="outline"
                size="sm"
                onClick={() => setLocation(user ? `/curator/binder/new/edit?demo=${demo.id}` : `/create?demo=${demo.id}`)}
              >
                {demo.title}
              </Pill>
            ))}
          </div>
        )}
      </div>
      <AnimatedPage className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-display text-foreground">📒 Featured binders</h1>
          <p className="text-lg text-muted-foreground">Handcrafted by experts, vetted for quality. </p>
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
            <div className="grid-12">
              {binders.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No other binders found. Try adjusting your search or filters.</p>
                </div>
              ) : binders.map((binder, index) => (
                <AnimatedCard key={binder.id} delay={0.05 * Math.min(index + 1, 6)} className="h-full col-span-12 md:col-span-6 lg:col-span-4">
                  <BinderCard binder={binder} />
                </AnimatedCard>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
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
    </>
  );
}
