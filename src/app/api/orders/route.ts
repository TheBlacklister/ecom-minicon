// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendMail } from "@/lib/mailer";
import { generateInvoiceBuffer } from "@/lib/invoice";

/* ---------------- AUTH HELPER ---------------- */

async function getUser(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ?? null;

  if (!token)
    return { user: null, supabase: null, error: new Error("Auth session missing!") };

  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      user: null,
      supabase: null,
      error: error ?? new Error("Unable to fetch user"),
    };
  }

  return { user: data.user, supabase, error: null };
}

/* =========================================================
   POST /api/orders
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request);

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message ?? "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await request.json();

    const {
      qikink_order_id,
      order_number,
      payment_mode,
      total_amount,
      subtotal,
      shipping,
      taxes,
      coupon_discount,
      coupon_code,
      shipping_address,
      cart_items,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = payload;

    if (!order_number || !total_amount || !cart_items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ---------- CREATE ORDER ---------- */

    const orderData: any = {
      user_id: user.id,
      order_number,
      status: payment_mode === "razorpay" ? "paid" : "pending",
      payment_mode,
      total_amount,
      subtotal,
      shipping: shipping || 0,
      taxes: taxes || 0,
      coupon_discount: coupon_discount || 0,
      coupon_code,
      shipping_address,
      user_email: user.email,
    };

    if (qikink_order_id) orderData.qikink_order_id = qikink_order_id;
    if (razorpay_order_id) orderData.razorpay_order_id = razorpay_order_id;
    if (razorpay_payment_id) orderData.razorpay_payment_id = razorpay_payment_id;
    if (razorpay_signature) orderData.razorpay_signature = razorpay_signature;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    /* ---------- CREATE ORDER ITEMS ---------- */

    const orderItems = cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product?.id ?? item.product_id,
      quantity: item.quantity ?? 1,
      price: item.price ?? item.product?.price_after ?? 0,
      selected_size: item.selected_size ?? null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);

      // rollback order
      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    /* ---------- FETCH FULL ORDER WITH PRODUCTS ---------- */

    const { data: fullOrder } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
      )
      .eq("id", order.id)
      .single();

    /* ---------- EMAIL + INVOICE (NON BLOCKING) ---------- */

    (async () => {
      try {
        const shapedOrder = {
          id: fullOrder.order_number,
          created_at: fullOrder.created_at,
          email: fullOrder.user_email,
          customerName:
            fullOrder.shipping_address?.name ?? fullOrder.user_email,
          items:
            fullOrder.order_items?.map((it: any) => ({
              title: it.product?.title ?? "Item",
              quantity: it.quantity,
              price: it.price,
            })) ?? [],
          total: fullOrder.total_amount,
          shipping_address: fullOrder.shipping_address,
        };

        const pdfBuffer = await generateInvoiceBuffer(shapedOrder);

        // 1️⃣ ORDER CONFIRMATION EMAIL (NO ATTACHMENT)
await sendMail({
  to: shapedOrder.email,
  subject: `Your MINICON Order #${shapedOrder.id} has been placed`,
  template: "order_created",
  templateData: {
    id: shapedOrder.id || "",
    customerName: shapedOrder.customerName || "Customer",
    items: shapedOrder.items || [],
    total: shapedOrder.total || 0,
    createdAt: shapedOrder.created_at
      ? new Date(shapedOrder.created_at).toLocaleString()
      : "",

    tracking: null,
    trackingLink: null,

    shippingName: fullOrder.shipping_address?.name || "",
    shippingAddressLine1: fullOrder.shipping_address?.address1 || "",
    shippingAddressLine2: fullOrder.shipping_address?.address2 || "",
    shippingCity: fullOrder.shipping_address?.city || "",
    shippingPostcode: fullOrder.shipping_address?.pincode || "",
    shippingState: fullOrder.shipping_address?.state || "",
    shippingCountry: fullOrder.shipping_address?.country || "",

    year: new Date().getFullYear(),
  },
});


// 2️⃣ INVOICE EMAIL (WITH PDF ATTACHMENT)
await sendMail({
  to: shapedOrder.email,
  subject: `Invoice for Order #${shapedOrder.id}`,
  template: "invoice",
  templateData: {
    id: shapedOrder.id,
    customerName: shapedOrder.customerName,
    items: shapedOrder.items,
    total: shapedOrder.total,
    createdAt: new Date(shapedOrder.created_at).toLocaleString(),
    year: new Date().getFullYear(),
  },
  attachments: [
    {
      filename: `invoice-${shapedOrder.id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});

        console.log("Order email sent");
      } catch (mailErr) {
        console.error("Email failed:", mailErr);

        await supabase
        .from("orders")
        .update({ email_failed: true })
        .eq("id", order.id);
      }
    })();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
      },
    });
  } catch (err) {
    console.error("Error in orders POST:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
