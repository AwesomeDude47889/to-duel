import { useState, useEffect } from 'react';
import { 
  User,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check for redirect result first
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log('Redirect sign-in successful:', result.user);
            setUser(result.user);
          }
        })
        .catch((error) => {
          console.error('Redirect result error:', error);
          setError(error.message);
        });

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        setUser(user);
        setIsLoading(false);
        setError(null);
      }, (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('Firebase auth initialization error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Set custom parameters to help with OAuth flow
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Starting Google sign-in attempt');
      console.log('Auth domain:', auth.app.options.authDomain);
      console.log('Project ID:', auth.app.options.projectId);
      console.log('Current origin:', window.location.origin);
      console.log('Current hostname:', window.location.hostname);
      
      // Add required scopes
      provider.addScope('email');
      provider.addScope('profile');
      
      // Try popup first, fall back to redirect if it fails
      try {
        console.log('Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('Popup sign-in successful:', result.user);
        return result.user;
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect...', popupError.code);
        
        // If popup fails due to popup blocking or domain issues, use redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/unauthorized-domain') {
          console.log('Using redirect method...');
          await signInWithRedirect(auth, provider);
          // No return value needed - redirect will handle the flow
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Detailed Google sign-in error:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential,
        stack: error.stack
      });
      throw new Error(error.message || error.code || 'Unknown authentication error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signInWithGoogle,
    logout
  };
}