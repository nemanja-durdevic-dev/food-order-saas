import { notFound } from "next/navigation";
import { getLocale, getDictionary } from "@/lib/dictionaries";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { OrderStatus, type OrderData, type OrderItemData } from "@/components/order/order-status";
import { BRAND_NAME } from "@/lib/brand";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: `Order Status — ${BRAND_NAME}`,
};

export default async function OrderStatusPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const messages = await getDictionary(locale);
  const supabase = await createClient();

  let { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*, locations(name)")
    .eq("id", id)
    .single();

  if (orderError) {
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("orders")
      .select("*, locations(name)")
      .eq("id", id)
      .single();
    orderData = adminData;
    orderError = adminError;
  }

  if (orderError || !orderData) {
    notFound();
  }

  const { data: itemsData } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return (
    <OrderStatus
      orderId={id}
      initialOrder={orderData as unknown as OrderData}
      initialItems={(itemsData ?? []) as unknown as OrderItemData[]}
      locale={locale}
      messages={messages}
    />
  );
}
