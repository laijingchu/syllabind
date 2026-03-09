import { Link } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ItemListEntry {
  id: string | number;
  href: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'tertiary' | 'destructive' | 'success-surface' | 'warning-surface' | 'danger-surface' | 'warning-inverted' | 'success-inverted';
}

interface ItemListItemProps {
  item: ItemListEntry;
  className?: string;
}

const showAvatar = (item: ItemListEntry) => !!(item.avatarUrl || item.avatarFallback);

export function ItemListItem({ item, className }: ItemListItemProps) {
  return (
    <Link href={item.href}>
      <div className={cn(
        'item-list-item group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer',
        className
      )}>
        {showAvatar(item) && (
          <Avatar className="h-7 w-7 border border-border shrink-0">
            <AvatarImage src={item.avatarUrl} alt={item.title} />
            <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
              {(item.avatarFallback || item.title || '?').charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-medium group-hover:text-primary transition-colors truncate">{item.title}</h5>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
          )}
        </div>
        {item.badge && (
          <Badge variant={item.badgeVariant || 'secondary'} className="text-xs shrink-0">
            {item.badge}
          </Badge>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

interface ItemListProps {
  items: ItemListEntry[];
  label?: string;
  className?: string;
}

export function ItemList({ items, label, className }: ItemListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('item-list space-y-3', className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      )}
      <div className="space-y-1">
        {items.map(item => (
          <ItemListItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

interface ItemListCardProps {
  title: string;
  action?: { label: string; href: string };
  items: ItemListEntry[];
  className?: string;
}

export function ItemListCard({ title, action, items, className }: ItemListCardProps) {
  if (items.length === 0) return null;

  return (
    <Card className={cn('item-list-card', className)}>
      <CardHeader className="pb-3 !flex-row !space-y-0 items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {action && (
          <Link href={action.href} className="text-sm text-primary hover:underline">
            {action.label}
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map(item => (
            <ItemListItem key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
