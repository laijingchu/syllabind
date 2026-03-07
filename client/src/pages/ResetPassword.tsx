import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PASSWORD_REQUIREMENTS } from '@shared/schema';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';
  const email = urlParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValid = PASSWORD_REQUIREMENTS.every(r => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword;

  if (!token || !email) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Invalid reset link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => setLocation('/forgot-password')}>
                Request a new link
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      setSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-display font-medium">Set a new password</h1>
        </div>

        <Card>
          {success ? (
            <>
              <CardHeader className="text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Password reset</CardTitle>
                <CardDescription>Your password has been updated. You can now log in.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full" onClick={() => setLocation('/login')}>
                  Go to Log In
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Choose a new password</CardTitle>
                <CardDescription>Enter a new password for {email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <ul className="text-xs space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <li
                        key={req.label}
                        className={newPassword ? (req.test(newPassword) ? 'text-green-600' : 'text-red-500') : 'text-muted-foreground'}
                      >
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!passwordValid || !passwordsMatch || isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Reset password
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
