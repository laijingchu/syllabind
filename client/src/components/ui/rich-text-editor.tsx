import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Heading1, Heading2, Quote, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

const EditorBubbleMenu = ({ editor }: { editor: Editor }) => {
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <BubbleMenu editor={editor} className="flex overflow-hidden rounded-md border bg-zinc-900 text-zinc-50 shadow-xl">
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('bold') && "bg-zinc-700 text-zinc-50")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('italic') && "bg-zinc-700 text-zinc-50")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('heading', { level: 1 }) && "bg-zinc-700 text-zinc-50")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('heading', { level: 2 }) && "bg-zinc-700 text-zinc-50")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('bulletList') && "bg-zinc-700 text-zinc-50")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0 rounded-none hover:bg-zinc-800 hover:text-zinc-50", editor.isActive('link') && "bg-zinc-700 text-zinc-50")}
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
};

export function RichTextEditor({ value, onChange, placeholder, className, isSaving, lastSaved }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[120px] w-full bg-transparent text-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5 max-w-none border-b border-input focus-visible:border-primary rounded-none px-1 py-2 text-xl font-serif",
          className
        ),
      },
    },
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
       if (editor.getText() === '' && value) {
         editor.commands.setContent(value);
       }
    }
  }, [value, editor]);

  return (
    <div className="group relative">
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent editor={editor} className="[&_.ProseMirror]:min-h-[120px]" />
      
      {/* Save indicator attached to the editor */}
      {(isSaving !== undefined || lastSaved !== undefined) && (
        <div className="absolute -bottom-6 right-0 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
          {isSaving ? (
            <span className="text-xs text-muted-foreground">Saving...</span>
          ) : lastSaved ? (
            <>
               <CheckCircle2 className="h-3 w-3 text-green-500/70" />
               <span className="text-xs text-muted-foreground/70">Saved</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
