import { useStore } from '@/lib/store';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, CheckCircle2, Award } from 'lucide-react';
import { SyllabusCard } from '@/components/SyllabusCard';

export default function Dashboard() {
  const { enrollment, getActiveSyllabus, getOverallProgress, syllabi, getSyllabusById } = useStore();
  const activeSyllabus = getActiveSyllabus();

  // Filter completed syllabi
  const completedSyllabi = enrollment.completedSyllabusIds
    .map(id => getSyllabusById(id))
    .filter((s): s is typeof s & {} => !!s); // Type guard

  const isCompleted = activeSyllabus && getOverallProgress(activeSyllabus.id) === 100;
  
  const allCompleted = syllabi.length > 0 && syllabi.every(s => enrollment.completedSyllabusIds.includes(s.id));

  const suggestedSyllabi = syllabi
    .filter(s => 
      (!activeSyllabus || s.id !== activeSyllabus.id) && 
      !enrollment.completedSyllabusIds.includes(s.id)
    )
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-serif text-foreground mb-2">
            {allCompleted ? "Journey Complete" : "Current Focus"}
          </h1>
          <p className="text-muted-foreground">
            {allCompleted 
              ? "You have mastered all available topics." 
              : isCompleted 
                ? "Start new syllabind" 
                : "Pick up where you left off."
            }
          </p>
        </header>

        {allCompleted ? (
           <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-medium">All Syllabinds Completed</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">You've mastered every topic in our catalog. Amazing work! We will email you when new syllabinds become available.</p>
              </div>
            </CardContent>
          </Card>
        ) : activeSyllabus ? (
          <div className="relative rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
               <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {getOverallProgress(activeSyllabus.id) === 100 && (
              <div className="absolute -top-6 -right-6 h-28 w-28 text-primary-foreground rounded-full flex items-center justify-center shadow-xl border-4 border-background transform rotate-12 z-20 animate-in zoom-in duration-500 bg-[#ffffff]">
                <div className="text-center -ml-1 mt-2">
                  <Award className="h-8 w-8 mx-auto mb-1" />
                  <div className="text-[10px] font-bold uppercase tracking-widest">Done</div>
                </div>
              </div>
            )}
            
            <div className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-primary uppercase tracking-wider">
                    {getOverallProgress(activeSyllabus.id) === 100 ? 'Completed' : 'In Progress'}
                  </div>
                  <h2 className="text-3xl font-serif">{activeSyllabus.title}</h2>
                  <p className="text-muted-foreground max-w-xl">{activeSyllabus.description}</p>
                </div>
                
                {getOverallProgress(activeSyllabus.id) < 100 && (
                   <div className="flex flex-col items-end gap-2 min-w-[140px]">
                      <span className="text-2xl font-mono font-medium">{getOverallProgress(activeSyllabus.id)}%</span>
                      <span className="text-xs text-muted-foreground">Total Completion</span>
                   </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  {getOverallProgress(activeSyllabus.id) < 100 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Week {enrollment.currentWeekIndex} of {activeSyllabus.durationWeeks}</span>
                    </div>
                  )}
                  <Progress value={getOverallProgress(activeSyllabus.id)} className="h-2" />
                </div>
                
                {getOverallProgress(activeSyllabus.id) === 100 ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-primary">Syllabind Completed!</h3>
                          <p className="text-xs text-muted-foreground">You've earned the completion badge.</p>
                        </div>
                      </div>
                      <Link href={`/syllabus/${activeSyllabus.id}/completed`} className="w-full sm:w-auto sm:ml-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">View Certificate</Button>
                      </Link>
                    </div>

                    {suggestedSyllabi.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-dashed">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Start Something New</h4>
                          <Link href="/catalog" className="text-sm text-primary hover:underline">Browse Catalog &rarr;</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {suggestedSyllabi.map(syllabus => (
                            <SyllabusCard key={syllabus.id} syllabus={syllabus} className="h-full text-left" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={`/syllabus/${activeSyllabus.id}/week/${enrollment.currentWeekIndex}`}>
                    <Button size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Continue to Week {enrollment.currentWeekIndex}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="bg-muted p-4 rounded-full">
                <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-medium">No active Syllabind</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">You are not currently enrolled in any syllabus. Browse the catalog to find your next topic.</p>
              </div>
              <Link href="/catalog">
                <Button>Browse Catalog</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
      {completedSyllabi.length > 0 && (
        <section className="space-y-6">
          <header>
            <h2 className="text-2xl font-serif text-foreground mb-2">Completed Journey</h2>
            <p className="text-muted-foreground">Syllabi you have successfully finished.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedSyllabi.map(s => (
               <div key={s.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card/50">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-medium">{s.title}</h4>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto" asChild>
                    <Link href={`/syllabus/${s.id}/completed`}>View</Link>
                  </Button>
               </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
