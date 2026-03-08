import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  count?: number;
  countLabel?: string;
  className?: string;
}

export function SearchBar({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  count,
  countLabel = 'results',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`search-bar flex items-center gap-3 ${className}`}>
      <div className="search-bar-input-group flex items-center gap-2 flex-1">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-background text-sm"
        />
        <Button
          variant="secondary"
          size="icon"
          className="shrink-0"
          onClick={onSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {count !== undefined && (
        <div className="search-bar-count text-sm text-muted-foreground shrink-0">
          {count} {countLabel}
        </div>
      )}
    </div>
  );
}
