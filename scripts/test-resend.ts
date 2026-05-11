import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    console.log('Testing Resend with key:', apiKey.slice(0, 7) + '...');
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['kuldeep.25bcon0852@jecrcu.edu.in'], // User's email from logs
      subject: 'Resend Integration Test - CampusPass',
      html: '<p>If you see this, Resend integration is working!</p>',
    });

    if (error) {
      console.error('Resend API Error:', error);
    } else {
      console.log('Resend Success:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testResend();
