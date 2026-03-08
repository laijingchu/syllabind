import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit2, BarChart2, ChevronDown, Globe, EyeOff, Lock, Eye } from 'lucide-react';
import { pluralize } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Binder } from '@/lib/types';

interface CuratorBinderRowProps {
  binder: Binder;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  readerCount?: { total: number; active: number };
  isAdmin?: boolean;
  isOtherCurator?: boolean;
  hasApprovalNotification?: boolean;
  onPublish: (id: number, visibility: string) => void;
  onUnpublish: (id: number) => void;
  onWithdraw: (id: number) => void;
  onRequestReview: (id: number) => void;
}

export function CuratorBinderCard({
  binder,
  selected,
  onToggleSelect,
  readerCount,
  isAdmin,
  isOtherCurator,
  hasApprovalNotification,
  onPublish,
  onUnpublish,
  onWithdraw,
  onRequestReview,
}: CuratorBinderRowProps) {
  return (
    <Card className={`curator-binder-card relative hover:shadow-md transition-shadow cursor-pointer ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Link href={`/curator/binder/${binder.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${binder.title}`} />
      <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="relative z-10 flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(binder.id)}
            className="mt-1 shrink-0"
          />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {binder.status === 'published' ? (
                binder.visibility === 'unlisted' ? (
                  <Badge variant="tertiary" className="shrink-0">Unlisted</Badge>
                ) : binder.visibility === 'private' ? (
                  <Badge variant="tertiary" className="shrink-0">Private</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Published</Badge>
                )
              ) : binder.status === 'pending_review' ? (
                <Badge variant="secondary" className="shrink-0 bg-warning-surface text-warning border-warning-border">
                  Pending Review
                </Badge>
              ) : (
                <Badge variant="tertiary" className="shrink-0">Draft</Badge>
              )}
              {isOtherCurator && (
                <Badge variant="secondary" className="text-xs">
                  by {binder.curator?.name || binder.curatorId}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm sm:text-lg leading-tight">{binder.title}</h3>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {pluralize(binder.durationWeeks, 'week')} • {binder.audienceLevel}
              <span className="hidden sm:inline"> • Updated {binder.updatedAt ? formatDistanceToNow(new Date(binder.updatedAt as string), { addSuffix: true }) : 'recently'}</span>
            </div>
            {binder.reviewNote && binder.status === 'draft' && (
              <div className="text-xs text-warning bg-warning-surface border border-warning-border rounded px-2 py-1 mt-1">
                Review feedback: {binder.reviewNote}
              </div>
            )}
            {binder.status === 'published' && hasApprovalNotification && (
              <div className="text-xs text-success bg-success-surface border border-success-border rounded px-2 py-1 mt-1">
                Approved and published!
              </div>
            )}
            {/* Mobile reader count */}
            <div className="text-xs text-muted-foreground sm:hidden md:hidden">
              {pluralize(readerCount?.total || 0, 'Reader')} • {pluralize(readerCount?.active || 0, 'Active')}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
          <div className="mr-2 sm:mr-4 text-right hidden md:block">
            <div className="text-sm font-medium">{pluralize(readerCount?.total || 0, 'Reader')}</div>
            <div className="text-xs text-muted-foreground">{pluralize(readerCount?.active || 0, 'Active')}</div>
          </div>
          {binder.status === 'published' ? (
            <Button variant="tertiary" size="sm" className="h-8 px-3" onClick={() => onUnpublish(binder.id)}>
              Unpublish
            </Button>
          ) : binder.status === 'pending_review' && !isAdmin ? (
            <Button variant="tertiary" size="sm" className="h-8 px-3" onClick={() => onWithdraw(binder.id)}>
              Withdraw from Review
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 px-2 sm:px-3 gap-1.5">
                  Publish <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => isAdmin ? onPublish(binder.id, 'public') : onRequestReview(binder.id)}>
                  <Globe className="h-4 w-4 mr-2" /> Public
                  <span className="ml-auto text-xs text-muted-foreground">{isAdmin ? 'Catalog' : 'To be featured'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPublish(binder.id, 'unlisted')}>
                  <EyeOff className="h-4 w-4 mr-2" /> Unlisted
                  <span className="ml-auto text-xs text-muted-foreground">Link only</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPublish(binder.id, 'private')}>
                  <Lock className="h-4 w-4 mr-2" /> Private
                  <span className="ml-auto text-xs text-muted-foreground">Only you</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Link href={`/curator/binder/${binder.id}/edit`}>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={binder.status === 'published' ? `/binder/${binder.id}` : `/binder/${binder.id}?preview=true`}>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/curator/binder/${binder.id}/analytics`}>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <BarChart2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
