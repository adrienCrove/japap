import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    primary: string;
    primaryText: string;
    secondaryText: string;
    border: string;
    borderLight: string;
    card: string;
    cardBorder: string;
    icon: string;
    error: string;
    success: string;
    statusBar: 'light' | 'dark';
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#FAFAFA',
    primary: '#E94F23',
    primaryText: '#000000',
    secondaryText: '#666666',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
    icon: '#666666',
    error: '#E94F23',
    success: '#4CAF50',
    statusBar: 'dark',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#000000',
    surface: '#1a1a1a',
    surfaceVariant: '#0a0a0a',
    primary: '#E94F23',
    primaryText: '#FFFFFF',
    secondaryText: '#999999',
    border: '#333333',
    borderLight: '#222222',
    card: '#1a1a1a',
    cardBorder: '#333333',
    icon: '#999999',
    error: '#E94F23',
    success: '#4CAF50',
    statusBar: 'light',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light'); // Par défaut: clair

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
