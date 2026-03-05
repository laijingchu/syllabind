import DesignSystemLayout, { CodeBlock, TokenRow } from '../DesignSystemLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function UIAvatar() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Avatar</h1>
          <p className="text-muted-foreground">
            A circular image element representing a user, with an automatic fallback to initials
            when the image is unavailable. Built on Radix UI Avatar for graceful loading states.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use Avatar</strong> to represent a user visually wherever identity context is needed: profile headers, cards, lists, and inline mentions.</p>
            <p><strong className="text-foreground">Use an icon</strong> instead when representing a generic or anonymous entity without a specific user identity.</p>
          </div>
        </section>

        {/* Demo - With Image */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">With Image</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Jane Smith" alt="Jane Smith" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex Reed" alt="Alex Reed" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Maya Kim" alt="Maya Kim" />
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The image loads asynchronously. While loading, the fallback is displayed. Once loaded, the image replaces it seamlessly.
          </p>
          <p className="text-sm text-muted-foreground">
            Syllabind uses <strong className="text-foreground">DiceBear Notionists</strong> (<code className="text-primary bg-primary/5 px-1 rounded">api.dicebear.com/7.x/notionists/svg</code>) as the default avatar illustration style. The <code className="text-primary bg-primary/5 px-1 rounded">seed</code> parameter is set to the user's display name to generate a consistent, unique illustration per user. Custom uploaded photos replace the DiceBear fallback.
          </p>
        </section>

        {/* Demo - Fallback Initials */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Fallback Initials</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar>
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            When no image is provided or it fails to load, the fallback renders initials on a muted background. Use 1-2 characters for best results.
          </p>
        </section>

        {/* Demo - Sizes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Sizes</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 text-center">
                <Avatar className="h-6 w-6 text-xs">
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">24px</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar className="h-8 w-8 text-xs">
                  <AvatarFallback>MD</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">32px</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar>
                  <AvatarFallback>DF</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">40px (default)</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar className="h-14 w-14 text-lg">
                  <AvatarFallback>LG</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">56px</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar className="h-20 w-20 text-2xl">
                  <AvatarFallback>XL</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">80px</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The default size is 40px (<code className="text-primary bg-primary/5 px-1 rounded">h-10 w-10</code>). Override via className to fit different contexts. Adjust <code className="text-primary bg-primary/5 px-1 rounded">text-*</code> alongside for proportional initials.
          </p>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">States</h2>
          <div className="border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 text-center">
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=OK" alt="OK" />
                  <AvatarFallback>OK</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">Image loaded</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar>
                  <AvatarImage src="/broken-image-url.jpg" alt="Broken" />
                  <AvatarFallback>FB</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">Fallback (broken image)</p>
              </div>
              <div className="space-y-2 text-center">
                <Avatar>
                  <AvatarFallback>NA</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">No image provided</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Radix Avatar handles the loading lifecycle automatically: it renders the fallback immediately, then swaps to the image once it has loaded successfully. Broken URLs fall back gracefully.
          </p>
        </section>

        {/* Design Tokens */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Design Tokens</h2>
          <div className="border border-border rounded-lg p-4">
            <TokenRow token="--muted" value="Fallback background color" />
            <TokenRow token="--muted-foreground" value="Fallback initials text color" />
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// With DiceBear Notionists illustration
const avatarSrc = \`https://api.dicebear.com/7.x/notionists/svg?seed=\${userName}\`;
<Avatar>
  <AvatarImage src={avatarSrc} alt="Jane Smith" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>

// With uploaded photo
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>

// Fallback only (no image)
<Avatar>
  <AvatarFallback>AR</AvatarFallback>
</Avatar>

// Custom size
<Avatar className="h-14 w-14 text-lg">
  <AvatarImage src={avatarSrc} alt="Jane Smith" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>

// Small inline avatar (e.g. curator row in BinderCard)
<Avatar className="h-8 w-8 border border-border/50">
  <AvatarImage src={avatarSrc} alt={curatorName} />
  <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
    {initial}
  </AvatarFallback>
</Avatar>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Alt text:</strong> Always provide a descriptive <code className="text-primary bg-primary/5 px-1 rounded">alt</code> prop on AvatarImage for screen readers.</p>
            <p><strong className="text-foreground">Fallback:</strong> The initials in AvatarFallback are readable by screen readers. Use meaningful abbreviations (first + last initial).</p>
            <p><strong className="text-foreground">Decorative use:</strong> If the avatar is purely decorative (e.g., next to the user's full name), use <code className="text-primary bg-primary/5 px-1 rounded">alt=""</code> to avoid redundant announcements.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">User profiles:</strong> Large avatar (80px) on Profile and CuratorProfile pages.</p>
            <p><strong className="text-foreground">Curator cards:</strong> Medium avatar (40px) in the curator-card section on BinderOverview.</p>
            <p><strong className="text-foreground">Classmates section:</strong> Small avatars (32px) in the classmates-grid showing enrolled readers.</p>
            <p><strong className="text-foreground">Header user menu:</strong> Compact avatar (32px) in the navigation bar as the profile menu trigger.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
