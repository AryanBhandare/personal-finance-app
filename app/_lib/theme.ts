// Hex values for the theme names stored on budgets and pots.
// Mirrors `colors.secondary` in tailwind.config.ts so charts match the UI.
export const themeHex: Record<string, string> = {
  green: "#277c78",
  yellow: "#f2cdac",
  cyan: "#82c9d7",
  navy: "#626070",
  red: "#c94736",
  purple: "#826cb0",
  lightPurple: "#af81ba",
  turquoise: "#597c7c",
  brown: "#93674f",
  magenta: "#934f6f",
  blue: "#3f82b2",
  navyGrey: "#97a0ac",
  amyGreen: "#7f9161",
  gold: "#cab361",
  orange: "#b36c49",
};

export function getThemeHex(theme: string) {
  return themeHex[theme] ?? theme;
}
