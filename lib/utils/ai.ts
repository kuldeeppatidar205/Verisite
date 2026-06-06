import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function generateReviewSummary(ratings: {
  rating: number;
  wifiRating?: number;
  foodRating?: number;
  securityRating?: number;
  behaviorRating?: number;
  backupRating?: number;
  responsivenessRating?: number;
}) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Summarize these student housing ratings into a single concise paragraph (max 2 sentences). 
    Scale is 1 to 5.
    Overall: ${ratings.rating}/5
    Wi-Fi: ${ratings.wifiRating || 'N/A'}/5
    Food: ${ratings.foodRating || 'N/A'}/5
    Security: ${ratings.securityRating || 'N/A'}/5
    Owner Behavior: ${ratings.behaviorRating || 'N/A'}/5
    Power/Water Backup: ${ratings.backupRating || 'N/A'}/5
    Management Responsiveness: ${ratings.responsivenessRating || 'N/A'}/5
    
    Make it sound natural and descriptive. Do not use bullet points.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI Summary Error:', error);
    return null;
  }
}
