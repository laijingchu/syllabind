import { useRoute, Link, useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Users, Search, Filter, ExternalLink, Check, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LearnerProfile, Submission, Syllabus } from '@/lib/types';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

export default function SyllabindLearners() {
  const [match, params] = useRoute('/creator/syllabus/:id/learners');
  const { getSyllabusById, getLearnersForSyllabus, getSubmissionsForStep } = useStore();
  const [, setLocation] = useLocation();

  // All state hooks at the top
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('learners');
  const [newCohortName, setNewCohortName] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<{ stepId: number, learnerId: string, submission: Submission } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [grade, setGrade] = useState('');
  const [rubricUrl, setRubricUrl] = useState('');

  const syllabusId = params?.id ? parseInt(params.id) : undefined;

  // Fetch full syllabus with weeks and steps
  useEffect(() => {
    if (syllabusId) {
      fetch(`/api/syllabi/${syllabusId}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setSyllabus(data))
        .catch(err => console.error('Failed to fetch syllabus:', err));
    }
  }, [syllabusId]);

  // Fetch learners asynchronously
  useEffect(() => {
    if (syllabusId) {
      getLearnersForSyllabus(syllabusId).then(({ classmates }) => setLearners(classmates));
    }
  }, [syllabusId]);

  if (!syllabus) return <div>Loading...</div>;

  // Mock cohort data (not yet implemented in store)
  const cohorts: any[] = [];
  const createCohort = (name: string, syllabusId: number) => console.log('Create cohort:', name, syllabusId);
  const assignLearnerToCohort = (learnerId: string, cohortId: number) => console.log('Assign learner:', learnerId, cohortId);
  const provideFeedback = (stepId: number, learnerId: string, feedback: string, grade: string, rubricUrl: string) => console.log('Provide feedback:', stepId, learnerId, feedback, grade, rubricUrl);

  const syllabusCohorts = cohorts.filter(c => c.syllabusId === syllabus.id);

  // Get all exercise steps for this syllabus
  const exerciseSteps = syllabus.weeks.flatMap(w => w.steps.filter(s => s.type === 'exercise').map(s => ({ ...s, weekIndex: w.index })));

  const handleCreateCohort = () => {
    if (newCohortName.trim()) {
      createCohort(newCohortName, syllabus.id);
      setNewCohortName('');
    }
  };

  const handleAssignCohort = (learnerId: string, cohortId: string) => {
    const cohortIdNum = cohortId === "unassigned" ? 0 : parseInt(cohortId);
    assignLearnerToCohort(learnerId, cohortIdNum);
  };

  const openGrading = (stepId: number, learnerId: string, submission: Submission) => {
    setSelectedSubmission({ stepId, learnerId, submission });
    setFeedbackText(submission.feedback || '');
    setGrade(submission.grade || '');
    setRubricUrl(submission.rubricUrl || '');
  };

  const saveFeedback = () => {
    if (selectedSubmission) {
      provideFeedback(selectedSubmission.stepId, selectedSubmission.learnerId, feedbackText, grade, rubricUrl);
      setSelectedSubmission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
             <Link href={`/creator/syllabus/${syllabus.id}/edit`}>
               <Button variant="ghost" size="sm" className="gap-2 -ml-2 sm:ml-0">
                 <ArrowLeft className="h-4 w-4" /> Back to Editor
               </Button>
             </Link>
             <div className="hidden sm:block h-6 w-px bg-border" />
             <div>
               <h1 className="font-display text-lg sm:text-xl">{syllabus.title}</h1>
               <p className="text-xs text-muted-foreground">Learner Management</p>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
             <TabsList className="w-full sm:w-auto inline-flex">
               <TabsTrigger value="learners" className="text-xs sm:text-sm">Learners</TabsTrigger>
               <TabsTrigger value="cohorts" className="text-xs sm:text-sm">Cohorts</TabsTrigger>
               <TabsTrigger value="submissions" className="text-xs sm:text-sm">Submissions</TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="learners" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card p-3 sm:p-4 rounded-lg border">
              <div className="flex gap-2 w-full sm:max-w-sm">
                <Input placeholder="Search learners..." className="bg-background text-sm" />
                <Button variant="outline" size="icon" className="shrink-0"><Search className="h-4 w-4" /></Button>
              </div>
              <div className="text-sm text-muted-foreground text-center sm:text-right">
                {learners.length} Enrolled
              </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block border rounded-lg bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners.map((learner) => (
                    <TableRow key={learner.user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={learner.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${learner.user.name || learner.user.username}`} />
                            <AvatarFallback>{(learner.user.name || learner.user.username || '?').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{learner.user.name}</div>
                            <div className="text-xs text-muted-foreground">{learner.user.email || 'No email'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={learner.status === 'completed' ? 'default' : 'secondary'}>
                          {learner.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(learner.joinedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                         <Select
                           value={learner.cohortId || "unassigned"}
                           onValueChange={(val) => handleAssignCohort(learner.user.id, val === "unassigned" ? "" : val)}
                         >
                           <SelectTrigger className="w-[140px] h-8 text-xs">
                             <SelectValue placeholder="Assign Cohort" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="unassigned">Unassigned</SelectItem>
                             {syllabusCohorts.map(c => (
                               <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {learners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No learners enrolled yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {learners.map((learner) => (
                <div key={learner.user.id} className="border rounded-lg bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={learner.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${learner.user.name || learner.user.username}`} />
                        <AvatarFallback>{(learner.user.name || learner.user.username || '?').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{learner.user.name}</div>
                        <div className="text-xs text-muted-foreground">{learner.user.email || 'No email'}</div>
                      </div>
                    </div>
                    <Badge variant={learner.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {learner.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(learner.joinedDate).toLocaleDateString()}
                    </div>
                    <Select
                      value={learner.cohortId || "unassigned"}
                      onValueChange={(val) => handleAssignCohort(learner.user.id, val === "unassigned" ? "" : val)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Cohort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {syllabusCohorts.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {learners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                  No learners enrolled yet.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-4 sm:space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <Card className="md:col-span-2 order-2 md:order-1">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Active Cohorts</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Group learners to manage them effectively.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                     {syllabusCohorts.map(cohort => (
                       <div key={cohort.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">{cohort.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{cohort.learnerIds.length} learners</p>
                          </div>
                          <Button variant="outline" size="sm">Manage</Button>
                       </div>
                     ))}
                     {syllabusCohorts.length === 0 && (
                       <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm border-dashed border-2 rounded-lg">
                         No cohorts created yet.
                       </div>
                     )}
                  </CardContent>
                </Card>

                <Card className="order-1 md:order-2">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Create Cohort</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid gap-2">
                      <Label className="text-sm">Cohort Name</Label>
                      <Input
                        placeholder="e.g. Spring 2024"
                        value={newCohortName}
                        onChange={(e) => setNewCohortName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button onClick={handleCreateCohort} disabled={!newCohortName.trim()} className="w-full" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Create Cohort
                    </Button>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4 sm:space-y-6">
             <div className="space-y-4 sm:space-y-8">
               {exerciseSteps.map(step => {
                 const submissions = getSubmissionsForStep(step.id);
                 const submissionList = Object.values(submissions);
                 const sharedSubmissions = submissionList.filter(s => s.isShared);

                 return (
                   <div key={step.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                         <div>
                           <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">Week {step.weekIndex}</div>
                           <h3 className="font-medium text-sm sm:text-base">{step.title}</h3>
                         </div>
                         <Badge variant="outline" className="w-fit text-xs">{sharedSubmissions.length} Submissions</Badge>
                      </div>

                      <div className="divide-y">
                        {sharedSubmissions.length > 0 ? sharedSubmissions.map((sub, idx) => {
                          const learnerId = Object.keys(submissions).find(key => submissions[key] === sub);
                          const learner = learners.find(l => l.user.id === learnerId);

                          if (!learner) return null;

                          return (
                            <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start hover:bg-muted/20 transition-colors">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                <AvatarImage src={learner.user.avatarUrl} />
                                <AvatarFallback>{learner.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>

                              <div className="flex-1 space-y-2 w-full min-w-0">
                                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                    <div>
                                      <div className="font-medium text-sm sm:text-base">{learner.user.name}</div>
                                      <div className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</div>
                                    </div>
                                    {sub.grade ? (
                                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs w-fit">
                                        Grade: {sub.grade}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs w-fit">Needs Grading</Badge>
                                    )}
                                 </div>

                                 <div className="bg-muted p-2 sm:p-3 rounded-md text-xs sm:text-sm break-all flex items-center justify-between gap-2">
                                    <span className="font-mono truncate">{sub.answer}</span>
                                    <a href={sub.answer.startsWith('http') ? sub.answer : `https://${sub.answer}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </a>
                                 </div>

                                 <div className="pt-1 sm:pt-2">
                                   <Button size="sm" variant="outline" onClick={() => openGrading(step.id, learner.user.id, sub)} className="text-xs sm:text-sm">
                                     {sub.grade ? 'Edit Feedback' : 'Grade Submission'}
                                   </Button>
                                 </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="p-6 sm:p-8 text-center text-muted-foreground italic text-sm">
                            No shared submissions for this exercise yet.
                          </div>
                        )}
                      </div>
                   </div>
                 );
               })}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Grade Submission</DialogTitle>
            <DialogDescription className="text-sm">
              Provide feedback, a grade, and rubric for the learner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
             <div className="space-y-2">
               <Label className="text-sm">Feedback</Label>
               <RichTextEditor
                 value={feedbackText}
                 onChange={setFeedbackText}
                 placeholder="Enter detailed feedback..."
               />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-sm">Grade</Label>
                 <Input
                   value={grade}
                   onChange={(e) => setGrade(e.target.value)}
                   placeholder="e.g. A, 90/100, Pass"
                   className="text-sm"
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-sm">Rubric URL (Optional)</Label>
                 <Input
                   value={rubricUrl}
                   onChange={(e) => setRubricUrl(e.target.value)}
                   placeholder="https://..."
                   className="text-sm"
                 />
               </div>
             </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedSubmission(null)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={saveFeedback} className="w-full sm:w-auto">Save & Send Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}