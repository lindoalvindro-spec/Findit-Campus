const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail SMTP Transporter (Port 587/TLS for cloud hosting like Render/Vercel)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Mengirim email reset password ke pengguna via Gmail SMTP
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} fullName - Nama lengkap pengguna
 * @param {string} resetLink - Link halaman reset password (berisi token)
 */
const sendResetPasswordEmail = async (toEmail, fullName, resetLink) => {
  const mailOptions = {
    from: `"SiTemu - Sistem Temuan Kampus" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Reset Kata Sandi Akun SiTemu Anda',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
                      🔍 SiTemu
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
                      Sistem Temuan Barang Kampus
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1E3A8A; margin: 0 0 8px; font-size: 20px;">
                      Halo, ${fullName || 'Pengguna'}! 👋
                    </h2>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                      Kami menerima permintaan untuk mengatur ulang kata sandi akun SiTemu Anda. 
                      Klik tombol di bawah ini untuk membuat kata sandi baru:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0 32px;">
                          <a href="${resetLink}" 
                             style="display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(30, 58, 138, 0.35);">
                            🔐 Atur Ulang Kata Sandi
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning -->
                    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      <p style="color: #92400E; font-size: 13px; margin: 0; line-height: 1.5;">
                        ⏱️ <strong>Link ini akan kedaluwarsa dalam 15 menit.</strong><br>
                        Jika Anda tidak meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
                      </p>
                    </div>

                    <!-- Fallback Link -->
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                      Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:<br>
                      <a href="${resetLink}" style="color: #2563EB; word-break: break-all; font-size: 11px;">${resetLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                      Email ini dikirim secara otomatis oleh sistem SiTemu.<br>
                      Mohon tidak membalas email ini.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 12px 0 0;">
                      © 2026 SiTemu — Sistem Temuan Kampus
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Reset password email sent to:', toEmail, '| Message ID:', info.messageId);
  return info;
};

module.exports = { sendResetPasswordEmail };
