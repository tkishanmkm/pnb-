"use client";

import { useState, useCallback, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useAppContext } from '@/hooks/use-app-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const OtpIcon = ({ avatarUrl }: { avatarUrl: string }) => {
    return (
         <Image src={avatarUrl || 'https://placehold.co/40x40.png'} alt="OTP Avatar" width={40} height={40} className="rounded-full" data-ai-hint="notification icon" />
    );
};


function OtpPopup({ otp, avatarUrl }: { otp: string; avatarUrl: string }) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] z-50">
            <div className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-3 text-white/90 animate-in slide-in-from-top-12 duration-500 fade-in-25">
                <div className="flex items-start gap-3">
                     <OtpIcon avatarUrl={avatarUrl}/>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold">VM-PNBSMS</p>
                            <p className="text-xs text-white/60">now</p>
                        </div>
                        <p className="text-sm mt-0.5">Dear Customer, Your OTP is <span className="font-bold">{otp}</span> and is valid for only 180 sec. Do not share it wit...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


function VerifyTransfer() {
    const router = useRouter();
    const params = useParams();
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    
    const payeeId = params.id as string;
    const { currentTransfer, settings, user } = state;
    const payee = state.payees.find(p => p.id === payeeId);
    
    const [otp, setOtp] = useState('');
    const otpInputRef = useRef<HTMLInputElement>(null);
    const [countdown, setCountdown] = useState(59);
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [currentOtp, setCurrentOtp] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!payee || !currentTransfer.amount) {
            if (typeof window !== 'undefined') {
              router.push('/fund-transfer');
            }
        }
    }, [payee, currentTransfer, router]);

    const generateOtp = useCallback(() => {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setCurrentOtp(newOtp);
        // Log to console for testing purposes
        console.log("Current Transaction OTP:", newOtp);
        return newOtp;
    }, []);
    
    const handleNavigationToSuccess = useCallback(() => {
        const queryParams = new URLSearchParams({
            payeeId: payee!.id,
            amount: currentTransfer.amount!.toString(),
            remarks: currentTransfer.remarks || '',
            transferDate: new Date().toISOString(),
            transferMode: 'IMPS'
        }).toString();
        router.push(`/fund-transfer/success?${queryParams}`);
    }, [currentTransfer, payee, router]);

    const handleSubmit = useCallback((enteredOtp: string) => {
        setIsProcessing(true);
        if (enteredOtp === currentOtp) { 
            toast({ title: "OTP Verified", description: "Processing transaction..." });
            setTimeout(() => {
                handleNavigationToSuccess();
            }, 1000); // Simulate processing time
        } else {
            toast({
                variant: 'destructive',
                title: 'Incorrect OTP',
                description: 'Please try again.',
            });
            setOtp('');
            setIsProcessing(false);
            otpInputRef.current?.focus();
        }
    }, [toast, currentOtp, handleNavigationToSuccess]);

    const triggerOtpSequence = useCallback(() => {
        const newOtp = generateOtp();
        setCountdown(59);
        setShowOtpPopup(true); 
        
        const hideTimer = setTimeout(() => {
            setShowOtpPopup(false);
        }, 5000);
        return () => clearTimeout(hideTimer);
    }, [generateOtp]);

    useEffect(() => {
        if (!payee || !currentTransfer.amount) return;

        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const showTimer = setTimeout(() => {
           triggerOtpSequence();
        }, 1000);

        otpInputRef.current?.focus();
        
        return () => {
            clearInterval(timer);
            clearTimeout(showTimer);
        };
    }, [triggerOtpSequence, payee, currentTransfer.amount]);

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d{0,6}$/.test(value)) {
            setOtp(value);
            if (value.length === 6) {
                handleSubmit(value);
            }
        }
    };
    
    if (!payee || !currentTransfer.amount) {
        return <div className="p-4">Transfer details are missing. Redirecting...</div>;
    }
    
    const otpDigits = otp.padEnd(6, ' ').split('');
    const otpAvatar = settings.otpAvatar || state.user.avatar;

    return (
        <div className="flex flex-col h-screen bg-white">
            {showOtpPopup && <OtpPopup otp={currentOtp} avatarUrl={otpAvatar} />}

            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">Verify</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 flex flex-col justify-start items-start p-6 pt-12 text-left">
                <div className="w-full">
                    <p className="text-base text-gray-700 mb-2">OTP has been sent to your registered mobile number ******{user.mobileNumber.slice(-4)}</p>
                    
                    <div 
                        className="relative flex justify-start items-center gap-3 my-8 cursor-text"
                        onClick={() => otpInputRef.current?.focus()}
                    >
                        {otpDigits.map((digit, index) => (
                            <div key={index} className="w-10 h-12 flex flex-col items-center justify-center">
                                 <div className={cn("w-4 h-4 bg-gray-300 rounded-full", { "bg-primary": digit !== " " })} />
                                 <div className="w-full h-px bg-gray-400 mt-2" />
                            </div>
                        ))}
                         <input
                            ref={otpInputRef}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otp}
                            onChange={handleOtpChange}
                            className="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-transparent [caret-color:transparent]"
                        />
                    </div>
                    
                    {countdown > 0 ? (
                        <p className="text-sm text-gray-500">Resend OTP will be enabled in {countdown}s</p>
                    ) : (
                        <button className="text-sm font-semibold text-primary" onClick={triggerOtpSequence}>
                            Resend OTP
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function VerifyTransferPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyTransfer />
        </Suspense>
    )
}
