'use server';

import { geminiClient } from '@/lib/gemini/client';
import {
  HarmCategory,
  HarmBlockThreshold,
  type Content,
  type Part,
  FunctionCallingMode,
  FunctionDeclaration,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.0-flash';
const STOCK_API_ENDPOINT = 'http://0.0.0.0:8000/get_report';

/* ---------- Types ---------- */
interface SimpleHistoryMessage {
  role: 'user' | 'model';
  content: Array<{ text: string }>;
}

export interface GenerateChatInput {
  prompt: string;
  history: SimpleHistoryMessage[];
}

export interface GenerateChatOutput {
  response?: string;
  error?: string;
}

/* ---------- Helpers ---------- */
function mapHistoryToGeminiContent(history: SimpleHistoryMessage[]): Content[] {
  return history
    .filter((m) => m.role === 'user' || m.role === 'model')
    .map((m): Content => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: m.content.map<Part>((p) => ({ text: p.text })),
    }));
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function withRetry<T>(
  op: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1_000,
): Promise<T> {
  let tries = 0;
  let lastErr: unknown;

  while (tries < maxRetries) {
    try {
      return await op();
    } catch (err: any) {
      lastErr = err;

      if (err?.message?.includes('429')) {
        const retryMatch = err.message.match(/retryDelay":"(\d+)s"/);
        const wait =
          retryMatch != null
            ? Number(retryMatch[1]) * 1_000
            : initialDelay * 2 ** tries;

        console.warn(`Rate-limit hit, retrying in ${wait / 1_000}s…`);
        await delay(wait);
        tries += 1;
        continue;
      }

      throw err;
    }
  }
  throw lastErr;
}

async function StockMarketData(query: string): Promise<string> {
    try {
      const res = await fetch(STOCK_API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({"query": query }),
      });
  
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} – ${res.statusText}`);
      }
  
      // Expecting JSON – adapt if your API returns something else
      const data = await res.json();
  
      /* Shape-agnostic stringify – adjust to your API’s exact schema */
      return (
        data.report
      );
    } catch (err: any) {
      console.error('Stock-API error:', err);
      return `⚠️ Could not fetch market data (${err.message ?? 'unknown error'}).`;
    }
  }

/* ---------- Main entry ---------- */
export async function generateGeminiChatMessage(
  input: GenerateChatInput,
): Promise<GenerateChatOutput> {
  if (!geminiClient) {
    return {
      error:
        'Gemini client not initialised. Check GOOGLE_GENAI_API_KEY or server logs.',
    };
  }

  const generationConfig = { temperature: 1 };

  const financeAndStockMarketData: FunctionDeclaration = {
    name: 'financeAndStockMarketData',
    description:
      'Get realtime stock-market data and general financial information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Free-text query describing the required information.',
        },
      },
      required: ['query'],
    },
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  try {
    const contents: Content[] = [
      ...mapHistoryToGeminiContent(input.history),
      { role: 'user', parts: [{ text: input.prompt }] },
    ];

    const model = geminiClient.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig,
      safetySettings,
      tools: [
      //   {
      //   googleSearch: {}
      // },
      {
        functionDeclarations: [financeAndStockMarketData] 
      }
      ],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    });

    const result = await withRetry(() => model.generateContent({ contents }));

    // console.log('Gemini response:', result.response.functionCalls()[0].name);
    /* ----- Handle tool calls if any ----- */
    const functionCalls: any =
      (result as any)?.response?.functionCalls ??
      (result as any)?.functionCalls ??
      [];

    if (functionCalls()?.length) {
      console.log('Tool call requested:', functionCalls);
      if (functionCalls()?.[0]?.name === 'financeAndStockMarketData') {
        const query = functionCalls()?.[0]?.arguments?.query;
        const response = await StockMarketData(query);
        return { response };
      }
      return {
        response:
          'Sorry, I could not process the tool call.',
      };
    }

    /* ----- Extract plain-text reply ----- */
    const responseText: string | undefined =
      (result as any)?.response?.text?.() ??
      (typeof (result as any).text === 'function'
        ? (result as any).text()
        : undefined);

    if (!responseText) {
      const block =
        (result as any)?.response?.promptFeedback?.blockReason ??
        (result as any)?.promptFeedback?.blockReason;
      return block
        ? {
            error: `Sorry, your request was blocked by safety filters (${block}).`,
          }
        : { error: 'AI generated an empty response.' };
    }

    return { response: responseText };
  } catch (err: any) {
    console.error('Gemini API error:', err);

    let friendly =
      "Sorry, I couldn't generate a response due to an internal error.";

    if (typeof err?.message === 'string') {
      const msg = err.message;

      if (msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED'))
        friendly =
          'AI service configuration error (invalid API key or permission denied).';
      else if (msg.includes('quota') || err.status === 429)
        friendly = 'AI request limit reached. Please try again later.';
      else if (msg.includes('UnsupportedUserLocation'))
        friendly = 'AI service is not available in your region.';
      else if (msg.includes('Invalid model name') || err.status === 404)
        friendly = `Configured model (${MODEL_NAME}) not found.`;
      else if (msg.includes('Invalid'))
        friendly = `Invalid request sent to AI service.`;
      else if (JSON.stringify(err).includes('SAFETY'))
        friendly =
          'Sorry, your request or the response was blocked by safety filters.';
    }

    return { error: friendly };
  }
}
