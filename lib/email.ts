import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️ Gmail credentials not configured. Email not sent.');
    if (process.env.NODE_ENV === 'development') {
      console.warn('📧 To: ' + options.to);
      console.warn('📝 Subject: ' + options.subject);
      const otpMatch = options.html.match(/letter-spacing:\s*6px;[^>]*>([^<]+)<\/span>/);
      if (otpMatch) {
        console.warn('🔑 OTP Code: ' + otpMatch[1].trim());
      } else {
        const urlMatch = options.html.match(/href="([^"]+)"/);
        if (urlMatch) {
          console.warn('🔗 Link: ' + urlMatch[1]);
        }
      }
    }
    return false;
  }


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Verisite" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Email send failed:', errorMessage);
    if (process.env.NODE_ENV === 'development') {
      console.error('📧 Failed to send to:', options.to);
      const otpMatch = options.html.match(/letter-spacing:\s*6px;[^>]*>([^<]+)<\/span>/);
      if (otpMatch) {
        console.error('🔑 OTP Code:', otpMatch[1].trim());
      } else {
        const urlMatch = options.html.match(/href="([^"]+)"/);
        if (urlMatch) {
          console.error('🔗 Manual Link:', urlMatch[1]);
        }
      }
    }
    console.error('💡 Check Gmail credentials in .env.local');
    return false;
  }
}

export function generateVerificationEmailHtml(otp: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef2f3;">
          <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Verisite</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 600;">Verify Your Email Address</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Hi ${userName},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Thank you for joining Verisite! To complete your verification, please use the following One-Time Password (OTP):</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; display: inline-block;">${otp}</span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">This OTP is valid for 15 minutes. Please do not share this code with anyone.</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 0;">Best regards,<br/><strong>Verisite Team</strong></p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This email was sent to verify your Verisite account. If you did not request this code, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateResetPasswordEmailHtml(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Reset Password - Verisite</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password.</p>
        <p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link: <code>${resetUrl}</code></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br/>Verisite Team</p>
      </body>
    </html>
  `;
}
