import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendShipmentEmail } from "@/lib/email/sendShipmentEmail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchQikinkOrderStatus(orderId: number, token: string) {
    const res = await fetch(
      `${process.env.QIKINK_BASE_URL}/api/order/details/${orderId}`,
      {
        headers: {
          ClientId: process.env.QIKINK_CLIENT_ID!,
          Accesstoken: token,
        },
      }
    );
  
    const data = await res.json();
    return data;
  }

// ✅ THIS IS THE FIX
export async function GET() {
  try {
    console.log("🔄 Syncing Qikink tracking...");

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .is("tracking", null)
      .not("shipment_email_sent", "eq", true)
      .not("qikink_order_id", "is", null);

    if (!orders?.length) {
      return NextResponse.json({ message: "No orders to sync" });
    }

    for (const order of orders) {
        await new Promise(res => setTimeout(res, 500)); // 0.5s delay
      try {
        const token = process.env.QIKINK_ACCESS_TOKEN!;

        const res = await fetchQikinkOrderStatus(
          order.qikink_order_id,
          token
        );

        console.log("🔍 FULL QIKINK RESPONSE:");
        console.log("🔍 Qikink Parsed Response:");
        console.dir(res, { depth: null });

        const shipment = res?.data?.shipment;

        if (!shipment || !shipment.awb_number) {
            console.log(`⚠️ No shipment yet for order ${order.order_number}`);
            continue;
          }

        await supabase
          .from("orders")
          .update({
            tracking: shipment.awb_number,
            tracking_url: `https://www.courierupdates.com/awb/${shipment.awb_number}`,
            carrier: shipment.courier_name,
            eta: shipment.estimated_delivery_date,
            status: shipment.status || "shipped",
          })
          .eq("id", order.id);

        console.log(`✅ Updated tracking for order ${order.order_number}`);
        try {
            await sendShipmentEmail(order, shipment);
          
            await supabase
              .from("orders")
              .update({ shipment_email_sent: true })
              .eq("id", order.id);
          
          } catch (err) {
            console.error("Shipment email failed:", err);
          
            await supabase
              .from("orders")
              .update({ shipment_email_failed: true })
              .eq("id", order.id);
          }
      } catch (err) {
        console.error(`❌ Failed for order ${order.id}`, err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("💥 Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}