import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client server-side
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

    // Initialize the model with the latest supported version and system instructions
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: "You are the Verisite AI Assistant. You help students and PG owners navigate the Verisite platform. Verisite is a student hostel and PG management platform where students can find PGs, hand over their rooms to other students, and leave anonymous reviews. Be helpful, concise, and friendly."
    });

    // Format history for Gemini API (filtering out the initial model greeting if present)
    const formattedHistory = messages
      .filter((m, i) => !(i === 0 && m.role === 'model'))
      .slice(0, -1)
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    const currentMessage = messages[messages.length - 1].content;

    // Start a chat session with the formatted history
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(currentMessage);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
