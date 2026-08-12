import nodemailer from "nodemailer";

/**
 * Admin sipariş bildirim maili — SUNUCU-ONLY.
 *
 * Eskiden /api/notify-order public HTTP endpoint'iydi: kimlik doğrulaması yoktu,
 * herkes sahte "yeni sipariş" maili tetikleyebilirdi (ve pratikte hiçbir yerden
 * çağrılmadığı için gerçek siparişlerde hiç çalışmıyordu).
 *
 * Artık yalnızca doğrulanmış PayTR SUCCESS webhook'undan çağrılır.
 *
 * ⚠️ Bu modül SADECE sunucu tarafından import edilmelidir (route handler / server action).
 *    nodemailer ve GMAIL_* gizli değerleri kullanır; bir client component'ten
 *    import edilirse build hatası alınır ve alınmalıdır.
 */

const formatPrice = (n: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(n);

export interface NotifyItem {
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
}

export interface NotifyCustomer {
  name: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  city?: string | null;
  district?: string | null;
}

export interface PaidOrderNotification {
  orderId: string;
  customerInfo: NotifyCustomer;
  items: NotifyItem[];
  total: number;
  paidAt: Date;
  paymentType?: string | null;
  currency?: string | null;
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHtml(o: PaidOrderNotification): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paidAtStr = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(o.paidAt);

  const itemRows = o.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:10px 0;color:#18181b;font-size:14px;">${esc(item.name)}${item.color ? ` — ${esc(item.color)}` : ""}${item.size ? ` / ${esc(item.size)}` : ""}</td>
        <td style="padding:10px 0;text-align:center;color:#71717a;font-size:14px;">${item.quantity}</td>
        <td style="padding:10px 0;text-align:right;color:#18181b;font-weight:600;font-size:14px;">₺${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">

    <div style="background:#18181b;padding:28px 36px;">
      <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Decoroys<span style="color:#3b82f6;">.</span></span>
      <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">Ödemesi Onaylanmış Sipariş Bildirimi</p>
      <div style="background:#27272a;border-radius:10px;padding:10px 16px;margin-top:16px;">
        <p style="color:#71717a;font-size:10px;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Sipariş No / merchant_oid</p>
        <p style="color:#fff;font-size:13px;font-family:monospace;font-weight:700;margin:0;">${esc(o.orderId)}</p>
      </div>
    </div>

    <div style="padding:32px 36px;">

      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;color:#047857;font-size:15px;font-weight:700;">✅ ÖDEME ONAYLANDI — PayTR</p>
        <p style="margin:6px 0 0;color:#059669;font-size:13px;">Tahsil edilen: <strong>₺${formatPrice(o.total)}</strong>${o.currency ? ` ${esc(o.currency)}` : ""}</p>
        <p style="margin:2px 0 0;color:#059669;font-size:13px;">Ödeme tarihi: <strong>${esc(paidAtStr)}</strong></p>
        ${o.paymentType ? `<p style="margin:2px 0 0;color:#059669;font-size:13px;">Ödeme tipi: <strong>${esc(o.paymentType)}</strong></p>` : ""}
      </div>

      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:0 0 12px;">Müşteri Bilgileri</h2>
      <div style="background:#fafafa;border-radius:10px;padding:16px 20px;margin-bottom:24px;font-size:14px;color:#3f3f46;line-height:1.8;">
        <p style="margin:0;font-weight:600;color:#18181b;">${esc(o.customerInfo.name)}</p>
        ${o.customerInfo.phone ? `<p style="margin:0;">${esc(o.customerInfo.phone)}</p>` : ""}
        ${o.customerInfo.email ? `<p style="margin:0;">${esc(o.customerInfo.email)}</p>` : ""}
        <p style="margin:8px 0 0;color:#52525b;">${esc(o.customerInfo.address)}${o.customerInfo.district ? `, ${esc(o.customerInfo.district)}` : ""}${o.customerInfo.city ? `, ${esc(o.customerInfo.city)}` : ""}</p>
      </div>

      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:0 0 12px;">Sipariş Kalemleri</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #f4f4f5;">
            <th style="padding:8px 0;text-align:left;font-size:12px;color:#a1a1aa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Ürün</th>
            <th style="padding:8px 0;text-align:center;font-size:12px;color:#a1a1aa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Adet</th>
            <th style="padding:8px 0;text-align:right;font-size:12px;color:#a1a1aa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Tutar</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:16px 0 0;font-size:15px;font-weight:700;color:#18181b;">Toplam</td>
            <td style="padding:16px 0 0;text-align:right;font-size:18px;font-weight:800;color:#18181b;">₺${formatPrice(o.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:32px;text-align:center;">
        <a href="${esc(appUrl)}/admin/siparisler" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:.3px;">
          Admin Paneline Git →
        </a>
      </div>

    </div>

    <div style="padding:20px 36px;border-top:1px solid #f4f4f5;text-align:center;">
      <p style="margin:0;font-size:12px;color:#a1a1aa;">decoroys.com — Yönetim Bildirimi</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Ödemesi onaylanmış sipariş için admin bildirimi gönderir.
 * ASLA throw etmez — mail hatası ödeme gerçeğini bozmamalıdır.
 */
export async function sendPaidOrderNotification(
  o: PaidOrderNotification
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

  if (!gmailUser || !gmailPass || !adminEmail) {
    return { ok: false, error: "Mail ortam değişkenleri eksik (GMAIL_USER / GMAIL_APP_PASSWORD / ADMIN_NOTIFY_EMAIL)" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Decoroys Sipariş" <${gmailUser}>`,
      to: adminEmail,
      subject: `✅ Yeni ÖDENMİŞ Sipariş — ₺${formatPrice(o.total)} — ${o.customerInfo.name}`,
      html: buildHtml(o),
    });

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen mail hatası" };
  }
}
