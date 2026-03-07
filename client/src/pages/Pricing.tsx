import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { Link } from 'wouter';
import { redirectToCheckout, type CheckoutPlan } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isPro, subscriptionTier } = useStore();

  const handleCheckout = async (plan: CheckoutPlan) => {
    if (!isAuthenticated) {
      window.location.href = '/login?returnTo=/pricing';
      return;
    }
    setLoading(plan);
    try {
      await redirectToCheckout('/billing', plan);
    } catch (e) {
      setLoading(null);
      toast({ title: 'Unable to start checkout', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' });
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: <Zap className="h-5 w-5" />,
      description: 'Get started with AI-powered learning.',
      features: [
        '100 lifetime credits',
        '1 active enrollment',
        '3 manual binders',
        'Up to 4-week AI binders',
        'Improve writing (1 credit each)',
        'Unlisted/private publishing',
      ],
      cta: isAuthenticated ? 'Current Plan' : 'Sign Up Free',
      disabled: isAuthenticated,
      plan: null as CheckoutPlan | null,
    },
    {
      name: 'Pro',
      price: annual ? '$12.50' : '$14.99',
      period: annual ? '/mo (billed annually)' : '/mo',
      icon: <Crown className="h-5 w-5" />,
      description: 'For serious curators and learners.',
      badge: 'Most Popular',
      features: [
        '130 credits/month',
        'Unlimited enrollments',
        'Unlimited binders',
        'Up to 6-week AI binders',
        'Public binder submission',
        'Purchasable credit packages',
      ],
      cta: isPro && subscriptionTier !== 'lifetime' ? 'Current Plan' : annual ? 'Go Pro — $150/yr' : 'Go Pro — $14.99/mo',
      disabled: isPro && subscriptionTier !== 'lifetime',
      plan: (annual ? 'pro_annual' : 'pro_monthly') as CheckoutPlan,
    },
    {
      name: 'Founding Member',
      price: '$500',
      period: 'one-time',
      icon: <Star className="h-5 w-5" />,
      description: 'Support Syllabind and get lifetime access.',
      badge: 'Limited',
      features: [
        '5,000 credits upfront',
        'Lifetime Pro access',
        'Unlimited everything',
        'Up to 6-week AI binders',
        'Purchasable credit packages',
        'Early supporter recognition',
      ],
      cta: subscriptionTier === 'lifetime' ? 'Current Plan' : 'Become a Founder — $500',
      disabled: subscriptionTier === 'lifetime',
      plan: 'lifetime' as CheckoutPlan,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-display font-medium">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free with 100 credits. Upgrade when you need more power.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm ${!annual ? 'font-medium' : 'text-muted-foreground'}`}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className={`text-sm ${annual ? 'font-medium' : 'text-muted-foreground'}`}>
            Annual <span className="text-green-600 text-xs">(save 17%)</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={`relative flex flex-col ${plan.badge === 'Most Popular' ? 'border-primary shadow-lg' : ''}`}>
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                {plan.badge}
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                {plan.icon}
                <CardTitle>{plan.name}</CardTitle>
              </div>
              <div className="pt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.badge === 'Most Popular' ? 'default' : 'outline'}
                disabled={plan.disabled || loading !== null}
                onClick={() => plan.plan && handleCheckout(plan.plan)}
              >
                {loading === plan.plan ? 'Redirecting...' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Cost Breakdown */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-display font-medium text-center">Credit Costs</h2>
        <p className="text-center text-muted-foreground text-sm">Credits are proportional to AI API costs.</p>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">AI Feature</th>
                <th className="text-right p-3 font-medium">Credits</th>
                <th className="text-right p-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">Binder generation</td>
                <td className="p-3 text-right font-mono">10/week</td>
                <td className="p-3 text-right text-muted-foreground">4-week = 40, 6-week = 60</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Week regeneration</td>
                <td className="p-3 text-right font-mono">10</td>
                <td className="p-3 text-right text-muted-foreground">Same as 1 week generation</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Improve writing</td>
                <td className="p-3 text-right font-mono">1</td>
                <td className="p-3 text-right text-muted-foreground">Per use</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Auto-fill from URL</td>
                <td className="p-3 text-right font-mono">0</td>
                <td className="p-3 text-right text-muted-foreground">Free for all</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Packages */}
      <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-display font-medium text-center">Credit Packages</h2>
          <p className="text-center text-muted-foreground text-sm">Need more credits? Purchase additional packages anytime.</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { plan: 'credits_100' as CheckoutPlan, credits: 100, price: '$4.99', perCredit: '$0.05' },
              { plan: 'credits_250' as CheckoutPlan, credits: 250, price: '$9.99', perCredit: '$0.04' },
              { plan: 'credits_550' as CheckoutPlan, credits: 550, price: '$19.99', perCredit: '$0.036' },
            ].map(pkg => (
              <Card key={pkg.plan}>
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-2xl font-bold">{pkg.credits}</p>
                  <p className="text-sm text-muted-foreground">credits</p>
                  <p className="font-semibold">{pkg.price}</p>
                  <p className="text-xs text-muted-foreground">{pkg.perCredit}/credit</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleCheckout(pkg.plan)} disabled={loading !== null}>
                    {loading === pkg.plan ? '...' : 'Buy'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      <p className="text-center text-sm text-muted-foreground">
        Questions?{' '}
        <Link href="/" className="underline hover:text-foreground transition-colors">Contact us</Link>
      </p>
    </div>
  );
}
