
"use client";

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import type { AppState, Action, Transaction, AccountDetails, ChatMessage, UpdateTransactionPayload } from '@/lib/types';
import { defaultState } from '@/lib/mock-data';

// Define a new context shape to include appData and setAppData
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'INITIALIZE_STATE':
      return { ...action.payload, isStateInitialized: true };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, loginPending: false };
    case 'LOGIN_PENDING':
        return { ...state, loginPending: true };
    case 'LOGOUT_PENDING':
        return { ...state, isLoggingOut: true };
    case 'LOGOUT_COMPLETE':
      return { ...state, isAuthenticated: false, isLoggingOut: false, loginPending: false };
    case 'SET_TRANSFER_DETAILS':
      return { ...state, currentTransfer: { ...state.currentTransfer, ...action.payload } };
    case 'CLEAR_TRANSFER':
      return { ...state, currentTransfer: {} };
    case 'ADD_TRANSACTION': {
      const newTransaction: Transaction = {
          ...action.payload,
          id: action.payload.id || `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          accountId: state.accounts[0].id,
      };
      const filteredTransactions = state.transactions.filter(tx => tx.id !== newTransaction.id);
      
      return {
        ...state,
        transactions: [newTransaction, ...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    }
    case 'UPDATE_TRANSACTION': {
        const { originalId, updatedTransaction } = action.payload;
        return {
            ...state,
            transactions: state.transactions.map(tx => tx.id === originalId ? updatedTransaction : tx)
        };
    }
    case 'UPDATE_USER':
        return {...state, user: {...state.user, ...action.payload}};
    case 'UPDATE_ACCOUNT': {
        const updatedAccount = action.payload;
        return {
            ...state,
            accounts: state.accounts.map(acc => acc.id === updatedAccount.id ? { ...acc, ...updatedAccount } : acc)
        }
    }
    case 'UPDATE_TRANSACTIONS':
        return {...state, transactions: action.payload};
    case 'ADD_PAYEE':
        return {...state, payees: [...state.payees, action.payload]};
    case 'DELETE_PAYEE':
        return {...state, payees: state.payees.filter(p => p.id !== action.payload.id)};
    case 'UPDATE_PAYEES':
        return {...state, payees: action.payload};
    case 'UPDATE_CHAT_HISTORY':
        return {...state, chatHistory: action.payload};
    case 'UPDATE_SETTINGS':
        return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_STATE_FROM_JSON':
        return {...action.payload, isAuthenticated: true, isStateInitialized: true, loginPending: false };
    case 'RESET_STATE':
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        // We don't need to show splash on reset, just reload the default state.
        return {...defaultState, isAuthenticated: state.isAuthenticated, isStateInitialized: true, loginPending: false};
    default:
      return state;
  }
};

const LOCAL_STORAGE_KEY = 'pnb-ebank-prototype-state';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {...defaultState, isAuthenticated: false });

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsedState: AppState = JSON.parse(storedState);
        parsedState.settings = { ...defaultState.settings, ...parsedState.settings };
        parsedState.loginPending = false; // Ensure loginPending is reset on load
        parsedState.isLoggingOut = false; // Ensure isLoggingOut is reset on load
        // Crucially, don't carry over auth state from storage directly without re-auth in a real app
        // But for this prototype, we re-hydrate it.
        dispatch({ type: 'INITIALIZE_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'INITIALIZE_STATE', payload: defaultState });
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      dispatch({ type: 'INITIALIZE_STATE', payload: defaultState });
    }
  }, []);

  useEffect(() => {
    if (state.isStateInitialized) {
        try {
          // Create a copy of the state to save, but ensure isAuthenticated is not persisted as true if logged out.
          const stateToSave = { 
            ...state,
            isAuthenticated: state.isAuthenticated, // Persist the current auth state
          };
          // PINs are now persisted so changes made in the settings stick across reloads.
          // They are only removed during the manual JSON export feature.

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
          console.error("Failed to save state to localStorage", error);
        }
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// New hook for compatibility with the provided success page code
export const useAppStore = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
      throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
}

// Selector hook to get only a specific part of the state
export const useAppState = <T,>(selector: (state: AppState) => T): T => {
    const { state } = useAppContext();
    return selector(state);
};
