import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function ShareDialog({ open, onOpenChange, title = "Share this page" }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "The link has been copied to your clipboard.",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Share this link with a friend to invite them to learn together.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            value={currentUrl}
            readOnly
            className="flex-1 text-sm"
          />
          <Button onClick={handleCopy} size="icon" variant={copied ? "default" : "outline"}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
