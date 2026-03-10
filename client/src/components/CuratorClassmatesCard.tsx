import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Globe, Hash, Linkedin, Lock, MessageCircle, Share2, Twitter, User as UserIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReaderProfile } from '@/lib/types';

interface CuratorClassmatesCardProps {
  curator: any;
  binder: { id: number; status?: string; showSchedulingLink?: boolean };
  readers: ReaderProfile[];
  totalEnrolled: number;
  isActive: boolean;
  isCompleted: boolean;
  enrollmentShareProfile: boolean;
  onShareProfileChange: (checked: boolean) => void;
  onBookCall: () => void;
  onJoinSlack: () => void;
  onShareClick: () => void;
  slackUrl: string | null;
  currentUser: any;
  isPro: boolean;
  canEdit?: boolean;
  isGuestPreview?: boolean;
  flipTrigger?: number;
}

function ReaderAvatar({ reader }: { reader: ReaderProfile }) {
  const avatarSrc = reader.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${reader.user.name || reader.user.username}`;
  const initial = (reader.user.name || reader.user.username || '?').charAt(0);
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button type="button" className="group relative cursor-pointer" onClick={() => setOpen(prev => !prev)}>
            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-transparent group-hover:ring-ring transition-all">
              <AvatarImage src={avatarSrc} alt={reader.user.name || reader.user.username} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            {reader.status === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-primary-inverted text-foreground-inverted rounded-full p-0.5 border border-background">
                <Check className="h-2 w-2" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-3 w-60 bg-popover text-popover-foreground border shadow-xl">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-border mt-0.5">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="space-y-0.5">
                <p className="font-medium text-sm leading-tight truncate">{reader.user.name}</p>
                {reader.user.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{reader.user.bio}</p>}
              </div>
              <div className="flex gap-0.5 -ml-1">
                {reader.user.linkedin && (
                  <a href={`https://linkedin.com/in/${reader.user.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {reader.user.twitter && (
                  <a href={`https://twitter.com/${reader.user.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {reader.user.threads && (
                  <a href={`https://threads.net/@${reader.user.threads}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                {reader.user.website && (
                  <a href={reader.user.website} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { ReaderAvatar };

export function CuratorClassmatesCard({
  curator,
  binder,
  readers,
  totalEnrolled,
  isActive,
  isCompleted,
  enrollmentShareProfile,
  onShareProfileChange,
  onBookCall,
  onJoinSlack,
  onShareClick,
  slackUrl,
  currentUser,
  isPro,
  canEdit = false,
  isGuestPreview = false,
  flipTrigger = 0,
}: CuratorClassmatesCardProps) {
  const [showClassmates, setShowClassmates] = useState(false);

  // Flip to classmates whenever parent bumps the trigger
  useEffect(() => {
    if (flipTrigger > 0) setShowClassmates(true);
  }, [flipTrigger]);

  const inProgressReaders = (readers || []).filter(l => l.status === 'in-progress');
  const completedReaders = (readers || []).filter(l => l.status === 'completed');

  return (
    <div className="curator-sidebar [perspective:1000px]">
      <div className={cn(
        "curator-card relative transition-transform duration-500 [transform-style:preserve-3d]",
        showClassmates && "[transform:rotateY(180deg)]"
      )}>
        {/* Front: Meet the Curator */}
        <div className="[backface-visibility:hidden] border rounded-xl bg-card shadow-sm p-6 space-y-5">
          {curator ? (
            <>
              <h3 className="font-medium text-lg border-b pb-3">Meet the Curator</h3>
              <div className="curator-info flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-border shrink-0">
                  <AvatarImage src={curator.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${curator.name}`} alt={curator.name} />
                  <AvatarFallback className="text-lg">{curator.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-medium">{curator.name}</h3>
                  {curator.profileTitle && (
                    <p className="text-xs text-muted-foreground">{curator.profileTitle}</p>
                  )}
                  {curator.expertise && !curator.profileTitle && (
                    <p className="text-xs text-muted-foreground">{curator.expertise}</p>
                  )}
                </div>
              </div>

              {curator.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">{curator.bio}</p>
              )}

              {(curator.linkedin || curator.twitter || curator.threads || curator.website) && (
                <div className="flex flex-wrap gap-2">
                  {curator.linkedin && (
                    <a href={`https://linkedin.com/in/${curator.linkedin}`} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                      <Linkedin className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {curator.twitter && (
                    <a href={`https://twitter.com/${curator.twitter}`} target="_blank" rel="noopener noreferrer" title="X / Twitter" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                      <Twitter className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {curator.threads && (
                    <a href={`https://threads.net/@${curator.threads}`} target="_blank" rel="noopener noreferrer" title="Threads" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {curator.website && (
                    <a href={curator.website.startsWith('http') ? curator.website : `https://${curator.website}`} target="_blank" rel="noopener noreferrer" title="Website" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="h-[18px] w-[18px]" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {curator.schedulingUrl && binder?.showSchedulingLink !== false && (
                  <Button variant="secondary" size="sm" onClick={onBookCall} className="w-full gap-2">
                    <CalendarDays className="h-4 w-4" />
                    1:1 Office Hour
                    {(!currentUser || !isPro) && (
                      <Badge className="bg-primary-inverted text-foreground-inverted text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                    )}
                  </Button>
                )}

                {slackUrl && binder?.status === 'published' && (
                  <Button variant="secondary" size="sm" onClick={onJoinSlack} className="w-full gap-2">
                    <Hash className="h-4 w-4" />
                    Join learning community
                    {(!currentUser || !isPro) && (
                      <Badge className="bg-primary-inverted text-foreground-inverted text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                    )}
                  </Button>
                )}

                <Button variant="secondary" size="sm" onClick={onShareClick} className="w-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Share with friend
                </Button>
              </div>

              {canEdit && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Only you can see this — <Link href={`/curator/binder/${binder.id}/edit`} className="underline hover:text-foreground transition-colors">edit this binder</Link>
                </p>
              )}

              {totalEnrolled > 0 && (
                <button
                  onClick={() => setShowClassmates(true)}
                  className="flex items-center gap-2 text-sm text-primary hover:underline font-medium pt-1 w-full justify-center"
                >
                  <Users className="h-4 w-4" />
                  See Classmates List
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </>
          ) : isGuestPreview ? (
            <>
              <h3 className="font-medium text-lg border-b pb-3">Meet the Curator</h3>
              <div className="curator-info flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-border shrink-0">
                  <AvatarFallback className="text-lg bg-muted">
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-medium">Your Name</h3>
                  <p className="text-xs text-muted-foreground">Your Title</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is where your bio appears. Highlight your expertise and what makes you the right guide for this topic. Once your binder is published, you can add a scheduling link so readers can book paid 1:1 sessions with you.
              </p>

              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" disabled>
                  <CalendarDays className="h-4 w-4" />
                  1:1 Office Hour
                  <Badge className="bg-primary-inverted text-foreground-inverted text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                </Button>

                <Button variant="secondary" size="sm" className="w-full gap-2" disabled>
                  <Hash className="h-4 w-4" />
                  Join learning community
                  <Badge className="bg-primary-inverted text-foreground-inverted text-[10px] py-0 px-1.5 leading-tight">Pro</Badge>
                </Button>

                <Button variant="secondary" size="sm" className="w-full gap-2" disabled>
                  <Share2 className="h-4 w-4" />
                  Share with friend
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Loading curator info...</p>
          )}
        </div>

        {/* Back: Classmates */}
        <div className="[backface-visibility:hidden] [transform:rotateY(180deg)] absolute inset-0 border rounded-xl bg-card shadow-sm p-6 space-y-5 overflow-y-auto">
          <div className="classmates-header flex justify-between items-center border-b pb-3">
            <h3 className="font-medium text-lg">Classmates</h3>
            <span className="text-sm text-muted-foreground">{totalEnrolled} enrolled</span>
          </div>

          {(isActive || isCompleted) && (
            <div className="flex items-center gap-2">
              <Switch
                id="share-profile"
                className="data-[state=unchecked]:bg-input"
                checked={enrollmentShareProfile}
                onCheckedChange={(checked) => onShareProfileChange(checked as boolean)}
              />
              <label
                htmlFor="share-profile"
                className="text-xs font-medium leading-none cursor-pointer text-muted-foreground select-none"
              >
                Appear in list
              </label>
            </div>
          )}

          {inProgressReaders.length === 0 && completedReaders.length === 0 && (
            <p className="text-sm text-muted-foreground">Still waiting for curious readers!</p>
          )}

          {inProgressReaders.length > 0 && (
            <div className="classmates-group space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">In Progress</p>
              <div className="classmates-avatars flex -space-x-3 overflow-hidden py-1 pl-1 flex-wrap gap-y-3">
                {inProgressReaders.map((reader, index) => (
                  <div key={reader.user.id} style={{ zIndex: inProgressReaders.length - index, position: 'relative' }}>
                    <ReaderAvatar reader={reader} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedReaders.length > 0 && (
            <div className="classmates-group space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
              <div className="classmates-avatars flex -space-x-3 overflow-hidden py-1 pl-1 flex-wrap gap-y-3">
                {completedReaders.map((reader, index) => (
                  <div key={reader.user.id} style={{ zIndex: completedReaders.length - index, position: 'relative' }}>
                    <ReaderAvatar reader={reader} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {slackUrl && (
            <p className="text-sm text-muted-foreground">
              <button onClick={onJoinSlack} className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                Join Slack{(!currentUser || !isPro) && <Lock className="h-3 w-3" />}
              </button>
            </p>
          )}

          <button
            onClick={() => setShowClassmates(false)}
            className="flex items-center gap-2 text-sm text-primary hover:underline font-medium pt-1 w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Curator info
          </button>
        </div>
      </div>
    </div>
  );
}
