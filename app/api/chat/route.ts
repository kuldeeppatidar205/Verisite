import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// We initialize it inside the handler to ensure env vars are loaded, 
// but it's safe to do it globally if env vars are static.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: "You are the PurePG AI Assistant. You help students and PG owners navigate the PurePG platform. PurePG is a student hostel and PG management platform where students can find PGs, hand over their rooms to other students, and leave anonymous reviews. Be helpful, concise, and friendly."
    });

    // Format history for Gemini API
    const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const currentMessage = messages[messages.length - 1].content;

    // Start a chat session with the formatted history
    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(currentMessage);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    require('fs').writeFileSync('error.log', error.stack || error.toString());
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
