import type { Metadata } from "next";
import { CorporateDetailPanel } from "@/components/corporate-detail-panel";

export const metadata: Metadata = {
  title: "Corporate detail",
};

export default async function CorporateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CorporateDetailPanel companyId={id} />;
}
