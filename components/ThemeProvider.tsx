'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme) {
      console.log('📌 Loaded theme from localStorage:', savedTheme);
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🌙 System prefers dark mode');
      setTheme('dark');
      applyTheme('dark');
    } else {
      console.log('☀️ System prefers light mode');
      setTheme('light');
      applyTheme('light');
    }
    
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const htmlElement = document.documentElement;
    
    if (newTheme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('🔄 Toggling theme:', prevTheme, '→', newTheme);
      
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      console.log('✅ Theme saved to localStorage:', newTheme);
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
