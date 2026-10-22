

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Eye, EyeOff, BookOpen, UserPlus, CreditCard, ShoppingCart, Home, Briefcase, Tractor, UserCheck, Hand, Link2, Send, CheckCircle2, Contact, Users, CreditCard as CreditCardIcon, HandCoins, Menu, Search, LogOut, QrCode, Percent, Power, Banknote, Gift, Leaf, PercentSquare, Warehouse, Car, GraduationCap, RefreshCw, TrendingUp, Landmark, FileCheck, Umbrella } from "lucide-react";
import { useAppContext } from "@/hooks/use-app-store";
import { cn, formatCurrency } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SideNav from '@/components/side-nav';
import { PNBLogo } from '@/components/pnb-logo';
import { RupeeIcon } from "@/components/rupee-icon";
import DynamicIcon from "@/components/dynamic-icon";
import type { IconAssets } from "@/lib/types";


const UPIIcon = () => (
    <svg width="24" height="24" viewBox="0 0 333334 199007" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44732 130924h1856l-1738 7215c-265 1061-206 1885 147 2415 354 530 1001 795 1973 795 942 0 1737-265 2356-795 618-531 1031-1355 1296-2415l1737-7215h1885l-1767 7392c-383 1590-1060 2798-2061 3593-972 795-2268 1208-3858 1208s-2680-383-3269-1179c-589-795-707-2002-324-3592l1767-7421zm223507 11868l2826-11868h6449l-383 1649h-4564l-706 2974h4564l-413 1679h-4564l-913 3827h4565l-412 1738h-6449zm-177-8982c-413-470-913-824-1443-1031-531-235-1119-353-1797-353-1266 0-2385 412-3386 1237s-1649 1915-1973 3239c-295 1267-177 2327 413 3181 559 824 1442 1237 2620 1237 677 0 1355-118 2031-383 678-235 1356-619 2062-1119l-530 2179c-589 382-1207 648-1856 825-648 176-1296 265-2002 265-883 0-1679-148-2356-443-678-294-1236-736-1679-1324-441-560-706-1237-824-2002-117-766-88-1590 148-2474 206-883 559-1680 1031-2445 471-766 1089-1443 1796-2002 706-589 1472-1030 2297-1325 824-294 1648-441 2503-441 677 0 1295 88 1885 294 559 207 1089 500 1560 913l-500 1972zm-18317 4300h3209l-530-2710c-29-176-59-383-59-589-30-235-30-471-30-736-118 265-235 500-383 736-118 235-235 442-353 619l-1855 2680zm4093 4682l-589-3062h-4594l-2062 3062h-1972l8539-12338 2650 12338h-1972zm-15548 0l2827-11868h6449l-383 1649h-4565l-706 2945h4563l-412 1679h-4564l-1325 5565h-1885v30zm-5566-6832h353c1001 0 1679-118 2062-354 382-236 648-648 795-1267 146-648 88-1119-207-1384-293-265-913-413-1855-413h-354l-795 3417zm-471 1502l-1267 5300h-1767l2828-11867h2621c766 0 1354 59 1737 148 411 89 736 265 971 500 295 295 471 648 559 1119 89 443 59 943-59 1502-235 943-619 1709-1207 2238-589 530-1326 854-2209 972l2680 5387h-2121l-2562-5300h-206zm-11632 5330l2828-11868h6478l-382 1649h-4565l-706 2974h4564l-411 1679h-4565l-912 3827h4564l-413 1738h-6479zm2031-10248l-2444 10218h-1884l2444-10218h3063l383-1649h8010l-382 1649h-3063zm-19170 10248l2945-12338 5595 7244c148 206 294 413 441 648s295 501 471 794l1974-8216h1737l-2945 12310-5713-7392c-147-206-295-412-441-619-147-235-265-442-354-707l-1972 8245h-1737v30zm-4594 0l2827-11868h1884l-2827 11868h-1884zm-13870-2385l1678-707c29 530 176 942 501 1207 324 265 765 413 1354 413 559 0 1031-148 1443-471 412-324 678-736 795-1266 177-707-235-1326-1236-1855-147-89-235-148-325-177-1119-648-1825-1207-2120-1737-294-530-354-1149-176-1884 235-972 736-1738 1530-2356 796-589 1679-913 2740-913 854 0 1530 177 2031 500 501 325 766 825 854 1444l-1648 766c-148-383-325-648-560-825-235-176-530-265-884-265-501 0-942 147-1295 412-354 265-589 619-707 1090-176 707 325 1383 1472 2002 89 59 147 89 207 117 1001 530 1678 1061 1972 1591 295 529 354 1148 178 1943-266 1119-825 2002-1680 2680-853 647-1855 1002-3033 1002-971 0-1737-237-2267-708-589-471-854-1149-824-2002zm-1973-7863l-2444 10218h-1884l2444-10218h-3062l381-1649h8010l-383 1649h-3062zm-19170 10248l2944-12338 5596 7244c147 206 295 413 442 648 146 235 294 501 471 794l1973-8216h1737l-2944 12310-5713-7392c-147-206-294-412-442-619-147-235-265-442-353-707l-1973 8245h-1737v30zm-8599 0l2827-11868h6449l-383 1649h-4564l-707 2974h4564l-412 1679h4564l-913 3827h4565l-413 1738h-6449zm-3121-5860c0-88 29-354 88-766 30-353 59-618 89-854-118 266-236 530-383 824-147 266-324 560-530 825l-4535 6331-1472-6448c-59-265-118-530-148-766-29-235-59-500-59-736-59 236-147 500-235 794-89 266-206 560-354 855l-2650 5831h-1737l5683-12368 1620 7479c29 118 59 324 89 589 29 266 88 619 147 1031 206-353 471-765 825-1296 88-146 176-235 206-324l5124-7479-177 12368h-1737l148-5890zm-17933 5860l1296-5418-2356-6420h1972l1472 4035c30 117 59 235 118 411 59 178 89 354 147 530 118-176 236-353 354-530 118-176 236-324 353-471l3446-3975h1884l-5506 6390-1296 5417h-1885v30zm-8746-4682h3209l-530-2710c-30-176-59-383-59-589-30-235-30-471-30-736-118 265-236 500-383 736-118 235-235 442-354 619l-1855 2680zm4063 4682l-589-3062h-4594l-2061 3062h-1973l8540-12338 2650 12338h-1973zm-11808-6920h471c1031 0 1767-118 2179-354 412-235 677-647 825-1237 146-618 58-1089-236-1324-324-265-972-383-1943-383h-471l-825 3299zm-501 1590l-1266 5330h-1767l2827-11868h2856c854 0 1443 59 1826 147s678 236 913 471c294 265 500 648 589 1119 88 472 59 972-59 1531-147 560-353 1090-677 1561s-707 854-1119 1119c-353 206-736 382-1148 471-412 88-1060 148-1885 148h-1089v-30zm-17580 3563h1590c854 0 1531-59 2003-176 471-117 883-324 1266-589 530-383 972-854 1325-1443 354-560 619-1237 795-2002 176-766 235-1414 147-1972-88-561-294-1061-648-1444-265-294-589-471-1030-589-442-118-1119-176-2091-176h-1354l-2003 8392zm-2297 1767l2828-11868h2532c1649 0 2798 88 3415 265 619 177 1148 442 1561 854 530 530 884 1208 1031 2002 147 825 88 1767-147 2798-266 1060-648 1972-1178 2796-530 825-1207 1473-2002 2003-589 413-1237 678-1944 854-677 177-1708 265-3063 265h-3033v30zm-8628 0l2827-11868h6449l-383 1649h-4565l-707 2974h4565l-412 1679h4565l-913 3827h4565l-412 1738h-6449zm-4565 0l2827-11868h1884l-2827 11868h-1885zm-8540 0l2827-11868h6449l-383 1649h-4564l-707 2945h4564l-412 1679h-4565l-1325 5565h-1885v30zm-4565 0l2827-11868h1884l-2827 11868h-1885zm-13015 0l2944-12338 5595 7244c147 206 294 413 442 648 147 235 294 501 471 794l1973-8216h1737l-2944 12310-5713-7392c-147-206-294-412-442-619-147-235-265-442-353-707l-1973 8245h-1737v30z" fill="#3a3734" /><path d="M233961 120588h-12927l17963-64873h12927l-17963 64873zm-107424-4064c-707 2562-3063 4358-5713 4358H54185c-1826 0-3180-619-4064-1855-883-1238-1089-2769-559-4594l16255-58541h12928l-14518 52298h51710l14517-52298h12928l-16844 60632zm100710-58777c-883-1237-2268-1855-4152-1855h-71027l-3504 12721h64608l-3769 13576h-51680v-30h-12927l-10719 38724h12927l7185-25973h58100c1826 0 3534-619 5124-1855 1590-1237 2651-2768 3151-4594l7185-25972c559-1943 383-3504-501-4741z" fill="#716d6a" /><path fill="#0e8635" d="M274245 55833l16344 32510-34365 32510 4087-14747 18794-17763-8941-17785z" /><path fill="#e97208" d="M262762 55833l16343 32510-34395 32510z" /><path d="M31367 0h270601c8631 0 16474 3528 22156 9210 5683 5683 9211 13526 9211 22156v136275c0 8629-3529 16472-9211 22155-5683 5682-13526 9211-22155 9211H31368c-8629 0-16473-3528-22156-9211C3530 184114 2 176272 2 167641V31366c0-8631 3528-16474 9210-22156S22738 0 31369 0zm270601 10811H31367c-5647 0-10785 2315-14513 6043s-6043 8866-6043 14513v136275c0 5646 2315 10784 6043 14512 3729 3729 8867 6044 14513 6044h270601c5645 0 10783-2315 14512-6044 3728-3729 6044-8867 6044-14511V31368c0-5645-2315-10784-6043-14513-3728-3728-8867-6043-14513-6043z" fill="gray" fillRule="nonzero" />
    </svg>
);

const BillPayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.24074 16C1.904 16 0 14.096 0 11.7593V4.24074C0 1.904 1.904 0 4.24074 0H10.1519C11.968 0 13.5926 1.12 14.2889 2.72963L16 7.02222V11.7593C16 14.096 14.096 16 11.7593 16H4.24074Z" fill="#F58220"/>
        <path d="M5.52881 12.3556V3.64444H8.08881C9.09622 3.64444 9.87548 3.86667 10.4266 4.31111C10.9777 4.75556 11.2533 5.39259 11.2533 6.22222C11.2533 7.01481 10.9925 7.64148 10.471 8.10074C9.94956 8.56 9.20881 8.80741 8.24881 8.84444H6.80881V12.3556H5.52881ZM6.80881 7.73333H7.88881C8.42807 7.73333 8.83548 7.61185 9.11104 7.36889C9.38659 7.12593 9.52437 6.77333 9.52437 6.31111C9.52437 5.82222 9.38659 5.4637 9.11104 5.23704C8.83548 5.01037 8.42807 4.89778 7.88881 4.89778H6.80881V7.73333Z" fill="white"/>
    </svg>
);

const GoldLoanIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFD700" fillOpacity="0.3" /><path d="M12 8.5V15.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" /><path d="M9.5 12H14.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" /></svg>;
const PMVishwakarmaIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#FF9933" /><path d="M4 12C4 7.58172 7.58172 4 12 4V20C7.58172 20 4 16.4183 4 12Z" fill="#FFFFFF" /><path d="M20 12C20 16.4183 16.4183 20 12 20V4C16.4183 4 20 7.58172 20 12Z" fill="#138808" /><circle cx="12" cy="12" r="2.5" fill="#000080" /><path d="M12 9.5V14.5" stroke="white" strokeWidth="1"/><path d="M10.75 10.75L13.25 13.25" stroke="white" strokeWidth="1"/><path d="M10.75 13.25L13.25 10.75" stroke="white" strokeWidth="1"/><path d="M9.5 12H14.5" stroke="white" strokeWidth="1"/></svg>;
const KrishiTatkalIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.20182 18.3223L9.56952 4.13303C10.3621 2.65162 12.4842 2.5591 13.401 4.0041L21.3197 16.591C22.2359 18.0352 21.2023 19.9999 19.5165 19.9999H4.15347C2.55393 19.9999 1.4553 18.1565 2.20182 18.3223Z" stroke="#4CAF50" strokeWidth="1.5"/><path d="M12 8L12 15" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 11H14" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" /></svg>;


type DynamicIconItem = {
    iconKey: keyof IconAssets;
    defaultIcon: React.ComponentType<any>;
    label: string;
    href?: string;
    tag?: string;
    highlighted?: boolean;
    isCentral?: boolean;
};

const popularItems: DynamicIconItem[] = [
    { iconKey: 'mpassbook', defaultIcon: BookOpen, label: "mPassbook", href: "/account-statement" },
    { iconKey: 'otherBank', defaultIcon: UserPlus, label: "Other Bank", href: "#" },
    { iconKey: 'creditCard', defaultIcon: CreditCard, label: "Credit Card", href: "#" },
    { iconKey: 'pnbShoppe', defaultIcon: ShoppingCart, label: "PNB Shoppe", href: "#", tag: "Shoppe" },
    { iconKey: 'digiHome', defaultIcon: Home, label: "Digi Home", href: "#" },
];

const payTransferItems: DynamicIconItem[] = [
    { iconKey: 'fundTransfer', defaultIcon: Send, label: "Fund Transfer", href: "/fund-transfer" },
    { iconKey: 'upi', defaultIcon: UPIIcon, label: "UPI", href: "#" },
    { iconKey: 'approveToPay', defaultIcon: CheckCircle2, label: "Approve to Pay", href: "#" },
    { iconKey: 'billPay', defaultIcon: BillPayIcon, label: "Bill Pay", href: "#" },
    { iconKey: 'payToContact', defaultIcon: Contact, label: "Pay To Contact", href: "#" },
    { iconKey: 'manageBeneficiary', defaultIcon: Users, label: "Manage Beneficiary", href: "/fund-transfer/beneficiary/list" },
    { iconKey: 'payCreditCard', defaultIcon: CreditCardIcon, label: "Pay Credit Card", href: "#" },
    { iconKey: 'cardlessCash', defaultIcon: HandCoins, label: "Cardless Cash", href: "#" },
];

const digitalLoans: DynamicIconItem[] = [
    { iconKey: 'msmeLoan', defaultIcon: Briefcase, label: "Digi MSME Loan"},
    { iconKey: 'krishiTatkalRin', defaultIcon: KrishiTatkalIcon, label: "Krishi Tatkal Rin", highlighted: true},
    { iconKey: 'digitalKcc', defaultIcon: Tractor, label: "Digital KCC"},
    { iconKey: 'easyRenewal', defaultIcon: Leaf, label: "Easy Renewal Journey"},
    { iconKey: 'eGstExpress', defaultIcon: PercentSquare, label: "E GST Express"},
    { iconKey: 'digitalGoldLoan', defaultIcon: GoldLoanIcon, label: "Digital Gold Loan", highlighted: true},
    { iconKey: 'digitalEGodam', defaultIcon: Warehouse, label: "Digital E-Godam"},
    { iconKey: 'digiHousingLoan', defaultIcon: Home, label: "Digi Housing Loan"},
    { iconKey: 'digitalCarLoan', defaultIcon: Car, label: "Digital Car Loan"},
    { iconKey: 'digitalEducationLoan', defaultIcon: GraduationCap, label: "Digital Education Loan"},
    { iconKey: 'pmVishwakarma', defaultIcon: PMVishwakarmaIcon, label: "PM Vishwakarma", highlighted: true},
    { iconKey: 'kccRenewal', defaultIcon: RefreshCw, label: "KCC Renewal/ Review & DP Enhancement"},
];

const investApplyItems: DynamicIconItem[] = [
    { iconKey: 'mutualFunds', defaultIcon: TrendingUp, label: "Online Mutual Funds"},
    { iconKey: 'ppf', defaultIcon: Landmark, label: "PPF"},
    { iconKey: 'applyOnline', defaultIcon: FileCheck, label: "Apply Online"},
    { iconKey: 'insurance', defaultIcon: Umbrella, label: "Insurance"},
];

const ServicesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.89543 4 2 4.89543 2 6V12H10V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 4H14V8H20V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 12H2V18C2 19.1046 2.89543 20 4 20H10V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 12H14V20H20C21.1046 20 22 19.1046 22 18V16C22 13.7909 20.2091 12 18 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const MyRewardsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.00977 15.25L8.00977 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15.25V8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.9902 15.25V8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const EmergencyIcon = () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C8.68629 4 6 6.68629 6 10V13.5C6 14.8807 7.11929 16 8.5 16H15.5C16.8807 16 18 14.8807 18 13.5V10C18 6.68629 15.3137 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 19C9 20.6569 10.3431 22 12 22C13.6569 22 15 20.6569 15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 9L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 9L22 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const bottomNavItems: DynamicIconItem[] = [
  { iconKey: 'services', defaultIcon: ServicesIcon, href: '/dashboard', label: 'Services' },
  { iconKey: 'myRewards', defaultIcon: MyRewardsIcon, href: '#', label: 'My Rewards' },
  { iconKey: 'scan', defaultIcon: QrCode, href: '#', label: 'Scan', isCentral: true },
  { iconKey: 'offers', defaultIcon: Percent, href: '#', label: 'Offers' },
  { iconKey: 'emergency', defaultIcon: EmergencyIcon, href: '#', label: 'Emergency' },
];

function DashboardPageComponent() {
  const [showBalance, setShowBalance] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  const handleLogout = React.useCallback(() => {
    dispatch({ type: 'LOGOUT_PENDING' });
  }, [dispatch]);

  const account = state.accounts[0];
  const { settings } = state;

  if (!account) {
    // Optional: Render a loading state or a message if no account is found
    return <div>Loading account details...</div>;
  }
  
  const formattedBalance = formatCurrency(account.balance);

  const renderIconRow = (items: typeof popularItems) => (
      <div className="grid grid-cols-5 gap-y-4 gap-x-2 text-center">
          {items.map((item, index) => (
              <Link href={item.href || '#'} key={index} className="shrink-0">
                  <div className="flex flex-col items-center space-y-1 p-0.5">
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100`}>
                         <DynamicIcon iconKey={item.iconKey} fallback={item.defaultIcon} className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 text-center relative px-1 leading-tight">
                        {item.label}
                        {'tag' in item && item.tag && <span className="absolute -top-2.5 -right-1 bg-accent text-primary font-bold text-[8px] px-1 rounded">{item.tag}</span>}
                      </span>
                  </div>
              </Link>
          ))}
      </div>
  );
  
  const renderPayTransferIconRow = (items: typeof payTransferItems) => (
       <div className="grid grid-cols-4 gap-y-3 gap-x-2 text-center">
          {items.map(({ iconKey, defaultIcon, label, href }, index) => (
            <Link href={href || '#'} key={index} className="shrink-0">
                <div className="flex flex-col items-center space-y-2 p-1 rounded-lg hover:bg-red-50 transition-colors">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/5">
                        <DynamicIcon iconKey={iconKey} fallback={defaultIcon} className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">{label}</span>
                </div>
            </Link>
          ))}
       </div>
  );
  
  const renderLoanIconRow = (items: (typeof digitalLoans[0] & { highlighted?: boolean })[]) => (
       <div className="grid grid-cols-4 gap-4 text-center">
          {items.map(({ iconKey, defaultIcon, label, highlighted }, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
                <div className={cn("rounded-lg p-3", highlighted ? 'bg-primary/10' : 'bg-primary/10')}>
                    <DynamicIcon 
                        iconKey={iconKey} 
                        fallback={defaultIcon} 
                        className={cn("h-6 w-6", highlighted ? 'text-primary' : 'text-primary')}
                    />
                </div>
                <span className="text-center text-[10px] font-medium leading-tight px-1">{label}</span>
            </div>
          ))}
       </div>
  );

  const renderInvestIconRow = (items: typeof investApplyItems) => (
    <div className="grid grid-cols-4 gap-4 text-center">
       {items.map(({ iconKey, defaultIcon, label }, index) => (
         <div key={index} className="flex flex-col items-center gap-1">
             <div className="bg-primary/10 rounded-lg p-3">
                 <DynamicIcon iconKey={iconKey} fallback={defaultIcon} className="h-6 w-6 text-primary" />
             </div>
             <span className="text-center text-[10px] font-medium leading-tight px-1">{label}</span>
         </div>
       ))}
    </div>
);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-3 h-16 bg-gray-50 shadow-sm sticky top-0 z-30">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SideNav />
          </SheetContent>
        </Sheet>

        <div className="absolute left-1/2 -translate-x-1/2">
          <PNBLogo className="h-10 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-6 w-6 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-6 w-6 text-primary" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-20">
          {/* Account Cards Section */}
          <div className="bg-gray-100 py-3">
            <Carousel
              className="w-full"
              opts={{ loop: false }}
              setApi={(api) => {
                if (!api) return;
                api.on("select", () => setCurrentSlide(api.selectedScrollSnap()));
              }}
            >
              <CarouselContent className="-ml-2">
                <CarouselItem className="pl-4">
                  <Link href="/saving-account-details">
                    <Card className="bg-primary text-primary-foreground rounded-lg shadow-md">
                      <CardContent className="p-3 flex flex-col justify-between h-24">
                        <div>
                          <p className="text-xs font-light">{account.type} Account</p>
                          <p className="text-xs font-semibold">...{account.accountNumber.slice(-4)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-base font-bold tracking-tighter flex items-center">
                            {showBalance ? <><RupeeIcon className="w-3.5 h-3.5 mr-0.5" /> {formattedBalance}</> : "••••••••••"}
                          </p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.preventDefault(); setShowBalance(!showBalance);}}>
                            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
                <CarouselItem className="pl-4">
                  <Card className="bg-primary text-primary-foreground rounded-lg shadow-md">
                    <CardContent className="p-3 flex flex-col justify-between h-24">
                      <div>
                        <p className="text-xs font-light">Deposit Account</p>
                        <p className="text-xs font-semibold">...{account.accountNumber.slice(-4)}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-base font-bold tracking-tighter flex items-center">
                          {showBalance ? <><RupeeIcon className="w-3.5 h-3.5 mr-0.5" /> {formattedBalance}</> : "••••••••••"}
                        </p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setShowBalance(!showBalance)}>
                          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="pl-4">
                  <Card className="bg-primary text-primary-foreground rounded-lg shadow-md">
                    <CardContent className="p-3 flex flex-col justify-center items-center h-24 text-center">
                      <p className="font-bold text-sm">Credit Card</p>
                      <p className="text-xs opacity-80 mt-1">Link Now</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="pl-4">
                   <Card className="bg-primary text-primary-foreground rounded-lg shadow-md">
                    <CardContent className="p-3 flex flex-col justify-center h-24">
                      <div className="flex items-center gap-3">
                        <Link2 className="h-5 w-5"/>
                        <p className="font-bold text-sm">Linked Accounts</p>
                      </div>
                      <p className="text-xs opacity-80 mt-1">View and manage all your linked bank accounts.</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
            <div className="flex justify-center pt-2 gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === currentSlide ? "bg-primary w-4" : "bg-gray-300")}/>
                ))}
            </div>
          </div>
          
          <div className="p-2 space-y-4 bg-white">
            {/* Popular Section */}
            <section>
              <h2 className="font-headline font-bold text-sm text-gray-800 mb-2 px-1">Popular</h2>
              {renderIconRow(popularItems)}
            </section>
    
            {/* Pay & Transfer Section */}
            <Card className="shadow-sm">
                <CardContent className="p-3 space-y-3">
                    <h2 className="font-headline font-bold text-sm text-gray-800 px-1">Pay &amp; Transfer</h2>
                    {renderPayTransferIconRow(payTransferItems)}
                </CardContent>
            </Card>
    
            {/* Digital Loans Section */}
             <Card className="shadow-sm">
                <CardContent className="p-3 space-y-3">
                    <h2 className="font-headline font-bold text-sm text-gray-800">Digital Loans</h2>
                    {renderLoanIconRow(digitalLoans)}
                </CardContent>
            </Card>

            {/* Invest / Apply Section */}
            <Card className="shadow-sm">
                <CardContent className="p-3 space-y-3">
                    <h2 className="font-headline font-bold text-sm text-gray-800">Invest / Apply</h2>
                    {renderInvestIconRow(investApplyItems)}
                </CardContent>
            </Card>

          </div>
      </main>

      {/* Bottom Nav */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40">
            <div className="relative bg-card/95 backdrop-blur-sm h-16 flex items-center justify-around rounded-t-2xl border-t">
            {bottomNavItems.map((item) => {
              if (item.isCentral) {
                return (
                  <Link href={item.href} key={item.label} className="relative -top-5 text-center">
                    <div className="bg-primary rounded-full p-3.5 shadow-lg border-4 border-card">
                      <DynamicIcon iconKey={item.iconKey} fallback={item.defaultIcon} className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-primary text-xs mt-1 block">{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link key={item.label} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center justify-center gap-1 text-primary">
                     <DynamicIcon iconKey={item.iconKey} fallback={item.defaultIcon} className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </footer>
    </div>
  );
}

const DashboardPage = React.memo(DashboardPageComponent);
export default DashboardPage;
