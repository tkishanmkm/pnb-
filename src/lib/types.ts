
export type Transaction = {
  id: string;
  accountId: string; // Keep for potential multi-account support
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  /** Parsed running balance immediately after this transaction, when supplied by the source statement. */
  balanceAfter?: number;
  category?: string;
  reference?: string;
  payee?: string;
  payeeId?: string; // Added for better linking
  remarks?: string; // Added for transfer details
  instrumentId?: string;
};

export type Payee = {
  id: string;
  name: string;
  nickname?: string;
  accountNumber: string;
  bank: string;
  ifsc: string;
  avatar?: string;
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  avatarUrl?: string;
};

export interface AccountDetails {
  id: string;
  userId: string;
  accountNumber: string;
  type: 'Savings' | 'Current';
  balance: number;
  currencySymbol: string;
  // New fields for PDF
  accountHolder: string;
  customerAddress: string;
  customerCity: string;
  customerPin: string;
  branchName: string;
  branchAddress: string;
  branchCity: string;
  branchPin: string;
  ifsc: string;
  micrCode?: string;
  customerId?: string;
  ckycNumber: string;
  nominee: string;
  averageQuarterlyBalance?: number;
  upiId?: string;
  status?: 'Active' | 'Debit Freeze';
}


export type User = {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    mpin: string;
    tpin: string;
    avatar: string;
    dob?: string;
    accounts?: AccountDetails[]; // Add this for passing to AI flow
}

export type CarouselBanner = {
  src: string;
  alt: string;
  hint: string;
}

export interface IconAssets {
  // Popular Items
  mpassbook?: string;
  otherBank?: string;
  creditCard?: string;
  pnbShoppe?: string;
  digiHome?: string;
  
  // Pay & Transfer
  fundTransfer?: string;
  upi?: string;
  approveToPay?: string;
  billPay?: string;
  payToContact?: string;
  manageBeneficiary?: string;
  payCreditCard?: string;
  cardlessCash?: string;

  // Digital Loans
  msmeLoan?: string;
  krishiRin?: string;
  digitalKcc?: string;
  eMudra?: string;
  easyRenewal?: string;
  eGstExpress?: string;
  digitalGoldLoan?: string;
  digitalEGodam?: string;
  digiHousingLoan?: string;
  digitalCarLoan?: string;
  digitalEducationLoan?: string;
  pmVishwakarma?: string;
  kccRenewal?: string;
  krishiTatkalRin?: string;

  // Invest / Apply
  mutualFunds?: string;
  ppf?: string;
  applyOnline?: string;
  insurance?: string;

  // Bottom Nav
  services?: string;
  myRewards?: string;
  scan?: string;
  offers?: string;
  emergency?: string;
}

export interface AppSettings {
  appLogo: string;
  loginHelpAvatar: string;
  otpAvatar: string;
  agentAvatar: string;
  pdfBanner: string;
  lastPagePdfDataUri?: string;
  currencySymbol: string;
  iconAssets?: IconAssets;
  pnbOneLogo: string;
  pnbBanner: string;
  carouselBanners: CarouselBanner[];
  pdfPassword?: string;
  /** Local prototype-only credentials; not bank authentication. */
  loginPassword?: string;
  demoLoginOtp?: string;
  registeredMobileLast4?: string;
  registeredAadhaarLast4?: string;
  agentEnglishStyle?: '1' | '2' | '3';
}

export interface TransferDetails {
  payeeId?: string;
  amount?: number;
  remarks?: string;
}

export type AppState = {
  isAuthenticated: boolean;
  isStateInitialized: boolean;
  loginPending: boolean;
  isLoggingOut?: boolean;
  user: User;
  accounts: AccountDetails[];
  transactions: Transaction[];
  payees: Payee[];
  chatHistory: ChatMessage[];
  currentTransfer: TransferDetails;
  settings: AppSettings;
  showSplash?: boolean;
};

// Payload for updating a transaction
export type UpdateTransactionPayload = {
  originalId: string;
  updatedTransaction: Transaction;
};


// Reducer action types
export type Action =
  | { type: 'INITIALIZE_STATE'; payload: AppState }
  | { type: 'LOGIN' }
  | { type: 'LOGIN_PENDING' }
  | { type: 'LOGOUT_PENDING' }
  | { type: 'LOGOUT_COMPLETE' }
  | { type: 'SET_TRANSFER_DETAILS'; payload: Partial<TransferDetails> }
  | { type: 'CLEAR_TRANSFER' }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id' | 'accountId'> & Partial<Pick<Transaction, 'id' | 'accountId'>> }
  | { type: 'UPDATE_TRANSACTION'; payload: UpdateTransactionPayload }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_ACCOUNT'; payload: AccountDetails }
  | { type: 'ADD_ACCOUNT'; payload: AccountDetails }
  | { type: 'UPDATE_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'REPLACE_STATEMENT_DATA'; payload: { account: AccountDetails; transactions: Transaction[] } }
  | { type: 'ADD_PAYEE'; payload: Payee }
  | { type: 'DELETE_PAYEE'; payload: {id: string} }
  | { type: 'UPDATE_PAYEES'; payload: Payee[] }
  | { type: 'UPDATE_CHAT_HISTORY', payload: ChatMessage[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_STATE_FROM_JSON'; payload: AppState }
  | { type: 'RESET_STATE' };
