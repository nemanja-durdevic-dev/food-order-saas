import { NextResponse } from "next/server";

import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

function escapeSearchQuery(query: string) {
  return query.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function rankLabel(label: string, query: string) {
  const normalizedLabel = label.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return 0;
  }

  return normalizedLabel.indexOf(normalizedQuery) + 1;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const collection = url.searchParams.get("collection") ?? "";
  const fieldKey = url.searchParams.get("field") ?? "";
  const query = (url.searchParams.get("q") ?? "").trim();

  const resource = getAdminResource(collection);
  const field = [...(resource?.createFields ?? []), ...(resource?.editFields ?? [])].find(
    (candidate) => candidate.key === fieldKey,
  );

  if (!resource || !field?.relation || !field.searchable) {
    return NextResponse.json({ error: "Unknown relation field." }, { status: 404 });
  }

  if (!query) {
    return NextResponse.json({ options: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: membership } = await supabaseAdmin
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let relationQuery = supabaseAdmin
    .from(field.relation.table)
    .select(`id, ${field.relation.labelColumn}`)
    .ilike(field.relation.labelColumn, `%${escapeSearchQuery(query)}%`)
    .order(field.relation.labelColumn, { ascending: true })
    .limit(50);

  if (field.relation.restaurantScoped !== false) {
    relationQuery = relationQuery.eq("restaurant_id", membership.restaurant_id);
  }

  const { data, error } = await relationQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const records = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const options = records
    .map((record) => ({
      label: String(record[field.relation!.labelColumn] ?? "Untitled"),
      value: String(record.id),
    }))
    .sort((firstOption, secondOption) => {
      const firstRank = rankLabel(firstOption.label, query);
      const secondRank = rankLabel(secondOption.label, query);

      if (firstRank !== secondRank) {
        return firstRank - secondRank;
      }

      return firstOption.label.localeCompare(secondOption.label);
    })
    .slice(0, 20);

  return NextResponse.json({
    options,
  });
}
