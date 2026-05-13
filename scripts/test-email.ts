import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testEmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('GMAIL_USER:', user ? '✓ Set' : '❌ Not set');
  console.log('GMAIL_APP_PASSWORD:', pass ? '✓ Set (hidden)' : '❌ Not set');

  if (!user || !pass) {
    console.error('\n❌ Gmail credentials are missing!');
    process.exit(1);
  }

  try {
    console.log('\n📧 Attempting to connect to Gmail SMTP...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified!\n');

    // Send test email
    console.log('📨 Sending test email...');
    const result = await transporter.sendMail({
      from: `"PurePG Test" <${user}>`,
      to: user, // Send to same Gmail account for testing
      subject: 'PurePG Email Test',
      html: `
        <h2>Email Verification Test</h2>
        <p>If you received this email, Gmail SMTP is working correctly!</p>
        <p>This is a test from PurePG email verification system.</p>
        <p><strong>Test Status: SUCCESS ✅</strong></p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('📌 Message ID:', result.messageId);
    console.log('\n💡 Check your Gmail inbox (including Spam/Promotions folder)');
    console.log('📧 Email was sent to:', user);
  } catch (error) {
    console.error('\n❌ Error details:');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Code:', (error as any).code);
      console.error('Command:', (error as any).command);
    } else {
      console.error(error);
    }

    console.error('\n💡 Troubleshooting:');
    console.error('1. Is this a Gmail app password? (not regular password)');
    console.error('2. Check https://myaccount.google.com/security');
    console.error('3. Gmail may require "Less secure apps" or app-specific password');
    console.error('4. Check if Gmail is blocking the connection');
  }
}

testEmail();
