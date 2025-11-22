// src/context/ThemeContext.tsx - VERSION CORRIGÉE
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ColorPalette, getColors } from '../design/Colors';
import { borders, layout, spacing, SpacingScale } from '../design/Spacing';
import { typography, TypographySystem } from '../design/Typography';

export type ThemeType = 'light' | 'dark';

export interface DesignSystem {
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingScale;
  layout: typeof layout;
  borders: typeof borders;
  isDark: boolean;
}

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isDark: boolean;
  designSystem: DesignSystem;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const designSystem: DesignSystem = {
    colors: getColors(isDark),
    typography,
    spacing,
    layout,
    borders,
    isDark,
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    designSystem,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook utilitaire pour accéder directement au design system
export const useDesignSystem = (): DesignSystem => {
  const { designSystem } = useTheme();
  return designSystem;
};

// Hook pour obtenir une couleur spécifique
export const useColor = () => {
  const { colors } = useDesignSystem();
  return colors;
};

// Hook pour obtenir les espacements
export const useSpacing = () => {
  const { spacing } = useDesignSystem();
  return spacing;
};

export default ThemeContext;