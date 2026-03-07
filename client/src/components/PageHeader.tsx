import { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`page-header flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="page-header-content space-y-2">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" className="page-header-back -ml-3">
              <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
            </Button>
          </Link>
        )}
        <div className="page-header-titles space-y-1">
          <h1 className="text-3xl font-display text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions shrink-0">{actions}</div>}
    </div>
  );
}
