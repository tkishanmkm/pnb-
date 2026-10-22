"use client";

import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import type { AppState, Action, Transaction, AccountDetails, ChatMessage, UpdateTransactionPayload } from '@/lib/types';
import { defaultState } from '@/lib/mock-data';
import { getStateFromIndexedDB, saveStateToIndexedDB, clearStateFromIndexedDB } from '@/lib/indexeddb';

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
      const requestedAccountId = action.payload.accountId;
      const accountId = requestedAccountId && state.accounts.some(account => account.id === requestedAccountId)
        ? requestedAccountId
        : state.accounts[0]?.id;
      if (!accountId) return state;

      const newTransaction: Transaction = {
          ...action.payload,
          id: action.payload.id || `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          accountId,
      };
      const filteredTransactions = state.transactions.filter(tx => tx.id !== newTransaction.id);
      
      const newState = {
        ...state,
        transactions: [newTransaction, ...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
      saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after adding transaction", err));
      return newState;
    }
    case 'UPDATE_TRANSACTION': {
        const { originalId, updatedTransaction } = action.payload;
        const newState = {
            ...state,
            transactions: state.transactions.map(tx => tx.id === originalId ? updatedTransaction : tx)
        };
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating transaction", err));
        return newState;
    }
    case 'UPDATE_USER': {
        const newState = {...state, user: {...state.user, ...action.payload}};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating user", err));
        return newState;
    }
    case 'UPDATE_ACCOUNT': {
        const updatedAccount = action.payload;
        const newState = {
            ...state,
            accounts: state.accounts.map(acc => acc.id === updatedAccount.id ? { ...acc, ...updatedAccount } : acc)
        };
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating account", err));
        return newState;
    }
    case 'UPDATE_TRANSACTIONS': {
        const newState = {...state, transactions: action.payload};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating transactions", err));
        return newState;
    }
    case 'ADD_PAYEE': {
        const newState = {...state, payees: [...state.payees, action.payload]};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after adding payee", err));
        return newState;
    }
    case 'DELETE_PAYEE': {
        const newState = {...state, payees: state.payees.filter(p => p.id !== action.payload.id)};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after deleting payee", err));
        return newState;
    }
    case 'UPDATE_PAYEES': {
        const newState = {...state, payees: action.payload};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating payees", err));
        return newState;
    }
    case 'UPDATE_CHAT_HISTORY': {
        const newState = {...state, chatHistory: action.payload};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating chat history", err));
        return newState;
    }
    case 'UPDATE_SETTINGS': {
        const newState = { ...state, settings: { ...state.settings, ...action.payload } };
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save state to IndexedDB after updating settings", err));
        return newState;
    }
    case 'SET_STATE_FROM_JSON': {
        const newState = {...action.payload, isAuthenticated: false, isStateInitialized: true, loginPending: false, isLoggingOut: false };
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save imported JSON state to IndexedDB", err));
        return newState;
    }
    case 'RESET_STATE': {
        clearStateFromIndexedDB().catch(err => console.error("Failed to clear IndexedDB on reset", err));
        try { window.localStorage.removeItem(LOCAL_STORAGE_KEY); } catch (error) { console.warn('Could not clear localStorage.', error); }
        const newState = {...defaultState, isAuthenticated: state.isAuthenticated, isStateInitialized: true, loginPending: false};
        saveStateToIndexedDB(newState).catch(err => console.error("Failed to save default state to IndexedDB on reset", err));
        return newState;
    }
    default:
      return state;
  }
};

const LOCAL_STORAGE_KEY = 'pnb-ebank-prototype-state';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {...defaultState, isAuthenticated: false, isStateInitialized: false });

  useEffect(() => {
    let isMounted = true;
    async function initializeApp() {
      try {
        let idbState: AppState | null = null;
        try {
          idbState = await getStateFromIndexedDB();
        } catch (storageError) {
          // Safari private browsing or restrictive storage settings may reject IndexedDB.
          console.warn('IndexedDB unavailable; trying localStorage fallback.', storageError);
        }
        if (!isMounted) return;

        if (idbState) {
          idbState.settings = { ...defaultState.settings, ...idbState.settings };
          idbState.loginPending = false;
          idbState.isLoggingOut = false;
          dispatch({ type: 'INITIALIZE_STATE', payload: idbState });
        } else {
          // Check localStorage as fallback if IDB is empty
          let storedState: string | null = null;
          try {
            storedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
          } catch (storageError) {
            console.warn('localStorage unavailable in this browser session.', storageError);
          }
          if (storedState) {
            const parsedState: AppState = JSON.parse(storedState);
            parsedState.settings = { ...defaultState.settings, ...parsedState.settings };
            parsedState.loginPending = false;
            parsedState.isLoggingOut = false;
            dispatch({ type: 'INITIALIZE_STATE', payload: parsedState });
            await saveStateToIndexedDB(parsedState);
          } else {
            dispatch({ type: 'INITIALIZE_STATE', payload: defaultState });
            await saveStateToIndexedDB(defaultState);
          }
        }
      } catch (error) {
        console.error("Failed to load initial state from IndexedDB/localStorage:", error);
        if (isMounted) {
          dispatch({ type: 'INITIALIZE_STATE', payload: defaultState });
        }
      }
    }
    initializeApp();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (state.isStateInitialized) {
        try {
          const stateToSave = { 
            ...state,
            isAuthenticated: state.isAuthenticated,
          };
          saveStateToIndexedDB(stateToSave).catch(err => {
            console.error("Failed to persist state update to IndexedDB", err);
          });
          try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
          } catch (storageError) {
            // Keep the app usable when Safari blocks localStorage; IndexedDB remains primary.
            console.warn('Could not persist localStorage fallback.', storageError);
          }
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

export const useAppStore = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
      throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
}

export const useAppState = <T,>(selector: (state: AppState) => T): T => {
    const { state } = useAppContext();
    return selector(state);
};
