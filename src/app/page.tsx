
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Fingerprint, Phone, QrCode, MapPin, Gift, ShieldCheck, MoreHorizontal, MessageSquare, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-store";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { SplashScreen } from "@/components/splash-screen";


const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);


const bottomNavItems = [
    { icon: MapPin, label: "ATM Locator", href: "#" },
    { icon: Gift, label: "Agri Schemes", href: "#" },
    { icon: QrCode, label: "Scan", href: "#", isCentral: true },
    { icon: ShieldCheck, label: "Security Tips", href: "#" },
    { icon: MoreHorizontal, label: "More", href: "#" },
];


export default function LoginPage() {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [greeting, setGreeting] = useState("Good Morning");
  const { toast } = useToast();
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(undefined);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [superLoginStage, setSuperLoginStage] = useState<'checking'|'normal'|'welcome'|'loading'|'userid'|'password'|'otp'>('checking');
  const [superUserId, setSuperUserId] = useState('');
  const [superPassword, setSuperPassword] = useState('');
  const [superOtp, setSuperOtp] = useState('');
  const [generatedSuperOtp, setGeneratedSuperOtp] = useState('');
  const [generatedDemoPassword, setGeneratedDemoPassword] = useState('');
  const [showSuperOtpNotice, setShowSuperOtpNotice] = useState(false);
  const [otpNoticeVisible, setOtpNoticeVisible] = useState(false);
  const [otpNoticeCycle, setOtpNoticeCycle] = useState(0);
  const [showDemoPasswordNotice, setShowDemoPasswordNotice] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [superLoginError, setSuperLoginError] = useState('');

  const pinInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!carouselApi) return;
    const syncActiveDot = () => setActiveBannerIndex(carouselApi.selectedScrollSnap());
    syncActiveDot();
    carouselApi.on("select", syncActiveDot);
    carouselApi.on("reInit", syncActiveDot);
    return () => {
      carouselApi.off("select", syncActiveDot);
      carouselApi.off("reInit", syncActiveDot);
    };
  }, [carouselApi]);

  useEffect(() => {
    try { setSuperLoginStage(window.localStorage.getItem('pnb-superlogout-pending') === '1' ? 'welcome' : 'normal'); } catch { setSuperLoginStage('normal'); }
  }, []);

  useEffect(() => {
    if (!showSuperOtpNotice || superLoginStage !== 'otp') { setOtpNoticeVisible(false); return; }
    setOtpNoticeVisible(false);
    let hideTimer: number | undefined;
    const showTimer = window.setTimeout(() => {
      setOtpNoticeVisible(true);
      hideTimer = window.setTimeout(() => setOtpNoticeVisible(false), 3000);
    }, 2000);
    return () => { window.clearTimeout(showTimer); if (hideTimer !== undefined) window.clearTimeout(hideTimer); };
  }, [showSuperOtpNotice, superLoginStage, otpNoticeCycle]);

  useEffect(() => {
    const getGreeting = () => {
        const now = new Date();
        const hour = now.getHours();

        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };
    setGreeting(getGreeting());
    if(!state.isAuthenticated) {
        pinInputsRef.current[0]?.focus();
    }
  }, [state.isAuthenticated]);

  const handlePinChange = (index: number, value: string) => {
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      if (value && index < 3) {
        pinInputsRef.current[index + 1]?.focus();
      }
      
      const completedPin = newPin.join('');
      if (completedPin.length === 4) {
        handleLogin(completedPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newPin = [...pin];
      if (newPin[index] !== "") {
        newPin[index] = "";
        setPin(newPin);
      } else if (index > 0) {
        pinInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleLogin = (enteredPin: string) => {
    // Demo-only master MPIN for local testing. Never enable in production.
    if (process.env.NODE_ENV !== 'production' && enteredPin === '9090') {
      dispatch({type: 'LOGIN_PENDING'});
      return;
    }

    if (enteredPin === state.user.mpin) {
      dispatch({type: 'LOGIN_PENDING'});
      // The router push is handled by the AuthProvider effect
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Incorrect PIN. Please try again.",
      });
      setPin(["", "", "", ""]);
      pinInputsRef.current[0]?.focus();
    }
  };
  
  const handleBiometricLogin = async () => {
    if (typeof window === 'undefined' || !window.isSecureContext || !('PublicKeyCredential' in window) || !navigator.credentials) {
      toast({ variant: 'destructive', title: 'Biometrics unavailable', description: 'This device or browser does not support secure biometric login. Please enter your MPIN.' });
      return;
    }
    try {
      const encodedCredentialId = window.localStorage.getItem('pnb-pro-biometric-credential-id');
      if (!encodedCredentialId) {
        toast({ title: 'Biometrics not set up', description: 'Set up device biometrics first. Please enter your MPIN to sign in.' });
        return;
      }
      const credentialId = Uint8Array.from(atob(encodedCredentialId), char => char.charCodeAt(0));
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({ publicKey: { challenge, allowCredentials: [{ type: 'public-key', id: credentialId }], userVerification: 'required', timeout: 60000 } });
      if (!assertion) throw new Error('Biometric verification was not completed.');
      // No trusted server-side WebAuthn verifier exists in this prototype. Never
      // treat a client-only assertion as authentication or open a session here.
      toast({ variant: 'destructive', title: 'Secure verification not configured', description: 'No login occurred. Please sign in with your MPIN.' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({ title: 'Biometric login cancelled', description: 'No login occurred. Enter your MPIN to continue.' });
        return;
      }
      toast({ variant: 'destructive', title: 'Biometric login failed', description: 'Your session was not opened. Please enter your MPIN.' });
    }
  };

  const handleTroubleSigningIn = () => {
    // Demo-only recovery: generate and save a new four-digit MPIN for this local demo profile.
    const generatedMpin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    dispatch({ type: 'UPDATE_USER', payload: { mpin: generatedMpin } });
    setPin(["", "", "", ""]);
    toast({
      title: "Demo MPIN Generated",
      description: `Your new demo MPIN is ${generatedMpin}. It has been saved; use it to sign in.`,
      duration: 10000,
    });
  };

  // If state is not ready, or if user is authenticated but on this page, show splash/loading
  if (!state.isStateInitialized || state.isAuthenticated) {
    return <SplashScreen />;
  }

  const { user, settings } = state;
  const { carouselBanners } = settings;

  if (superLoginStage === 'checking') return <SplashScreen />;

  const transitionSuperLogin = (target: 'userid'|'password'|'otp'|'normal') => {
    setSuperLoginError('');
    if (target === 'otp') {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedSuperOtp(otp);
      setSuperOtp('');
      setShowSuperOtpNotice(true);
    }
    setSuperLoginStage('loading');
    window.setTimeout(() => {
      if (target === 'normal') {
        try { window.localStorage.removeItem('pnb-superlogout-pending'); window.localStorage.setItem('pnb-superlogin-complete','1'); } catch {}
      }
      setSuperLoginStage(target);
    }, 2000);
  };

  if (superLoginStage !== 'normal') {
    const configuredHeaderLogo = settings?.appLogo || settings?.pnbOneLogo;
    const headerLogo = configuredHeaderLogo && !configuredHeaderLogo.includes("placehold.co") ? configuredHeaderLogo : "/pnb-splash/pnb-logo.png";
    if (superLoginStage === 'loading') return <main className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-5 bg-white p-6"><Image src={headerLogo || settings?.pnbOneLogo || '/placeholder.png'} alt="PNB ONE" width={180} height={72} className="h-auto max-h-20 w-auto max-w-[70vw] object-contain" priority /><div aria-label="Loading" role="status" className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></main>;
    const submitUserId = () => {
      const found = state.accounts.some(a => [a.customerId, a.userId].some(v => v && v === superUserId.trim()));
      if (!superUserId.trim() || !found) { setSuperLoginError('Please enter the Customer ID configured in Settings.'); return; }
      transitionSuperLogin('password');
    };
    const submitPassword = () => {
      const acceptedPassword = generatedDemoPassword || settings.loginPassword;
      if (!acceptedPassword) { setSuperLoginError('Use Trouble Login? to generate a local demo password.'); return; }
      if (superPassword !== acceptedPassword) { setSuperLoginError('Incorrect password. Please try again.'); return; }
      setShowDemoPasswordNotice(false);
      transitionSuperLogin('otp');
    };
    const submitOtp = () => {
      if (!generatedSuperOtp) { setSuperLoginError('Please request a new OTP and try again.'); return; }
      if (superOtp !== generatedSuperOtp) { setSuperLoginError('Incorrect OTP. Please try again.'); return; }
      setShowSuperOtpNotice(false);
      transitionSuperLogin('normal');
    };
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4">
          <span className="text-xs font-semibold text-primary">App Version: 5.16</span>
          {headerLogo && <Image src={headerLogo} alt="App Logo" width={140} height={44} className="h-10 w-auto object-contain" />}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-sm font-semibold text-primary">à¤•A</span>
        </header>
        {superLoginStage === 'welcome' ? (
          settings?.pnbBanner ? <div className="flex w-full justify-center border-b bg-white px-3 py-2"><Image src={settings.pnbBanner} alt="Splash Screen Banner (PNB)" width={600} height={90} className="h-auto max-h-16 w-auto max-w-full object-contain" priority /></div> :
          <div className="w-full border-b bg-white"><Image src={carouselBanners[3]?.src || carouselBanners[0]?.src || '/placeholder.png'} alt="Splash Screen Banner (PNB)" width={600} height={300} className="max-h-32 w-full object-cover" priority /></div>
        ) : <div className="relative w-full border-b bg-white">
          <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]} className="w-full">
            <CarouselContent>{carouselBanners.map((item, index) => <CarouselItem key={index}><Image src={item.src} alt={item.alt || `Banner ${index + 1}`} width={600} height={300} className="max-h-40 w-full object-cover" /></CarouselItem>)}</CarouselContent>
          </Carousel>
        </div>}
        {((showSuperOtpNotice && otpNoticeVisible) || showDemoPasswordNotice) && (superLoginStage === 'otp' || superLoginStage === 'password') && <div role="status" aria-live="polite" className={`absolute left-1/2 top-2 z-[100] w-[calc(100%-16px)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-md bg-[#38383b] text-white shadow-xl transition-all duration-500 ${showSuperOtpNotice && !otpNoticeVisible ? '-translate-y-[calc(100%+16px)] opacity-0' : 'translate-y-0 opacity-100'}` }><div className="flex min-h-[68px] items-center gap-3 px-3 py-2"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15">{settings?.otpAvatar ? <Image src={settings.otpAvatar} alt="OTP Notification Avatar" width={44} height={44} className="h-11 w-11 rounded-full object-cover" unoptimized /> : <svg viewBox="0 0 44 44" aria-hidden="true" className="h-11 w-11"><circle cx="22" cy="22" r="22" fill="#d1d5db"/><circle cx="22" cy="15" r="7" fill="#fff"/><path d="M7 38c1-8 7-13 15-13s14 5 15 13" fill="#fff"/></svg>}</div><div className="min-w-0 flex-1"><div className="text-base font-medium leading-5">VM-PNBSMS</div><p className="mt-1 whitespace-normal break-words text-sm leading-5 text-white/90">{showDemoPasswordNotice ? <>Dear Customer, Your local demo password is <span className="font-bold">{generatedDemoPassword}</span>. This is not a bank password.</> : <>Dear Customer, Your local demo OTP is <span className="font-bold tracking-wide">{generatedSuperOtp}</span> and is valid for only 180 sec. Do not share it with anyone.</>}</p></div></div></div>}
        {superLoginStage === 'welcome' ? (
          <main className="flex flex-1 flex-col items-center justify-center p-6"><div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 text-center shadow-sm">
            {headerLogo && <Image src={headerLogo} alt="App Logo" width={190} height={68} className="mx-auto h-16 w-auto object-contain" />}
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="text-2xl font-semibold text-primary">Welcome To PNB ONE</h1><p className="text-sm leading-6 text-gray-600">The next generation of banking ? simple, secure, and convenient banking at your fingertips.</p>
            <Button className="w-full" onClick={() => transitionSuperLogin('userid')}>Next</Button>
          </div></main>
        ) : superLoginStage === 'userid' ? (
          <main className="flex flex-1 justify-center px-4 pt-8"><div className="w-full max-w-md">
            <div className="border-b-2 border-primary bg-white px-3 py-3 text-lg font-semibold text-primary">Existing users login ðŸ”’</div>
            <div className="space-y-5 border bg-white p-4">
              <div className="flex items-center gap-2"><label htmlFor="super-userid" className="min-w-[100px] text-sm">User ID : <span className="text-red-600">*</span></label><input id="super-userid" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm" value={superUserId} onChange={e=>setSuperUserId(e.target.value)} autoComplete="username" /><Button variant="outline" size="icon" aria-label="User ID help" onClick={()=>setHelpOpen(v=>!v)}>?</Button></div>
              {helpOpen && <p className="rounded-md bg-muted p-3 text-sm">Default User ID is your Customer ID mentioned on the front page of your Passbook. If you do not remember, use Forgot User ID option.</p>}
              {superLoginError && <p role="alert" className="text-sm text-red-600">{superLoginError}</p>}
              <div className="flex justify-end gap-5 text-sm font-semibold text-rose-700 underline"><button onClick={()=>setSuperLoginError('New user registration is not available in this local demo.')}>New user?</button><button onClick={()=>{ const customerId = state.accounts.find(a => a.customerId)?.customerId; if (customerId) { setSuperUserId(customerId); setSuperLoginError('Demo User ID filled from the Customer ID saved in Settings.'); } else { setSuperLoginError('No Customer ID is saved in Settings yet. Add it in Account Settings first.'); } }}>Know Your User ID</button></div>
              <Button className="w-full" onClick={submitUserId}>Continue</Button>
            </div>
          </div></main>
        ) : superLoginStage === 'password' ? (
          <main className="flex flex-1 items-start justify-center px-4 pt-8"><div className="w-full max-w-md border bg-white">
            <div className="border-b-2 border-primary px-3 py-3 text-lg font-semibold text-primary">Existing users login ðŸ”’</div>
            <div className="space-y-4 p-4"><p className="text-sm text-muted-foreground">User ID: {superUserId}</p><label htmlFor="super-password" className="text-sm font-medium">Password : *</label><input id="super-password" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm" type="password" autoComplete="current-password" value={superPassword} onChange={e=>setSuperPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submitPassword();}} />
            {superLoginError && <p role="alert" className="text-sm text-red-600">{superLoginError}</p>}<Button className="w-full" onClick={submitPassword}>Continue</Button><button type="button" className="w-full pt-2 text-sm font-semibold text-rose-700 underline" onClick={()=>{const password = Math.random().toString(36).slice(2,8).toUpperCase() + Math.floor(10 + Math.random()*90);setGeneratedDemoPassword(password);setSuperPassword(password);setShowDemoPasswordNotice(true);setSuperLoginError('A random local demo password was generated and filled in. It is not a bank password.');}}>Trouble Login?</button></div>
          </div></main>
        ) : superLoginStage === 'otp' ? (
          <main className="flex flex-1 items-start justify-center px-4 pt-8"><div role="dialog" aria-modal="true" aria-labelledby="super-otp-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-xl"><div className="mb-4 flex items-center gap-3">{headerLogo && <Image src={headerLogo} alt="App Logo" width={64} height={32} className="h-8 w-auto object-contain" />}<h2 id="super-otp-title" className="text-lg font-semibold text-primary">OTP Verification</h2></div><label htmlFor="super-otp" className="text-sm font-medium">OTP</label><input id="super-otp" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm" inputMode="numeric" autoComplete="one-time-code" value={superOtp} maxLength={6} onChange={e=>setSuperOtp(e.target.value.replace(/\D/g,'').slice(0,6))} onKeyDown={e=>{if(e.key==='Enter')submitOtp();}} />
            {superLoginError && <p role="alert" className="mt-2 text-sm text-red-600">{superLoginError}</p>}<Button className="mt-4 w-full" onClick={submitOtp}>Verify OTP</Button><button type="button" className="mt-3 w-full text-sm font-semibold text-primary underline underline-offset-4" onClick={() => { const otp = String(Math.floor(100000 + Math.random() * 900000)); setGeneratedSuperOtp(otp); setSuperOtp(''); setSuperLoginError('A new local demo OTP was generated. Check the notification at the top.'); setOtpNoticeVisible(false); setShowSuperOtpNotice(true); setOtpNoticeCycle(cycle => cycle + 1); }}>Resend OTP</button></div></div></main>
        ) : null}
        {superLoginStage === 'welcome' && <footer className="mt-auto border-t bg-white px-4 py-3"><div className="flex items-center justify-center gap-5 text-primary"><MessageSquare className="h-5 w-5"/><FacebookIcon className="h-5 w-5"/><Twitter className="h-5 w-5"/><Linkedin className="h-5 w-5"/><Instagram className="h-5 w-5"/><Youtube className="h-5 w-5"/></div><div className="mt-4 flex justify-around text-sm text-gray-600"><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>1800-1800</span><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>1800-2021</span></div><div className="mt-2 flex justify-center text-sm text-gray-600"><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>0120-249000</span></div></footer>}
        {superLoginStage === 'welcome' && carouselBanners[3] && <div className="w-full border-t bg-white"><Image src={carouselBanners[3].src} alt={carouselBanners[3].alt || 'Banner 4'} width={600} height={300} className="max-h-36 w-full object-cover" /></div>}
        {superLoginStage !== 'welcome' && <div className="mt-auto flex items-center justify-between gap-3 border-t bg-white px-4 py-3">
          <div className="min-w-0"><p className="text-sm font-semibold text-primary">Login Help</p><p className="text-xs text-gray-600">Need help signing in?</p></div>
          <div className="flex items-center gap-3">{settings?.loginHelpAvatar && <Image src={settings.loginHelpAvatar} width={52} height={52} alt="Login Help Avatar" className="h-12 w-12 rounded-full object-cover" />}</div>
        </div>}
        {superLoginStage !== 'welcome' && <footer className="border-t bg-white px-4 pb-20 pt-4"><div className="flex items-center justify-center gap-4 text-primary"><MessageSquare className="h-5 w-5"/><FacebookIcon className="h-5 w-5"/><Twitter className="h-5 w-5"/><Linkedin className="h-5 w-5"/><Instagram className="h-5 w-5"/><Youtube className="h-5 w-5"/></div><div className="mt-4 flex justify-around text-sm text-gray-600"><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>1800-1800</span><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>1800-2021</span></div><div className="mt-2 flex justify-center text-sm text-gray-600"><span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/>0120-249000</span></div></footer>}
        {superLoginStage !== 'welcome' && <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md"><div className="flex h-16 items-center justify-around rounded-t-2xl bg-primary text-primary-foreground">{bottomNavItems.filter(item => !item.isCentral).map(item => { const Icon = item.icon; return <div key={item.label} className="flex flex-1 flex-col items-center justify-center gap-0.5"><Icon className="h-5 w-5 text-white"/><span className="text-[10px] font-medium text-white">{item.label}</span></div>; })}</div></div>}
      </div>
    );
  }
  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 pb-[env(safe-area-inset-bottom)]">
        <header className="flex items-center justify-between p-3 bg-gray-50 h-16">
            <span className="text-xs text-primary font-semibold">App Version: 5.16</span>
            {settings?.appLogo && !settings.appLogo.includes("placehold.co") ? (<Image src={settings.appLogo} alt="App Logo" width={120} height={40} className="h-10 w-auto object-contain" data-ai-hint="app logo" />) : (<Image src="/pnb-splash/pnb-logo.png" alt="PNB" width={120} height={54} className="h-10 w-auto object-contain" />)}
            <div className="flex items-center justify-center w-8 h-8 rounded-full border bg-white shadow-sm">
                <span className="font-semibold text-primary">à¤•A</span>
            </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-28">
            <div className="relative -mx-4">
                <Carousel
                  opts={{loop: true}}
                  plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
                  setApi={setCarouselApi}
                  className="w-full"
                >
                    <CarouselContent>
                        {carouselBanners.map((banner, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <Image src={banner.src} width={600} height={300} alt={banner.alt} className="rounded-xl shadow-md" data-ai-hint="bank promotion"/>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {carouselBanners.map((_, i) => (
                        <button key={i} onClick={() => carouselApi?.scrollTo(i)} aria-label={`Show banner ${i + 1}`} aria-current={i === activeBannerIndex ? "true" : undefined} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === activeBannerIndex ? "bg-white w-4" : "bg-white/50")}/>
                    ))}
                </div>
            </div>

            <div className="mt-6 text-left">
                <h1 className="text-xl font-semibold text-gray-800">{greeting},</h1>
                <p className="text-xl font-bold text-gray-800 truncate">{user.name.toUpperCase()}</p>
                <p className="text-sm text-gray-500 mt-2">Please enter 4 digit MPIN</p>
            </div>
            
            <div className="flex justify-start items-center gap-4 my-4 ml-4">
                {pin.map((digit, index) => (
                    <div key={index} className="w-10 h-10 flex flex-col items-center justify-center">
                         <input
                            ref={el => { pinInputsRef.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={cn(
                                "w-4 h-4 bg-gray-300 rounded-full text-center text-transparent focus:outline-none",
                                { "bg-primary": digit !== "" }
                            )}
                            style={{ caretColor: 'transparent' }}
                         />
                         <div className="w-full h-px bg-gray-300 mt-2"/>
                    </div>
                ))}
            </div>

            <div className="flex items-start justify-between px-4">
                 <div>
                    <p className="text-sm font-semibold text-primary cursor-pointer" onClick={handleTroubleSigningIn}>Trouble Signing In?</p>
                    <Button type="button" variant="outline" onClick={handleBiometricLogin} className="mt-2 border-primary text-primary rounded-full px-6">
                        <Fingerprint className="mr-2 h-5 w-5" /> LOGIN WITH BIOMETRICS
                    </Button>
                 </div>
                 {settings?.loginHelpAvatar && <Image src={settings.loginHelpAvatar} width={60} height={60} alt="Help Avatar" data-ai-hint="girl cartoon" />}
            </div>

            <div className="flex justify-center items-center gap-4 text-primary mt-4">
                <MessageSquare className="h-5 w-5"/>
                <FacebookIcon className="h-5 w-5"/>
                <Twitter className="h-5 w-5"/>
                <Linkedin className="h-5 w-5"/>
                <Instagram className="h-5 w-5"/>
                <Youtube className="h-5 w-5"/>
            </div>

            <div className="flex justify-around items-center text-sm text-gray-600 mt-4">
                 <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/><span>1800-1800</span></div>
                 <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/><span>1800-2021</span></div>
            </div>
            <div className="flex justify-center items-center text-sm text-gray-600 mt-2">
                 <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary"/><span>0120-249000</span></div>
            </div>
        </main>
        
        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40">
            <div className="relative bg-primary text-primary-foreground h-16 flex items-center justify-around rounded-t-2xl">
            {bottomNavItems.filter(item => !item.isCentral).map((item) => {
              const Icon = item.icon;

              if (item.isCentral) {
                return (
                  <div key={item.label} className="relative -top-5 text-center">
                    <div className="bg-white rounded-full p-3 shadow-lg border-2 border-primary">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="font-semibold text-white text-xs mt-1 block">{item.label}</span>
                  </div>
                );
              }

              return (
                <div key={item.label} className="flex-1">
                  <div className="flex flex-col items-center justify-center gap-0.5 text-accent">
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium text-white">{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
