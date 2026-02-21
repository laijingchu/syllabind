import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BookOpen, CheckCircle, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Marketing() {
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
    <div className="max-w-6xl mx-auto space-y-24 pb-20 pt-8">
      {/* Alpha Banner */}
      <div className="bg-primary/0 border border-primary/20 text-primary p-3 rounded-full text-center text-sm font-medium animate-in fade-in slide-in-from-top-4 mt-[0px] mb-[0px]">
        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mr-2">Alpha</span>
        Syllabind is currently in private alpha. Learners can sign up now, but curation access is by application only.
      </div>
      {/* A. Hero */}
      <section className="text-center space-y-8 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-foreground">
            Syllabind<span className="text-primary">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-display italic">Stay on top of chaos with one calm syllabus at a time.</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn expert listicles into four-week learning journeys you can actually finish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link href="/login?mode=signup">
             <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-black text-white hover:bg-neutral-800 border-none">
               Sign up
             </Button>
           </Link>
           <Link href="/catalog">
             <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-primary/20 hover:border-primary/50 text-primary">
               See a sample Syllabind
             </Button>
           </Link>
        </div>

        {/* Hero Visual */}
        <div className="relative mt-12 mx-auto max-w-4xl rounded-xl border bg-card shadow-2xl overflow-hidden aspect-[16/9] group text-left">
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10 pointer-events-none" />
           
           <div className="flex h-full">
              {/* Sidebar Mock */}
              <div className="w-1/3 bg-secondary/20 border-r p-6 space-y-6 hidden sm:block">
                 <div className="space-y-2">
                    <div className="h-2 w-20 bg-muted rounded-full" />
                    <div className="h-6 w-32 bg-primary/20 rounded-md" />
                 </div>
                 <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3 p-2 bg-background rounded-md border shadow-sm">
                       <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                       <div className="text-xs font-medium">Foundations</div>
                    </div>
                    <div className="flex items-center gap-3 p-2 opacity-50">
                       <div className="h-5 w-5 rounded-full border border-muted flex items-center justify-center text-[10px]">2</div>
                       <div className="text-xs font-medium">Tools & Setup</div>
                    </div>
                    <div className="flex items-center gap-3 p-2 opacity-50">
                       <div className="h-5 w-5 rounded-full border border-muted flex items-center justify-center text-[10px]">3</div>
                       <div className="text-xs font-medium">Deep Dive</div>
                    </div>
                 </div>
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 p-6 md:p-8 space-y-6 bg-card">
                 <div className="space-y-2">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider">Week 1</div>
                    <h3 className="text-2xl font-display">The Philosophy of Less</h3>
                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                       <div className="h-full w-1/3 bg-primary" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-4 p-4 border rounded-lg bg-background shadow-sm">
                       <div className="h-5 w-5 rounded border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                       </div>
                       <div>
                          <div className="text-sm font-medium line-through text-muted-foreground">Reading: Why We Are Distracted</div>
                          <div className="text-xs text-muted-foreground mt-1">15 min read • James Williams</div>
                       </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 p-4 border rounded-lg bg-background shadow-sm">
                       <div className="h-5 w-5 rounded border-2 border-muted" />
                       <div>
                          <div className="text-sm font-medium">Exercise: Audit Your Screen Time</div>
                          <div className="text-xs text-muted-foreground mt-1">Check your stats and write down top 3 apps.</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>
      {/* B. "Why" Section */}
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-display">The internet made learning infinite.<br/>It also made it unbearable.</h2>
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
            <CardTitle className="font-display">One at a time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No juggling five courses. Commit to one path this month and actually finish it.</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-display">4-Week Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Finite, finishable journeys. Clear weekly plans that fit into your busy life.</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors">
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="font-display">Active Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Don't just read. Respond to prompts, complete exercises, and build meaningful, fun projects.</p>
          </CardContent>
        </Card>
      </section>
      {/* D. Calm Learning Principles */}
      <section className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display">Calm Learning Principles</h2>
          <p className="text-muted-foreground text-lg">We designed Syllabind to be the antidote to information overload.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
           {[
             { title: "One syllabus at a time", desc: "Each learner can have only one active Syllabind. Finish it before you start another." },
             { title: "Four weeks max", desc: "Long enough to go deep, short enough to actually finish. No endless courses." },
             { title: "Weekly time caps", desc: "Respect your time. ~2h reading + ~2h exercises per week. Quality over quantity." },
             { title: "No previewing ahead", desc: "Stay present. Future weeks unlock only when you reach them." },
             { title: "Active > Passive", desc: "Don't just consume. Every few readings includes a prompt to apply what you learned." },
             { title: "Trackable completion", desc: "A clear finish line. Earn your badge when all steps and submissions are done." }
           ].map((item, i) => (
             <div key={i} className="flex gap-4">
               <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-display font-medium shrink-0">
                 {i + 1}
               </div>
               <div>
                 <h3 className="font-medium text-lg mb-1">{item.title}</h3>
                 <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
               </div>
             </div>
           ))}
        </div>
      </section>
      {/* E. Split Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center bg-card rounded-2xl border p-8 md:p-12 shadow-sm">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
            Learners
          </div>
          <h3 className="text-3xl font-display">For overwhelmed professionals</h3>
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
          <div className="pt-2">
            <Link href="/login?mode=signup">
              <Button size="lg" className="w-full sm:w-auto">Sign up</Button>
            </Link>
          </div>
        </div>
        <div className="space-y-6 border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-12">
           <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Thought Leaders
          </div>
          <h3 className="text-3xl font-display">For those who want to teach</h3>
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
          <div className="pt-2">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                document.getElementById('curate')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Apply to curate
            </Button>
          </div>
        </div>
      </section>
      {/* F. Testimonials */}
      <section className="space-y-12">
        <h2 className="text-3xl font-display text-center">What early learners say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Finally, I finished a course on AI instead of just bookmarking 50 threads about it.", author: "Sarah J.", role: "Product Manager" },
            { quote: "The 'one at a time' rule is genius. It forced me to focus and actually do the work.", author: "David K.", role: "Developer" },
            { quote: "I love that I can't jump ahead. It makes me enjoy the current week's readings more.", author: "Elena R.", role: "Designer" }
          ].map((t, i) => (
            <Card key={i} className="bg-muted/30 border-none shadow-none">
              <CardContent className="pt-6 space-y-4">
                <div className="text-primary text-4xl font-display leading-none opacity-20">"</div>
                <p className="text-lg italic text-muted-foreground relative z-10 -mt-4 mb-4">
                   {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                   <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {t.author.charAt(0)}
                   </div>
                   <div>
                      <div className="font-medium text-sm">{t.author}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* G. Curate Application */}
      <section id="curate" className="max-w-xl mx-auto text-center space-y-8 bg-primary/5 rounded-3xl p-8 md:p-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-display">Apply to Curate</h2>
          <p className="text-muted-foreground">
            We are looking for thoughtful curators to build high-quality, finishable learning paths. Tell us about the syllabus you want to bind.
          </p>
        </div>

        {submitted ? (
          <div className="bg-background p-6 rounded-lg border shadow-sm animate-in zoom-in duration-300">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Application Received</h3>
            <p className="text-muted-foreground">Thanks for your interest in curating. We’ll review your application and be in touch soon.</p>
            <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Send another application</Button>
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
               <Label htmlFor="expertise">What is your area of expertise?</Label>
               <Input id="expertise" placeholder="e.g. Behavioral Psychology, Sustainable Design..." className="bg-background" />
            </div>

            <div className="space-y-2">
               <Label htmlFor="interest">Describe the syllabus you want to create</Label>
               <Textarea id="interest" placeholder="What are the key goals and resources?" className="bg-background h-32" />
            </div>

            <Button type="submit" size="lg" className="w-full bg-black text-white hover:bg-neutral-800">Submit Application</Button>
          </form>
        )}
      </section>
    </div>
  );
}
