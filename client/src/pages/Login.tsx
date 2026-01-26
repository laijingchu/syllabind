import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Mail } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  
  const handleReplitAuth = () => {
    // Replit Auth login is triggered by visiting the site with auth enabled
    // We can just redirect to root or use the window.replit.auth() if available
    window.location.href = '/'; 
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <BookOpen className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-serif font-medium">Welcome to Syllabind</h1>
          <p className="text-muted-foreground">Focus on one learning journey at a time.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your account securely using Replit Auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleReplitAuth} 
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <Mail className="h-5 w-5" />
              Continue with Replit Auth
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Secure access via Replit
                </span>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground px-4">
              By continuing, you'll be redirected to Replit to securely sign in via Email, Google, or Apple.
            </p>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button variant="link" onClick={() => setLocation('/welcome')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
