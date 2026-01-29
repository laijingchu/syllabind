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
    <div className={`empty-state ${className}`}>
      {Icon && (
        <div className={`empty-state-icon ${iconClassName}`}>
          <Icon className="h-8 w-8" />
        </div>
      )}
      <div className="empty-state-content">
        <h2 className="text-xl font-serif">{title}</h2>
        {description && <p className="text-muted-foreground max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  );
}
