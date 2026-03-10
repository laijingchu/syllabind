import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked, Send, Star, ArrowRight } from 'lucide-react';

export function CuratorRecruitCard() {
  const { user, binders } = useStore();
  const [learnMoreUrl, setLearnMoreUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/site-settings/curator_learn_more_url')
      .then((r) => r.json())
      .then((data) => setLearnMoreUrl(data.value || '#learnmore_curator'))
      .catch(() => setLearnMoreUrl(null));
  }, []);

  // Hide for users who already have a featured binder (unless admin)
  const isAlreadyFeatured = user && binders.some(
    (b) => b.curatorId === user.username && b.isDemo
  );
  if (isAlreadyFeatured && !user?.isAdmin) return null;

  const steps = [
    { icon: BookMarked, label: 'Create a binder with your vetted resources', description: 'Showcase books, articles, and audiovisual content you\'ve personally vetted' },
    { icon: Send, label: 'Submit for review', description: 'Our team reviews your binder for quality and fit' },
    { icon: Star, label: 'Get featured, get paid fairly', description: 'Show your scheduling link on any binder, and keep 100% of what you earn' },
  ];

  return (
      <Card className="curator-recruit-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Become a Curator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground max-w-lg">
            Share your expertise with the Syllabind community. Build a structured learning binder on a topic you know well, submit it for review, and reach learners across the platform. Add your paid scheduling link with no platform fees.
          </p>

          <ol className="curator-recruit-steps space-y-3">
            {steps.map(({ icon: Icon, label, description }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-highlight text-primary shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex gap-3">
            <Link href="/curator/binder/new/edit">
              <Button className="gap-2">
                Craft Your Binder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {learnMoreUrl && (
              <a href={learnMoreUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Learn More</Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
  );
}
