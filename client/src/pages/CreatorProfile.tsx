import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

export default function CreatorProfile() {
  const { user, updateUser } = useStore();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        expertise: user.expertise || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleSave = () => {
    updateUser(formData);
    toast({
      title: "Profile updated",
      description: "Your creator profile has been saved successfully."
    });
    setLocation('/creator');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/creator">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-serif">Creator Profile</h1>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24 border-4 border-muted">
                <AvatarImage src={formData.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserIcon className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 w-full max-w-sm">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input 
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-[10px] text-muted-foreground italic">Use a direct image link from Unsplash or similar.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise / Headline</Label>
                <Input 
                  id="expertise"
                  value={formData.expertise}
                  onChange={e => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="e.g. Behavioral Designer & Author"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  className="min-h-[120px] leading-relaxed"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell learners about your background and teaching style..."
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
