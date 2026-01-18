import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/20">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('bold') && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('italic') && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('link') && "bg-muted text-foreground")}
        onClick={setLink}
        title="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", editor.isActive('blockquote') && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
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
          "min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose dark:prose-invert prose-sm max-w-none",
          "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
          className
        ),
      },
    },
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content if value changes externally (e.g. initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
       // Only update if the content is different to avoid cursor jumping
       // But comparing HTML strings can be tricky. 
       // For this simple mock, we'll assume external updates only happen on load or drastic changes.
       if (editor.getText() === '' && value) {
         editor.commands.setContent(value);
       }
    }
  }, [value, editor]);

  return (
    <div className="border rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="p-0 [&_.ProseMirror]:border-0 [&_.ProseMirror]:shadow-none [&_.ProseMirror]:focus-visible:ring-0 [&_.ProseMirror]:min-h-[150px] [&_.ProseMirror]:p-3" />
    </div>
  );
}
