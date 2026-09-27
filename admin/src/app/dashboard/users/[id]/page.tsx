import type { Metadata } from "next";
import { UserDetailPanel } from "@/components/user-detail-panel";

export const metadata: Metadata = {
  title: "User details",
};

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  return <UserDetailPanel userId={id} />;
}
