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
import { useState } from 'react';
import { LearnerProfile, Submission } from '@/lib/types';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

export default function CreatorLearners() {
  const [match, params] = useRoute('/creator/syllabus/:id/learners');
  const { getSyllabusById, getLearnersForSyllabus, cohorts, createCohort, assignLearnerToCohort, getSubmissionsForStep, provideFeedback } = useStore();
  const [, setLocation] = useLocation();

  const syllabusId = params?.id;
  const syllabus = syllabusId ? getSyllabusById(syllabusId) : undefined;

  const [activeTab, setActiveTab] = useState('learners');
  const [newCohortName, setNewCohortName] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null); // For cohort assignment dialog
  const [selectedSubmission, setSelectedSubmission] = useState<{ stepId: string, learnerId: string, submission: Submission } | null>(null); // For grading dialog
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [grade, setGrade] = useState('');
  const [rubricUrl, setRubricUrl] = useState('');

  if (!syllabus) return <div>Syllabus not found</div>;

  const learners = getLearnersForSyllabus(syllabus.id);
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
    assignLearnerToCohort(cohortId, learnerId);
  };

  const openGrading = (stepId: string, learnerId: string, submission: Submission) => {
    setSelectedSubmission({ stepId, learnerId, submission });
    setFeedbackText(submission.feedback || '');
    setGrade(submission.grade || '');
    setRubricUrl(submission.rubricUrl || '');
  };

  const saveFeedback = () => {
    if (selectedSubmission) {
      provideFeedback(selectedSubmission.stepId, selectedSubmission.learnerId, {
        feedback: feedbackText,
        grade,
        rubricUrl
      });
      setSelectedSubmission(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href={`/creator/editor/${syllabus.id}`}>
               <Button variant="ghost" size="sm" className="gap-2">
                 <ArrowLeft className="h-4 w-4" /> Back to Editor
               </Button>
             </Link>
             <div className="h-6 w-px bg-border" />
             <div>
               <h1 className="font-serif text-xl">{syllabus.title}</h1>
               <p className="text-xs text-muted-foreground">Learner Management</p>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
             <TabsList>
               <TabsTrigger value="learners">All Learners</TabsTrigger>
               <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
               <TabsTrigger value="submissions">Submissions & Grading</TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="learners" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
              <div className="flex gap-2 w-full max-w-sm">
                <Input placeholder="Search learners..." className="bg-background" />
                <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {learners.length} Enrolled
              </div>
            </div>

            <div className="border rounded-lg bg-card">
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
                            <AvatarImage src={learner.user.avatarUrl} />
                            <AvatarFallback>{learner.user.name.charAt(0)}</AvatarFallback>
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
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-6">
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Active Cohorts</CardTitle>
                    <CardDescription>Group learners to manage them effectively.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {syllabusCohorts.map(cohort => (
                       <div key={cohort.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                          <div>
                            <h3 className="font-medium">{cohort.name}</h3>
                            <p className="text-sm text-muted-foreground">{cohort.learnerIds.length} learners</p>
                          </div>
                          <Button variant="outline" size="sm">Manage</Button>
                       </div>
                     ))}
                     {syllabusCohorts.length === 0 && (
                       <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                         No cohorts created yet.
                       </div>
                     )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Create Cohort</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Cohort Name</Label>
                      <Input 
                        placeholder="e.g. Spring 2024" 
                        value={newCohortName}
                        onChange={(e) => setNewCohortName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateCohort} disabled={!newCohortName.trim()} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Create Cohort
                    </Button>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
             <div className="space-y-8">
               {exerciseSteps.map(step => {
                 const submissions = getSubmissionsForStep(step.id);
                 const submissionList = Object.values(submissions);
                 const sharedSubmissions = submissionList.filter(s => s.isShared);
                 
                 return (
                   <div key={step.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-6 py-4 border-b flex justify-between items-center">
                         <div>
                           <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Week {step.weekIndex}</div>
                           <h3 className="font-medium">{step.title}</h3>
                         </div>
                         <Badge variant="outline">{sharedSubmissions.length} Submissions</Badge>
                      </div>
                      
                      <div className="divide-y">
                        {sharedSubmissions.length > 0 ? sharedSubmissions.map((sub, idx) => {
                          // Find learner
                          // Since submissions map keys are learnerIds (in getSubmissionsForStep logic), we need to find learner by ID?
                          // Wait, getSubmissionsForStep returns Record<learnerId, Submission>.
                          // But we converted to array via Object.values, so we lost the key.
                          // But wait, the Store logic sets the key as learnerId in the object? No, only in the Record.
                          // Let's refactor the iteration.
                          const learnerId = Object.keys(submissions).find(key => submissions[key] === sub);
                          const learner = learners.find(l => l.user.id === learnerId);
                          
                          if (!learner) return null;

                          return (
                            <div key={idx} className="p-6 flex gap-6 items-start hover:bg-muted/20 transition-colors">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={learner.user.avatarUrl} />
                                <AvatarFallback>{learner.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 space-y-2">
                                 <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{learner.user.name}</div>
                                      <div className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</div>
                                    </div>
                                    {sub.grade ? (
                                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        Grade: {sub.grade}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Needs Grading</Badge>
                                    )}
                                 </div>
                                 
                                 <div className="bg-muted p-3 rounded-md text-sm break-all flex items-center justify-between">
                                    <span className="font-mono">{sub.answer}</span>
                                    <a href={sub.answer.startsWith('http') ? sub.answer : `https://${sub.answer}`} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </a>
                                 </div>
                                 
                                 <div className="pt-2">
                                   <Button size="sm" variant="outline" onClick={() => openGrading(step.id, learner.user.id, sub)}>
                                     {sub.grade ? 'Edit Feedback' : 'Grade Submission'}
                                   </Button>
                                 </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="p-8 text-center text-muted-foreground italic">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Provide feedback, a grade, and rubric for the learner.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
             <div className="space-y-2">
               <Label>Feedback</Label>
               <RichTextEditor 
                 value={feedbackText} 
                 onChange={setFeedbackText} 
                 placeholder="Enter detailed feedback..." 
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Grade</Label>
                 <Input 
                   value={grade} 
                   onChange={(e) => setGrade(e.target.value)} 
                   placeholder="e.g. A, 90/100, Pass"
                 />
               </div>
               <div className="space-y-2">
                 <Label>Rubric URL (Optional)</Label>
                 <Input 
                   value={rubricUrl} 
                   onChange={(e) => setRubricUrl(e.target.value)} 
                   placeholder="https://..."
                 />
               </div>
             </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
            <Button onClick={saveFeedback}>Save & Send Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}