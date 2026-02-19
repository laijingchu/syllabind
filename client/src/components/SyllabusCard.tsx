import { useState } from 'react';
import { Link } from 'wouter';
import { Syllabus } from '@/lib/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Clock, ArrowRight, Calendar, Linkedin, Twitter, MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, pluralize } from '@/lib/utils';
import { format } from 'date-fns';

interface SyllabusCardProps {
  syllabus: Syllabus;
  className?: string;
}

export function SyllabusCard({ syllabus, className }: SyllabusCardProps) {
  const dateToShow = syllabus.updatedAt || syllabus.createdAt;
  const isUpdated = syllabus.updatedAt && syllabus.createdAt &&
    new Date(syllabus.updatedAt).getTime() !== new Date(syllabus.createdAt).getTime();

  const creator = syllabus.creator;
  const creatorName = creator?.name || creator?.username || syllabus.creatorId;
  const avatarSrc = creator?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${creatorName}`;
  const initial = (creatorName || '?').charAt(0);
  const hasSocials = creator && (creator.linkedin || creator.twitter || creator.threads || creator.website);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden transition-all border-border/60", className)}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="font-normal">
            {syllabus.audienceLevel}
          </Badge>
        </div>
        <div className="flex items-center justify-between py-1">
          {creator && (
            <TooltipProvider delayDuration={0}>
              <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="creator-avatar flex items-center gap-2 cursor-pointer rounded-full pr-2 hover:bg-muted/50 transition-colors"
                    onClick={() => setTooltipOpen(prev => !prev)}
                  >
                    <Avatar className="h-6 w-6 border border-border/50">
                      <AvatarImage src={avatarSrc} alt={creatorName} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {creatorName}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="p-3 w-60 bg-popover text-popover-foreground border shadow-xl">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 border border-border/50 mt-0.5">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm leading-tight truncate">{creatorName}</p>
                        {creator.expertise && <p className="text-xs text-primary/80 leading-snug truncate">{creator.expertise}</p>}
                        {creator.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{creator.bio}</p>}
                      </div>
                      {hasSocials && (
                        <div className="flex gap-0.5 -ml-1">
                          {creator.linkedin && (
                            <a href={`https://linkedin.com/in/${creator.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors">
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {creator.twitter && (
                            <a href={`https://twitter.com/${creator.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors">
                              <Twitter className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {creator.threads && (
                            <a href={`https://threads.net/@${creator.threads}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {creator.website && (
                            <a href={creator.website} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
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
          {dateToShow && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Calendar className="h-3 w-3" />
              {isUpdated ? 'Updated' : 'Created'} {format(new Date(dateToShow), 'MMM d, yyyy')}
            </div>
          )}
        </div>
        <h3 className="text-xl font-display font-medium leading-tight group-hover:text-primary transition-colors">
          {syllabus.title}
        </h3>
      </CardHeader>
      <CardContent className="pb-4 space-y-3 flex-1">
        <div
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: syllabus.description }}
        />
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Link href={`/syllabus/${syllabus.id}`}>
           <Button variant="outline" className="gap-2 group-hover:border-primary/50 group-hover:text-primary transition-colors">
             View Syllabind
             <ArrowRight className="h-4 w-4 opacity-50 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
           </Button>
        </Link>
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" /> {pluralize(syllabus.durationWeeks, 'week')}
        </span>
      </CardFooter>
    </Card>
  );
}
