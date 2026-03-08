import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { BinderCard } from '@/components/BinderCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Linkedin, Twitter, MessageCircle, Globe } from 'lucide-react';
import type { Binder } from '@/lib/types';

const demoBinder: Binder = {
  id: 1,
  title: 'Digital Minimalism',
  description: 'A 4-week guided exploration of intentional technology use. Learn to reclaim your attention, build healthier digital habits, and rediscover offline activities that bring meaning.',
  audienceLevel: 'Beginner',
  durationWeeks: 4,
  status: 'published',
  visibility: 'public',
  weeks: [],
  curatorId: 'janesmith',
  curator: {
    username: 'janesmith',
    name: 'Jane Smith',
    avatarUrl: null,
    bio: 'Writer and digital wellness advocate exploring the intersection of technology and mindful living.',
    expertise: 'Digital Wellness',
    profileTitle: null,
    linkedin: 'janesmith',
    twitter: 'janesmith',
    threads: null,
    website: null,
    schedulingUrl: null,
  },
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-02-20T00:00:00Z',
};

const demoBinderMinimal: Binder = {
  id: 2,
  title: 'Systems Thinking 101',
  description: 'An introduction to systems thinking frameworks. Understand feedback loops, leverage points, and mental models for analyzing complex problems.',
  audienceLevel: 'Intermediate',
  durationWeeks: 3,
  status: 'published',
  visibility: 'public',
  weeks: [],
  curatorId: 'alexr',
  curator: {
    username: 'alexr',
    name: 'Alex Rivera',
    avatarUrl: null,
    bio: null,
    expertise: null,
    profileTitle: null,
    linkedin: null,
    twitter: null,
    threads: null,
    website: null,
    schedulingUrl: null,
  },
  createdAt: '2026-02-01T00:00:00Z',
};

export default function ComponentBinderCard() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">BinderCard</h1>
          <p className="text-lg text-muted-foreground">
            A card component for displaying binder previews. Composes Card, Badge, Avatar, Tooltip,
            and Button to show curator info, category badge, title, description, duration, and a CTA
            that transforms on group hover.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use BinderCard</strong> anywhere a binder needs to be represented as a browsable item in a grid or list — catalog pages, dashboard enrollment lists, and marketing surfaces.</p>
            <p><strong className="text-foreground">Use BinderOverview</strong> instead when the user has navigated to a single binder and needs full detail (week-by-week breakdown, enrollment sidebar, classmates).</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BinderCard binder={demoBinder} />
              <BinderCard binder={demoBinderMinimal} />
            </div>
          </div>
          <p className="text-base text-muted-foreground">
            Hover over a card to see the group hover effects: title color change, CTA button fill, and arrow icon slide. Click the curator avatar to open the tooltip with bio and social links.
          </p>
        </section>

        {/* Anatomy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Anatomy</h2>
          <div className="border border-border rounded-lg p-6 space-y-4 text-base">
            <div className="space-y-3">
              <div className="border-l-2 border-border pl-4 space-y-1">
                <p className="font-medium text-foreground">1. Curator row (CardHeader top)</p>
                <p className="text-lg text-muted-foreground">Avatar (8x8, DiceBear fallback) + curator name in muted text. Wrapped in a Tooltip trigger that opens on hover or click, revealing the curator's bio, expertise, and social links (LinkedIn, Twitter, Threads, Website).</p>
              </div>
              <div className="border-l-2 border-border pl-4 space-y-1">
                <p className="font-medium text-foreground">2. Audience level badge</p>
                <p className="text-lg text-muted-foreground">Outline Badge showing <code className="text-primary bg-muted px-1 rounded">binder.audienceLevel</code> (e.g. "Beginner", "Intermediate").</p>
              </div>
              <div className="border-l-2 border-border pl-4 space-y-1">
                <p className="font-medium text-foreground">3. Title</p>
                <p className="text-lg text-muted-foreground">Display font, xl size. Transitions to primary color on group hover.</p>
              </div>
              <div className="border-l-2 border-border pl-4 space-y-1">
                <p className="font-medium text-foreground">4. Description (CardContent)</p>
                <p className="text-lg text-muted-foreground">HTML-sanitized description rendered via <code className="text-primary bg-muted px-1 rounded">dangerouslySetInnerHTML</code> with <code className="text-primary bg-muted px-1 rounded">sanitizeHtml()</code>. Clamped to 3 lines.</p>
              </div>
              <div className="border-l-2 border-border pl-4 space-y-1">
                <p className="font-medium text-foreground">5. Footer (CardFooter)</p>
                <p className="text-lg text-muted-foreground">"View Binder" outline Button with ArrowRight icon that slides in on hover. Duration label with Clock icon showing week count via <code className="text-primary bg-muted px-1 rounded">pluralize()</code>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Curator Popover */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Curator Popover</h2>
          <p className="text-base text-muted-foreground">
            Clicking or hovering the curator avatar opens a rich tooltip showing the curator's profile and social links. Below is the popover content rendered inline.
          </p>
          <div className="border border-border rounded-lg p-6 space-y-6">
            {/* Full popover - with all social links */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">With bio, expertise, and social links</p>
              <div className="bg-popover text-popover-foreground border shadow-xl rounded-md p-3 w-60">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-border mt-0.5">
                    <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Jane Smith" />
                    <AvatarFallback>J</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm leading-tight truncate">Jane Smith</p>
                      <p className="text-xs text-primary leading-snug truncate">Digital Wellness</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">Writer and digital wellness advocate exploring intentional technology use.</p>
                    </div>
                    <div className="flex gap-0.5 -ml-1">
                      <span className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0077b5] transition-colors cursor-pointer">
                        <Linkedin className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#1DA1F2] transition-colors cursor-pointer">
                        <Twitter className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <Globe className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal popover - no socials */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Minimal (no bio, no social links)</p>
              <div className="bg-popover text-popover-foreground border shadow-xl rounded-md p-3 w-60">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-border mt-0.5">
                    <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex Rivera" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm leading-tight truncate">Alex Rivera</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Structure:</strong> Avatar (h-9 w-9) + name, optional expertise (<code className="text-primary bg-muted px-1 rounded">text-primary</code>), optional bio (line-clamp-2), optional social icons row.</p>
            <p><strong className="text-foreground">Container:</strong> <code className="text-primary bg-muted px-1 rounded">w-60</code>, uses <code className="text-primary bg-muted px-1 rounded">bg-popover text-popover-foreground</code> tokens, <code className="text-primary bg-muted px-1 rounded">shadow-xl</code> for elevated appearance.</p>
            <p><strong className="text-foreground">Trigger:</strong> A <code className="text-primary bg-muted px-1 rounded">{"<button>"}</code> wrapping the avatar + name. Opens on hover (via TooltipProvider with <code className="text-primary bg-muted px-1 rounded">delayDuration=0</code>) and on click (via controlled state toggle).</p>
          </div>
        </section>

        {/* Social Icons */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Social Icons</h2>
          <p className="text-base text-muted-foreground">
            The curator popover uses Lucide icons at <code className="text-primary bg-muted px-1 rounded">h-3.5 w-3.5</code> (14px) for social links. Each has a brand-specific hover color.
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-3 font-medium">Icon</th>
                  <th className="text-left p-3 font-medium">Lucide name</th>
                  <th className="text-left p-3 font-medium">Resting color</th>
                  <th className="text-left p-3 font-medium">Hover color</th>
                  <th className="text-left p-3 font-medium">URL pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center p-1.5 rounded-md border border-border">
                      <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">Linkedin</td>
                  <td className="p-3 font-mono text-xs">text-muted-foreground</td>
                  <td className="p-3"><span className="font-mono text-xs text-[#0077b5]">#0077b5</span></td>
                  <td className="p-3 font-mono text-xs">{"linkedin.com/in/{handle}"}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center p-1.5 rounded-md border border-border">
                      <Twitter className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">Twitter</td>
                  <td className="p-3 font-mono text-xs">text-muted-foreground</td>
                  <td className="p-3"><span className="font-mono text-xs text-[#1DA1F2]">#1DA1F2</span></td>
                  <td className="p-3 font-mono text-xs">{"twitter.com/{handle}"}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center p-1.5 rounded-md border border-border">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">MessageCircle</td>
                  <td className="p-3 font-mono text-xs">text-muted-foreground</td>
                  <td className="p-3 font-mono text-xs">text-foreground</td>
                  <td className="p-3 font-mono text-xs">{"threads.net/@{handle}"}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center p-1.5 rounded-md border border-border">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">Globe</td>
                  <td className="p-3 font-mono text-xs">text-muted-foreground</td>
                  <td className="p-3 font-mono text-xs">text-primary</td>
                  <td className="p-3 font-mono text-xs">{"direct URL"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Size:</strong> All icons use <code className="text-primary bg-muted px-1 rounded">h-3.5 w-3.5</code> (14px). This is smaller than the standard component icon size (16px) to fit the compact popover context.</p>
            <p><strong className="text-foreground">Hit target:</strong> Each icon is wrapped in an anchor with <code className="text-primary bg-muted px-1 rounded">p-1 rounded-md</code> padding, giving a comfortable touch/click target despite the small icon.</p>
            <p><strong className="text-foreground">Hover background:</strong> All icons gain <code className="text-primary bg-muted px-1 rounded">hover:bg-muted</code> for subtle feedback on top of the brand color transition.</p>
            <p><strong className="text-foreground">Security:</strong> All links open in new tabs with <code className="text-primary bg-muted px-1 rounded">target="_blank" rel="noopener noreferrer"</code>.</p>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">binder</td>
                  <td className="p-3 font-mono text-xs">Binder</td>
                  <td className="p-3 text-muted-foreground">Full binder object including nested <code className="text-primary bg-muted px-1 rounded">curator</code> with profile and social links.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">className?</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 text-muted-foreground">Additional classes merged onto the root Card element via <code className="text-primary bg-muted px-1 rounded">cn()</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Internal Composition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Internal Composition</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Card, CardHeader, CardContent, CardFooter</strong> — Structural layout with flex column and full height.</p>
            <p><strong className="text-foreground">Avatar + AvatarImage + AvatarFallback</strong> — Curator avatar with DiceBear fallback URL.</p>
            <p><strong className="text-foreground">Tooltip (TooltipProvider, Trigger, Content)</strong> — Rich curator popover with bio, expertise, and social icon links.</p>
            <p><strong className="text-foreground">Badge (outline)</strong> — Audience level indicator.</p>
            <p><strong className="text-foreground">Button (outline)</strong> — "View Binder" CTA that fills primary on group hover.</p>
            <p><strong className="text-foreground">Link (wouter)</strong> — Wraps the CTA button, navigating to <code className="text-primary bg-muted px-1 rounded">/binder/:id</code>.</p>
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Group hover effects:</strong> The root Card has the <code className="text-primary bg-muted px-1 rounded">group</code> class. On hover, the title transitions to primary color, the CTA button fills with primary background, and the arrow icon slides from left to right with opacity transition.</p>
            <p><strong className="text-foreground">Sanitized HTML:</strong> The description uses <code className="text-primary bg-muted px-1 rounded">sanitizeHtml()</code> from <code className="text-primary bg-muted px-1 rounded">@/lib/sanitize</code> before rendering via dangerouslySetInnerHTML.</p>
            <p><strong className="text-foreground">Date display:</strong> Shows <code className="text-primary bg-muted px-1 rounded">updatedAt</code> if different from <code className="text-primary bg-muted px-1 rounded">createdAt</code>, otherwise shows creation date. Formatted with date-fns.</p>
            <p><strong className="text-foreground">Flex layout:</strong> The card uses <code className="text-primary bg-muted px-1 rounded">flex flex-col h-full</code> so cards in a grid align footers regardless of content length.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--primary" value="Title hover color, CTA hover fill" />
            <TokenRow token="--primary-inverted" value="CTA text on hover" />
            <TokenRow token="--muted-foreground" value="Curator name, description, duration text" />
            <TokenRow token="--border" value="Card border (at 60% opacity)" />
            <TokenRow token="--muted" value="Curator row hover background, avatar fallback background" />
            <TokenRow token="--popover / --popover-foreground" value="Tooltip content background and text" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { BinderCard } from '@/components/BinderCard';

// Basic usage in a grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {binders.map((binder) => (
    <BinderCard key={binder.id} binder={binder} />
  ))}
</div>

// With custom className
<BinderCard binder={binder} className="max-w-sm" />

// Binder type shape (key fields)
interface Binder {
  id: number;
  title: string;
  description: string;
  audienceLevel: string;
  durationWeeks: number;
  curatorId: string;
  createdAt: string;
  updatedAt?: string;
  curator?: {
    username: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    expertise?: string;
    linkedin?: string;
    twitter?: string;
    threads?: string;
    website?: string;
  };
}`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Curator tooltip:</strong> The tooltip trigger is a <code className="text-primary bg-muted px-1 rounded">&lt;button&gt;</code> element, making it keyboard-focusable and activatable. It opens on hover (via TooltipProvider) and on click (via state toggle).</p>
            <p><strong className="text-foreground">Social links:</strong> Each social icon link in the tooltip opens in a new tab with <code className="text-primary bg-muted px-1 rounded">rel="noopener noreferrer"</code> for security.</p>
            <p><strong className="text-foreground">CTA button:</strong> The "View Binder" button is wrapped in a wouter Link, providing standard anchor navigation semantics.</p>
            <p><strong className="text-foreground">Sanitization:</strong> HTML descriptions are sanitized before rendering to prevent XSS attacks.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Catalog:</strong> Primary grid of all published binders, typically 3 columns on desktop.</p>
            <p><strong className="text-foreground">Dashboard:</strong> Reader's enrolled binders list, showing progress context alongside the card.</p>
            <p><strong className="text-foreground">Marketing page:</strong> Featured binders section showcasing curated highlights.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
