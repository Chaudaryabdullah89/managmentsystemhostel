// Design Theme for Hostel Portal Mobile Client
// Integrates Apple-inspired spacing/shadows with Google product brand colors

export const colors = {
  // Google's Core Brand Palette
  primary: '#4285F4',      // Google Blue
  success: '#34A853',      // Google Green
  warning: '#FBBC05',      // Google Yellow
  danger: '#EA4335',       // Google Red
  
  // Secondary UI Accent Colors
  accentLight: '#E8F0FE',  // Light Blue tint
  successLight: '#E6F4EA', // Light Green tint
  warningLight: '#FEF7E0', // Light Yellow tint
  dangerLight: '#FCE8E6',  // Light Red tint

  // Neutral Colors (Apple Inspired System Grays)
  background: '#F2F2F7',   // Primary screen backdrop
  surface: '#FFFFFF',      // Card and container backdrop
  border: '#E5E5EA',       // Clean thin borders
  
  // Typography
  textPrimary: '#1C1C1E',  // System dark text
  textSecondary: '#8E8E93',// System gray subtext
  textPlaceholder: '#C7C7CC',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  giant: 32,
};

export const borderRadius = {
  small: 8,
  medium: 14,
  large: 20,
  pill: 9999,
};

export const shadows = {
  premium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  premiumHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
};
