import { useRoute, useLocation, Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Syllabus, Week, Step, StepType } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Plus, GripVertical, Save, ArrowLeft, BarChart2, Share2, CheckCircle2, Users, ExternalLink, Wand2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { SyllabindChatPanel } from '@/components/SyllabindChatPanel';
import { GeneratingWeekPlaceholder } from '@/components/GeneratingWeekPlaceholder';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const generateTempId = () => -Math.floor(Math.random() * 1000000); // Temporary negative IDs for unsaved items

export default function SyllabindEditor() {
  const [match, params] = useRoute('/creator/syllabus/:id/edit');
  const isNew = useLocation()[0] === '/creator/syllabus/new';
  const { createSyllabus, updateSyllabus, getSubmissionsForStep, getLearnersForSyllabus } = useStore();
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    currentWeek: number;
    status: string;
  }>({ currentWeek: 0, status: '' });
  const [generatingWeeks, setGeneratingWeeks] = useState<Set<number>>(new Set());
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [justCompletedWeek, setJustCompletedWeek] = useState<number | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-20250514');
  const [regeneratingWeekIndex, setRegeneratingWeekIndex] = useState<number | null>(null);
  const [showRegenerateWeekDialog, setShowRegenerateWeekDialog] = useState(false);
  const [weekToRegenerate, setWeekToRegenerate] = useState<number | null>(null);
  const [originalWeeks, setOriginalWeeks] = useState<Week[]>([]); // Store weeks from database
  const [isLoadingContent, setIsLoadingContent] = useState(!isNew && !!params?.id);
  const [activeWeekTab, setActiveWeekTab] = useState('week-1'); // Controlled tab for auto-switching during generation

  // Check if Syllabind already has content
  const hasSyllabindContent = formData.weeks.some(week =>
    week.steps.length > 0 || week.title || week.description
  );

  // Fetch full syllabus with weeks and steps when editing
  useEffect(() => {
    if (!isNew && params?.id) {
      const syllabusId = parseInt(params.id);
      fetch(`/api/syllabinds/${syllabusId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch syllabus');
          return res.json();
        })
        .then((existing: Syllabus) => {
          // Ensure weeks array exists
          const weeksArray = existing.weeks || [];
          // Store original weeks from database for restoration when duration changes
          if (weeksArray.length > 0) {
            setOriginalWeeks(weeksArray);
          }
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
          setIsLoadingContent(false);
        })
        .catch(err => {
          console.error('Failed to fetch syllabus:', err);
          setIsLoadingContent(false);
        });
    }
  }, [isNew, params?.id]);

  // Auto-save effect
  useEffect(() => {
    // Skip initial load, empty title, or unsaved syllabinds (negative IDs)
    if (!formData.title || formData.id < 0) return;

    const save = async () => {
      setIsSaving(true);
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 500));

      // Only auto-save existing syllabinds (positive IDs)
      updateSyllabus(debouncedFormData);

      setLastSaved(new Date());
      setIsSaving(false);
    };

    save();
  }, [debouncedFormData]);

  // Fetch learners when syllabus ID changes
  useEffect(() => {
    if (formData.id && formData.id > 0) { // Only fetch for real IDs, not temp negative IDs
      getLearnersForSyllabus(formData.id).then(({ classmates }) => setLearners(classmates));
    }
  }, [formData.id]);

  // Adjust weeks array when duration changes - restore from database if available
  const handleDurationChange = (weeksStr: string) => {
    const count = parseInt(weeksStr);
    const newWeeks = [...formData.weeks];
    if (count > newWeeks.length) {
      for (let i = newWeeks.length; i < count; i++) {
        // Check if we have original content from database for this week
        const originalWeek = originalWeeks.find(w => w.index === i + 1);
        if (originalWeek) {
          newWeeks.push(originalWeek);
        } else {
          newWeeks.push({
            id: generateTempId(),
            syllabusId: formData.id,
            index: i + 1,
            steps: [],
            title: ''
          });
        }
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

  const removeStep = async (weekIndex: number, stepId: number) => {
    // Optimistically update local state
    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (week) {
      week.steps = week.steps.filter(s => s.id !== stepId);
    }
    setFormData({ ...formData, weeks: newWeeks });

    // Skip API call for unsaved steps (negative IDs)
    if (stepId < 0) return;

    // Persist deletion to database
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete step');
      }
    } catch (error) {
      console.error('Failed to delete step:', error);
      toast({
        title: "Error",
        description: "Failed to delete step. Please try again.",
        variant: "destructive"
      });
      // Revert by refetching
      const response = await fetch(`/api/syllabinds/${formData.id}`, { credentials: 'include' });
      if (response.ok) {
        const updated = await response.json();
        setFormData(updated);
      }
    }
  };

  // Cmd+click (Mac) or Ctrl+click (Windows) to use mock mode (test streaming without API calls)
  const handleAutogenerateClick = (e: React.MouseEvent) => {
    const useMock = e.metaKey || e.ctrlKey;

    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description before autogenerating.",
        variant: "destructive"
      });
      return;
    }

    // If Syllabind already has content, show confirmation dialog
    if (hasSyllabindContent) {
      setShowRegenerateDialog(true);
      // Store mock preference for dialog confirmation
      (window as any).__useMockGeneration = useMock;
      return;
    }

    // Otherwise, proceed with generation
    handleAutogenerate(useMock);
  };

  // useMock: Alt+click to test streaming without API calls
  const handleAutogenerate = async (useMock = false) => {
    setShowRegenerateDialog(false);

    if (useMock) {
      console.log('[Mock Mode] Testing streaming effect without API calls');
    }

    let syllabusId = formData.id;
    if (isNew || syllabusId < 0) {
      const created = await createSyllabus({
        ...formData,
        status: 'generating'
      });
      syllabusId = created.id;
      setFormData({ ...formData, id: syllabusId });
    }

    setIsGenerating(true);
    setGenerationProgress({ currentWeek: 0, status: useMock ? 'Mock generation...' : 'Starting generation...' });
    setGeneratingWeeks(new Set());
    setCompletedWeeks(new Set());
    setJustCompletedWeek(null);

    try {
      const response = await fetch('/api/generate-syllabind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ syllabusId, model: selectedModel })
      });

      if (!response.ok) throw new Error('Failed to start generation');

      const { websocketUrl } = await response.json();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Append mock=true to WebSocket URL if in mock mode
      const wsUrl = useMock ? `${websocketUrl}&mock=true` : websocketUrl;
      const ws = new WebSocket(`${protocol}//${window.location.host}${wsUrl}`);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'week_started': {
            const weekIdx = message.data.weekIndex;
            setGeneratingWeeks(prev => new Set(Array.from(prev).concat(weekIdx)));
            setGenerationProgress({
              currentWeek: weekIdx,
              status: `Generating Week ${weekIdx}...`
            });
            // Auto-switch to the generating week's tab so user sees streaming
            setActiveWeekTab(`week-${weekIdx}`);
            // Clear existing steps for this week to show the streaming placeholder
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIndex = weekIdx - 1;
              if (newWeeks[weekIndex]) {
                newWeeks[weekIndex] = {
                  ...newWeeks[weekIndex],
                  steps: [],
                  title: '',
                  description: ''
                };
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'searching':
            setGenerationProgress(prev => ({
              ...prev,
              status: `Searching: ${message.data.query}`
            }));
            break;

          case 'week_info': {
            // Receive week title/description BEFORE steps so they render first
            const { weekIndex: infoWeekIndex, title, description } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = infoWeekIndex - 1;
              if (newWeeks[weekIdx]) {
                newWeeks[weekIdx] = {
                  ...newWeeks[weekIdx],
                  title,
                  description
                };
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'step_completed': {
            const { weekIndex: stepWeekIndex, step } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = stepWeekIndex - 1;
              if (newWeeks[weekIdx]) {
                // Add step to the week's steps array
                const existingSteps = [...newWeeks[weekIdx].steps];
                existingSteps.push(step);
                newWeeks[weekIdx] = {
                  ...newWeeks[weekIdx],
                  steps: existingSteps
                };
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'week_completed': {
            const week = message.data.week;
            const weekIdx = week.weekIndex;

            // Update week title/description FIRST (before hiding placeholder)
            // This ensures data is present when normal view renders
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIndex = week.weekIndex - 1;
              if (newWeeks[weekIndex]) {
                newWeeks[weekIndex] = {
                  ...newWeeks[weekIndex],
                  title: week.title,
                  description: week.description
                  // Don't overwrite steps - they were added incrementally via step_completed
                };
              }
              return { ...prev, weeks: newWeeks };
            });

            // THEN remove from generating (triggers switch from placeholder to normal view)
            setGeneratingWeeks(prev => {
              const next = new Set(prev);
              next.delete(weekIdx);
              return next;
            });
            setCompletedWeeks(prev => new Set(Array.from(prev).concat(weekIdx)));
            setJustCompletedWeek(weekIdx);

            // Clear "just completed" after animation duration
            setTimeout(() => setJustCompletedWeek(null), 600);
            break;
          }

          case 'generation_complete':
            setIsGenerating(false);
            setGeneratingWeeks(new Set());
            setCompletedWeeks(new Set());
            setJustCompletedWeek(null);
            toast({
              title: "Syllabind Generated!",
              description: "Your Syllabind has been generated. Review and make any edits.",
            });
            fetch(`/api/syllabinds/${syllabusId}`, { credentials: 'include' })
              .then(res => res.json())
              .then(updated => {
                setFormData(updated);
                // Store generated weeks as new baseline for duration changes
                if (updated.weeks?.length > 0) {
                  setOriginalWeeks(updated.weeks);
                }
              });
            break;

          case 'rate_limit_status': {
            const status = message.data;

            if (status.status === 'exceeded' || status.status === 'low') {
              const waitMinutes = status.resetIn ? Math.ceil(status.resetIn / 60) : 'a few';
              setIsGenerating(false);
              toast({
                title: "⏱️ Rate Limit Exceeded",
                description: `${status.message}\n\nPlease wait ${waitMinutes} minute(s) and try again.`,
                variant: "destructive"
              });
            } else {
              console.log('[Rate Limit] Status OK:', status);
            }
            break;
          }

          case 'generation_error': {
            const errorData = message.data;
            setIsGenerating(false);

            if (errorData.isRateLimit) {
              const waitMinutes = errorData.resetIn ? Math.ceil(errorData.resetIn / 60) : 'a few';
              toast({
                title: "⏱️ Rate Limit Exceeded",
                description: `${errorData.message}\n\nRemaining requests: ${errorData.remaining || 'Unknown'}\nPlease wait ${waitMinutes} minute(s) and try again.`,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Generation Error",
                description: errorData.message || 'Generation failed',
                variant: "destructive"
              });
            }
            break;
          }

          case 'error':
            setIsGenerating(false);
            toast({
              title: "Generation Error",
              description: message.data.message,
              variant: "destructive"
            });
            break;
        }
      };

      ws.onerror = () => {
        setIsGenerating(false);
        toast({
          title: "Connection Error",
          description: "Lost connection to generation service.",
          variant: "destructive"
        });
      };

      ws.onclose = (event) => {
        // Only show error if generation wasn't completed normally
        if (!isGenerating) return;
        setIsGenerating(false);
        setGeneratingWeeks(new Set());

        const errorMessages: Record<number, string> = {
          4401: 'Authentication failed. Please log in again.',
          4403: 'Not authorized to modify this syllabus.',
          4404: 'Syllabus not found.',
          4400: 'Invalid request.',
        };

        const message = errorMessages[event.code] || 'Connection closed unexpectedly.';
        toast({
          title: "Generation Failed",
          description: message,
          variant: "destructive"
        });
      };

    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateWeekClick = (weekIndex: number) => {
    setWeekToRegenerate(weekIndex);
    setShowRegenerateWeekDialog(true);
  };

  const handleRegenerateWeek = async (weekIndex: number, useMock = false) => {
    setShowRegenerateWeekDialog(false);
    setWeekToRegenerate(null);
    setRegeneratingWeekIndex(weekIndex);
    setActiveWeekTab(`week-${weekIndex}`);
    setGeneratingWeeks(new Set([weekIndex]));

    // Clear existing content for this week locally
    setFormData(prev => {
      const newWeeks = [...prev.weeks];
      const weekIdx = weekIndex - 1;
      if (newWeeks[weekIdx]) {
        newWeeks[weekIdx] = {
          ...newWeeks[weekIdx],
          steps: [],
          title: '',
          description: ''
        };
      }
      return { ...prev, weeks: newWeeks };
    });

    try {
      const response = await fetch('/api/regenerate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          syllabusId: formData.id,
          weekIndex,
          model: selectedModel
        })
      });

      if (!response.ok) throw new Error('Failed to start week regeneration');

      const { websocketUrl } = await response.json();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = useMock ? `${websocketUrl}&mock=true` : websocketUrl;
      const ws = new WebSocket(`${protocol}//${window.location.host}${wsUrl}`);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'week_info': {
            const { weekIndex: infoWeekIndex, title, description } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = infoWeekIndex - 1;
              if (newWeeks[weekIdx]) {
                newWeeks[weekIdx] = { ...newWeeks[weekIdx], title, description };
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'step_completed': {
            const { weekIndex: stepWeekIndex, step } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = stepWeekIndex - 1;
              if (newWeeks[weekIdx]) {
                const existingSteps = [...newWeeks[weekIdx].steps];
                existingSteps.push(step);
                newWeeks[weekIdx] = { ...newWeeks[weekIdx], steps: existingSteps };
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'week_completed':
          case 'week_regeneration_complete': {
            setGeneratingWeeks(new Set());
            setRegeneratingWeekIndex(null);
            setCompletedWeeks(prev => new Set(Array.from(prev).concat(weekIndex)));

            toast({
              title: "Week Regenerated!",
              description: `Week ${weekIndex} has been regenerated successfully.`,
            });

            // Refresh full syllabus data
            fetch(`/api/syllabinds/${formData.id}`, { credentials: 'include' })
              .then(res => res.json())
              .then(updated => setFormData(updated));
            break;
          }

          case 'rate_limit_status':
            break;

          case 'generation_error':
          case 'error': {
            setGeneratingWeeks(new Set());
            setRegeneratingWeekIndex(null);

            const errorData = message.data;
            toast({
              title: errorData.isRateLimit ? "Rate Limit Exceeded" : "Error",
              description: errorData.message || 'Week regeneration failed',
              variant: "destructive"
            });
            break;
          }
        }
      };

      ws.onerror = () => {
        setGeneratingWeeks(new Set());
        setRegeneratingWeekIndex(null);
        toast({
          title: "Connection Error",
          description: "Lost connection to generation service.",
          variant: "destructive"
        });
      };

      ws.onclose = (event) => {
        // Only show error if regeneration wasn't completed normally
        if (regeneratingWeekIndex === null) return;
        setGeneratingWeeks(new Set());
        setRegeneratingWeekIndex(null);

        const errorMessages: Record<number, string> = {
          4401: 'Authentication failed. Please log in again.',
          4403: 'Not authorized to modify this syllabus.',
          4404: 'Syllabus not found.',
          4400: 'Invalid request.',
        };

        const message = errorMessages[event.code] || 'Connection closed unexpectedly.';
        toast({
          title: "Regeneration Failed",
          description: message,
          variant: "destructive"
        });
      };

    } catch (error) {
      setGeneratingWeeks(new Set());
      setRegeneratingWeekIndex(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleSyllabindUpdate = async () => {
    if (formData.id > 0) {
      const response = await fetch(`/api/syllabinds/${formData.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const updated = await response.json();
        setFormData(updated);
        toast({
          title: "Syllabind Updated",
          description: "Changes from chat applied.",
        });
      }
    }
  };

  const handleSave = (statusOverride?: 'draft' | 'published') => {
    const dataToSave = statusOverride ? { ...formData, status: statusOverride } : formData;

    if (isNew) {
      createSyllabus(dataToSave);
    } else {
      updateSyllabus(dataToSave);
    }

    const message = statusOverride === 'published'
      ? "Syllabind published successfully!"
      : "Your changes have been saved successfully.";

    toast({
      title: statusOverride === 'published' ? "Syllabind Published" : "Syllabind saved",
      description: message
    });
    setLocation('/creator');
  };

  const handleShareDraft = () => {
    const draftUrl = `${window.location.origin}/syllabus/${formData.id}?preview=true`;
    navigator.clipboard.writeText(draftUrl);
    toast({ 
      title: "Draft Link Copied!", 
      description: "Share this link with anyone to preview your syllabind before publishing.",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/creator')} className="shrink-0">
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-display">{isNew ? 'Create New Syllabind' : 'Edit Syllabind'}</h1>
         </div>
         <div className="flex flex-wrap gap-2 items-center">
            {!isNew && (
              <>
                <Button variant="outline" size="sm" onClick={handleShareDraft} className="gap-2">
                  <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Draft</span>
                </Button>
                <Link href={`/creator/syllabus/${params?.id}/analytics`}>
                  <Button variant="ghost" size="sm">
                    <BarChart2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Analytics</span>
                  </Button>
                </Link>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => handleSave()}><span className="hidden sm:inline">Save </span>Draft</Button>
            <Button size="sm" onClick={() => handleSave('published')}>Publish</Button>
            {!isNew && (
              <Link href={`/creator/syllabus/${params?.id}/learners`}>
                <Button variant="outline" size="sm" className="gap-2">
                   <Users className="h-4 w-4" /> <span className="hidden sm:inline">Learners</span>
                </Button>
              </Link>
            )}
         </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-10 p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2">
            <Label className="text-sm">Title</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Intro to Stoicism"
              className="text-base md:text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Description</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value: string) => setFormData({...formData, description: value})}
              placeholder="What will they learn?"
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-2">
              <Label className="text-sm">Audience Level</Label>
              <Select
                value={formData.audienceLevel}
                onValueChange={(v: any) => setFormData({...formData, audienceLevel: v})}
              >
                <SelectTrigger className="text-base md:text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Duration (Weeks)</Label>
              <Select
                value={formData.durationWeeks.toString()}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger className="text-base md:text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Week</SelectItem>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="3">3 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks</SelectItem>
                  <SelectItem value="5">5 Weeks</SelectItem>
                  <SelectItem value="6">6 Weeks</SelectItem>
                  <SelectItem value="7">7 Weeks</SelectItem>
                  <SelectItem value="8">8 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-opus-4-20250514">Opus</SelectItem>
                  <SelectItem value="claude-sonnet-4-20250514">Sonnet</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Haiku</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={isLoadingContent || hasSyllabindContent ? "secondary" : "default"}
                onClick={handleAutogenerateClick}
                disabled={isGenerating || !formData.title || !formData.description}
                className="flex-1 gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating
                  ? 'Generating...'
                  : hasSyllabindContent
                    ? 'Regenerate with AI'
                    : 'Autogenerate with AI'}
              </Button>
            </div>
            {isGenerating && (
              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/30 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Generating Week {generationProgress.currentWeek} of {formData.durationWeeks}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((generationProgress.currentWeek / formData.durationWeeks) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(generationProgress.currentWeek / formData.durationWeeks) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">
                        {generationProgress.status}
                      </p>
                    </div>
                  </div>

                  {/* Week status indicators */}
                  <div className="flex gap-1.5 mt-3">
                    {formData.weeks.map((w) => (
                      <div
                        key={w.index}
                        className={cn(
                          "h-2 flex-1 rounded-full transition-all duration-300",
                          completedWeeks.has(w.index)
                            ? "bg-green-500"
                            : generatingWeeks.has(w.index)
                              ? "bg-primary animate-pulse"
                              : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium">Syllabind</h2>
        <Tabs value={activeWeekTab} onValueChange={setActiveWeekTab} className="w-full">
          <TabsList className="w-auto flex-wrap h-auto p-1 justify-start">
            {formData.weeks?.map(w => {
              const isWeekGenerating = generatingWeeks.has(w.index);
              const isWeekComplete = completedWeeks.has(w.index) || (!isGenerating && (w.steps.length > 0 || w.title));

              return (
                <TabsTrigger
                  key={w.index}
                  value={`week-${w.index}`}
                  className={cn(
                    "text-xs sm:text-sm px-3 sm:px-4 gap-1.5",
                    isWeekGenerating && "animate-pulse"
                  )}
                >
                  {isWeekGenerating && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Week {w.index}
                  {isWeekComplete && !isWeekGenerating && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {formData.weeks?.map(week => {
            const isWeekGenerating = generatingWeeks.has(week.index);
            const isJustCompleted = justCompletedWeek === week.index;
            const hasContent = week.steps.length > 0 || week.title;

            return (
            <TabsContent key={week.index} value={`week-${week.index}`} className="space-y-6 sm:space-y-10 mt-4 sm:mt-8">
              {isWeekGenerating && week.steps.length < 4 ? (
                <Card>
                  <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                    <GeneratingWeekPlaceholder
                      weekIndex={week.index}
                      status={generationProgress.status}
                      title={week.title}
                      description={week.description}
                      currentSteps={week.steps}
                    />
                  </CardContent>
                </Card>
              ) : (
              <Card className={cn(isWeekGenerating && "border-primary/30 animate-generating")}>
                 <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6 space-y-6 sm:space-y-10">
                    <div className="space-y-2">
                      <Label className="text-sm">Week Title (Optional)</Label>
                      <Input
                        value={week.title}
                        onChange={e => {
                          const newWeeks = [...formData.weeks];
                          newWeeks.find(w => w.index === week.index)!.title = e.target.value;
                          setFormData({...formData, weeks: newWeeks});
                        }}
                        placeholder="e.g. Foundations"
                        className="text-base md:text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-sm">Weekly Summary (Optional)</Label>
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
                       {/* Regenerate Week Button */}
                       {!isNew && formData.id > 0 && (
                         <div className="pt-2">
                           <Button
                             variant="secondary"
                             size="sm"
                             onClick={(e) => {
                               const useMock = e.metaKey || e.ctrlKey;
                               const hasWeekContent = week.steps.length > 0 || week.title || week.description;
                               if (hasWeekContent) {
                                 handleRegenerateWeekClick(week.index);
                               } else {
                                 handleRegenerateWeek(week.index, useMock);
                               }
                             }}
                             disabled={isGenerating || regeneratingWeekIndex !== null}
                             className="gap-2"
                           >
                             <Wand2 className="h-4 w-4" />
                             {regeneratingWeekIndex === week.index
                               ? 'Regenerating...'
                               : 'Regenerate Week'}
                           </Button>
                         </div>
                       )}
                    </div>

                    <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-10">
                      {week.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className={cn(
                            "border rounded-lg p-4 sm:p-6 bg-muted/20 relative group",
                            isJustCompleted && `step-enter step-delay-${Math.min(idx + 1, 4)}`
                          )}
                        >
                          <div className="flex items-center justify-between mb-4 sm:mb-6">
                             <div className="flex items-center gap-2 sm:gap-3">
                               <Badge variant="outline" className="text-[10px] sm:text-xs uppercase px-1.5 sm:px-2 py-0.5 tracking-wider font-semibold">{step.type}</Badge>
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

                          <div className="grid gap-5 sm:gap-8">
                             {step.type === 'reading' && (
                               <div className="grid gap-2">
                                 <Label className="text-sm">URL</Label>
                                 <div className="flex gap-2">
                                   <Input
                                     value={step.url || ''}
                                     onChange={e => updateStep(week.index, step.id, 'url', e.target.value)}
                                     placeholder="https://..."
                                     className="text-base md:text-lg"
                                   />
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     onClick={() => window.open(step.url, '_blank', 'noopener,noreferrer')}
                                     disabled={!step.url}
                                     title="Open link in new tab"
                                     className="shrink-0"
                                   >
                                     <ExternalLink className="h-4 w-4" />
                                   </Button>
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <Button
                                           variant="secondary"
                                           size="icon"
                                           onClick={() => handleAutoFill(week.index, step.id)}
                                           disabled={!step.url}
                                           className="shrink-0"
                                         >
                                           <Wand2 className="h-4 w-4" />
                                         </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>
                                         <p>Auto-fill title, author, and other fields from URL</p>
                                       </TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                 </div>
                               </div>
                             )}

                             {step.type === 'reading' && (
                               <>
                                 {/* Title and Media Type on same row */}
                                 <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4 sm:gap-6">
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Title</Label>
                                      <Input value={step.title} onChange={e => updateStep(week.index, step.id, 'title', e.target.value)} className="text-base md:text-lg" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Media Type</Label>
                                      <Select
                                        value={step.mediaType || 'Blog/Article'}
                                        onValueChange={(v: any) => updateStep(week.index, step.id, 'mediaType', v)}
                                      >
                                        <SelectTrigger className="text-base md:text-lg"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Book">Book</SelectItem>
                                          <SelectItem value="Book Chapter">Book Chapter</SelectItem>
                                          <SelectItem value="Journal Article">Journal Article</SelectItem>
                                          <SelectItem value="Youtube video">Youtube video</SelectItem>
                                          <SelectItem value="Blog/Article">Blog/Article</SelectItem>
                                          <SelectItem value="Podcast">Podcast</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                 </div>

                                 {/* Author, Creation Date, and Est. Min on same row */}
                                 <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px] gap-4 sm:gap-6">
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Author</Label>
                                      <Input
                                        value={step.author || ''}
                                        onChange={e => updateStep(week.index, step.id, 'author', e.target.value)}
                                        placeholder="e.g. Plato"
                                        className="text-base md:text-lg"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Creation/Publish Date</Label>
                                      <Input
                                        type="date"
                                        value={step.creationDate || ''}
                                        onChange={e => updateStep(week.index, step.id, 'creationDate', e.target.value)}
                                        className="text-base md:text-lg"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Est. Min</Label>
                                      <Input type="number" value={step.estimatedMinutes || 0} onChange={e => updateStep(week.index, step.id, 'estimatedMinutes', parseInt(e.target.value))} className="text-base md:text-lg" />
                                    </div>
                                 </div>

                                 <div className="grid gap-2">
                                   <Label className="text-sm">Description</Label>
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
                               <>
                                 {/* Title and Est. Minutes on same row for exercises */}
                                 <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-4 sm:gap-6">
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Title</Label>
                                      <Input value={step.title} onChange={e => updateStep(week.index, step.id, 'title', e.target.value)} className="text-base md:text-lg" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label className="text-sm">Est. Min</Label>
                                      <Input type="number" value={step.estimatedMinutes || 0} onChange={e => updateStep(week.index, step.id, 'estimatedMinutes', parseInt(e.target.value))} className="text-base md:text-lg" />
                                    </div>
                                 </div>
                                 <div className="grid gap-2">
                                   <Label className="text-sm">Prompt</Label>
                                   <RichTextEditor
                                      value={step.promptText || ''}
                                      onChange={(value: string) => updateStep(week.index, step.id, 'promptText', value)}
                                      placeholder="What should they do?"
                                      isSaving={isSaving}
                                      lastSaved={lastSaved}
                                   />
                                 </div>
                               </>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button variant="secondary" size="sm" onClick={() => addStep(week.index, 'reading')} className="text-sm">
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Add Reading
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => addStep(week.index, 'exercise')} className="text-sm">
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Add Exercise
                      </Button>
                    </div>
                 </CardContent>
              </Card>
              )}
            </TabsContent>
            );
          })}
        </Tabs>
      </div>
      
      {!isNew && (
        <div className="space-y-4 pt-6 sm:pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
             <h2 className="text-lg sm:text-xl font-medium">Recent Submissions</h2>
             <Link href={`/creator/syllabus/${params?.id}/learners`}>
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                 View All <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
               </Button>
             </Link>
          </div>

          <div className="grid gap-3 sm:gap-4">
             {(() => {
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
                     <div className="text-center py-6 sm:py-8 bg-muted/20 rounded-lg text-muted-foreground italic text-sm">
                        No recent submissions.
                     </div>
                   );
                }

                return allRecentSubmissions.map((sub, idx) => {
                   return (
                     <Card key={idx}>
                       <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                             <div className="font-medium text-base md:text-lg flex flex-wrap items-center gap-2">
                               <span className="truncate">Week {sub.weekIndex}: {sub.stepTitle}</span>
                               {sub.grade ? <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">Graded: {sub.grade}</Badge> : <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">Needs Grading</Badge>}
                             </div>
                             <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                <span className="font-mono bg-muted px-1 rounded truncate max-w-[200px] sm:max-w-none">{sub.answer}</span>
                                <span className="shrink-0">• {new Date(sub.submittedAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                          <Link href={`/creator/syllabus/${formData.id}/learners`}>
                             <Button size="sm" variant="secondary" className="w-full sm:w-auto">Review</Button>
                          </Link>
                       </CardContent>
                     </Card>
                   );
                });
             })()}
          </div>
        </div>
      )}

      {formData.id > 0 && (
        <SyllabindChatPanel
          syllabusId={formData.id}
          onSyllabindUpdate={handleSyllabindUpdate}
        />
      )}

      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Syllabind?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your existing Syllabind content with newly generated material.
              All current weeks, steps, and descriptions will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { (window as any).__useMockGeneration = false; }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const useMock = (window as any).__useMockGeneration || false;
              (window as any).__useMockGeneration = false;
              handleAutogenerate(useMock);
            }}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRegenerateWeekDialog} onOpenChange={setShowRegenerateWeekDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Week {weekToRegenerate}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all content in Week {weekToRegenerate} with newly generated material.
              The steps and weekly summary will be deleted and regenerated. Other weeks will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWeekToRegenerate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (weekToRegenerate) {
                handleRegenerateWeek(weekToRegenerate);
              }
            }}>
              Regenerate Week
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
