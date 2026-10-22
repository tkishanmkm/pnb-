

'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from '@/hooks/use-app-store';
import { SplashScreen } from './splash-screen';
import { LoginLoadingScreen } from './login-loading-screen';
import { useRouter, usePathname } from 'next/navigation';

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  // Unified state for loading status
  const [status, setStatus] = useState<'initializing' | 'loading' | 'active'>('initializing');

  useEffect(() => {
    if (!state.isStateInitialized) {
      return; // Wait for state to be loaded from localStorage.
    }
    
    // Handle logout splash screen
    if (state.isLoggingOut) {
        setStatus('initializing'); // Show splash screen
        const timer = setTimeout(() => {
            dispatch({ type: 'LOGOUT_COMPLETE' });
            router.replace('/');
            setStatus('active');
        }, 4000); // 4 seconds for logout splash
        return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      if (state.loginPending) {
        setStatus('loading');
        // Handle login processing, then redirect to dashboard.
        setTimeout(() => {
          dispatch({ type: 'LOGIN' });
          router.replace('/dashboard');
          setStatus('active');
        }, 2000); // Duration of the login loading animation
      } else {
        // This block now only handles the INITIAL redirection after the splash screen.
        if (state.isAuthenticated) {
           if (pathname === '/') {
              router.replace('/dashboard');
           }
        } else {
          if (pathname !== '/') {
            router.replace('/');
          }
        }
        setStatus('active');
      }
    }, 2000); // This is the splash screen duration

    return () => clearTimeout(timer);
  // The dependency array is carefully chosen to handle these state transitions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isStateInitialized, state.loginPending, state.isLoggingOut]);


  // Determine what to render based on the current status
  if (status === 'initializing' || !state.isStateInitialized || state.isLoggingOut) {
    return <SplashScreen />;
  }

  if (status === 'loading') {
    return <LoginLoadingScreen />;
  }
  
  if (status === 'active') {
    if (state.isAuthenticated && pathname !== '/') {
      return <>{children}</>;
    }
    if (!state.isAuthenticated && pathname === '/') {
      return <>{children}</>;
    }
  }

  return <SplashScreen />;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <AppInitializer>{children}</AppInitializer>
    </AppProvider>
  );
};
