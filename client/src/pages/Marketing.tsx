import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BookOpen, CheckCircle, Clock, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';

export default function Marketing() {
  const { signup } = useStore();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('learner');
  const [submitted, setSubmitted] = useState(false);

  const handleQuickSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Direct them to full signup or just fake it here?
      // PRD: "Get early access -> opens sign-up flow"
      // Let's redirect to login page with pre-filled email or just use the signup action if we want to be quick.
      // But specs say "Form (frontend spec) ... Success state: Thanks for signing up"
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-24 pb-20">
      {/* A. Hero */}
      <section className="text-center space-y-8 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-foreground">
            Syllabind<span className="text-primary">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic">Stay on top of chaos with one calm syllabus at a time.</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn expert listicles into four-week learning journeys you can actually finish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link href="/login?mode=signup">
             <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
               Get Early Access
             </Button>
           </Link>
           <Link href="/catalog">
             <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-primary/20 hover:border-primary/50 text-primary">
               See a sample Syllabind
             </Button>
           </Link>
        </div>

        {/* Hero Visual */}
        <div className="relative mt-12 mx-auto max-w-4xl rounded-xl border bg-card shadow-2xl overflow-hidden aspect-[16/9] group">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
           {/* Abstract UI representation */}
           <div className="p-8 grid grid-cols-[1fr_2fr] gap-8 h-full opacity-80">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-primary/20 rounded-md" />
                <div className="h-4 w-1/2 bg-muted rounded-md" />
                <div className="space-y-2 mt-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">{i}</div>
                      <div className="h-4 w-full bg-muted/50 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-muted/10 rounded-lg p-6 border border-border/50">
                 <div className="h-6 w-1/3 bg-primary/10 rounded-md mb-6" />
                 <div className="space-y-4">
                   <div className="h-24 bg-card rounded-md border shadow-sm p-4" />
                   <div className="h-24 bg-card rounded-md border shadow-sm p-4" />
                 </div>
              </div>
           </div>
        </div>
      </section>
      {/* B. "Why" Section */}
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-serif">The internet made learning infinite.<br/>It also made it unbearable.</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Feeds full of "ultimate guides" and threads. Saving hundreds of links but finishing none. 
          The constant anxiety of being behind. We replaced the joy of learning with the stress of collecting.
        </p>
      </section>
      {/* C. "What is Syllabind" Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card className="bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors">
          <CardHeader>
            <Clock className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-serif">One at a time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No juggling five courses. Commit to one path this month and actually finish it.</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-serif">4-Week Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Finite, finishable journeys. Clear weekly plans that fit into your busy life.</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors">
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-serif">Active Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Don't just read. Respond to prompts, complete exercises, and apply what you learn.</p>
          </CardContent>
        </Card>
      </section>
      {/* E. Split Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center bg-card rounded-2xl border p-8 md:p-12 shadow-sm">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
            Learners
          </div>
          <h3 className="text-3xl font-serif">For overwhelmed professionals</h3>
          <ul className="space-y-3">
            {[
              "Choose one structured syllabus instead of bookmarking 20 threads.",
              "See exactly what to do this week, not the whole mountain.",
              "Keep all your notes and submissions in one place."
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6 border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-12">
           <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Thought Leaders
          </div>
          <h3 className="text-3xl font-serif">For those who want to teach</h3>
          <ul className="space-y-3">
            {[
              "Dock your existing posts, videos, and resources into a linear syllabus.",
              "Add context and prompts so learners take action.",
              "See simple analytics: starts, completions, and drop-off."
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* G. Early Access */}
      <section className="max-w-xl mx-auto text-center space-y-8 bg-primary/5 rounded-3xl p-8 md:p-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif">Join the early access list</h2>
          <p className="text-muted-foreground">
            We’re starting Syllabind with a small group of learners and thought leaders who care about deep, structured learning.
          </p>
        </div>

        {submitted ? (
          <div className="bg-background p-6 rounded-lg border shadow-sm animate-in zoom-in duration-300">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">You're on the list!</h3>
            <p className="text-muted-foreground">Thanks for signing up. We’ll be in touch when the first Syllabinds are ready.</p>
            <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Sign up another email</Button>
          </div>
        ) : (
          <form onSubmit={handleQuickSignup} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                placeholder="you@example.com" 
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>I'm primarily a...</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="learner" id="learner" />
                  <Label htmlFor="learner" className="font-normal">Learner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="creator" />
                  <Label htmlFor="creator" className="font-normal">Creator</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal">Both</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
               <Label htmlFor="interest">What do you want to learn or teach?</Label>
               <Textarea id="interest" placeholder="e.g. Systems thinking, Product design..." className="bg-background h-20" />
            </div>

            <Button type="submit" size="lg" className="w-full">Get Early Access</Button>
          </form>
        )}
      </section>
    </div>
  );
}
