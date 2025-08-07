import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LocaleSettings {
  language: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
}

export interface LocaleContextType {
  settings: LocaleSettings;
  updateSettings: (settings: Partial<LocaleSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
}

const defaultSettings: LocaleSettings = {
  language: 'en-US',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'US'
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Currency mapping
const currencyMap: Record<string, { code: string; symbol: string; locale: string }> = {
  'USD': { code: 'USD', symbol: '$', locale: 'en-US' },
  'EUR': { code: 'EUR', symbol: '€', locale: 'de-DE' },
  'GBP': { code: 'GBP', symbol: '£', locale: 'en-GB' },
  'JPY': { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  'CAD': { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
  'AUD': { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  'CHF': { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },
  'CNY': { code: 'CNY', symbol: '¥', locale: 'zh-CN' },
  'INR': { code: 'INR', symbol: '₹', locale: 'en-IN' },
  'BRL': { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  'MXN': { code: 'MXN', symbol: '$', locale: 'es-MX' },
  'KRW': { code: 'KRW', symbol: '₩', locale: 'ko-KR' }
};

// Language mapping
const languageMap: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)', 
  'es-ES': 'Español',
  'es-MX': 'Español (México)',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'pt-BR': 'Português (Brasil)',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'zh-CN': '中文 (简体)',
  'zh-TW': '中文 (繁體)',
  'hi-IN': 'हिन्दी',
  'ar-SA': 'العربية'
};

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [settings, setSettings] = useState<LocaleSettings>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('localeSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // Save to localStorage when settings change
  useEffect(() => {
    localStorage.setItem('localeSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<LocaleSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const formatCurrency = (amount: number): string => {
    const currencyInfo = currencyMap[settings.currency] || currencyMap['USD'];
    
    try {
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: 'currency',
        currency: currencyInfo.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported locales
      return `${currencyInfo.symbol}${amount.toLocaleString()}`;
    }
  };

  const formatNumber = (number: number): string => {
    const locale = settings.language || 'en-US';
    
    try {
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      return number.toLocaleString();
    }
  };

  const formatDate = (date: Date): string => {
    const locale = settings.language || 'en-US';
    
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };

      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      // Fallback formatting
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      if (settings.dateFormat === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
      } else {
        return `${month}/${day}/${year}`;
      }
    }
  };

  const value: LocaleContextType = {
    settings,
    updateSettings,
    formatCurrency,
    formatNumber,
    formatDate
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Export available options for settings UI
export const availableCurrencies = Object.keys(currencyMap);
export const availableLanguages = Object.keys(languageMap);
export const currencyOptions = Object.entries(currencyMap).map(([code, info]) => ({
  value: code,
  label: `${info.symbol} ${code}`
}));
export const languageOptions = Object.entries(languageMap).map(([code, name]) => ({
  value: code,
  label: name
}));