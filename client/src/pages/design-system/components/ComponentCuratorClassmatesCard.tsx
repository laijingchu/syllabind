import { useState } from 'react';
import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { CuratorClassmatesCard } from '@/components/CuratorClassmatesCard';
import { useToast } from '@/hooks/use-toast';

const mockCurator = {
  name: 'Jane Smith',
  avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=janesmith',
  profileTitle: 'Learning Designer & Author',
  expertise: 'Digital Minimalism',
  bio: 'I help people build healthier relationships with technology. Author of two books on digital wellness and a former UX researcher at a major tech company.',
  linkedin: 'janesmith',
  twitter: 'janesmith',
  threads: 'janesmith',
  website: 'https://janesmith.example.com',
  schedulingUrl: 'https://cal.example.com/janesmith',
};

import { ReaderProfile } from '@/lib/types';

const mockReaders: ReaderProfile[] = [
  { user: { id: '1', username: 'alice', name: 'Alice Chen', isCurator: false, avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=alice', bio: 'Product designer exploring digital wellness.', linkedin: 'alicechen' }, status: 'in-progress', joinedDate: '2026-02-15' },
  { user: { id: '2', username: 'bob', name: 'Bob Park', isCurator: false, avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=bob', bio: 'Software engineer and avid reader.', twitter: 'bobpark' }, status: 'in-progress', joinedDate: '2026-02-20' },
  { user: { id: '3', username: 'carol', name: 'Carol Rivera', isCurator: false, avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=carol' }, status: 'in-progress', joinedDate: '2026-03-01' },
  { user: { id: '4', username: 'dave', name: 'Dave Kim', isCurator: false, avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=dave', bio: 'Completed in 3 weeks!', linkedin: 'davekim', threads: 'davekim' }, status: 'completed', joinedDate: '2026-01-10' },
];

export default function ComponentCuratorClassmatesCard() {
  const { toast } = useToast();
  const [shareProfile, setShareProfile] = useState(true);

  const noop = () => {};
  const showToast = (msg: string) => () => toast({ title: msg });

  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">CuratorClassmatesCard</h1>
          <p className="text-lg text-muted-foreground">
            A 3D flip card showing curator info on the front and a classmates list on the back.
            Shared across BinderOverview and WeekView pages for a consistent sidebar experience.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use CuratorClassmatesCard</strong> in any binder-scoped page sidebar where the curator profile and classmates list should be visible. It provides the curator's bio, social links, action buttons (Office Hour, Community, Share), and a flip animation to reveal enrolled classmates.</p>
            <p><strong className="text-foreground">Do not use</strong> for curator display outside of binder context (e.g. admin panels or catalog cards). Use BinderCard or CuratorRecruitCard instead.</p>
          </div>
        </section>

        {/* Demo */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Demo</h2>
          <p className="text-sm text-muted-foreground">Click "See Classmates List" to flip the card. Click "Back to Curator" to flip back.</p>
          <div className="border border-border rounded-lg p-6 max-w-sm">
            <CuratorClassmatesCard
              curator={mockCurator}
              binder={{ id: 1, status: 'published' }}
              readers={mockReaders}
              totalEnrolled={7}
              isActive={true}
              isCompleted={false}
              enrollmentShareProfile={shareProfile}
              onShareProfileChange={setShareProfile}
              onBookCall={showToast('Office Hour clicked')}
              onJoinSlack={showToast('Join Community clicked')}
              onShareClick={showToast('Share clicked')}
              slackUrl="https://slack.example.com"
              currentUser={{ username: 'demo' }}
              isPro={false}
            />
          </div>

          <p className="text-xs font-mono text-muted-foreground mt-4">Guest preview state</p>
          <div className="border border-border rounded-lg p-6 max-w-sm">
            <CuratorClassmatesCard
              curator={null}
              binder={{ id: -1 }}
              readers={[]}
              totalEnrolled={0}
              isActive={false}
              isCompleted={false}
              enrollmentShareProfile={false}
              onShareProfileChange={noop}
              onBookCall={noop}
              onJoinSlack={noop}
              onShareClick={noop}
              slackUrl={null}
              currentUser={null}
              isPro={false}
              isGuestPreview={true}
            />
          </div>
        </section>

        {/* Structure */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Structure</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Front face:</strong> Curator avatar, name, title/expertise, bio, social links (LinkedIn, Twitter/X, Threads, Website), action buttons (1:1 Office Hour, Join Community, Share with Friend), and a "See Classmates List" CTA that triggers the flip.</p>
            <p><strong className="text-foreground">Back face:</strong> Classmates header with enrollment count, share-profile toggle, readers grouped by status (In Progress / Completed) with overlapping avatars, optional Slack CTA, and a "Back to Curator" button.</p>
            <p><strong className="text-foreground">ReaderAvatar:</strong> Exported sub-component rendering each reader as an interactive avatar with a tooltip showing their name, bio, and social links.</p>
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
                  <td className="p-3 font-mono text-xs">curator</td>
                  <td className="p-3 font-mono text-xs">any</td>
                  <td className="p-3 text-muted-foreground">Curator profile object (name, bio, avatarUrl, social links, schedulingUrl).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">binder</td>
                  <td className="p-3 font-mono text-xs">{`{ id, status?, showSchedulingLink? }`}</td>
                  <td className="p-3 text-muted-foreground">Binder metadata for conditional rendering of action buttons.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">readers</td>
                  <td className="p-3 font-mono text-xs">ReaderProfile[]</td>
                  <td className="p-3 text-muted-foreground">Array of classmates with user info and enrollment status.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">totalEnrolled</td>
                  <td className="p-3 font-mono text-xs">number</td>
                  <td className="p-3 text-muted-foreground">Total enrollment count (includes private profiles).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">isActive</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">Whether the current user is actively enrolled.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">isCompleted</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">Whether the current user has completed the binder.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">enrollmentShareProfile</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">Current share-profile toggle state.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onShareProfileChange</td>
                  <td className="p-3 font-mono text-xs">(checked: boolean) =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Callback when share-profile toggle changes.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onBookCall</td>
                  <td className="p-3 font-mono text-xs">() =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Handler for Office Hour button click.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onJoinSlack</td>
                  <td className="p-3 font-mono text-xs">() =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Handler for Join Community button click.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onShareClick</td>
                  <td className="p-3 font-mono text-xs">() =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Handler for Share with Friend button click.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">slackUrl</td>
                  <td className="p-3 font-mono text-xs">string | null</td>
                  <td className="p-3 text-muted-foreground">Slack community URL; hides community button when null.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">canEdit?</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">Shows "edit this binder" link for curators/admins.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">isGuestPreview?</td>
                  <td className="p-3 font-mono text-xs">boolean</td>
                  <td className="p-3 text-muted-foreground">Shows placeholder curator info for guest preview mode.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Styling Notes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Styling Notes</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">3D flip:</strong> Uses CSS <code className="text-primary bg-muted px-1 rounded">perspective: 1000px</code> on the container and <code className="text-primary bg-muted px-1 rounded">transform-style: preserve-3d</code> with <code className="text-primary bg-muted px-1 rounded">backface-visibility: hidden</code> on both faces. The back face is rotated 180deg and absolutely positioned.</p>
            <p><strong className="text-foreground">Avatar sizes:</strong> Curator avatar is 56px (h-14 w-14). Reader avatars are 40px (h-10 w-10) with -3 overlap spacing.</p>
            <p><strong className="text-foreground">Social link buttons:</strong> 36px circular buttons with muted background and brand-colored hover states.</p>
            <p><strong className="text-foreground">Pro badges:</strong> Shown on Office Hour and Community buttons when the user is not Pro.</p>
          </div>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--card" value="Card background" />
            <TokenRow token="--border" value="Card border, avatar borders, section dividers" />
            <TokenRow token="--muted" value="Social link button backgrounds" />
            <TokenRow token="--muted-foreground" value="Secondary text, social link icons" />
            <TokenRow token="--primary" value="CTA links, active states" />
            <TokenRow token="--primary-inverted" value="Pro badge background, completion badge" />
            <TokenRow token="--foreground-inverted" value="Pro badge text" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { CuratorClassmatesCard } from '@/components/CuratorClassmatesCard';

<CuratorClassmatesCard
  curator={curator}
  binder={binder}
  readers={readers}
  totalEnrolled={totalEnrolled}
  isActive={isActive}
  isCompleted={isCompleted}
  enrollmentShareProfile={enrollmentShareProfile}
  onShareProfileChange={handleShareProfileChange}
  onBookCall={handleBookCall}
  onJoinSlack={handleJoinSlack}
  onShareClick={() => setShowShareDialog(true)}
  slackUrl={slackUrl}
  currentUser={currentUser}
  isPro={isPro}
  canEdit={canEdit}
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Reader tooltips:</strong> Built on Radix Tooltip with click-to-toggle for touch devices. Social links within tooltips have descriptive titles.</p>
            <p><strong className="text-foreground">Share profile toggle:</strong> Uses Radix Switch with associated label for screen readers.</p>
            <p><strong className="text-foreground">Social links:</strong> All external links have <code className="text-primary bg-muted px-1 rounded">target="_blank" rel="noopener noreferrer"</code> and descriptive title attributes.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">BinderOverview:</strong> Displayed in the sticky right sidebar. Includes the "edit this binder" link for curators and supports guest preview mode.</p>
            <p><strong className="text-foreground">WeekView:</strong> Displayed in the sticky right sidebar below the progress card and week navigation. Provides the same curator info and classmates experience as the overview page.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
