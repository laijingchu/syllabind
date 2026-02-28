import { useRoute, useLocation, Link } from 'wouter';
import { usePostHog } from '@posthog/react';
import { useStore } from '@/lib/store';
import { Binder, Week, Step, StepType, Category, Tag } from '@/lib/types';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Plus, GripVertical, Save, ArrowLeft, BarChart2, Share2, CheckCircle2, AlertTriangle, Users, ExternalLink, Wand2, Loader2, X, Pencil, ChevronDown, Globe, EyeOff, Lock, Eye, Crown } from 'lucide-react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/use-debounce';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const generateTempId = () => -Math.floor(Math.random() * 1000000); // Temporary negative IDs for unsaved items


interface SortableStepProps {
  step: Step;
  idx: number;
  weekIndex: number;
  isJustCompleted: boolean;
  updateStep: (weekIndex: number, stepId: number, field: keyof Step, value: any) => void;
  removeStep: (weekIndex: number, stepId: number) => void;
  handleAutoFill: (weekIndex: number, stepId: number) => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

function SortableStep({ step, idx, weekIndex, isJustCompleted, updateStep, removeStep, handleAutoFill, isSaving, lastSaved }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg p-4 sm:p-6 bg-muted/20 relative group",
        isJustCompleted && `step-enter step-delay-${Math.min(idx + 1, 4)}`,
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
         <div className="flex items-center gap-2 sm:gap-3">
           <button
             {...attributes}
             {...listeners}
             className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors touch-none"
             aria-label="Drag to reorder"
           >
             <GripVertical className="h-5 w-5" />
           </button>
           <Badge variant="outline" className="text-[10px] sm:text-xs uppercase px-1.5 sm:px-2 py-0.5 tracking-wider font-semibold">{step.type}</Badge>
           <span className="text-xs text-muted-foreground font-medium">Step {idx + 1}</span>
         </div>
         <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => removeStep(weekIndex, step.id)}
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
                 onChange={e => updateStep(weekIndex, step.id, 'url', e.target.value)}
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
                       onClick={() => handleAutoFill(weekIndex, step.id)}
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
             <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label className="text-sm">Title</Label>
                  <Input value={step.title} onChange={e => updateStep(weekIndex, step.id, 'title', e.target.value)} className="text-base md:text-lg" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Media Type</Label>
                  <Select
                    value={step.mediaType || 'Blog/Article'}
                    onValueChange={(v: any) => updateStep(weekIndex, step.id, 'mediaType', v)}
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

             <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px] gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label className="text-sm">Author</Label>
                  <Input
                    value={step.author || ''}
                    onChange={e => updateStep(weekIndex, step.id, 'author', e.target.value)}
                    placeholder="e.g. Plato"
                    className="text-base md:text-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Creation/Publish Date</Label>
                  <Input
                    type="date"
                    value={step.creationDate || ''}
                    onChange={e => updateStep(weekIndex, step.id, 'creationDate', e.target.value)}
                    className="text-base md:text-lg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Est. Min</Label>
                  <Input type="number" value={step.estimatedMinutes || 0} onChange={e => updateStep(weekIndex, step.id, 'estimatedMinutes', parseInt(e.target.value))} className="text-base md:text-lg" />
                </div>
             </div>

             <div className="grid gap-2">
               <Label className="text-sm">Description</Label>
               <RichTextEditor
                  value={step.note || ''}
                  onChange={(value: string) => updateStep(weekIndex, step.id, 'note', value)}
                  placeholder="Why should they read this?"
                  isSaving={isSaving}
                  lastSaved={lastSaved}
               />
             </div>
           </>
         )}

         {step.type === 'exercise' && (
           <>
             <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label className="text-sm">Title</Label>
                  <Input value={step.title} onChange={e => updateStep(weekIndex, step.id, 'title', e.target.value)} className="text-base md:text-lg" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Est. Min</Label>
                  <Input type="number" value={step.estimatedMinutes || 0} onChange={e => updateStep(weekIndex, step.id, 'estimatedMinutes', parseInt(e.target.value))} className="text-base md:text-lg" />
                </div>
             </div>
             <div className="grid gap-2">
               <Label className="text-sm">Prompt</Label>
               <RichTextEditor
                  value={step.promptText || ''}
                  onChange={(value: string) => updateStep(weekIndex, step.id, 'promptText', value)}
                  placeholder="What should they do?"
                  isSaving={isSaving}
                  lastSaved={lastSaved}
               />
             </div>
           </>
         )}
      </div>
    </div>
  );
}

export default function BinderEditor() {
  const [match, params] = useRoute('/curator/binder/:id/edit');
  const [location, setLocation] = useLocation();
  const isNew = location === '/curator/binder/new' || location.startsWith('/create');
  const isGuestMode = location.startsWith('/create');
  const { createBinder, updateBinder, refreshBinders, getSubmissionsForStep, getReadersForBinder, user, isPro } = useStore();
  const isFreeTier = isGuestMode || !isPro;
  const posthog = usePostHog();
  const [readers, setReaders] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [binderTags, setBinderTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<(Tag & { usageCount?: number })[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const initialTitle = isNew ? new URLSearchParams(window.location.search).get('title') || '' : '';

  const defaultWeeks = isGuestMode ? 3 : 4;
  const [formData, setFormData] = useState<Binder>({
    id: generateTempId(),
    title: initialTitle,
    description: '',
    audienceLevel: 'Beginner',
    durationWeeks: defaultWeeks,
    status: 'draft',
    visibility: 'public',
    curatorId: user?.username || '',
    showSchedulingLink: true,
    mediaPreference: 'auto',
    weeks: Array.from({ length: defaultWeeks }, (_, i) => ({
      id: generateTempId(),
      binderId: generateTempId(),
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
  const [erroredWeeks, setErroredWeeks] = useState<Set<number>>(new Set());
  const [justCompletedWeek, setJustCompletedWeek] = useState<number | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regeneratingWeekIndex, setRegeneratingWeekIndex] = useState<number | null>(null);
  const [showRegenerateWeekDialog, setShowRegenerateWeekDialog] = useState(false);
  const [weekToRegenerate, setWeekToRegenerate] = useState<number | null>(null);
  const [originalWeeks, setOriginalWeeks] = useState<Week[]>([]); // Store weeks from database
  const [isLoadingContent, setIsLoadingContent] = useState(!isNew && !!params?.id);
  const [activeWeekTab, setActiveWeekTab] = useState('week-1'); // Controlled tab for auto-switching during generation
  const generationWsRef = useRef<WebSocket | null>(null); // Persist WS ref for cancel support
  const isGeneratingRef = useRef(false); // Ref for ws.onclose (avoids stale closure)
  const regeneratingWeekRef = useRef<number | null>(null); // Ref for ws.onclose (avoids stale closure)
  const rateLimitRetryRef = useRef<ReturnType<typeof setInterval> | null>(null); // Track rate limit countdown

  // Demo & generation info state
  const [demoBinders, setDemoBinders] = useState<Array<{ id: number; title: string; description: string; audienceLevel: string; durationWeeks: number; weeks: Week[] }>>([]);
  const [isDemoMode, setIsDemoMode] = useState(false); // True after user taps a demo pill
  const [generationInfo, setGenerationInfo] = useState<{ generationCount: number; generationLimit: number | null; remaining: number | null; cooldownRemaining: number; isPro: boolean } | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistUrl, setWaitlistUrl] = useState<string | null>(null);

  // Check if Binder already has content
  const hasBinderContent = formData.weeks.some(week =>
    week.steps.length > 0 || week.title || week.description
  );

  // Fetch full binder with weeks and steps when editing
  useEffect(() => {
    // Skip fetch if generation is in progress -- the generation handlers manage formData
    if (isGeneratingRef.current) return;

    if (!isNew && params?.id) {
      const binderId = parseInt(params.id);
      fetch(`/api/binders/${binderId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch binder');
          return res.json();
        })
        .then((existing: Binder) => {
          // Skip update if generation started while fetch was in-flight
          if (isGeneratingRef.current) return;

          // Ensure weeks array exists
          const weeksArray = existing.weeks || [];
          // Store original weeks from database for restoration when duration changes
          if (weeksArray.length > 0) {
            setOriginalWeeks(weeksArray);
          }

          // Reset stale "generating" status if no generation is active on this client
          if (existing.status === 'generating') {
            fetch(`/api/binders/${binderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'draft' })
            }).catch(() => {});
            existing.status = 'draft';
          }

          setFormData({
            ...existing,
            visibility: existing.visibility || 'public',
            categoryId: existing.categoryId || null,
            weeks: weeksArray.length > 0 ? weeksArray : Array.from({ length: existing.durationWeeks || 4 }, (_, i) => ({
              id: generateTempId(),
              binderId: existing.id,
              index: i + 1,
              steps: [] as Step[],
              title: ''
            }))
          });
          if (existing.tags) setBinderTags(existing.tags);
          setIsLoadingContent(false);
        })
        .catch(err => {
          console.error('Failed to fetch binder:', err);
          setIsLoadingContent(false);
        });
    }
  }, [isNew, params?.id]);

  // Auto-create effect: when user types a title on /new, create the record in the DB
  // so that subsequent auto-saves work and content persists across refresh
  const isCreatingRef = useRef(false);
  useEffect(() => {
    if (isGuestMode) return; // Skip in guest mode
    if (formData.id >= 0 || !formData.title?.trim() || isCreatingRef.current) return;

    isCreatingRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/binders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...formData, curatorId: undefined, status: 'draft' })
        });
        if (!res.ok) throw new Error('Failed to create binder');
        const created = await res.json();
        setFormData(prev => ({ ...prev, id: created.id }));
        window.history.replaceState(null, '', `/curator/binder/${created.id}/edit`);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Failed to auto-create binder:', err);
      } finally {
        isCreatingRef.current = false;
      }
    })();
  }, [debouncedFormData.title]);

  // Auto-save effect
  useEffect(() => {
    if (isGuestMode) return; // Skip in guest mode
    // Skip initial load, empty title, or unsaved binders (negative IDs)
    if (!formData.title || formData.id < 0) return;

    // Skip auto-save during AI generation/regeneration -- the server is actively
    // creating weeks/steps, and a concurrent saveWeeksAndSteps would race with it,
    // causing "duplicate key" constraint violations on weeks(binder_id, index)
    if (isGenerating || regeneratingWeekIndex !== null) return;

    const save = async () => {
      setIsSaving(true);
      try {
        await updateBinder(debouncedFormData);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedFormData]);

  // Fetch readers when binder ID changes
  useEffect(() => {
    if (formData.id && formData.id > 0) { // Only fetch for real IDs, not temp negative IDs
      getReadersForBinder(formData.id).then(({ classmates }) => setReaders(classmates));
    }
  }, [formData.id]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setAllCategories(data))
      .catch(() => {});
  }, []);

  // Fetch demo binders in guest mode
  useEffect(() => {
    if (!isGuestMode) return;
    fetch('/api/demo-binders')
      .then(res => res.json())
      .then(data => setDemoBinders(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isGuestMode]);

  // Fetch waitlist URL in guest mode
  useEffect(() => {
    if (!isGuestMode) return;
    fetch('/api/site-settings/waitlist_form_url')
      .then(r => r.json())
      .then(data => setWaitlistUrl(data.value || null))
      .catch(() => {});
  }, [isGuestMode]);

  // Fetch generation info for authenticated users
  useEffect(() => {
    if (isGuestMode || !user) return;
    fetch('/api/generation-info', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGenerationInfo(data))
      .catch(() => {});
  }, [user, isGuestMode]);

  // Fetch tags for this binder
  useEffect(() => {
    if (formData.id > 0) {
      fetch(`/api/binders/${formData.id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.tags) setBinderTags(data.tags);
        })
        .catch(() => {});
    }
  }, [formData.id]);

  // Tag autocomplete
  useEffect(() => {
    if (tagInput.length < 2) {
      setTagSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tags?q=${encodeURIComponent(tagInput)}`)
        .then(res => res.json())
        .then(data => setTagSuggestions(data.filter((t: Tag) => !binderTags.some(st => st.id === t.id))))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [tagInput, binderTags]);

  const addTag = async (name: string) => {
    if (binderTags.length >= 5) return;
    const trimmed = name.trim();
    if (!trimmed || binderTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newTagNames = [...binderTags.map(t => t.name), trimmed];
    setTagInput('');
    setShowTagSuggestions(false);

    if (formData.id > 0) {
      try {
        const res = await fetch(`/api/binders/${formData.id}/tags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tags: newTagNames }),
        });
        if (res.ok) {
          const updatedTags = await res.json();
          setBinderTags(updatedTags);
        }
      } catch (err) {
        console.error('Failed to add tag:', err);
      }
    }
  };

  const removeTag = async (tagId: number) => {
    const newTags = binderTags.filter(t => t.id !== tagId);
    setBinderTags(newTags);

    if (formData.id > 0) {
      try {
        await fetch(`/api/binders/${formData.id}/tags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tags: newTags.map(t => t.name) }),
        });
      } catch (err) {
        console.error('Failed to remove tag:', err);
      }
    }
  };

  // Adjust weeks array when duration changes - restore from database if available
  const handleDurationChange = (weeksStr: string) => {
    const count = parseInt(weeksStr);
    // Guest mode: 4+ weeks requires signup
    if (count > 3 && isGuestMode) {
      setShowWaitlist(true);
      return;
    }
    if (count > 4 && isFreeTier) {
      setShowUpgrade(true);
      return;
    }
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
            binderId: formData.id,
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
      const response = await fetch(`/api/binders/${formData.id}`, { credentials: 'include' });
      if (response.ok) {
        const updated = await response.json();
        setFormData(updated);
      }
    }
  };

  // Demo generation: simulate the full generation lifecycle using pre-built demo data
  const handleDemoGenerate = (demo: { id: number; title: string; description: string; audienceLevel: string; durationWeeks: number; weeks: Week[] }) => {
    setIsDemoMode(true);
    const weekCount = Math.min(demo.durationWeeks || 6, 6);
    const demoWeeks = (demo.weeks || []).slice(0, weekCount);

    // Prefill form basics and initialize empty week slots
    setFormData(prev => ({
      ...prev,
      title: demo.title || prev.title,
      description: demo.description || prev.description,
      audienceLevel: (demo.audienceLevel as any) || prev.audienceLevel,
      durationWeeks: weekCount,
      weeks: Array.from({ length: weekCount }, (_, i) => ({
        id: generateTempId(),
        binderId: prev.id,
        index: i + 1,
        steps: [] as Step[],
        title: ''
      })),
    }));

    // Start generation animation
    setIsGenerating(true);
    setGeneratingWeeks(new Set());
    setCompletedWeeks(new Set());
    setErroredWeeks(new Set());
    setJustCompletedWeek(null);
    setGenerationProgress({ currentWeek: 0, status: `Planning ${weekCount}-week course structure...` });
    setActiveWeekTab('week-1');

    // Phase 1: brief planning delay, then populate week titles
    setTimeout(() => {
      // Show all week titles/descriptions (like outline_planned event)
      setFormData(prev => {
        const newWeeks = [...prev.weeks];
        demoWeeks.forEach((dw, i) => {
          if (newWeeks[i]) {
            newWeeks[i] = { ...newWeeks[i], title: dw.title || '', description: dw.description || '' };
          }
        });
        return { ...prev, weeks: newWeeks };
      });
      setGenerationProgress(prev => ({ ...prev, status: 'Course outline ready — generating content...' }));

      // Phase 2: simulate week-by-week content generation
      demoWeeks.forEach((dw, i) => {
        const weekIndex = i + 1;
        const startDelay = 800 + i * 1200; // stagger: each week starts 1.2s after the previous
        const endDelay = startDelay + 800;  // each week "generates" for 0.8s

        // Week starts generating
        setTimeout(() => {
          setGeneratingWeeks(prev => new Set(Array.from(prev).concat(weekIndex)));
          setGenerationProgress({ currentWeek: weekIndex, status: `Generating Week ${weekIndex}...` });
          setActiveWeekTab(`week-${weekIndex}`);
        }, startDelay);

        // Week completes: populate steps into formData
        setTimeout(() => {
          setFormData(prev => {
            const newWeeks = [...prev.weeks];
            const idx = weekIndex - 1;
            if (newWeeks[idx]) {
              newWeeks[idx] = {
                ...newWeeks[idx],
                title: dw.title || newWeeks[idx].title,
                description: dw.description || newWeeks[idx].description,
                steps: dw.steps || [],
              };
            }
            return { ...prev, weeks: newWeeks };
          });

          setGeneratingWeeks(prev => { const next = new Set(prev); next.delete(weekIndex); return next; });
          setCompletedWeeks(prev => new Set(Array.from(prev).concat(weekIndex)));
          setJustCompletedWeek(weekIndex);
          setTimeout(() => setJustCompletedWeek(null), 600);

          // Final week: finish generation
          if (weekIndex === weekCount) {
            setTimeout(() => {
              setIsGenerating(false);
              setGeneratingWeeks(new Set());
              setCompletedWeeks(new Set());
              setJustCompletedWeek(null);
              setGenerationProgress({ currentWeek: 0, status: '' });
              setActiveWeekTab('week-1');
            }, 400);
          }
        }, endDelay);
      });
    }, 1200);
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

    // Guest mode: show waitlist popup instead of calling API
    if (isGuestMode) {
      setShowWaitlist(true);
      return;
    }

    // Regeneration is a Pro feature
    if (hasBinderContent && isFreeTier) {
      setShowUpgrade(true);
      return;
    }

    // If Binder already has content, show confirmation dialog
    if (hasBinderContent) {
      setShowRegenerateDialog(true);
      // Store mock preference for dialog confirmation
      (window as any).__useMockGeneration = useMock;
      return;
    }

    // Otherwise, proceed with generation
    handleAutogenerate(useMock);
  };

  const handleCancelGeneration = () => {
    // Clear rate limit countdown if active
    if (rateLimitRetryRef.current) {
      clearInterval(rateLimitRetryRef.current);
      rateLimitRetryRef.current = null;
    }
    // Clear refs BEFORE closing WebSocket so the onclose handler doesn't show error
    isGeneratingRef.current = false;
    regeneratingWeekRef.current = null;
    if (generationWsRef.current) {
      generationWsRef.current.close();
      generationWsRef.current = null;
    }
    setIsGenerating(false);
    setGeneratingWeeks(new Set());
    setCompletedWeeks(new Set());
    setErroredWeeks(new Set());
    setJustCompletedWeek(null);
    setRegeneratingWeekIndex(null);
    setGenerationProgress({ currentWeek: 0, status: '' });
    toast({
      title: "Generation Cancelled",
      description: "Binder generation was cancelled. Any completed weeks have been saved.",
    });
    // Refresh to get current state from server
    if (formData.id > 0) {
      fetch(`/api/binders/${formData.id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(updated => setFormData(updated))
        .catch(() => {});
    }
  };

  // Redirect guest users to sign up, preserving their title
  const requireAuth = () => {
    if (!isGuestMode) return false;
    const titleParam = formData.title?.trim() ? `?title=${encodeURIComponent(formData.title.trim())}` : '';
    setLocation(`/login?mode=signup&redirect=${encodeURIComponent(`/curator/binder/new${titleParam}`)}`);
    return true;
  };

  // useMock: Alt+click to test streaming without API calls
  const handleAutogenerate = async (useMock = false) => {
    if (requireAuth()) return;
    setShowRegenerateDialog(false);

    if (useMock) {
      console.log('[Mock Mode] Testing streaming effect without API calls');
    }

    // Show progress immediately -- don't wait for create/start API calls
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setGenerationProgress({ currentWeek: 0, status: 'Starting generation...' });
    setGeneratingWeeks(new Set());
    setCompletedWeeks(new Set());
    setErroredWeeks(new Set());
    setJustCompletedWeek(null);

    let binderId = formData.id;
    try {
      // For new binders, create via API directly (skip store's refreshBinders)
      // and stay on /new -- no navigation, no remount, all state preserved
      if (binderId < 0) {
        const res = await fetch('/api/binders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...formData, curatorId: undefined, status: 'draft' })
        });
        if (!res.ok) throw new Error('Failed to create binder');
        const created = await res.json();
        binderId = created.id;
        setFormData(prev => ({ ...prev, id: binderId }));
      } else {
        // Flush current basics to DB before generation -- auto-save is debounced and
        // skipped during generation, so durationWeeks/title/etc. may be stale in the DB
        const mediaPref = formData.mediaPreference || 'auto';
        console.log('[Generate] Pre-generation save mediaPreference:', mediaPref);
        await fetch(`/api/binders/${binderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            audienceLevel: formData.audienceLevel,
            durationWeeks: formData.durationWeeks,
            mediaPreference: mediaPref,
          })
        });
      }

      // Reset all weeks to empty slots -- server deletes existing data before regenerating,
      // so client must also start clean to prevent stale/duplicate content from prior attempts
      setFormData(prev => {
        const targetCount = prev.durationWeeks;
        const newWeeks = Array.from({ length: targetCount }, (_, i) => ({
          id: generateTempId(),
          binderId: binderId,
          index: i + 1,
          steps: [] as Step[],
          title: ''
        }));
        return { ...prev, weeks: newWeeks };
      });
      const response = await fetch('/api/generate-binder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ binderId: binderId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'GENERATION_LIMIT_REACHED') {
          toast({ title: "Generation Limit Reached", description: errorData.message || "Upgrade to Pro for unlimited generations.", variant: "destructive" });
          setIsGenerating(false);
          isGeneratingRef.current = false;
          // Refresh generation info
          fetch('/api/generation-info', { credentials: 'include' }).then(r => r.json()).then(setGenerationInfo).catch(() => {});
          return;
        }
        if (errorData.error === 'GENERATION_COOLDOWN') {
          toast({ title: "Cooldown Active", description: `Please wait ${Math.ceil((errorData.retryAfterSeconds || 900) / 60)} minutes before generating again.`, variant: "destructive" });
          setIsGenerating(false);
          isGeneratingRef.current = false;
          return;
        }
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const { websocketUrl } = await response.json();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Append mock=true to WebSocket URL if in mock mode
      const wsUrl = useMock ? `${websocketUrl}&mock=true` : websocketUrl;
      const ws = new WebSocket(`${protocol}//${window.location.host}${wsUrl}`);
      generationWsRef.current = ws;

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'rate_limit_wait': {
            const { resetIn } = message.data;
            setGenerationProgress(prev => ({
              ...prev,
              status: `Lots of curators are building right now -- please hold on! Resuming in ${resetIn}s`
            }));
            break;
          }

          case 'planning_started': {
            setGenerationProgress({
              currentWeek: 0,
              status: `Planning ${message.data.durationWeeks}-week course structure...`
            });
            break;
          }

          case 'outline_planned': {
            // Phase 1 complete: populate all week titles/descriptions immediately
            const plannedWeeks = message.data.weeks as Array<{ weekIndex: number; title: string; description: string }>;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              for (const pw of plannedWeeks) {
                const idx = pw.weekIndex - 1;
                if (!newWeeks[idx]) {
                  newWeeks[idx] = {
                    id: generateTempId(),
                    binderId: prev.id,
                    index: pw.weekIndex,
                    steps: [],
                    title: ''
                  };
                }
                newWeeks[idx] = {
                  ...newWeeks[idx],
                  title: pw.title,
                  description: pw.description
                };
              }
              return { ...prev, weeks: newWeeks };
            });
            setGenerationProgress(prev => ({
              ...prev,
              status: 'Course outline ready -- generating content...'
            }));
            break;
          }

          case 'week_started': {
            const weekIdx = message.data.weekIndex;
            setGeneratingWeeks(prev => new Set(Array.from(prev).concat(weekIdx)));
            setGenerationProgress({
              currentWeek: weekIdx,
              status: `Generating Week ${weekIdx}...`
            });
            // Auto-switch to the generating week's tab so user sees streaming
            setActiveWeekTab(`week-${weekIdx}`);
            // Clear only steps for this week -- preserve title/description from outline plan
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIndex = weekIdx - 1;
              if (!newWeeks[weekIndex]) {
                newWeeks[weekIndex] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: weekIdx,
                  steps: [],
                  title: ''
                };
              }
              newWeeks[weekIndex] = {
                ...newWeeks[weekIndex],
                steps: []
              };
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
              if (!newWeeks[weekIdx]) {
                newWeeks[weekIdx] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: infoWeekIndex,
                  steps: [],
                  title: ''
                };
              }
              newWeeks[weekIdx] = {
                ...newWeeks[weekIdx],
                title,
                description
              };
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'step_completed': {
            const { weekIndex: stepWeekIndex, step } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = stepWeekIndex - 1;
              if (!newWeeks[weekIdx]) {
                newWeeks[weekIdx] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: stepWeekIndex,
                  steps: [],
                  title: ''
                };
              }
              // Add step to the week's steps array, deduplicating by step ID
              const existingSteps = [...newWeeks[weekIdx].steps];
              if (!existingSteps.some(s => s.id === step.id)) {
                existingSteps.push(step);
              }
              newWeeks[weekIdx] = {
                ...newWeeks[weekIdx],
                steps: existingSteps
              };
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
              if (!newWeeks[weekIndex]) {
                newWeeks[weekIndex] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: week.weekIndex,
                  steps: [],
                  title: ''
                };
              }
              newWeeks[weekIndex] = {
                ...newWeeks[weekIndex],
                title: week.title,
                description: week.description
                // Don't overwrite steps - they were added incrementally via step_completed
              };
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

            // Update progress bar immediately -- don't wait for next week_started
            setGenerationProgress(prev => {
              const totalWeeks = formData.durationWeeks;
              if (weekIdx >= totalWeeks) {
                return { currentWeek: totalWeeks, status: 'Finalizing...' };
              }
              return { currentWeek: weekIdx, status: `Generating Week ${weekIdx + 1}...` };
            });

            // Clear "just completed" after animation duration
            setTimeout(() => setJustCompletedWeek(null), 600);
            break;
          }

          case 'url_repair_started': {
            const { count } = message.data;
            setGenerationProgress(prev => ({
              ...prev,
              status: `Searching for links for ${count} reading${count > 1 ? 's' : ''}...`
            }));
            break;
          }

          case 'step_url_repaired': {
            const { stepId, url } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              for (const week of newWeeks) {
                const step = week.steps.find(s => s.id === stepId);
                if (step) {
                  step.url = url;
                  break;
                }
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'url_repair_complete':
            // No UI change needed -- generation continues
            break;

          case 'generation_complete':
            setIsGenerating(false);
            isGeneratingRef.current = false;
            setGeneratingWeeks(new Set());
            setCompletedWeeks(new Set());
            setJustCompletedWeek(null);
            generationWsRef.current = null;
            toast({
              title: "Binder Generated!",
              description: "Your Binder has been generated. Review and make any edits.",
            });
            // Sync store so curator dashboard shows the new binder
            refreshBinders();
            fetch(`/api/binders/${binderId}`, { credentials: 'include' })
              .then(res => res.json())
              .then(updated => {
                // Preserve mediaPreference from local state -- the DB value is authoritative
                // but we keep the user's selection in case it wasn't flushed yet
                setFormData(prev => ({
                  ...updated,
                  mediaPreference: updated.mediaPreference || prev.mediaPreference || 'auto',
                }));
                if (updated.weeks?.length > 0) {
                  setOriginalWeeks(updated.weeks);
                }
                // Update URL to edit route (replace avoids browser back to /new)
                window.history.replaceState(null, '', `/curator/binder/${binderId}/edit`);
              });
            break;

          case 'generation_error': {
            const errorData = message.data;

            if (errorData.isRateLimit) {
              // Keep progress card visible -- no toast, no state reset
              const retryIn = Math.max(errorData.resetIn || 60, 30);
              setGenerationProgress(prev => ({
                ...prev,
                status: `Lots of curators building right now -- resuming in ${retryIn}s`
              }));
              let remaining = retryIn;
              const countdown = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                  clearInterval(countdown);
                  rateLimitRetryRef.current = null;
                  handleAutogenerate();
                } else {
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: `Lots of curators building right now -- resuming in ${remaining}s`
                  }));
                }
              }, 1000);
              rateLimitRetryRef.current = countdown;
              break;
            }

            // Non-rate-limit errors: mark errored week, show toast
            if (errorData.weekIndex) {
              setErroredWeeks(prev => new Set(Array.from(prev).concat(errorData.weekIndex)));
            }
            setIsGenerating(false);
            isGeneratingRef.current = false;
            setGeneratingWeeks(new Set());

            // Re-fetch clean state from server to avoid stale/duplicate data
            refreshBinders();
            fetch(`/api/binders/${binderId}`, { credentials: 'include' })
              .then(res => res.json())
              .then(updated => {
                setFormData(updated);
                if (updated.weeks?.length > 0) {
                  setOriginalWeeks(updated.weeks);
                }
                window.history.replaceState(null, '', `/curator/binder/${binderId}/edit`);
              })
              .catch(() => {}); // Silently fail -- user will see the error toast

            toast({
              title: "Generation Error",
              description: errorData.message || 'Generation failed',
              variant: "destructive"
            });
            break;
          }

          case 'error':
            setIsGenerating(false);
            isGeneratingRef.current = false;
            setGeneratingWeeks(new Set());
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
        isGeneratingRef.current = false;
        generationWsRef.current = null;
        setGeneratingWeeks(new Set());
        // Re-fetch to show whatever was saved before the connection dropped
        if (binderId > 0) {
          refreshBinders();
          fetch(`/api/binders/${binderId}`, { credentials: 'include' })
            .then(res => res.json())
            .then(updated => {
              setFormData(updated);
              if (updated.weeks?.length > 0) {
                setOriginalWeeks(updated.weeks);
              }
              window.history.replaceState(null, '', `/curator/binder/${binderId}/edit`);
            })
            .catch(() => {});
        }
        toast({
          title: "Connection Error",
          description: "Lost connection to generation service. Any completed weeks have been saved.",
          variant: "destructive"
        });
      };

      ws.onclose = (event) => {
        generationWsRef.current = null;
        // Only show error if generation wasn't completed normally (use ref to avoid stale closure)
        if (!isGeneratingRef.current) return;
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setGeneratingWeeks(new Set());

        // Don't show error if user cancelled (code 1000 or 1005)
        if (event.code === 1000 || event.code === 1005) return;

        const errorMessages: Record<number, string> = {
          4401: 'Authentication failed. Please log in again.',
          4403: 'Not authorized to modify this Binder.',
          4404: 'Binder not found.',
          4400: 'Invalid request.',
        };

        const errorMessage = errorMessages[event.code] || 'Connection closed unexpectedly.';
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive"
        });
      };

    } catch (error) {
      setIsGenerating(false);
      isGeneratingRef.current = false;
      generationWsRef.current = null;
      // Reset status back to draft so user can retry
      if (binderId > 0) {
        refreshBinders();
        fetch(`/api/binders/${binderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'draft' })
        }).catch(() => {});
        window.history.replaceState(null, '', `/curator/binder/${binderId}/edit`);
      }
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
    regeneratingWeekRef.current = weekIndex;
    setActiveWeekTab(`week-${weekIndex}`);
    setGeneratingWeeks(new Set([weekIndex]));
    setErroredWeeks(prev => { const next = new Set(prev); next.delete(weekIndex); return next; });

    // Clear only steps for this week -- preserve title/description
    setFormData(prev => {
      const newWeeks = [...prev.weeks];
      const weekIdx = weekIndex - 1;
      if (newWeeks[weekIdx]) {
        newWeeks[weekIdx] = {
          ...newWeeks[weekIdx],
          steps: []
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
          binderId: formData.id,
          weekIndex
        })
      });

      if (!response.ok) throw new Error('Failed to start week regeneration');

      const { websocketUrl } = await response.json();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = useMock ? `${websocketUrl}&mock=true` : websocketUrl;
      const ws = new WebSocket(`${protocol}//${window.location.host}${wsUrl}`);
      generationWsRef.current = ws;

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'rate_limit_wait': {
            const { resetIn } = message.data;
            setGenerationProgress(prev => ({
              ...prev,
              status: `Lots of curators are building right now -- please hold on! Resuming in ${resetIn}s`
            }));
            break;
          }

          case 'url_repair_started': {
            const { count } = message.data;
            setGenerationProgress(prev => ({
              ...prev,
              status: `Searching for links for ${count} reading${count > 1 ? 's' : ''}...`
            }));
            break;
          }

          case 'step_url_repaired': {
            const { stepId, url } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              for (const week of newWeeks) {
                const step = week.steps.find(s => s.id === stepId);
                if (step) {
                  step.url = url;
                  break;
                }
              }
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'url_repair_complete':
            break;

          case 'week_info': {
            const { weekIndex: infoWeekIndex, title, description } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = infoWeekIndex - 1;
              if (!newWeeks[weekIdx]) {
                newWeeks[weekIdx] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: infoWeekIndex,
                  steps: [],
                  title: ''
                };
              }
              newWeeks[weekIdx] = { ...newWeeks[weekIdx], title, description };
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'step_completed': {
            const { weekIndex: stepWeekIndex, step } = message.data;
            setFormData(prev => {
              const newWeeks = [...prev.weeks];
              const weekIdx = stepWeekIndex - 1;
              if (!newWeeks[weekIdx]) {
                newWeeks[weekIdx] = {
                  id: generateTempId(),
                  binderId: prev.id,
                  index: stepWeekIndex,
                  steps: [],
                  title: ''
                };
              }
              const existingSteps = [...newWeeks[weekIdx].steps];
              existingSteps.push(step);
              newWeeks[weekIdx] = { ...newWeeks[weekIdx], steps: existingSteps };
              return { ...prev, weeks: newWeeks };
            });
            break;
          }

          case 'week_completed':
          case 'week_regeneration_complete': {
            setGeneratingWeeks(new Set());
            setRegeneratingWeekIndex(null);
            regeneratingWeekRef.current = null;
            generationWsRef.current = null;
            setCompletedWeeks(prev => new Set(Array.from(prev).concat(weekIndex)));
            setErroredWeeks(prev => { const next = new Set(prev); next.delete(weekIndex); return next; });

            toast({
              title: "Week Regenerated!",
              description: `Week ${weekIndex} has been regenerated successfully.`,
            });

            // Refresh full binder data
            fetch(`/api/binders/${formData.id}`, { credentials: 'include' })
              .then(res => res.json())
              .then(updated => setFormData(updated));
            break;
          }

          case 'generation_error':
          case 'error': {
            setGeneratingWeeks(new Set());
            setErroredWeeks(prev => new Set(Array.from(prev).concat(weekIndex)));
            setRegeneratingWeekIndex(null);
            regeneratingWeekRef.current = null;
            generationWsRef.current = null;

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
        regeneratingWeekRef.current = null;
        generationWsRef.current = null;
        toast({
          title: "Connection Error",
          description: "Lost connection to generation service.",
          variant: "destructive"
        });
      };

      ws.onclose = (event) => {
        generationWsRef.current = null;
        // Only show error if regeneration wasn't completed normally (use ref to avoid stale closure)
        if (regeneratingWeekRef.current === null) return;
        setGeneratingWeeks(new Set());
        setRegeneratingWeekIndex(null);
        regeneratingWeekRef.current = null;

        // Don't show error if user cancelled
        if (event.code === 1000 || event.code === 1005) return;

        const errorMessages: Record<number, string> = {
          4401: 'Authentication failed. Please log in again.',
          4403: 'Not authorized to modify this Binder.',
          4404: 'Binder not found.',
          4400: 'Invalid request.',
        };

        const errorMessage = errorMessages[event.code] || 'Connection closed unexpectedly.';
        toast({
          title: "Regeneration Failed",
          description: errorMessage,
          variant: "destructive"
        });
      };

    } catch (error) {
      setGeneratingWeeks(new Set());
      setRegeneratingWeekIndex(null);
      regeneratingWeekRef.current = null;
      generationWsRef.current = null;
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };


  const handleSave = async (statusOverride?: 'draft' | 'published', visibilityOverride?: string) => {
    if (requireAuth()) return;
    // Update formData immediately so autosave doesn't race with stale values
    const overrides: Record<string, any> = {};
    if (statusOverride) overrides.status = statusOverride;
    if (visibilityOverride) overrides.visibility = visibilityOverride;
    if (Object.keys(overrides).length > 0) {
      setFormData(prev => ({ ...prev, ...overrides }));
    }

    const dataToSave = { ...formData, ...overrides };

    try {
      if (formData.id < 0) {
        await createBinder(dataToSave);
      } else {
        await updateBinder(dataToSave);
      }

      if (statusOverride === 'published') {
        posthog?.capture('binder_published', { binder_id: dataToSave.id, title: dataToSave.title });
      }

      const message = statusOverride === 'published'
        ? "Binder published successfully!"
        : statusOverride === 'draft' && formData.status === 'published'
          ? "Binder has been unpublished."
          : "Your changes have been saved successfully.";

      toast({
        title: statusOverride === 'published' ? "Binder Published" : statusOverride === 'draft' && formData.status === 'published' ? "Binder Unpublished" : "Binder saved",
        description: message,
        ...(statusOverride === 'published' && dataToSave.id > 0 && {
          action: (
            <ToastAction altText="View binder" onClick={() => setLocation(`/binder/${dataToSave.id}`)}>
              View Binder
            </ToastAction>
          ),
        }),
      });
      if (!statusOverride) {
        setLocation('/curator');
      }
    } catch (err) {
      // Revert status on failure
      if (statusOverride) {
        setFormData(prev => ({ ...prev, status: statusOverride === 'published' ? 'draft' : 'published' }));
      }
      toast({
        title: "Save failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShareDraft = () => {
    const draftUrl = `${window.location.origin}/binder/${formData.id}?preview=true`;
    navigator.clipboard.writeText(draftUrl);
    posthog?.capture('link_shared', { url: draftUrl, type: 'draft_preview' });
    toast({
      title: "Draft Link Copied!",
      description: "Share this link with anyone to preview your binder before publishing.",
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

  const handleDelete = async () => {
    if (formData.id < 0) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/binders/${formData.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete binder');
      toast({
        title: "Binder Deleted",
        description: "Your binder has been permanently deleted.",
      });
      setLocation('/curator');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete binder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // DnD sensors with activation constraint to avoid interfering with clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Deduplicate weeks by index -- prevents ghost tabs if duplicate indexes exist
  const uniqueWeeks = useMemo(() => {
    const seen = new Set<number>();
    return (formData.weeks || []).filter(w => {
      if (seen.has(w.index)) return false;
      seen.add(w.index);
      return true;
    });
  }, [formData.weeks]);

  const handleDragEnd = useCallback((weekIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newWeeks = [...formData.weeks];
    const week = newWeeks.find(w => w.index === weekIndex);
    if (!week) return;

    const oldIndex = week.steps.findIndex(s => s.id === active.id);
    const newIndex = week.steps.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    week.steps = arrayMove(week.steps, oldIndex, newIndex);
    // Update position values to reflect new order
    week.steps.forEach((step, i) => { step.position = i + 1; });
    setFormData({ ...formData, weeks: newWeeks });
  }, [formData]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/curator')} className="shrink-0">
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-display">{isNew ? 'Create New Binder' : 'Edit Binder'}</h1>
         </div>
         <div className="flex flex-wrap gap-2 items-center">
            {!isNew && (
              <>
                <Button variant="outline" size="sm" onClick={handleShareDraft} className="gap-2">
                  <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Draft</span>
                </Button>
                <Link href={`/curator/binder/${params?.id}/analytics`}>
                  <Button variant="ghost" size="sm">
                    <BarChart2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Analytics</span>
                  </Button>
                </Link>
              </>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {isGuestMode ? (
                isDemoMode ? (
                  <span className="hidden sm:inline">Demo</span>
                ) : (formData.title.trim() || formData.description.trim()) ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="hidden sm:inline">Progress not saved</span>
                  </>
                ) : null
              ) : isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500/70" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : null}
            </span>
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="gap-1.5 border-destructive text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </Button>
            )}
            {isGuestMode ? (
              <Button size="sm" className="gap-1.5" onClick={() => setShowWaitlist(true)}>Sign up</Button>
            ) : formData.status === 'published' ? (
              <Button variant="secondary" size="sm" onClick={() => setShowUnpublishDialog(true)}>Unpublish</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    Publish <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => handleSave('published', 'public')}>
                    <Globe className="h-4 w-4 mr-2" /> Public
                    <span className="ml-auto text-xs text-muted-foreground">Catalog</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSave('published', 'unlisted')}>
                    <EyeOff className="h-4 w-4 mr-2" /> Unlisted
                    <span className="ml-auto text-xs text-muted-foreground">Link only</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSave('published', 'private')}>
                    <Lock className="h-4 w-4 mr-2" /> Private
                    <span className="ml-auto text-xs text-muted-foreground">Only you</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isNew && (
              <Link href={formData.status === 'published' ? `/binder/${params?.id}` : `/binder/${params?.id}?preview=true`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Preview</span>
                </Button>
              </Link>
            )}
            {!isNew && (
              <Link href={`/curator/binder/${params?.id}/readers`}>
                <Button variant="outline" size="sm" className="gap-2">
                   <Users className="h-4 w-4" /> <span className="hidden sm:inline">Readers</span>
                </Button>
              </Link>
            )}
         </div>
      </div>

      {isLoadingContent ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading binder...</p>
        </div>
      ) : (
      <>
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
            {isGuestMode && demoBinders.length > 0 && !hasBinderContent && !isGenerating && (
              <div className="demo-topic-chips flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Try a demo:</span>
                {demoBinders.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemoGenerate(demo)}
                    className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {demo.title}
                  </button>
                ))}
              </div>
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
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
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      <span className="flex items-center gap-2">
                        {n} {n === 1 ? 'Week' : 'Weeks'}
                        {isGuestMode && n === 4 && (
                          <Badge className="ml-1 bg-green-600 text-white text-[10px] py-0 px-1.5 leading-tight">Free Sign Up</Badge>
                        )}
                        {isGuestMode && n > 4 && (
                          <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                        )}
                        {!isGuestMode && n > 4 && isFreeTier && (
                          <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Audio/Video Materials</Label>
              <Select
                value={formData.mediaPreference || 'auto'}
                onValueChange={(v: any) => setFormData({...formData, mediaPreference: v})}
              >
                <SelectTrigger className="text-base md:text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Category, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-2">
              <Label className="text-sm">Category</Label>
              <Select
                value={formData.categoryId?.toString() || 'none'}
                onValueChange={(v: string) => setFormData({...formData, categoryId: v === 'none' ? null : parseInt(v)})}
              >
                <SelectTrigger className="text-base md:text-lg"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tags ({binderTags.length}/5)</Label>
              {binderTags.length < 5 && (
                <div className="relative">
                  <Input
                    value={tagInput}
                    onChange={e => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                    }}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onFocus={() => tagInput.length >= 2 && setShowTagSuggestions(true)}
                    placeholder="Type a tag and press enter"
                    className="text-base md:text-lg"
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                      {tagSuggestions.map(t => (
                        <button
                          key={t.id}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                          onMouseDown={e => { e.preventDefault(); addTag(t.name); }}
                        >
                          {t.name}
                          {typeof t.usageCount === "number" && t.usageCount > 0 && <span className="text-xs text-muted-foreground">({t.usageCount})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {binderTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {binderTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
                      {tag.name}
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant={isLoadingContent || hasBinderContent ? "secondary" : "default"}
                onClick={handleAutogenerateClick}
                disabled={isGenerating || !formData.title || !formData.description}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isGenerating
                  ? 'Generating...'
                  : hasBinderContent
                    ? 'Regenerate with AI'
                    : 'Autogenerate with AI'}
                {hasBinderContent && isFreeTier && (
                  <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                )}
              </Button>
              {/* Scheduling link toggle -- only shown when curator has a scheduling URL */}
              {user?.schedulingUrl && (
                <div className="scheduling-link-toggle flex items-center gap-2">
                  <Switch
                    id="show-scheduling-link"
                    checked={formData.showSchedulingLink ?? true}
                    onCheckedChange={(checked) => {
                      const val = checked as boolean;
                      setFormData(prev => ({ ...prev, showSchedulingLink: val }));
                      // Persist immediately (don't wait for debounce)
                      if (formData.id > 0) {
                        fetch(`/api/binders/${formData.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ showSchedulingLink: val }),
                        }).catch(() => {});
                      }
                    }}
                  />
                  <label
                    htmlFor="show-scheduling-link"
                    className="text-sm font-medium leading-none cursor-pointer select-none whitespace-nowrap"
                  >
                    Scheduling link
                  </label>
                  <Link href="/profile#scheduling">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit scheduling URL in profile">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
              {/* Admin-only: Mark as Demo toggle */}
              {user?.isAdmin && !isNew && formData.id > 0 && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="is-demo"
                    checked={formData.isDemo ?? false}
                    onCheckedChange={(checked) => {
                      const val = checked as boolean;
                      setFormData(prev => ({ ...prev, isDemo: val }));
                      fetch(`/api/binders/${formData.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ isDemo: val }),
                      }).catch(() => {});
                    }}
                  />
                  <label htmlFor="is-demo" className="text-sm font-medium leading-none cursor-pointer select-none whitespace-nowrap">
                    Demo binder
                  </label>
                </div>
              )}
            </div>
            {/* Generation info for authenticated free users */}
            {!isGuestMode && generationInfo && !generationInfo.isPro && (
              <p className="text-xs text-muted-foreground">
                {generationInfo.remaining !== null && generationInfo.remaining > 0
                  ? `${generationInfo.remaining} of ${generationInfo.generationLimit} free generation${generationInfo.remaining === 1 ? '' : 's'} remaining`
                  : "You've used all free generations. Upgrade to Pro for unlimited."}
                {generationInfo.cooldownRemaining > 0 && ` (${Math.ceil(generationInfo.cooldownRemaining / 60)} min cooldown)`}
              </p>
            )}
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
                          {generationProgress.status || 'Starting generation...'}
                        </span>
                        {generationProgress.currentWeek > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round((completedWeeks.size / formData.durationWeeks) * 100)}%
                          </span>
                        )}
                      </div>
                      <Progress
                        value={generationProgress.currentWeek === 0
                          ? 5
                          : (completedWeeks.size / formData.durationWeeks) * 100}
                        className="h-2 bg-secondary"
                        indicatorClassName="bg-foreground"
                      />
                    </div>
                  </div>

                  {/* Cancel button */}
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelGeneration}
                      className="text-muted-foreground hover:text-destructive gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Binder weeks */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium">Binder</h2>
        <Tabs value={activeWeekTab} onValueChange={setActiveWeekTab} className="w-full">
          <TabsList className="w-auto flex-wrap h-auto p-1 justify-start">
            {uniqueWeeks.map(w => {
              const isWeekGenerating = generatingWeeks.has(w.index);
              const isWeekComplete = completedWeeks.has(w.index);
              const isWeekErrored = erroredWeeks.has(w.index);

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
                  {isWeekErrored && !isWeekGenerating && (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  {isWeekComplete && !isWeekGenerating && !isWeekErrored && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {uniqueWeeks.map(week => {
            const isWeekGenerating = generatingWeeks.has(week.index);
            const isWeekCompleted = completedWeeks.has(week.index);
            const isJustCompleted = justCompletedWeek === week.index;
            const hasContent = week.steps.length > 0 || week.title;
            // Show skeleton placeholder for any week not yet completed during full generation,
            // or for the actively generating week during single-week regeneration
            const showPlaceholder = isWeekGenerating || (isGenerating && !isWeekCompleted);

            return (
            <TabsContent key={week.index} value={`week-${week.index}`} className="space-y-6 sm:space-y-10 mt-4 sm:mt-8">
              {showPlaceholder ? (
                <Card>
                  <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                    <GeneratingWeekPlaceholder
                      weekIndex={week.index}
                      status={isWeekGenerating ? generationProgress.status : `Waiting to generate Week ${week.index}...`}
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
                               if (isFreeTier) {
                                 setShowUpgrade(true);
                                 return;
                               }
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
                             {isFreeTier && (
                               <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                             )}
                           </Button>
                         </div>
                       )}
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(week.index)}>
                    <SortableContext items={week.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-10">
                      {week.steps.map((step, idx) => (
                        <SortableStep
                          key={step.id}
                          step={step}
                          idx={idx}
                          weekIndex={week.index}
                          isJustCompleted={isJustCompleted}
                          updateStep={updateStep}
                          removeStep={removeStep}
                          handleAutoFill={handleAutoFill}
                          isSaving={isSaving}
                          lastSaved={lastSaved}
                        />
                      ))}
                    </div>
                    </SortableContext>
                    </DndContext>

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
             <Link href={`/curator/binder/${params?.id}/readers`}>
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
                          <Link href={`/curator/binder/${formData.id}/readers`}>
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


      </>
      )}

      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Binder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your existing Binder content with newly generated material.
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

      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Binder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{formData.title || 'this binder'}" from the Catalog. It will no longer be visible to new readers. Current readers' progress will be kept and restored if you republish.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => {
                setShowUnpublishDialog(false);
                handleSave('draft');
              }}
            >
              Unpublish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { if (!isDeleting) setShowDeleteDialog(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Binder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{formData.title || 'this binder'}" and all its weeks, steps, enrollments, and submissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</> : 'Delete Permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRegenerateWeekDialog} onOpenChange={setShowRegenerateWeekDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Week {weekToRegenerate}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate the readings and exercises for Week {weekToRegenerate}.
              The week title and summary will be preserved. Other weeks will remain unchanged.
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

      <UpgradePrompt open={showUpgrade} onOpenChange={setShowUpgrade} variant="pro-feature" />

      {/* Waitlist popup for guest mode */}
      <Dialog open={showWaitlist} onOpenChange={setShowWaitlist}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Waitlist</DialogTitle>
            <DialogDescription>
              Sign up to get 2 free AI-generated binders with readings, exercises, and curated resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowWaitlist(false)}>
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                if (waitlistUrl) {
                  window.open(waitlistUrl, '_blank');
                } else {
                  setLocation(`/login?mode=signup`);
                }
                setShowWaitlist(false);
              }}
            >
              Join Waitlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
