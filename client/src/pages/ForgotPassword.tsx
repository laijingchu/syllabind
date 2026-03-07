import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Something went wrong');
      }

      setSent(true);
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
          <h1 className="text-2xl font-display font-medium">Reset your password</h1>
        </div>

        <Card>
          {sent ? (
            <>
              <CardHeader className="text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => setLocation('/login')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Log In
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Forgot password?</CardTitle>
                <CardDescription>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send reset link
                </Button>
                <Button variant="ghost" type="button" className="w-full" onClick={() => setLocation('/login')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Log In
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
