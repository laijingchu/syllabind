import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconClassName = 'bg-primary/10 text-primary',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state flex flex-col items-center justify-center text-center py-12 gap-4 ${className}`}>
      {Icon && (
        <div className={`empty-state-icon rounded-full p-4 ${iconClassName}`}>
          <Icon className="h-8 w-8" />
        </div>
      )}
      <div className="empty-state-content space-y-2">
        <h2 className="text-xl font-display">{title}</h2>
        {description && <p className="text-muted-foreground max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  );
}
