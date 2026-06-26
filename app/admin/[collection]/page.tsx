import { notFound } from "next/navigation";

import { getAdminResource } from "@/lib/admin/resources";
import { AdminCollectionPage as AdminCollectionPageContent } from "../_components/admin-collection-page";

type Props = {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ page?: string; q?: string }>;
};

export default async function AdminCollectionPage({ params, searchParams }: Props) {
  const { collection } = await params;
  const resource = getAdminResource(collection);

  if (!resource) {
    notFound();
  }

  return <AdminCollectionPageContent resource={resource} searchParams={searchParams} />;
}
