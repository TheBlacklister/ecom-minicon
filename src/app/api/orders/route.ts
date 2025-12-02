// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendMail } from "@/lib/mailer";
import { generateInvoiceBuffer } from "@/lib/invoice";

/**
 * Helper - get authenticated user + supabase admin client
 */
async function getUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  if (!token) return { user: null, supabase: null, error: new Error("Auth session missing!") };

  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, supabase: null, error: error ?? new Error("Unable to fetch user") };
  }
  return { user: data.user, supabase, error: null };
}

/**
 * POST /api/orders
 * Create a new order (authenticated)
 * - inserts into orders
 * - inserts order_items
 * - generates PDF invoice and emails order_created template with attachment
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request);
    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? "Not authenticated" }, { status: 401 });
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

    if (!order_number || !total_amount || !cart_items || cart_items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // prepare order row
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
      user_email: user.email, // store the user's email for fallback
    };

    if (qikink_order_id) orderData.qikink_order_id = qikink_order_id;
    if (razorpay_order_id) orderData.razorpay_order_id = razorpay_order_id;
    if (razorpay_payment_id) orderData.razorpay_payment_id = razorpay_payment_id;
    if (razorpay_signature) orderData.razorpay_signature = razorpay_signature;

    // create order
    const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single();
    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // create order items
    const orderItems = cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product?.id ?? item.product_id ?? null,
      quantity: item.quantity ?? 1,
      price: item.price ?? item.product?.price_after ?? 0,
      selected_size: item.selected_size ?? null,
      title: item.title ?? item.product?.title ?? "",
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    // --- build shaped order for email/invoice
    const shapedOrder = {
      id: order.id,
      created_at: order.created_at,
      email: order.user_email ?? user.email,
      customerName: (order.shipping_address && order.shipping_address.name) ?? user.email,
      items: orderItems.map((it: any) => ({
        title: it.title ?? "Item",
        quantity: it.quantity,
        price: it.price,
      })),
      total: order.total_amount ?? order.total ?? total_amount,
      shipping_address,
    };

    // generate PDF invoice and send email (non-blocking: catch errors)
    (async () => {
      try {
        const pdfBuffer = await generateInvoiceBuffer(shapedOrder);

        await sendMail({
          to: shapedOrder.email,
          subject: `Your MINICON Order #${shapedOrder.id} — Invoice`,
          template: "order_created",
          templateData: {
            id: shapedOrder.id,
            customerName: shapedOrder.customerName,
            items: shapedOrder.items,
            total: shapedOrder.total,
            shippingName: shapedOrder.shipping_address?.name ?? "",
            shippingAddressLine1: shapedOrder.shipping_address?.line1 ?? shapedOrder.shipping_address?.address ?? "",
            shippingAddressLine2: shapedOrder.shipping_address?.line2 ?? "",
            shippingCity: shapedOrder.shipping_address?.city ?? "",
            shippingPostcode: shapedOrder.shipping_address?.postal_code ?? shapedOrder.shipping_address?.postcode ?? "",
            shippingState: shapedOrder.shipping_address?.state ?? "",
            shippingCountry: shapedOrder.shipping_address?.country ?? "",
            createdAt: new Date(shapedOrder.created_at ?? Date.now()).toLocaleString(),
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
        console.log("Order-created email sent to", shapedOrder.email);
      } catch (mailErr) {
        console.error("Failed to send order-created email:", mailErr);
      }
    })();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        qikink_order_id: order.qikink_order_id ?? null,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
      },
    });
  } catch (err) {
    console.error("Error in orders POST:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders
 * Used to update order status (body: { orderId, status, tracking, eta })
 * Sends a status update email when status changes.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request);
    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { status, tracking, tracking_url, eta, awb_number } = body;
    let { orderId } = body;

    // coerce numeric id
    orderId = typeof orderId === "string" && /^\d+$/.test(orderId)
      ? Number(orderId)
      : orderId;

    // coerce numeric id consistently (adjust if your id is uuid/string)
    orderId = typeof orderId === "string" && /^\d+$/.test(orderId) ? Number(orderId) : orderId;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    // fetch existing order to check ownership (or admin can update)
    const { data: existing, error: fetchErr } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (fetchErr) {
      console.error("Order fetch error (fetchErr):", fetchErr);
      return NextResponse.json({ error: "Order fetch failed", details: fetchErr }, { status: 500 });
    }
    if (!existing) {
      console.warn("Order not found (id):", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ownership check (only owner may update) - change if admins allowed
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this order" }, { status: 403 });
    }

    // Build payload using only fields we actually received (and that are in your schema)
    const updatePayload: Record<string, any> = {};
    if (typeof status !== "undefined") updatePayload.status = status;
    if (typeof tracking !== "undefined") updatePayload.tracking = tracking;
    if (typeof tracking_url !== "undefined") updatePayload.tracking_url = tracking_url;
    if (typeof eta !== "undefined") updatePayload.eta = eta;
    if (typeof awb_number !== "undefined") updatePayload.awb_number = awb_number;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // ---- paste this BEFORE the update call ----
console.log("PATCH /api/orders payload:", { orderId, updatePayload });

// Debug: show the fetched row and current user id/shape (helps catch type mismatch / ownership)
console.log("Existing row (fetched):", existing);
console.log("Current request user:", { id: user?.id, role: user?.role, email: user?.email });

// Also log types for id to catch numeric vs string mismatch
console.log("Types: existing.id typeof=", typeof existing?.id, "orderId typeof=", typeof orderId);

// Proceed with update below...


    console.log("PATCH /api/orders payload:", { orderId, updatePayload });

    // Use maybeSingle() so if update affects 0 rows we get null rather than a PGRST116 exception
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("Failed to update order status (updateErr):", updateErr);
      return NextResponse.json({ error: updateErr }, { status: 500 });
    }

    if (!updatedOrder) {
      console.warn("Update matched 0 rows for id:", orderId);
      return NextResponse.json({ error: "Order not found or not updated" }, { status: 404 });
    }

    // fetch enriched order (with items) using maybeSingle()
    const { data: fetched, error: fetchedErr } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (fetchedErr) {
      console.error("Failed to fetch enriched order:", fetchedErr);
      // still return success since update succeeded, but include warning
      return NextResponse.json({
        success: true,
        updated: true,
        order: updatedOrder,
        warning: "Failed to fetch enriched order",
        details: fetchedErr,
      });
    }
    if (!fetched) {
      // unlikely because updatedOrder existed — but handle defensively
      return NextResponse.json({ success: true, updated: true, order: updatedOrder });
    }

    const shapedOrder = {
      id: fetched.id,
      created_at: fetched.created_at,
      email: fetched.user_email ?? user.email,
      customerName: (fetched.shipping_address && fetched.shipping_address.name) ?? fetched.user_email ?? user.email,
      items: (fetched.order_items || []).map((it: any) => ({
        title: it.product?.title ?? it.title ?? "Item",
        quantity: it.quantity ?? it.qty ?? 1,
        price: it.price ?? it.product?.price_after ?? 0,
      })),
      total: fetched.total_amount ?? fetched.total ?? 0,
      tracking: fetched.tracking ?? null,
      tracking_url: fetched.tracking_url ?? null,
      eta: fetched.eta ?? null,
      awb_number: fetched.awb_number ?? null,
    };

    // send status update email (non-blocking)
    (async () => {
      try {
        const labelMap: Record<string, string> = {
          pending: "Pending",
          on_hold: "On hold",
          paid: "Paid",
          shipped: "Shipped",
          out_for_delivery: "Out for delivery",
          delivered: "Delivered",
          cancelled: "Cancelled",
        };
        const statusLabel = labelMap[status] ?? status;

        await sendMail({
          to: shapedOrder.email,
          subject: `Your MINICON Order #${shapedOrder.id} — ${statusLabel}`,
          template: "order_status",
          templateData: {
            id: shapedOrder.id,
            customerName: shapedOrder.customerName,
            statusLabel,
            isShipment: ["shipped", "out_for_delivery"].includes(status),
            tracking: shapedOrder.tracking,
            tracking_url: shapedOrder.tracking_url,
            eta: shapedOrder.eta,
            awb_number: shapedOrder.awb_number,
            updatedAt: new Date().toLocaleString(),
            year: new Date().getFullYear(),
            items: shapedOrder.items,
            total: shapedOrder.total,
          },
        });
        console.log("Order status email sent to", shapedOrder.email, "status:", status);
      } catch (mailErr) {
        console.error("Failed to send order status email:", mailErr);
      }
    })();

    return NextResponse.json({ success: true, updated: true, order: updatedOrder });
  } catch (err) {
    console.error("Error in orders PATCH:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/orders
 * (existing) return current user's orders with items
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request);
    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? "Not authenticated" }, { status: 401 });
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (err) {
    console.error("Error in orders GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
