import { useStore } from '@/lib/store';
import { SyllabusCard } from '@/components/SyllabusCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';

export default function Catalog() {
  const { syllabi } = useStore();

  // Only show published syllabi in catalog
  const publishedSyllabi = syllabi.filter(s => s.status === 'published');

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-display text-foreground">Catalog</h1>
        <p className="text-lg text-muted-foreground">
          Curated learning paths designed to be completed, not just bookmarked.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedSyllabi.map((syllabus, index) => (
          <AnimatedCard key={syllabus.id} delay={0.05 * index}>
            <SyllabusCard syllabus={syllabus} />
          </AnimatedCard>
        ))}
      </div>
    </AnimatedPage>
  );
}
