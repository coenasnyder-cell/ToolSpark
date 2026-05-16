// ToolSpark — layout.ts
// Status: ACTIVE
// Description: Spacing, sizing, and layout constants

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Border radius
  radiusSm: 8,
  radius: 12,
  radiusLg: 16,
  radiusFull: 999,

  // Component sizes
  tabBarHeight: 60,
  headerHeight: 56,
  buttonHeight: 48,
  inputHeight: 48,
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 64,

  // Touch targets
  minTouchTarget: 44,
};