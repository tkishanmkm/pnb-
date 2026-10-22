
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
  const carouselApi = useRef<CarouselApi>();

  const pinInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
  
  const handleTroubleSigningIn = () => {
    toast({
      title: "Trouble Signing In?",
      description: `For demo purposes, the MPIN is ${state.user.mpin}`,
      duration: 5000,
    });
  };

  // If state is not ready, or if user is authenticated but on this page, show splash/loading
  if (!state.isStateInitialized || state.isAuthenticated) {
    return <SplashScreen />;
  }

  const { user, settings } = state;
  const { carouselBanners } = settings;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        <header className="flex items-center justify-between p-3 bg-gray-50 h-16">
            <span className="text-xs text-primary font-semibold">App Version: 5.16</span>
            {settings?.appLogo && (
              <Image src={settings.appLogo} alt="App Logo" width={120} height={40} className="h-10 w-auto object-contain" data-ai-hint="app logo" />
            )}
            <div className="flex items-center justify-center w-8 h-8 rounded-full border bg-white shadow-sm">
                <span className="font-semibold text-primary">कA</span>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
            <div className="relative -mx-4">
                <Carousel
                  opts={{loop: true}}
                  plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
                  setApi={(api) => { carouselApi.current = api; }}
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
                        <button key={i} onClick={() => carouselApi.current?.scrollTo(i)} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === (carouselApi.current?.selectedScrollSnap() ?? 0) ? "bg-white w-4" : "bg-white/50")}/>
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
                    <Button variant="outline" className="mt-2 border-primary text-primary rounded-full px-6">
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
            {bottomNavItems.map((item) => {
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
