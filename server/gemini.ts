import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const rawKey = (process.env.GEMINI_API_KEY || '').trim();
const isValidKey = Boolean(rawKey && rawKey !== 'MY_GEMINI_API_KEY' && !rawKey.startsWith('MY_'));

let aiClient: GoogleGenAI | null = null;
if (isValidKey) {
  aiClient = new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function getGeminiClient(): GoogleGenAI | null {
  return aiClient;
}

export const GEMINI_MODEL = 'gemini-3.8-flash';

export async function generateAiContentWithTimeout(prompt: string, timeoutMs = 6000): Promise<string> {
  const client = getGeminiClient();
  if (!client) return '';

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error('AI call timeout')), timeoutMs);
  });

  const generatePromise = client.models
    .generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    })
    .then((res) => res.text || '');

  return Promise.race([generatePromise, timeoutPromise]);
}
