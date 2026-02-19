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
import { ArrowLeft, Loader2, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe';
import { Badge } from '@/components/ui/badge';

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
  const { user, updateUser, isPro, refreshSubscriptionLimits } = useStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle ?subscription=success query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast({ title: 'Welcome to Syllabind Pro!', description: 'Your subscription is now active.' });
      refreshSubscriptionLimits();
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-medium mb-2">Edit Profile</h1>
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
                    <p className="text-xs text-muted-foreground">Username: {user?.username}</p>
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

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            {isPro && <Badge className="bg-primary text-primary-foreground">Pro</Badge>}
          </div>
          <CardDescription>
            {isPro
              ? 'You have an active Syllabind Pro subscription.'
              : 'Upgrade to Syllabind Pro for unlimited creation and enrollment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <Button
              variant="outline"
              onClick={async () => {
                setPortalLoading(true);
                try { await redirectToPortal(); } catch (e) { setPortalLoading(false); toast({ title: 'Unable to open billing portal', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' }); }
              }}
              disabled={portalLoading}
            >
              {portalLoading ? 'Redirecting...' : 'Manage Billing'}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>$9.99/mo</strong> — Unlimited syllabinds, enroll in any course, full progress tracking.
              </p>
              <Button
                onClick={async () => {
                  try { await redirectToCheckout('/profile'); } catch (e) { toast({ title: 'Unable to start checkout', description: e instanceof Error ? e.message : 'Please try again later.', variant: 'destructive' }); }
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
