import { ReactNode } from 'react';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Single source of truth for Free plan features.
 * Used in UpgradePrompt (enrollment-signup) and Pricing page.
 */
export const FREE_READER_FEATURES: string[] = [
  '1 active enrollment',
];

export const FREE_CURATOR_FEATURES: string[] = [
  '100 lifetime AI credits for binder creation',
  '3 manual binders',
  'Up to 4-week AI binders',
  'Unlisted/private publishing',
];

/** Flat list of all Free features as strings (for compact display like UpgradePrompt). */
export function getAllFreeFeatures(): string[] {
  return [...FREE_READER_FEATURES, ...FREE_CURATOR_FEATURES];
}

/**
 * Single source of truth for Pro plan features.
 * Used in UpgradePrompt and Pricing page.
 */
export const PRO_READER_FEATURES: Array<string | { text: string; starred?: boolean }> = [
  'Unlimited enrollments',
  { text: 'Join exclusive learning community', starred: true },
  { text: 'Book 1:1 call with featured curator', starred: true },
];

export const PRO_CURATOR_FEATURES: Array<string | { text: string; starred?: boolean }> = [
  '130 AI credits/month for binder creation',
  'Purchase additional AI credits',
  'Create unlimited binders',
  'Up to 6-week AI binders',
  'Submit binder for featured listing',
];

export const PRO_BOTTOM_FEATURES: ReactNode[] = [
  <span key="video-sessions">Promote your paid video call sessions on your binders — set your own rate, add your scheduling link, <span className="font-bold underline">with no platform fee</span></span>,
];

/** Flat list of all Pro features as strings (for compact display like UpgradePrompt). */
export function getAllProFeatures(): string[] {
  const extract = (f: string | { text: string }) => typeof f === 'string' ? f : f.text;
  return [
    ...PRO_READER_FEATURES.map(extract),
    ...PRO_CURATOR_FEATURES.map(extract),
  ];
}

interface ProFeaturesListProps {
  className?: string;
  /** Compact mode shows a flat list. Full mode shows reader/curator sections. */
  variant?: 'compact' | 'full';
}

/**
 * Compact Pro features list for use in modals and cards.
 */
export function ProFeaturesList({ className, variant = 'compact' }: ProFeaturesListProps) {
  if (variant === 'compact') {
    const features = getAllProFeatures();
    return (
      <div className={cn('border rounded-lg p-4 bg-muted space-y-2', className)}>
        <p className="font-medium text-sm">Syllabind Pro includes:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

/**
 * Compact Free plan features list for use in modals (enrollment-signup).
 */
export function FreePlanFeaturesList({ className }: { className?: string }) {
  const features = getAllFreeFeatures();
  return (
    <div className={cn('border rounded-lg p-4 bg-muted space-y-2', className)}>
      <p className="font-medium text-sm">Free account includes:</p>
      <ul className="text-sm text-muted-foreground space-y-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
