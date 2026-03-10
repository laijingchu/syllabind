import { useState } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function CreditsCard() {
  const { creditBalance, user } = useStore();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    const titleParam = title.trim() ? `?title=${encodeURIComponent(title.trim())}` : '';
    setLocation(`/curator/binder/new/edit${titleParam}`);
  };

  return (
    <Card className="credits-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Start a syllabus binder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="group relative flex items-center rounded-full border border-border bg-background shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Intro to Systems Thinking"
            className="flex-1 bg-transparent border-0 outline-none text-sm px-2 py-0.5 placeholder:text-muted-foreground"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <Button size="sm" className="w-full" onClick={handleCreate}>
          Build binder
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {user?.isAdmin ? 'Unlimited' : creditBalance} AI credits left, or just create manually.
        </p>
      </CardContent>
    </Card>
  );
}
