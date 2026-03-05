import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';

export default function UICalendar() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 5),
    to: new Date(2026, 2, 12),
  });

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Calendar</h1>
          <p className="text-muted-foreground">
            A date picker calendar built on react-day-picker. Supports single date selection,
            date ranges, and multiple months with keyboard navigation.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Calendar</strong> when users need to pick a specific date or date range. Typically paired with a Popover for inline date pickers.</p>
            <p><strong className="text-foreground">Use a text input</strong> instead when the date is far in the past or future and easier to type (e.g., birth date).</p>
          </div>
        </section>

        {/* Demo - Single Date */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={setSelected}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Selected: <code className="text-primary bg-primary/5 px-1 rounded">{selected ? selected.toLocaleDateString() : 'none'}</code>
            </p>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Date Range</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Range: <code className="text-primary bg-primary/5 px-1 rounded">
                  {range?.from ? range.from.toLocaleDateString() : '?'} - {range?.to ? range.to.toLocaleDateString() : '?'}
                </code>
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Disabled Dates</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  disabled={{ before: new Date() }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Past dates are disabled and shown at 50% opacity.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Today is highlighted with <code className="text-primary bg-primary/5 px-1 rounded">bg-accent</code>. Selected dates use <code className="text-primary bg-primary/5 px-1 rounded">bg-primary</code>. Range midpoints use a lighter accent fill. Outside-month days are muted.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Selected date fill and range endpoints" />
            <TokenRow token="--accent" value="Today highlight and range midpoint fill" />
            <TokenRow token="--muted" value="Outside-month day text color" />
            <TokenRow token="--ring" value="Focus ring on day buttons and dropdowns" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Calendar } from '@/components/ui/calendar';

// Single date selection
const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>

// Date range
const [range, setRange] = useState<{ from: Date; to?: Date }>();

<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
/>

// Disable past dates
<Calendar
  mode="single"
  disabled={{ before: new Date() }}
/>

// Inside a Popover (common pattern)
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Pick a date</Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> Arrow keys move focus between days. Enter or Space selects a day. Page Up/Down navigate months.</p>
            <p><strong className="text-foreground">Focus indicator:</strong> Focused day shows a 3px ring using <code className="text-primary bg-primary/5 px-1 rounded">ring-ring/50</code>.</p>
            <p><strong className="text-foreground">Disabled dates:</strong> Reduced to 50% opacity with <code className="text-primary bg-primary/5 px-1 rounded">aria-disabled</code> set.</p>
            <p><strong className="text-foreground">Screen readers:</strong> Each day is announced with its full date. Navigation buttons are labeled "Previous month" and "Next month".</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Binder scheduling:</strong> Curators pick start and end dates when setting up cohort-based binders.</p>
            <p><strong className="text-foreground">Date pickers:</strong> Used inside Popover for date selection fields throughout forms.</p>
            <p><strong className="text-foreground">Analytics:</strong> Date range selection for filtering binder activity and reader progress data.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
