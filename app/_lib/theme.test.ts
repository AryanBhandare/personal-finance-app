import { describe, expect, it } from "vitest";
import { getThemeHex, themeHex } from "./theme";
import tailwindConfig from "@/tailwind.config";

describe("getThemeHex", () => {
  it("maps stored theme names to palette colours", () => {
    expect(getThemeHex("green")).toBe("#277c78");
    expect(getThemeHex("navy")).toBe("#626070");
  });

  it("passes through values that are already colours", () => {
    expect(getThemeHex("#123456")).toBe("#123456");
  });

  it("matches the Tailwind palette so charts and UI agree", () => {
    const palette = (tailwindConfig.theme?.extend?.colors as any).secondary;
    for (const [name, hex] of Object.entries(themeHex)) {
      expect(palette[name]).toBe(hex);
    }
  });
});
