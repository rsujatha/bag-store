module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerName, customerEmail, customerPhone, customerAddress, items, total, orderId } = req.body;

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.size}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">₹${Number(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #4A2B4D; font-size: 24px; margin-bottom: 4px;">KASVI</h1>
      <p style="color: #888; font-size: 13px; margin-bottom: 32px; letter-spacing: 2px;">NEW ORDER RECEIVED</p>

      <div style="background: #fafaf5; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Customer Details</p>
        <p style="margin: 4px 0;"><strong>Name:</strong> ${customerName}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${customerEmail || '—'}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${customerPhone}</p>
        <p style="margin: 4px 0;"><strong>Address:</strong> ${customerAddress}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Order Items</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f5f5f0;">
              <th style="padding: 8px 12px; text-align: left;">Product</th>
              <th style="padding: 8px 12px; text-align: left;">Size</th>
              <th style="padding: 8px 12px; text-align: left;">Qty</th>
              <th style="padding: 8px 12px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="text-align: right; font-size: 18px; font-weight: 700; color: #4A2B4D; margin-bottom: 24px;">
        Total: ₹${Number(total).toLocaleString('en-IN')}
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 16px;">
        <p style="font-size: 12px; color: #999;">Order ID: ${orderId}</p>
        <p style="font-size: 12px; color: #999;">Manage this order at <a href="https://kasvibags.vercel.app/#admin" style="color: #4A2B4D;">kasvibags.vercel.app/#admin</a></p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: process.env.NOTIFY_EMAIL,
        subject: `New Order — ₹${Number(total).toLocaleString('en-IN')} from ${customerName}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();
    if (data.id) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: data });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
