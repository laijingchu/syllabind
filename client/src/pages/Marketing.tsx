import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BinderCard } from '@/components/BinderCard';
import type { Binder } from '@/lib/types';

// Responsive two-row visibility for 1/2/3-column grid
// Mobile (1 col): show 2, md (2 cols): show 4, lg (3 cols): show 6
function twoRowClass(index: number): string {
  if (index < 2) return '';
  if (index < 4) return 'hidden md:block';
  return 'hidden lg:block';
}

export default function Marketing() {
  const [, setLocation] = useLocation();

  // Fetch site settings
  const [waitlistUrl, setWaitlistUrl] = useState<string | null>(null);
  const [getPaidToTeachUrl, setGetPaidToTeachUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/site-settings/waitlist_form_url')
      .then(res => res.json())
      .then(data => setWaitlistUrl(data.value || null))
      .catch(() => {});
    fetch('/api/site-settings/get_paid_to_teach_url')
      .then(res => res.json())
      .then(data => setGetPaidToTeachUrl(data.value || null))
      .catch(() => {});
  }, []);

  // Fetch binders for showcase sections
  const [buildCards, setBuildCards] = useState<Binder[]>([]);
  const [curatedCards, setCuratedCards] = useState<Binder[]>([]);
  useEffect(() => {
    // Section 1: unlisted binders from admin account
    fetch('/api/binders?catalog=true&visibility=unlisted&creator=@admin&sort=newest&limit=6')
      .then(res => res.json())
      .then(data => setBuildCards((data.binders || []).slice(0, 6)))
      .catch(() => {});
    // Section 2: public binders from all curators
    fetch('/api/binders?catalog=true&visibility=public&sort=newest&limit=6')
      .then(res => res.json())
      .then(data => setCuratedCards((data.binders || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  const handleWaitlistClick = () => {
    if (waitlistUrl) {
      window.open(waitlistUrl, '_blank', 'noopener,noreferrer');
    } else {
      setLocation('/login?mode=signup');
    }
  };

  const handleGetPaidToTeachClick = () => {
    if (getPaidToTeachUrl) {
      window.open(getPaidToTeachUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-24 md:space-y-32 pb-12 md:pb-20 pt-4 md:pt-8 px-4 md:px-6">
      {/* A. Hero */}
      <section className="text-center space-y-8 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-display font-medium tracking-tight text-foreground">
            Syllabind<span className="text-primary">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-display">Make knowledge accessible; excellence recognizable.</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Goodbye: scattered bookmarks, tutorial hells, commoditized bootcamps. <br className="hidden md:block" /> Hello: pluralistic perspectives, community and guidance, impactful projects.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
           <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-black text-white hover:bg-neutral-800 border-none" onClick={handleWaitlistClick}>
             Join waitlist
             {waitlistUrl && <ExternalLink className="ml-2 h-4 w-4" />}
           </Button>
           {getPaidToTeachUrl && (
             <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg rounded-full border-primary/20 hover:border-primary/50 text-primary" onClick={handleGetPaidToTeachClick}>
               Give feedback
             </Button>
           )}
        </div>
      </section>

      {/* Two Pathways */}
      <section className="pathways-section space-y-8 md:space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-display">Two ways to learn</h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you want to chart your own course or learn from the best, Syllabind has a path for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Self-directed */}
          <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
            <div className="text-3xl">&#x1F9ED;</div>
            <h3 className="text-xl md:text-2xl font-display font-medium">Self-directed</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Build your own Binder with AI curatorial assistance. Our tools generate a content arc and find meaningful resources online — then you edit, refine, and make it yours. It's the teach-you-how-to-fish method.
            </p>
            <ul className="space-y-2 pt-2">
              {['AI-assisted content curation', 'Edit and refine your learning path', 'Learn by teaching yourself', 'Slack community & peer groups'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Expert-directed */}
          <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
            <div className="text-3xl">&#x1F393;</div>
            <h3 className="text-xl md:text-2xl font-display font-medium">Expert-directed</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Academics and industry experts share their knowledge beyond the limited confines of their institutions — for fair pay. Access world-class guidance without the time or financial commitment of a full degree program.
            </p>
            <ul className="space-y-2 pt-2">
              {['Curated by real academics and practitioners', 'Accessible without a degree program', 'Fair compensation for experts', 'Slack community & peer groups'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 1: Build your own */}
      {buildCards.length > 0 && (
        <section className="build-showcase space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-display">Build your own Binder</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what others have created. Then build your own learning path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildCards.map((binder, index) => (
              <motion.div
                key={binder.id}
                className={twoRowClass(index)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.15, ease: 'easeOut' }}
              >
                <BinderCard binder={binder} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-black text-white hover:bg-neutral-800 border-none" onClick={handleWaitlistClick}>
              <Plus className="mr-2 h-5 w-5" />
              Create your own
            </Button>
            <Link href="/catalog" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-12 px-8 text-lg rounded-full">
                Browse all binders
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Section 2: Expert-curated */}
      {curatedCards.length > 0 && (
        <section className="curated-showcase space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-display">Expert-curated content</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Structured learning paths from experienced curators and thought leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedCards.map((binder, index) => (
              <motion.div
                key={binder.id}
                className={twoRowClass(index)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: (index % 3) * 0.15, ease: 'easeOut' }}
              >
                <BinderCard binder={binder} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {getPaidToTeachUrl && (
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-black text-white hover:bg-neutral-800 border-none" onClick={handleGetPaidToTeachClick}>
                Give feedback
              </Button>
            )}
            <Link href="/catalog" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-12 px-8 text-lg rounded-full">
                Browse all binders
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
      {/* About */}
      <section className="about-section space-y-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display">Why we built Syllabind</h2>
        <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          <p>
            The internet made learning infinite — and overwhelming. We save hundreds of links but finish none. We juggle five courses and complete zero. The joy of learning got buried under the stress of collecting.
          </p>
          <p>
            Syllabind is the antidote: short, structured, finishable learning paths curated by people who care. One binder at a time. Four weeks max. Real exercises, real progress, real completion.
          </p>
        </div>
      </section>

      {/* Comparison Chart */}
      <section className="comparison-section space-y-8 md:space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-display">The Syllabind vision</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not another course platform. Here's how we're different.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 pr-4 font-medium text-muted-foreground w-1/4" />
                <th className="py-4 px-4 font-display font-medium text-lg">Syllabind</th>
                <th className="py-4 px-4 font-medium text-muted-foreground">Degree programs</th>
                <th className="py-4 px-4 font-medium text-muted-foreground">Bootcamps</th>
                <th className="py-4 px-4 font-medium text-muted-foreground">Online courses</th>
                <th className="py-4 px-4 font-medium text-muted-foreground">YouTube / blogs</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { feature: 'Structured path', binder: true, degree: true, bootcamps: true, courses: true, free: false },
                { feature: 'Finishable (1-4 weeks)', binder: true, degree: false, bootcamps: false, courses: false, free: false },
                { feature: 'Curated by experts', binder: true, degree: true, bootcamps: true, courses: true, free: false },
                { feature: 'Active exercises', binder: true, degree: true, bootcamps: true, courses: true, free: false },
                { feature: 'Free to start', binder: true, degree: false, bootcamps: false, courses: false, free: true },
                { feature: 'No video lectures', binder: true, degree: false, bootcamps: false, courses: false, free: false },
                { feature: 'Open web resources', binder: true, degree: false, bootcamps: false, courses: false, free: true },
                { feature: 'Curator-friendly', binder: true, degree: false, bootcamps: false, courses: false, free: true },
              ].map(({ feature, binder, degree, bootcamps, courses, free }) => (
                <tr key={feature}>
                  <td className="py-3 pr-4 font-medium">{feature}</td>
                  <td className="py-3 px-4 text-center">{binder ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 text-center">{degree ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 text-center">{bootcamps ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 text-center">{courses ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 text-center">{free ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {[
            { name: 'Syllabind', highlight: true, features: ['Structured path', 'Finishable (1-4 weeks)', 'Curated by experts', 'Active exercises', 'Free to start', 'No video lectures', 'Open web resources', 'Curator-friendly'] },
            { name: 'Degree programs', highlight: false, features: ['Structured path', 'Curated by experts', 'Active exercises'] },
            { name: 'Bootcamps', highlight: false, features: ['Structured path', 'Curated by experts', 'Active exercises'] },
            { name: 'Online courses', highlight: false, features: ['Structured path', 'Curated by experts', 'Active exercises'] },
            { name: 'YouTube / blogs', highlight: false, features: ['Free to start', 'Open web resources', 'Curator-friendly'] },
          ].map(({ name, highlight, features }) => (
            <div key={name} className={`rounded-xl border p-5 space-y-3 ${highlight ? 'border-primary border-2' : ''}`}>
              <h3 className={`font-display font-medium ${highlight ? 'text-lg' : 'text-base text-muted-foreground'}`}>{name}</h3>
              <ul className="space-y-1.5">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`h-3.5 w-3.5 shrink-0 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Plans & Pricing */}
      <section className="pricing-section space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-display">Plans & Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border bg-card p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-display font-medium">Free</h3>
              <p className="text-muted-foreground mt-1">For readers getting started</p>
            </div>
            <div className="text-4xl font-display font-medium">
              $0<span className="text-lg text-muted-foreground font-normal">/mo</span>
            </div>
            <ul className="space-y-3">
              {['Enroll in binders', 'Track your progress', 'Submit exercises'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="w-full rounded-full" onClick={handleWaitlistClick}>
              Get started
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 space-y-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Coming soon</span>
            </div>
            <div>
              <h3 className="text-2xl font-display font-medium">Pro</h3>
              <p className="text-muted-foreground mt-1">For curators and power readers</p>
            </div>
            <div className="text-4xl font-display font-medium">
              TBD<span className="text-lg text-muted-foreground font-normal">/mo</span>
            </div>
            <ul className="space-y-3">
              {['Everything in Free', 'Create unlimited binders', 'Analytics & reader insights', 'Priority support'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full rounded-full bg-black text-white hover:bg-neutral-800 border-none" onClick={handleWaitlistClick}>
              Join waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section space-y-12 max-w-3xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-display">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y">
          {[
            { q: 'What is a Binder?', a: 'A Binder is a curated, multi-week learning path with readings and exercises. Think of it as a structured course you can actually finish.' },
            { q: 'Is Syllabind free?', a: 'Yes — readers can enroll in binders, track progress, and submit exercises for free. A Pro plan for curators is coming soon.' },
            { q: 'How long does a Binder take?', a: 'Most binders are 1 to 4 weeks, designed for roughly 2-4 hours per week. Short enough to finish, long enough to go deep.' },
            { q: 'Can I create my own Binder?', a: 'Absolutely. Sign up, switch to curator mode, and start building. You can curate readings from anywhere on the web and add your own exercises.' },
            { q: 'How do curators get paid?', a: 'We are still finalizing curator compensation. Join the waitlist or reach out to learn more.' },
          ].map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none text-lg font-medium">
                {q}
                <Plus className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
