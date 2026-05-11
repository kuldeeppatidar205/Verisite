import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ Gmail credentials not configured. Email not sent.');
    console.warn('📧 To: ' + options.to);
    console.warn('📝 Subject: ' + options.subject);
    const urlMatch = options.html.match(/href="([^"]+)"/);
    if (urlMatch) {
      console.warn('🔗 Verification Link: ' + urlMatch[1]);
    }
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"CampusPass" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Email send failed:', errorMessage);
    console.error('📧 Failed to send to:', options.to);
    console.error('💡 Check Gmail credentials in .env.local');
    return false;
  }
}

export function generateVerificationEmailHtml(verifyUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Email Verification - CampusPass</h2>
        <p>Hi ${userName},</p>
        <p>Welcome to CampusPass! Please verify your email to get started.</p>
        <p>
          <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link: <code>${verifyUrl}</code></p>
        <p>This link expires in 24 hours.</p>
        <p>Best regards,<br/>CampusPass Team</p>
      </body>
    </html>
  `;
}
