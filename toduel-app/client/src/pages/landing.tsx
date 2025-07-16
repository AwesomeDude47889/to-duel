import { useState } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { auth } from "@/lib/firebase";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useFirebaseAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // Debug logging
    console.log("=== FIREBASE DEBUG INFO ===");
    console.log("Auth instance:", auth);
    console.log("Auth app:", auth.app);
    console.log("Auth config:", {
      apiKey: auth.app.options.apiKey?.substring(0, 10) + "...",
      authDomain: auth.app.options.authDomain,
      projectId: auth.app.options.projectId
    });
    console.log("Current URL:", window.location.href);
    console.log("Current origin:", window.location.origin);
    console.log("Current hostname:", window.location.hostname);
    console.log("=== END DEBUG INFO ===");
    
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome to ToDuel!",
        description: "Successfully signed in with Google",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google";
      
      if (error.message.includes("popup-closed-by-user")) {
        errorMessage = "Sign-in was cancelled";
      } else if (error.message.includes("popup-blocked")) {
        errorMessage = "Pop-up was blocked. Please allow pop-ups and try again";
      } else if (error.message.includes("network-request-failed")) {
        errorMessage = "Network error. Please check your connection";
      } else if (error.message.includes("auth/account-exists-with-different-credential")) {
        errorMessage = "An account already exists with this email using a different sign-in method";
      } else if (error.message.includes("unauthorized-domain")) {
        errorMessage = "Domain authorization issue. Please check Firebase console settings.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-tasks text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ToDuel</h1>
          <p className="mt-2 text-gray-600">Your personal productivity companion</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 text-center">Welcome</h2>
              <p className="text-gray-600 text-center mt-2">Sign in to access your tasks</p>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full py-4 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner className="w-5 h-5 text-gray-600" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500 mt-4">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
