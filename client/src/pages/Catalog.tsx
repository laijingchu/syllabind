import { useStore } from '@/lib/store';
import { SyllabindCard } from '@/components/SyllabindCard';
import { AnimatedPage, AnimatedCard } from '@/components/ui/animated-container';

export default function Catalog() {
  const { syllabinds } = useStore();

  // Only show published syllabinds in catalog
  const publishedSyllabinds = syllabinds.filter(s => s.status === 'published');

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-display text-foreground">Course catalog</h1>
        <p className="text-lg text-muted-foreground">
          Learn by reading on the topic. Complete the course with a meaningful project and connect with peers and course creators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedSyllabinds.map((syllabus, index) => (
          <AnimatedCard key={syllabus.id} delay={0.05 * index} className="h-full">
            <SyllabindCard syllabus={syllabus} />
          </AnimatedCard>
        ))}
      </div>
    </AnimatedPage>
  );
}
