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
import { useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  threads: z.string().optional(),
  shareProfile: z.boolean().default(false),
});

export default function Profile() {
  const { user, updateUser } = useStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      website: user?.website || "",
      linkedin: user?.linkedin || "",
      twitter: user?.twitter || "",
      threads: user?.threads || "",
      shareProfile: user?.shareProfile || false,
    },
  });

  if (!user) {
    return <div className="container mx-auto py-10">Please log in to view your profile.</div>;
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
    updateUser({ avatarUrl: url });
    toast({
      title: "Avatar updated",
      description: "Looking good!",
    });
  };

  const handleAvatarRemove = () => {
    updateUser({ avatarUrl: undefined });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-medium mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Manage your public profile and preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Public Information</CardTitle>
              <CardDescription>
                This information will be displayed on your profile and to other learners.
              </CardDescription>
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
                      <Textarea 
                        placeholder="Tell us a little about yourself" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Max 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="shareProfile"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Share Profile in Classmates
                      </FormLabel>
                      <FormDescription>
                        Allow other learners in the same syllabus to see your profile and connect with you.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
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
