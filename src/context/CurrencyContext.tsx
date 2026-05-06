import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import userService from '@/api/userService';
import currencyService from '@/api/currencyService';
import { useAuth } from '@/hooks/useAuth'; 

interface CurrencyInfo {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyContextType {
  userCurrencyId: number;
  userCurrencyCode: string;
  userCurrencySymbol: string;
  currencies: CurrencyInfo[];
  isLoadingCurrencies: boolean;
  isAuthenticated: boolean;
  getCurrencyInfo: (currencyId: number) => CurrencyInfo | undefined;
  getSymbol: (currencyId: number) => string;
  getCode: (currencyId: number) => string;
  getName: (currencyId: number) => string;
  formatAmount: (amount: number, currencyId?: number) => string;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated: authIsAuthenticated, user } = useAuth(); // Get auth state
  
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [userCurrencyId, setUserCurrencyId] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  //  Check if user has valid token
  const hasValidToken = (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token && token.trim().length > 0;
  };

  //  Memoize fetch function with useCallback
  const fetchUserAndCurrencies = useCallback(async () => {
    try {
      //  Only fetch if user is authenticated
      if (!hasValidToken()) {
        console.log('No valid token, skipping currency fetch');
        setIsLoadingCurrencies(false);
        setIsAuthenticated(false);
        setUserCurrencyId(0);
        setCurrencies([]);
        return;
      }

      setIsLoadingCurrencies(true);
      setIsAuthenticated(true);

      console.log('Fetching user data...');
      const userData = await userService.getCurrentUser();
      console.log('User data received:', userData);
      
      if (!userData || !userData.currencyId) {
        throw new Error('User not authenticated or missing currencyId');
      }

      //  Update to new user's currency
      console.log(`Setting currency to ${userData.currencyId}`);
      setUserCurrencyId(userData.currencyId);

      console.log('Fetching currencies...');
      const currencyResponse = await currencyService.getAllCurrencies();
      console.log('Currencies received:', currencyResponse);
      
      const currencyList: CurrencyInfo[] = (currencyResponse || []).map(
        (dto: any) => ({
          id: dto.id || 0,
          code: dto.code || '',
          name: dto.name || '',
          symbol: dto.symbol || '',
        })
      );
      
      setCurrencies(currencyList);
      console.log('Currencies loaded successfully');
    } catch (error) {
      console.error('Failed to load user or currencies:', error);
      setIsAuthenticated(false);
      setUserCurrencyId(0);
      setCurrencies([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, []);

  //  Initial load on mount
  useEffect(() => {
    console.log('CurrencyProvider mounted, fetching...');
    fetchUserAndCurrencies();
  }, [fetchUserAndCurrencies]);

  // Refresh when auth state changes (user login/logout/switch)
  useEffect(() => {
    console.log('Auth state changed, refreshing currency...');
    fetchUserAndCurrencies();
  }, [authIsAuthenticated, user?.userId, fetchUserAndCurrencies]); // Add auth dependencies

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currencyUpdated') {
        console.log('Currency updated detected, refreshing...');
        fetchUserAndCurrencies();
      }
      // Listen for logout
      if (e.key === 'authToken' && !e.newValue) {
        console.log('Token removed, clearing currencies...');
        setIsAuthenticated(false);
        setUserCurrencyId(0);
        setCurrencies([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUserAndCurrencies]);

  // Get currency info by ID
  const getCurrencyInfo = useCallback(
    (currencyId: number): CurrencyInfo | undefined => {
      return currencies.find((c) => c.id === currencyId);
    },
    [currencies]
  );

  // Get currency symbol
  const getSymbol = useCallback(
    (currencyId: number): string => {
      return getCurrencyInfo(currencyId)?.symbol || '';
    },
    [getCurrencyInfo]
  );

  // Get currency code
  const getCode = useCallback(
    (currencyId: number): string => {
      return getCurrencyInfo(currencyId)?.code || '';
    },
    [getCurrencyInfo]
  );

  // Get currency name
  const getName = useCallback(
    (currencyId: number): string => {
      return getCurrencyInfo(currencyId)?.name || '';
    },
    [getCurrencyInfo]
  );

  // Format amount with currency symbol
  const formatAmount = useCallback(
    (amount: number, currencyId: number = userCurrencyId): string => {
      const currency = getCurrencyInfo(currencyId);
      if (!currency) return `${amount.toFixed(2)}`;

      const formatted = amount.toFixed(2);
      return `${currency.symbol}${formatted}`;
    },
    [userCurrencyId, getCurrencyInfo]
  );

  // Get user's currency info
  const userCurrencyInfo = getCurrencyInfo(userCurrencyId);
  const userCurrencyCode = userCurrencyInfo?.code || '';
  const userCurrencySymbol = userCurrencyInfo?.symbol || '';

  // Memoize context value
  const value: CurrencyContextType = useMemo(
    () => ({
      userCurrencyId,
      userCurrencyCode,
      userCurrencySymbol,
      currencies,
      isLoadingCurrencies,
      isAuthenticated,
      getCurrencyInfo,
      getSymbol,
      getCode,
      getName,
      formatAmount,
      refreshCurrency: fetchUserAndCurrencies,
    }),
    [
      userCurrencyId,
      userCurrencyCode,
      userCurrencySymbol,
      currencies,
      isLoadingCurrencies,
      isAuthenticated,
      getCurrencyInfo,
      getSymbol,
      getCode,
      getName,
      formatAmount,
      fetchUserAndCurrencies,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}


export default CurrencyContext;