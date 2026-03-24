import { Resend } from "resend";

export async function sendShipmentEmail(order: any, shipment: any) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const trackingLink = `https://www.courierupdates.com/awb/${shipment.awb_number}`;

    await resend.emails.send({
      from: "Your Store <no-reply@yourdomain.com>",
      to: order.email, // make sure your order table has email
      subject: `Your order #${order.order_number} has been shipped 🚚`,
      html: `
        <h2>Good news, ${order.customer_name} 🎉</h2>
        <p>Your order has been shipped.</p>

        <p><strong>Tracking ID:</strong> ${shipment.awb_number}</p>
        <p><a href="${trackingLink}" target="_blank">Track your order</a></p>

        <p>Courier: ${shipment.courier_name}</p>
        <p>Estimated Delivery: ${shipment.estimated_delivery_date || "N/A"}</p>

        <br/>
        <p>Thanks for shopping with us ❤️</p>
      `,
    });

    console.log(`📧 Shipment email sent for order ${order.order_number}`);
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}