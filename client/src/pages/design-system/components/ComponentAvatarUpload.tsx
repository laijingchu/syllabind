import DesignSystemLayout, { CodeBlock } from '../DesignSystemLayout';
import { Upload, User as UserIcon, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function ComponentAvatarUpload() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">AvatarUpload</h1>
          <p className="text-lg text-muted-foreground">
            A drag-and-drop avatar upload component with live preview, powered by react-dropzone.
            Handles file selection, upload to the server, and removal of existing avatars.
          </p>
        </div>

        {/* When to Use */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">When to Use</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Use AvatarUpload</strong> when a user needs to set or change a profile photo. It combines a preview, a dropzone trigger, and a remove action in a single cohesive control.</p>
            <p><strong className="text-foreground">Use a plain Avatar</strong> when displaying a user's photo without editing capability.</p>
          </div>
        </section>

        {/* Anatomy */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Anatomy</h2>
          <p className="text-base text-muted-foreground">
            The component cannot be rendered in this design system demo because it calls <code className="text-primary bg-primary/5 px-1 rounded">fetch('/api/upload')</code> on file drop. Below is a static representation of its layout.
          </p>
          <div className="border border-border rounded-lg p-6">
            <div className="flex items-center gap-6">
              {/* Static avatar preview */}
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarFallback className="text-2xl bg-muted">
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                {/* Static dropzone representation */}
                <div className="border-2 border-dashed border-border rounded-md px-4 py-3 text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>Upload photo</span>
                </div>

                {/* Remove button (shown when avatar exists) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                  disabled
                >
                  <X className="h-3 w-3 mr-1.5" /> Remove photo
                </Button>

                <p className="text-[10px] text-muted-foreground">
                  Recommended: Square JPG, PNG, or GIF. Max 2MB.
                </p>
              </div>
            </div>
          </div>
          <div className="text-base text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Avatar preview</strong> — 96x96px (h-24 w-24) with a 2px border. Shows the uploaded image or a fallback initial/icon.</p>
            <p><strong className="text-foreground">Dropzone area</strong> — Dashed border, click or drag-and-drop to select a file. Highlights on drag-over with primary color.</p>
            <p><strong className="text-foreground">Remove button</strong> — Ghost destructive button, only visible when an avatar URL is set.</p>
            <p><strong className="text-foreground">File restrictions text</strong> — Micro-copy at 10px showing accepted formats and max size.</p>
          </div>
        </section>

        {/* Props */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Props</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-xs">currentAvatarUrl</td>
                  <td className="p-3 font-mono text-xs">string?</td>
                  <td className="p-3 text-muted-foreground">URL of the currently set avatar. When provided, shows the image and the remove button.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">name</td>
                  <td className="p-3 font-mono text-xs">string</td>
                  <td className="p-3 text-muted-foreground">User's display name. First character is used as the fallback initial in the Avatar.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onUpload</td>
                  <td className="p-3 font-mono text-xs">(url: string) =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Called with the uploaded image URL after a successful server upload.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">onRemove</td>
                  <td className="p-3 font-mono text-xs">() =&gt; void</td>
                  <td className="p-3 text-muted-foreground">Called when the user clicks the remove photo button.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Internal Composition */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Internal Composition</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Avatar / AvatarImage / AvatarFallback</strong> — Renders the circular preview with image or initial fallback.</p>
            <p><strong className="text-foreground">Button</strong> — Ghost destructive variant for the remove action.</p>
            <p><strong className="text-foreground">react-dropzone</strong> — Provides drag-and-drop file handling, restricts to image/* with .png, .jpg, .jpeg, .gif extensions, single file only.</p>
            <p><strong className="text-foreground">Lucide icons</strong> — Upload, User (fallback), X (remove).</p>
          </div>
        </section>

        {/* Code */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Code</h2>
          <CodeBlock>{`import { AvatarUpload } from '@/components/AvatarUpload';

// Basic usage
<AvatarUpload
  currentAvatarUrl={user.avatarUrl}
  name={user.displayName}
  onUpload={(url) => updateProfile({ avatarUrl: url })}
  onRemove={() => updateProfile({ avatarUrl: null })}
/>

// Without existing avatar (shows fallback)
<AvatarUpload
  name="Jane Smith"
  onUpload={(url) => handleUpload(url)}
  onRemove={() => handleRemove()}
/>`}</CodeBlock>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Accessibility</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Keyboard:</strong> The dropzone area is clickable and opens the native file picker. The remove button is focusable via Tab and activates on Enter or Space.</p>
            <p><strong className="text-foreground">Drag and drop:</strong> react-dropzone provides a hidden file input, so screen readers see a standard file input. The visible dropzone acts as a click target.</p>
            <p><strong className="text-foreground">Error feedback:</strong> Upload failures display a browser alert with a descriptive error message.</p>
            <p><strong className="text-foreground">Alt text:</strong> The Avatar image uses the <code className="text-primary bg-primary/5 px-1 rounded">name</code> prop as alt text.</p>
          </div>
        </section>

        {/* In the Product */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">In the Product</h2>
          <div className="text-base text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Profile page:</strong> Readers use AvatarUpload to set or change their profile photo in account settings.</p>
            <p><strong className="text-foreground">CuratorProfile page:</strong> Curators upload their avatar displayed on binder pages and the curator card.</p>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
