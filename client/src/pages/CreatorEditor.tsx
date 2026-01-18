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
import { Trash2, Plus, GripVertical, Save, ArrowLeft, BarChart2, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function CreatorEditor() {
  const [match, params] = useRoute('/creator/syllabus/:id/edit');
  const isNew = useLocation()[0] === '/creator/syllabus/new';
  const { getSyllabusById, createSyllabus, updateSyllabus } = useStore();
  const [location, setLocation] = useLocation();

  const [formData, setFormData] = useState<Syllabus>({
    id: generateId(),
    title: '',
    description: '',
    audienceLevel: 'Beginner',
    durationWeeks: 4,
    status: 'draft',
    creatorId: 'user-1',
    weeks: Array.from({ length: 4 }, (_, i) => ({ index: i + 1, steps: [] as Step[], title: '' })),
  });

  useEffect(() => {
    if (!isNew && params?.id) {
      const existing = getSyllabusById(params.id);
      if (existing) {
        setFormData(existing);
      }
    }
  }, [isNew, params?.id, getSyllabusById]);

  // Adjust weeks array when duration changes
  const handleDurationChange = (weeksStr: string) => {
    const count = parseInt(weeksStr);
    const newWeeks = [...formData.weeks];
    if (count > newWeeks.length) {
      for (let i = newWeeks.length; i < count; i++) {
        newWeeks.push({ index: i + 1, steps: [], title: '' });
      }
    } else {
      newWeeks.splice(count);
    }
    setFormData({ ...formData, durationWeeks: count, weeks: newWeeks });
  };

  const addStep = (weekIndex: number, type: StepType) => {
    const newStep: Step = {
      id: generateId(),
      type,
      title: type === 'reading' ? 'New Reading' : 'New Exercise',
      estimatedMinutes: 15
    };
    
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      week.steps.push(newStep);
    }
    setFormData({ ...formData, weeks: newWeeks });
  };

  const updateStep = (weekIndex: number, stepId: string, field: keyof Step, value: any) => {
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

  const removeStep = (weekIndex: number, stepId: string) => {
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      week.steps = week.steps.filter(s => s.id !== stepId);
    }
    setFormData({ ...formData, weeks: newWeeks });
  };

  const handleSave = () => {
    if (isNew) {
      createSyllabus(formData);
    } else {
      updateSyllabus(formData);
    }
    toast({ title: "Syllabus saved", description: "Your changes have been saved successfully." });
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/creator')}>
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif">{isNew ? 'Create New Syllabind' : 'Edit Syllabind'}</h1>
         </div>
         <div className="flex gap-2">
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
            <Button variant="outline" onClick={handleSave}>Save Draft</Button>
            <Button onClick={() => { setFormData({...formData, status: 'published'}); handleSave(); }}>Publish</Button>
         </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            {formData.weeks.map(w => (
              <TabsTrigger key={w.index} value={`week-${w.index}`}>Week {w.index}</TabsTrigger>
            ))}
          </TabsList>
          
          {formData.weeks.map(week => (
            <TabsContent key={week.index} value={`week-${week.index}`} className="space-y-4 mt-4">
              <Card>
                 <CardContent className="pt-6 space-y-4">
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

                    <div className="space-y-4 mt-6">
                      {week.steps.map((step, idx) => (
                        <div key={step.id} className="border rounded-lg p-4 bg-muted/20 relative group">
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                             onClick={() => removeStep(week.index, step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="grid gap-4">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge variant="outline" className="text-xs uppercase">{step.type}</Badge>
                               <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                             </div>
                             
                             <div className="grid gap-2">
                               <Label>Title</Label>
                               <Input value={step.title} onChange={e => updateStep(week.index, step.id, 'title', e.target.value)} />
                             </div>

                             {step.type === 'reading' && (
                               <div className="grid gap-2">
                                 <Label>URL</Label>
                                 <Input value={step.url || ''} onChange={e => updateStep(week.index, step.id, 'url', e.target.value)} placeholder="https://..." />
                               </div>
                             )}

                             {step.type === 'exercise' && (
                               <div className="grid gap-2">
                                 <Label>Prompt</Label>
                                 <RichTextEditor 
                                    value={step.promptText || ''} 
                                    onChange={(value: string) => updateStep(week.index, step.id, 'promptText', value)} 
                                    placeholder="What should they do?" 
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
    </div>
  );
}
