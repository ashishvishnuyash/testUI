
// Use the stable SDK import
import {
  GoogleGenerativeAI,
} from '@google/generative-ai';

// Use the correct environment variable name specified in firebase/config.ts (if it's intended to be the same)
// Or define a separate one like GOOGLE_GENAI_API_KEY
// Use the most specific key first if available
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

let geminiClient: GoogleGenerativeAI | null = null;
let initializationGeminiError: string | null = null;

if (!apiKey) {
  initializationGeminiError = "GOOGLE_GENAI_API_KEY or NEXT_PUBLIC_GOOGLE_AI_API_KEY environment variable is not set. Gemini AI features will be unavailable.";
  console.error(`🔴 ERROR: ${initializationGeminiError}`);
} else {
    try {
        // Initialize using the stable SDK class name
        geminiClient = new GoogleGenerativeAI(apiKey);
        // console.log("🟢 [Gemini Client] Initialized successfully using @google/generative-ai.");
    } catch (e: any) {
        initializationGeminiError = `Failed to initialize GoogleGenerativeAI: ${e.message}`;
        console.error(`🔴 ERROR: ${initializationGeminiError}`, e);
        geminiClient = null;
    }
}


// console.log(`[Gemini Client Export] Status: ${initializationGeminiError ? `🔴 Error: ${initializationGeminiError}` : '🟢 Success'}`);
// console.log(`[Gemini Client Export] Exporting client: ${geminiClient ? 'OK' : 'NULL'}`);


// Export the client and any initialization error
export { geminiClient, initializationGeminiError };
