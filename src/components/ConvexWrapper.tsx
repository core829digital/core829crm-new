"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const ConvexClientProvider = dynamic(
  () => import("@/components/ConvexClientProvider"),
  { ssr: false }
);

export default function ConvexWrapper({ children }: { children: ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
