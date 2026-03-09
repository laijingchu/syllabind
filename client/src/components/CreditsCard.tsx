import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

export function CreditsCard() {
  const { creditBalance, isPro } = useStore();

  return (
    <Card className="credits-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          AI Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="credits-balance text-3xl font-mono font-semibold">{creditBalance}</p>
        <Link href="/billing">
          <Button variant="secondary" size="sm" className="w-full">
            {isPro ? 'Get More' : 'Upgrade'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
