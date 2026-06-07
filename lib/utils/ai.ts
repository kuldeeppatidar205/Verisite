import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export async function generateReviewSummary(reviews: Array<{
  rating: number;
  wifiRating?: number;
  foodRating?: number;
  securityRating?: number;
  behaviorRating?: number;
  backupRating?: number;
  responsivenessRating?: number;
  comment?: string;
}>) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('AI Summary Error: GEMINI_API_KEY is missing');
      return null;
    }

    if (!genAI) {
      genAI = new GoogleGenerativeAI(apiKey);
    }

    if (!reviews || reviews.length === 0) return null;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const reviewsText = reviews.map((r, i) => `Review ${i + 1}:
    Overall: ${r.rating}/5
    Wi-Fi: ${r.wifiRating || 'N/A'}/5
    Food: ${r.foodRating || 'N/A'}/5
    Security: ${r.securityRating || 'N/A'}/5
    Owner Behavior: ${r.behaviorRating || 'N/A'}/5
    Power/Water Backup: ${r.backupRating || 'N/A'}/5
    Management Responsiveness: ${r.responsivenessRating || 'N/A'}/5
    Comment: ${r.comment || 'N/A'}`).join('\n\n');

    const prompt = `You are an AI assistant for a student housing platform. Analyze the following reviews for a specific housing listing and provide a concise, unified summary (max 3 sentences) of the overall student sentiment. 
    Highlight key strengths and common complaints if any.
    Make it sound natural and descriptive. Do not use bullet points or list individual reviews.
    
    Reviews:
    ${reviewsText}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI Summary Error:', error);
    return null;
  }
}
