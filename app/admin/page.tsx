import { redirect } from "next/navigation";

import { getAdminResource } from "@/lib/admin/resources";
import { AdminCollectionPage } from "./_components/admin-collection-page";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ page?: string; q?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const resource = getAdminResource("locations");

  if (!resource) {
    redirect("/");
  }

  return <AdminCollectionPage resource={resource} searchParams={searchParams} />;
}
