import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareHeart } from 'lucide-react';

export function FeedbackCard() {
  const [feedbackUrl, setFeedbackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-settings/feedback_url_learners')
      .then((r) => r.json())
      .then((data) => setFeedbackUrl(data.value || null))
      .catch(() => setFeedbackUrl(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <Card className="feedback-card">
      <CardHeader className="pb-3">
        <div className="feedback-illustration flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/50 mb-2">
          <MessageSquareHeart className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <CardTitle className="text-base">We'd love your feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Help us improve Syllabind by sharing your experience.
        </p>
        <a href={feedbackUrl || undefined} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="w-full">
            Give Feedback
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
