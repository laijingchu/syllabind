import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
      includesFrom: null as string | null,
      proHighlights: [] as string[],
      readerFeatures: [
        '1 active enrollment',
      ],
      curatorFeatures: [
        '100 lifetime AI credits for binder creation',
        '3 manual binders',
        'Up to 4-week AI binders',
        'Unlisted/private publishing',
      ],
      bottomFeatures: [] as string[],
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
      includesFrom: 'Free',
      proHighlights: [] as string[],
      readerFeatures: [
        'Unlimited enrollments',
        { text: 'Join exclusive learning community', starred: true },
        { text: 'Book 1:1 call with featured curator', starred: true },
      ],
      curatorFeatures: [
        '130 AI credits/month for binder creation',
        'Purchase additional AI credits',
        'Create unlimited binders',
        'Up to 6-week AI binders',
        'Submit binder for featured listing',
      ],
      bottomFeatures: [
        <span>Promote your paid video call sessions on your binders — set your own rate, add your scheduling link, <span className="font-bold underline">with no platform fee</span></span>,
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
      badge: 'Lifetime Pro!',
      includesFrom: 'Pro',
      proHighlights: [] as string[],
      readerFeatures: [
        'Lifetime Pro access',
        'Lifetime access to learning community',
        'Lifetime access to 1:1 office hours',
      ],
      curatorFeatures: [
        { text: '5,000 AI credits upfront for binder creation', starred: true },
        'Direct and priority support — help shape the platform!',
      ],
      bottomFeatures: [] as string[],
      cta: subscriptionTier === 'lifetime' ? 'Current Plan' : 'Get Lifetime Access — $500',
      disabled: subscriptionTier === 'lifetime',
      plan: 'lifetime' as CheckoutPlan,
    },
  ];

  return (
    <div className="py-12 space-y-32">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-medium">Ungate knowledge, uphold excellence.</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            <Badge className="bg-primary-inverted text-foreground-inverted shimmer-text border border-[hsl(var(--warm-300))] [animation-duration:9s]">Debut offer!</Badge> Get discounted pricing plans until August 2026
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-sm ${!annual ? 'font-medium' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={`text-sm ${annual ? 'font-medium' : 'text-muted-foreground'}`}>
              Annual <span className="text-success text-xs">(save 17%)</span>
            </span>
          </div>
        </div>

      <div className="grid-12">
        {plans.map(plan => (
          <Card key={plan.name} className={`col-span-12 md:col-span-4 relative flex flex-col ${plan.badge === 'Most Popular' ? 'outline-primary shadow-lg' : ''}`}>
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 w-fit bg-primary-inverted text-foreground-inverted">
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
              <div className="space-y-4 flex-1 mb-6">
                {plan.proHighlights.length > 0 && (
                  <ul className="space-y-2">
                    {plan.proHighlights.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm font-medium">
                        <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0 fill-yellow-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {plan.includesFrom && (
                  <p className="text-sm text-muted-foreground italic">Everything included in {plan.includesFrom}, plus:</p>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">As reader</p>
                  <ul className="space-y-2">
                    {plan.readerFeatures.map(f => {
                      const text = typeof f === 'string' ? f : f.text;
                      const starred = typeof f !== 'string' && f.starred;
                      return (
                        <li key={text} className={`flex items-start gap-2 text-sm ${starred ? 'font-medium' : ''}`}>
                          {starred
                            ? <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0 fill-yellow-500" />
                            : <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />}
                          {text}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">As curator</p>
                  <ul className="space-y-2">
                    {plan.curatorFeatures.map(f => {
                      const text = typeof f === 'string' ? f : f.text;
                      const starred = typeof f !== 'string' && f.starred;
                      return (
                        <li key={text} className={`flex items-start gap-2 text-sm ${starred ? 'font-medium' : ''}`}>
                          {starred
                            ? <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0 fill-yellow-500" />
                            : <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />}
                          {text}
                        </li>
                      );
                    })}
                    {plan.bottomFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-medium">
                        <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0 fill-yellow-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                className="w-full"
                variant={plan.badge === 'Most Popular' ? 'default' : 'secondary'}
                disabled={plan.disabled || loading !== null}
                onClick={() => plan.plan && handleCheckout(plan.plan)}
              >
                {loading && loading === plan.plan ? 'Redirecting...' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>

      {/* Credit Packages & Cost Breakdown — side by side on the 12-col grid */}
      <div className="grid-12">
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h2 className="text-2xl font-display font-medium">AI Credit Packages</h2>
          <p className="text-muted-foreground text-sm">Need more AI credits for binder creation? Purchase additional packages anytime.</p>
          <div className="grid-12">
            {[
              { plan: 'credits_100' as CheckoutPlan, credits: 100, price: '$4.99', perCredit: '$0.05' },
              { plan: 'credits_250' as CheckoutPlan, credits: 250, price: '$9.99', perCredit: '$0.04' },
              { plan: 'credits_550' as CheckoutPlan, credits: 550, price: '$19.99', perCredit: '$0.036' },
            ].map(pkg => (
              <Card key={pkg.plan} className="col-span-12 sm:col-span-4">
                <CardContent className="pt-6 text-center space-y-2">
                  <p className="text-2xl font-bold">{pkg.credits}</p>
                  <p className="text-sm text-muted-foreground">AI credits</p>
                  <p className="font-semibold">{pkg.price}</p>
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => handleCheckout(pkg.plan)} disabled={loading !== null}>
                    {loading === pkg.plan ? '...' : 'Buy'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h2 className="text-2xl font-display font-medium">AI Credit Costs</h2>
          <p className="text-muted-foreground text-sm">AI credits are proportional to API costs.</p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-medium">AI Feature</th>
                  <th className="text-right p-3 font-medium">AI Credits</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t bg-card">
                  <td className="p-3">Binder generation</td>
                  <td className="p-3 text-right font-mono">10/week</td>
                </tr>
                <tr className="border-t bg-card">
                  <td className="p-3">Week regeneration</td>
                  <td className="p-3 text-right font-mono">10</td>
                </tr>
                <tr className="border-t bg-card">
                  <td className="p-3">Improve writing</td>
                  <td className="p-3 text-right font-mono">1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="grid-12">
        <div className="col-span-12 md:col-span-8 md:col-start-3 space-y-4">
        <h2 className="text-2xl font-display font-medium text-center">Frequently Asked Questions</h2>
        <Accordion type="multiple" defaultValue={["what-is-binder"]}>
          <AccordionItem value="what-is-binder">
            <AccordionTrigger>What is a binder?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              A binder is a curated, multi-week learning experience built by a curator. Think of it as a structured reading list — each week contains handpicked or AI-discovered books, articles, websites, or videos (anything accessible via a link), along with a practical, hands-on project idea designed to guide you through a topic at a realistic, thoughtful pace. Every member on the platform can be both a curator and a reader who enrolls in binders, but for a binder to be publicly listed it must go through approval to be "featured" for quality benchmarking.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="what-are-ai-credits">
            <AccordionTrigger>What are AI credits for?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>AI credits power the AI-assisted features available to curators, such as generating binder content, regenerating individual weeks, and improving writing. Each action costs a set number of credits — for example, binder generation costs 10 credits per week. Free accounts start with 100 lifetime credits, Pro members receive 130 credits per month, and anyone can purchase additional credit packages as needed.</p>
              <p className="mt-3">While AI is a helpful tool for fast-paced learning and research, we actually encourage curators to source from their own expertise and surface materials that aren't easily discoverable by LLMs and web search alone — that's what makes a binder truly valuable. This approach is how we keep plan costs down and quality high.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ai-credits">
            <AccordionTrigger>Why do you charge additional for AI credits?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">

              AI features like binder generation and writing assistance use large language models that have real per-use costs. Rather than baking those costs into a higher subscription price for everyone, we give you a generous baseline and let you purchase more only if you need them.

            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="credit-rollover">
            <AccordionTrigger>Do monthly credits roll over for Pro accounts?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              No, monthly AI credits reset each billing cycle. However, any credits you purchase separately through credit packages are yours permanently and never expire.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="learning-community">
            <AccordionTrigger>What does it mean to join the learning community?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              The learning community is a private Slack workspace where Pro members and Founding Members connect with fellow readers and curators. Share insights from binders you're working through, discuss ideas, ask questions, and discover new learning paths — all in a focused, supportive environment away from the noise of social media.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="office-hours">
            <AccordionTrigger>What is a 1:1 office hour with a featured curator?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Syllabind aims to give learners an opportunity to connect with topical experts through more affordable, pay-as-you-go means — as an alternative to expensive bootcamps or traditional college programs. Featured curators can offer paid video call sessions through their binder pages, where readers are encouraged to ask questions relating to binder content and share their projects for critical feedback. As a Pro or Founding Member, you can book a 1:1 call to go deeper on a topic or get personalized guidance. Curators set their own rates and availability — Syllabind takes no cut.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="no-platform-fee">
            <AccordionTrigger>Why do you not charge platform fees on hosting paid scheduling links on featured binders? That's wild.</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">

              <p>We believe curators should keep what they earn. Syllabind's business model is built around subscriptions and AI credits — not taking a cut of your consulting income. When readers book paid video calls through your featured binder, 100% of that revenue is yours. We just provide the platform to connect you with learners.</p>
              <p className="mt-3">Syllabind recognizes that many knowledge workers operate within institutional structures and corporate systems that are financially exploitative — our founding principle is to stop perpetuating that problem and provide a fair platform for people to share knowledge. Set your own rate, and we won't take a cut.</p>

            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="approval">
            <AccordionTrigger>Why is approval necessary for featured binders?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Featured binders appear in our public catalog and represent the Syllabind community. We review submissions to ensure they meet a baseline quality standard — well-structured weeks, thoughtful content curation, and a clear learning outcome. This protects readers and helps great binders stand out. You can always publish unlisted or private binders without approval.</p>
              <p className="mt-3">While any curator can add a scheduling link to their binders, we encourage curators to only offer paid sessions on topics where they have genuine expertise — readers are trusting and paying for 1:1 guidance.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="priority-support">
            <AccordionTrigger>What does "Direct and priority support" mean?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              As a Founding Member, you get a direct line to the Syllabind team via a private Slack channel. Your feedback, feature requests, and support questions are prioritized — you're helping shape the platform during its earliest days, and we want to make sure your voice is heard.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="refund-policy">
            <AccordionTrigger>What is your refund policy?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Pro subscriptions are eligible for a full refund within 7 days of purchase, no questions asked. Founding Member purchases are eligible for a full refund within 7 days, provided AI credits have been used fairly (given the 5,000 credits granted upfront). Beyond 7 days, refunds for both plans are handled on a case-by-case basis at our discretion — because AI features incur real per-use costs, we may not be able to offer a full refund if significant credits have been consumed.</p>
              <p className="mt-3">AI credit packages are refundable if none of the purchased credits have been used. Once credits have been consumed, the package is considered final. If you have any questions, reach out to <a href="mailto:support@syllabind.com" className="underline hover:text-foreground">support@syllabind.com</a>.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Still have questions?{' '}
        <a href="mailto:support@syllabind.com" className="underline hover:text-foreground transition-colors">Contact us</a>
      </p>
    </div>
  );
}
