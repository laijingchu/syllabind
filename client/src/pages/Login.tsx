import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Mail, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const isSignupInit = urlParams.get('mode') === 'signup';
  const [activeTab, setActiveTab] = useState(isSignupInit ? 'waitlist' : 'login');
  const oauthError = urlParams.get('error');

  // Get returnTo from URL params, validate it starts with / to prevent open redirect
  const rawReturnTo = urlParams.get('returnTo') || '/';
  const returnTo = rawReturnTo.startsWith('/') ? rawReturnTo : '/';
  const [isLoading, setIsLoading] = useState(false);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-settings/terms_of_service_url').then(r => r.json()),
      fetch('/api/site-settings/privacy_policy_url').then(r => r.json()),
    ])
      .then(([termsData, privacyData]) => {
        setTermsUrl(termsData.value || null);
        setPrivacyUrl(privacyData.value || null);
      })
      .catch(() => {});
  }, []);

  // Show toast for OAuth errors on mount
  const [shownError, setShownError] = useState<string | null>(null);
  if (oauthError && oauthError !== shownError) {
    setShownError(oauthError);
    const messages: Record<string, string> = {
      invalid_state: 'Authentication session expired. Please try again.',
      google_auth_failed: 'Google sign-in failed. Please try again.',
      google_token_failed: 'Could not complete Google sign-in. Please try again.',
      google_userinfo_failed: 'Could not retrieve your Google account info. Please try again.',
      apple_auth_failed: 'Apple sign-in failed. Please try again.',
      apple_token_failed: 'Could not complete Apple sign-in. Please try again.',
      session_failed: 'Could not save your session. Please try again.',
    };
    toast({
      title: 'Sign-in failed',
      description: `${messages[oauthError] || 'Authentication failed. Please try again.'} (${oauthError})`,
      variant: 'destructive',
    });
  }

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Waitlist external URL
  const [waitlistUrl, setWaitlistUrl] = useState<string | null>(null);
  const [waitlistUrlLoading, setWaitlistUrlLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-settings/waitlist_form_url')
      .then(res => res.json())
      .then(data => {
        setWaitlistUrl(data.value || null);
        setWaitlistUrlLoading(false);
      })
      .catch(() => setWaitlistUrlLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      const redirectTarget = sessionStorage.getItem('binder_returnTo') || returnTo;
      sessionStorage.removeItem('binder_returnTo');
      setLocation(redirectTarget);
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    sessionStorage.setItem('binder_returnTo', returnTo);
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-display font-medium">Welcome to Syllabind</h1>
          <p className="text-muted-foreground">Focus on one learning journey at a time.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Log In</TabsTrigger>
            <TabsTrigger value="waitlist" data-testid="tab-waitlist">Join Waitlist</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Log In</CardTitle>
                <CardDescription>Welcome back. Ready to continue?</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="m@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Log In with Email
                  </Button>

                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleAuth}
                    data-testid="button-google-login"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <p className="auth-legal text-center text-xs text-muted-foreground">
                    <a href={termsUrl || "/terms"} {...(termsUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline hover:text-foreground transition-colors">Terms of Service</a>
                    {' and '}
                    <a href={privacyUrl || "/privacy"} {...(privacyUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline hover:text-foreground transition-colors">Privacy Policy</a>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist">
            <Card>
              <CardHeader>
                <CardTitle>Join the Waitlist</CardTitle>
                <CardDescription>Syllabind is in private alpha. Request early access below.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-8 text-center space-y-6">
                {waitlistUrlLoading ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : waitlistUrl ? (
                  <>
                    <p className="text-muted-foreground">Fill out a short form and we'll reach out when it's your turn.</p>
                    <Button asChild size="lg" className="w-full">
                      <a href={waitlistUrl} target="_blank" rel="noopener noreferrer">
                        Join Waitlist
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground py-4">The waitlist is coming soon. Check back later!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button variant="link" onClick={() => setLocation('/welcome')} data-testid="link-back-home">
            Back to Home
          </Button>
        </div>

        {(termsUrl || privacyUrl) && (
          <p className="auth-legal text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            {termsUrl && <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Terms of Service</a>}
            {termsUrl && privacyUrl && ' and '}
            {privacyUrl && <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Privacy Policy</a>}.
          </p>
        )}
      </div>
    </div>
  );
}
