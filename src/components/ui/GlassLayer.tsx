"use client";

import { GlassEnhancer } from "@/components/ui/LiquidGlass";

/** Liquid glass su pulsanti, barre, pannelli, card e contenitori di form di tutto il sito. */
export default function GlassLayer() {
  return <GlassEnhancer selector={`.btn, nav.bg-black, form, [class*="rounded-xl"][class*="bg-white"], [class*="rounded-2xl"][class*="bg-white"]`} />;
}
