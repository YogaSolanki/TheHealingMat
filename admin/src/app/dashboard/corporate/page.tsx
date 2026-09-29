import type { Metadata } from "next";
import { CorporatesPanel } from "@/components/corporates-panel";

export const metadata: Metadata = {
  title: "Corporate",
};

export default function CorporatePage() {
  return <CorporatesPanel />;
}
