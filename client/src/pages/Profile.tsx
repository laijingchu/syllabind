import { useStore } from '@/lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  profileTitle: z.string().max(100, {
    message: "Title must not be longer than 100 characters.",
  }).optional(),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  threads: z.string().optional(),
  schedulingUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  shareProfile: z.boolean().default(false),
});

export default function Profile() {
  const { user, updateUser } = useStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Scroll to hash anchor (e.g. #scheduling) on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    }
  }, []);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      profileTitle: user?.profileTitle || "",
      bio: user?.bio || "",
      website: user?.website || "",
      linkedin: user?.linkedin || "",
      twitter: user?.twitter || "",
      threads: user?.threads || "",
      schedulingUrl: user?.schedulingUrl || "",
      shareProfile: user?.shareProfile || false,
    },
  });

  if (!user) {
    return <div className="py-10">Please log in to view your profile.</div>;
  }

  function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsSaving(true);
    
    // Simulate network delay
    setTimeout(() => {
      updateUser(values);
      setIsSaving(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    }, 800);
  }

  const handleAvatarUpload = (url: string) => {
    // Prevent blob URLs from being saved
    if (url.startsWith('blob:')) {
      console.error('Blob URL detected, not saving:', url);
      toast({
        title: "Upload error",
        description: "Invalid image URL. Please try uploading again.",
        variant: "destructive"
      });
      return;
    }

    updateUser({ avatarUrl: url });
    toast({
      title: "Avatar updated",
      description: "Looking good!",
    });
  };

  const handleAvatarRemove = () => {
    updateUser({ avatarUrl: null });
  };

  return (
    <div className="grid-12 gap-y-6">
      {/* Header */}
      <div className="col-span-12">
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Manage your public profile and preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="col-span-12 grid-12 gap-y-6">

          {/* Left — Identity */}
          <Card className="col-span-12 md:col-span-6">
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Your public name, photo, and bio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Profile Picture</label>
                <AvatarUpload
                  currentAvatarUrl={user.avatarUrl}
                  name={user.name}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Username: {user?.username}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Product Designer at Acme" {...field} />
                    </FormControl>
                    <FormDescription>A short headline, like your role or expertise.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little about yourself" className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>Max 160 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Right — Links */}
          <Card className="col-span-12 md:col-span-6">
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Social profiles and scheduling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Username</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-muted-foreground text-sm mr-2 select-none">in/</span>
                        <Input placeholder="username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X (Twitter) Handle</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-muted-foreground text-sm mr-2 select-none">@</span>
                        <Input placeholder="username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="threads"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threads Handle</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-muted-foreground text-sm mr-2 select-none">@</span>
                        <Input placeholder="username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schedulingUrl"
                render={({ field }) => (
                  <FormItem id="scheduling">
                    <FormLabel>Scheduling Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://calendly.com/you" {...field} />
                    </FormControl>
                    <FormDescription>
                      Link to your scheduling page (Calendly, Cal.com, etc.). Shown on any of your binders. Only offer paid sessions on topics that align with your expertise.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save */}
          <div className="col-span-12 flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
