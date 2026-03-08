import { useState } from 'react';
import { Link } from 'wouter';
import { Binder } from '@/lib/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Clock, ArrowRight, Linkedin, Twitter, MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, pluralize } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { format } from 'date-fns';

interface BinderCardProps {
  binder: Binder;
  className?: string;
}

export function BinderCard({ binder, className }: BinderCardProps) {
  const dateToShow = binder.updatedAt || binder.createdAt;
  const isUpdated = binder.updatedAt && binder.createdAt &&
    new Date(binder.updatedAt).getTime() !== new Date(binder.createdAt).getTime();

  const curator = binder.curator;
  const curatorName = curator?.name || curator?.username || binder.curatorId;
  const avatarSrc = curator?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${curatorName}`;
  const initial = (curatorName || '?').charAt(0);
  const hasSocials = curator && (curator.linkedin || curator.twitter || curator.threads || curator.website);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden transition-all border-border", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between py-1">
          {curator && (
            <TooltipProvider delayDuration={0}>
              <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="curator-avatar flex items-center gap-2 cursor-pointer rounded-full pr-2 hover:bg-muted transition-colors"
                    onClick={() => setTooltipOpen(prev => !prev)}
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={avatarSrc} alt={curatorName} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {curatorName}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="p-3 w-60 bg-popover text-popover-foreground border shadow-xl">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 border border-border mt-0.5">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm leading-tight truncate">{curatorName}</p>
                        {curator.expertise && <p className="text-xs text-primary leading-snug truncate">{curator.expertise}</p>}
                        {curator.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{curator.bio}</p>}
                      </div>
                      {hasSocials && (
                        <div className="flex gap-0.5 -ml-1">
                          {curator.linkedin && (
                            <a href={`https://linkedin.com/in/${curator.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {curator.twitter && (
                            <a href={`https://twitter.com/${curator.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                              <Twitter className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {curator.threads && (
                            <a href={`https://threads.net/@${curator.threads}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {curator.website && (
                            <a href={curator.website} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex justify-between items-start mt-3 mb-2">
          <Badge variant="secondary" className="font-normal">
            {binder.audienceLevel}
          </Badge>
        </div>
        <h3 className="text-xl font-display font-medium leading-tight group-hover:text-primary transition-colors">
          {binder.title}
        </h3>
      </CardHeader>
      <CardContent className="pb-4 space-y-3 flex-1">
        <div
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(binder.description) }}
        />
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Link href={`/binder/${binder.id}`}>
           <Button variant="secondary" className="binder-card-cta gap-2 group-hover:border-primary transition-colors">
             View Binder
             <ArrowRight className="h-4 w-4 opacity-50 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
           </Button>
        </Link>
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" /> {pluralize(binder.durationWeeks, 'week')}
        </span>
      </CardFooter>
    </Card>
  );
}
