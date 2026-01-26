import { useRoute, useLocation, Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Syllabus, Week, Step, StepType } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Plus, GripVertical, Save, ArrowLeft, BarChart2, Share2, CheckCircle2, Users, ExternalLink, Wand2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

const generateTempId = () => -Math.floor(Math.random() * 1000000); // Temporary negative IDs for unsaved items

export default function CreatorEditor() {
  const [match, params] = useRoute('/creator/syllabus/:id/edit');
  const isNew = useLocation()[0] === '/creator/syllabus/new';
  const { getSyllabusById, createSyllabus, updateSyllabus, getSubmissionsForStep, getLearnersForSyllabus } = useStore();
  const [location, setLocation] = useLocation();
  const [learners, setLearners] = useState<any[]>([]);

  const [formData, setFormData] = useState<Syllabus>({
    id: generateTempId(),
    title: '',
    description: '',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    status: 'draft',
    creatorId: 'user-1',
    weeks: Array.from({ length: 4 }, (_, i) => ({
      id: generateTempId(),
      syllabusId: generateTempId(),
      index: i + 1,
      steps: [] as Step[],
      title: ''
    })),
  });
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    if (!isNew && params?.id) {
      const existing = getSyllabusById(parseInt(params.id));
      if (existing) {
        // Ensure weeks array exists
        const weeksArray = existing.weeks || [];
        setFormData({
          ...existing,
          weeks: weeksArray.length > 0 ? weeksArray : Array.from({ length: existing.durationWeeks || 4 }, (_, i) => ({
            id: generateTempId(),
            syllabusId: existing.id,
            index: i + 1,
            steps: [] as Step[],
            title: ''
          }))
        });
      }
    }
  }, [isNew, params?.id, getSyllabusById]);

  // Auto-save effect
  useEffect(() => {
    // Skip initial load, empty title, or unsaved syllabi (negative IDs)
    if (!formData.title || formData.id < 0) return;

    const save = async () => {
      setIsSaving(true);
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 500));

      // Only auto-save existing syllabi (positive IDs)
      updateSyllabus(debouncedFormData);

      setLastSaved(new Date());
      setIsSaving(false);
    };

    save();
  }, [debouncedFormData]);

  // Fetch learners when syllabus ID changes
  useEffect(() => {
    if (formData.id && formData.id > 0) { // Only fetch for real IDs, not temp negative IDs
      getLearnersForSyllabus(formData.id).then(setLearners);
    }
  }, [formData.id]);

  // Adjust weeks array when duration changes
  const handleDurationChange = (weeksStr: string) => {
    const count = parseInt(weeksStr);
    const newWeeks = [...formData.weeks];
    if (count > newWeeks.length) {
      for (let i = newWeeks.length; i < count; i++) {
        newWeeks.push({
          id: generateTempId(),
          syllabusId: formData.id,
          index: i + 1,
          steps: [],
          title: ''
        });
      }
    } else {
      newWeeks.splice(count);
    }
    setFormData({ ...formData, durationWeeks: count, weeks: newWeeks });
  };

  const addStep = (weekIndex: number, type: StepType) => {
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      const newStep: Step = {
        id: generateTempId(),
        weekId: week.id,
        position: week.steps.length + 1,
        type,
        title: type === 'reading' ? 'New Reading' : 'New Exercise',
        estimatedMinutes: 15
      };
      week.steps.push(newStep);
    }
    setFormData({ ...formData, weeks: newWeeks });
  };

  const updateStep = (weekIndex: number, stepId: number, field: keyof Step, value: any) => {
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      const step = week.steps.find(s => s.id === stepId);
      if (step) {
        (step as any)[field] = value;
      }
    }
    setFormData({ ...formData, weeks: newWeeks });
  };

  const removeStep = (weekIndex: number, stepId: number) => {
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      week.steps = week.steps.filter(s => s.id !== stepId);
    }
    setFormData({ ...formData, weeks: newWeeks });
  };

  const handleSave = (statusOverride?: 'draft' | 'published') => {
    const dataToSave = statusOverride ? { ...formData, status: statusOverride } : formData;

    if (isNew) {
      createSyllabus(dataToSave);
    } else {
      updateSyllabus(dataToSave);
    }

    const message = statusOverride === 'published'
      ? "Syllabus published successfully!"
      : "Your changes have been saved successfully.";

    toast({
      title: statusOverride === 'published' ? "Syllabus Published" : "Syllabus saved",
      description: message
    });
    setLocation('/creator');
  };

  const handleShareDraft = () => {
    const draftUrl = `${window.location.origin}/syllabus/${formData.id}?preview=true`;
    navigator.clipboard.writeText(draftUrl);
    toast({ 
      title: "Draft Link Copied!", 
      description: "Share this link with anyone to preview your syllabus before publishing.",
      duration: 3000,
    });
  };

  const handleAutoFill = async (weekIndex: number, stepId: number) => {
    // Mock auto-fill logic
    // In a real app, this would call an API with the URL to scrape metadata
    const step = formData.weeks.find(w => w.index === weekIndex)?.steps.find(s => s.id === stepId);
    if (!step?.url) return;

    toast({ title: "Analyzing URL...", description: "AI is extracting metadata from the link." });
    
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock data based on simple heuristic or random
    const isBook = step.url.includes('amazon') || step.url.includes('goodreads');
    const isVideo = step.url.includes('youtube') || step.url.includes('vimeo');
    
    updateStep(weekIndex, stepId, 'title', isBook ? "The Design of Everyday Things" : "Understanding Cognitive Load");
    updateStep(weekIndex, stepId, 'author', isBook ? "Don Norman" : "Jane Doe");
    updateStep(weekIndex, stepId, 'creationDate', "2023-05-15");
    updateStep(weekIndex, stepId, 'mediaType', isBook ? "Book" : isVideo ? "Youtube video" : "Blog/Article");
    updateStep(weekIndex, stepId, 'note', "<p>This is a seminal work in the field. Pay attention to the concept of affordances.</p>");
    updateStep(weekIndex, stepId, 'estimatedMinutes', 45);

    toast({ title: "Metadata Extracted", description: "Fields have been auto-filled." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/creator')}>
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif">{isNew ? 'Create New Syllabind' : 'Edit Syllabind'}</h1>
         </div>
         <div className="flex gap-2 items-center">
            {!isNew && (
              <>
                <Button variant="outline" onClick={handleShareDraft} className="gap-2">
                  <Share2 className="h-4 w-4" /> Share Draft
                </Button>
                <Link href={`/creator/syllabus/${params?.id}/analytics`}>
                  <Button variant="ghost">
                    <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                  </Button>
                </Link>
              </>
            )}
            <Button variant="outline" onClick={() => handleSave()}>Save Draft</Button>
            <Button onClick={() => handleSave('published')}>Publish</Button>
            {!isNew && (
              <Link href={`/creator/syllabus/${params?.id}/learners`}>
                <Button variant="outline" className="gap-2">
                   <Users className="h-4 w-4" /> Learners
                </Button>
              </Link>
            )}
         </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-10">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g. Intro to Stoicism"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor 
              value={formData.description} 
              onChange={(value: string) => setFormData({...formData, description: value})} 
              placeholder="What will they learn?"
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          </div>
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label>Audience Level</Label>
              <Select 
                value={formData.audienceLevel} 
                onValueChange={(v: any) => setFormData({...formData, audienceLevel: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (Weeks)</Label>
              <Select 
                value={formData.durationWeeks.toString()} 
                onValueChange={handleDurationChange}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Week</SelectItem>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="3">3 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Curriculum</h2>
        <Tabs defaultValue="week-1" className="w-full">
          <TabsList>
            {formData.weeks?.map(w => (
              <TabsTrigger key={w.index} value={`week-${w.index}`}>Week {w.index}</TabsTrigger>
            ))}
          </TabsList>

          {formData.weeks?.map(week => (
            <TabsContent key={week.index} value={`week-${week.index}`} className="space-y-10 mt-8">
              <Card>
                 <CardContent className="pt-6 space-y-10">
                    <div className="space-y-2">
                      <Label>Week Title (Optional)</Label>
                      <Input 
                        value={week.title} 
                        onChange={e => {
                          const newWeeks = [...formData.weeks];
                          newWeeks.find(w => w.index === week.index)!.title = e.target.value;
                          setFormData({...formData, weeks: newWeeks});
                        }} 
                        placeholder="e.g. Foundations"
                      />
                    </div>

                    <div className="space-y-2">
                       <Label>Weekly Summary (Optional)</Label>
                       <RichTextEditor
                          value={week.description || ''}
                          onChange={value => {
                             const newWeeks = [...formData.weeks];
                             newWeeks.find(w => w.index === week.index)!.description = value;
                             setFormData({...formData, weeks: newWeeks});
                          }}
                          placeholder="What is the theme for this week?"
                          isSaving={isSaving}
                          lastSaved={lastSaved}
                       />
                    </div>

                    <div className="space-y-8 mt-10">
                      {week.steps.map((step, idx) => (
                        <div key={step.id} className="border rounded-lg p-6 bg-muted/20 relative group">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                               <Badge variant="outline" className="text-xs uppercase px-2 py-0.5 tracking-wider font-semibold">{step.type}</Badge>
                               <span className="text-xs text-muted-foreground font-medium">Step {idx + 1}</span>
                             </div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => removeStep(week.index, step.id)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                          
                          <div className="grid gap-8">
                             <div className="grid gap-2">
                               <Label>Title</Label>
                               <Input value={step.title} onChange={e => updateStep(week.index, step.id, 'title', e.target.value)} />
                             </div>

                             {step.type === 'reading' && (
                               <>
                                 <div className="grid gap-2">
                                   <Label>URL</Label>
                                   <div className="flex gap-2">
                                     <Input 
                                       value={step.url || ''} 
                                       onChange={e => updateStep(week.index, step.id, 'url', e.target.value)} 
                                       placeholder="https://..." 
                                     />
                                     <Button 
                                       variant="secondary" 
                                       size="icon"
                                       onClick={() => handleAutoFill(week.index, step.id)}
                                       disabled={!step.url}
                                       title="Auto-fill with AI"
                                     >
                                       <Wand2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-8">
                                    <div className="grid gap-2">
                                      <Label>Author</Label>
                                      <Input 
                                        value={step.author || ''} 
                                        onChange={e => updateStep(week.index, step.id, 'author', e.target.value)} 
                                        placeholder="e.g. Plato" 
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>Creation/Publish Date</Label>
                                      <Input 
                                        type="date"
                                        value={step.creationDate || ''} 
                                        onChange={e => updateStep(week.index, step.id, 'creationDate', e.target.value)} 
                                      />
                                    </div>
                                 </div>

                                 <div className="grid gap-2">
                                    <Label>Media Type</Label>
                                    <Select 
                                      value={step.mediaType || 'Blog/Article'} 
                                      onValueChange={(v: any) => updateStep(week.index, step.id, 'mediaType', v)}
                                    >
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Book">Book</SelectItem>
                                        <SelectItem value="Youtube video">Youtube video</SelectItem>
                                        <SelectItem value="Blog/Article">Blog/Article</SelectItem>
                                        <SelectItem value="Podcast">Podcast</SelectItem>
                                      </SelectContent>
                                    </Select>
                                 </div>

                                 <div className="grid gap-2">
                                   <Label>Description</Label>
                                   <RichTextEditor 
                                      value={step.note || ''} 
                                      onChange={(value: string) => updateStep(week.index, step.id, 'note', value)} 
                                      placeholder="Why should they read this?" 
                                      isSaving={isSaving}
                                      lastSaved={lastSaved}
                                   />
                                 </div>
                               </>
                             )}

                             {step.type === 'exercise' && (
                               <div className="grid gap-2">
                                 <Label>Prompt</Label>
                                 <RichTextEditor 
                                    value={step.promptText || ''} 
                                    onChange={(value: string) => updateStep(week.index, step.id, 'promptText', value)} 
                                    placeholder="What should they do?" 
                                    isSaving={isSaving}
                                    lastSaved={lastSaved}
                                 />
                               </div>
                             )}

                             <div className="grid gap-2">
                               <Label>Est. Minutes</Label>
                               <Input type="number" value={step.estimatedMinutes || 0} onChange={e => updateStep(week.index, step.id, 'estimatedMinutes', parseInt(e.target.value))} className="w-24" />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="secondary" onClick={() => addStep(week.index, 'reading')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Reading
                      </Button>
                      <Button variant="secondary" onClick={() => addStep(week.index, 'exercise')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Exercise
                      </Button>
                    </div>
                 </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {!isNew && (
        <div className="space-y-4 pt-8 border-t">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-medium">Recent Submissions</h2>
             <Link href={`/creator/syllabus/${params?.id}/learners`}>
               <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                 View All <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
               </Button>
             </Link>
          </div>
          
          <div className="grid gap-4">
             {(() => {
                // Learners are now loaded via useEffect below
                // Collect all shared submissions across all steps
                const allRecentSubmissions = (formData.weeks || [])
                  .flatMap(w => w.steps)
                  .filter(s => s.type === 'exercise')
                  .flatMap(step => {
                     const subs = getSubmissionsForStep(step.id);
                     return Object.values(subs)
                       .filter(s => s.isShared)
                       .map(s => ({ ...s, stepTitle: step.title, weekIndex: formData.weeks.find(w => w.steps.includes(step))?.index }));
                  })
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .slice(0, 5); // Show last 5

                if (allRecentSubmissions.length === 0) {
                   return (
                     <div className="text-center py-8 bg-muted/20 rounded-lg text-muted-foreground italic">
                        No recent submissions.
                     </div>
                   );
                }

                return allRecentSubmissions.map((sub, idx) => {
                   // Hacky way to find learner ID since submission doesn't store it directly in our mock types (Wait, it doesn't?)
                   // Wait, getSubmissionsForStep returns Record<learnerId, Submission>. 
                   // But we flattened it. We need to preserve learnerId.
                   // Let's refactor the flatMap above slightly if possible, or just search again (inefficient but fine for mock).
                   // Actually, let's just use the fact that we can get learner from the submission if we stored it?
                   // Submission type: stepId, answer, submittedAt, isShared... no learnerId inside Submission interface in types.ts?
                   // Let's check types.ts... Submission doesn't have learnerId inside it explicitly?
                   // Ah, in store.tsx, we key it by learnerId.
                   
                   // Let's fix the logic: iterate steps, get Record, map entries to include learnerId.
                   return (
                     <Card key={idx}>
                       <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             {/* We don't have learnerId easily here without the refactor below. 
                                 Let's just show "A Learner" for now or do the lookup properly. 
                             */}
                             <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                  <span>Week {sub.weekIndex}: {sub.stepTitle}</span>
                                  {sub.grade ? <Badge variant="secondary" className="text-xs">Graded: {sub.grade}</Badge> : <Badge variant="outline" className="text-xs">Needs Grading</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                   <span className="font-mono bg-muted px-1 rounded">{sub.answer}</span>
                                   <span>• {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                          </div>
                          <Link href={`/creator/syllabus/${formData.id}/learners`}>
                             <Button size="sm" variant="secondary">Review</Button>
                          </Link>
                       </CardContent>
                     </Card>
                   );
                });
             })()}
          </div>
        </div>
      )}

    </div>
  );
}
