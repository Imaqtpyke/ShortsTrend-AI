import { TrendAnalysis, ContentIdea, ScriptCritique, CustomCharacter, BrandProfile } from "../types";

// B5 FIX: Never hardcode localhost. In production this must be the deployed server URL.
// Set VITE_API_BASE_URL in your deployment environment (Vercel, Netlify, etc.).
// Falls back to localhost:3001 for local development only.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

// B2 FIX: Client-side retries are DISABLED (retries = 0 default).
// The server already retries up to 3 times internally for each Gemini call.
// Having BOTH client and server retry independently caused a worst-case of
// 27 Gemini API calls per single user action (3 client × 3 server × 3 Gemini).
// The server is the single source of retry truth. The client propagates errors immediately.
async function fetchFromBackend<T>(endpoint: string, body: any, options?: { signal?: AbortSignal }, retries = 0, delay = 1000): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(errorData.error || "AI Rate Limit Reached: The AI brain is currently cooling down from too many requests. Please wait about 30-60 seconds before trying again.");
      }
      
      const isClientError = response.status >= 400 && response.status < 500;
      const err = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (err as any).status = response.status;
      (err as any).isClientError = isClientError;
      throw err;
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    // BUG FIX #7 cont: Skip retry for client errors (4xx) — retrying won't help.
    if (retries > 0 && !error.message?.includes('API overload') && !error.isClientError) {
      console.warn(`API call to ${endpoint} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchFromBackend<T>(endpoint, body, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Optional character param — when provided, the server injects it into AI prompts
// for generate, improve, and critique endpoints.

export async function critiqueScript(
  script: string,
  hook: string,
  character?: CustomCharacter,
  brand?: BrandProfile,
  platform?: string,
  persona?: string,
  options?: { signal?: AbortSignal }
): Promise<ScriptCritique> {
  return fetchFromBackend<ScriptCritique>("/critique", { script, hook, character, brand, platform, persona }, options);
}

export async function generateImprovement(
  script: string,
  critique: string,
  visualStyle: string,
  visualGenerationType: 'image' | 'video' | 'image-to-video',
  segmentLength?: number,
  totalDuration = 60,
  character?: CustomCharacter,
  brand?: BrandProfile,
  persona?: string,
  platform?: string,
  expectedSegments?: number,
  options?: { signal?: AbortSignal }
): Promise<Partial<ScriptCritique>> {
  return fetchFromBackend<Partial<ScriptCritique>>("/improve", {
    script, critique, visualStyle, visualGenerationType, segmentLength, totalDuration, character, brand, persona, platform, expectedSegments
  }, options);
}

export async function analyzeTrends(
  niche?: string,
  bypassCache?: boolean,
  platform?: string,
  options?: { signal?: AbortSignal }
): Promise<TrendAnalysis> {
  return fetchFromBackend<TrendAnalysis>("/analyze", { niche, bypassCache, platform }, options);
}

export async function analyzeUrl(url: string, platform?: string, options?: { signal?: AbortSignal }): Promise<TrendAnalysis> {
  return fetchFromBackend<TrendAnalysis>("/analyze-url", { url, platform }, options);
}

export async function generateContentIdea(
  trend: string,
  visualStyle: string,
  visualGenerationType: 'image' | 'video' | 'image-to-video',
  segmentLength?: number,
  totalDuration = 60,
  character?: CustomCharacter,
  brand?: BrandProfile,
  genre?: string,
  persona?: string,
  platform?: string,
  customGenre?: string,
  variationId?: string,

  onProgress?: (partial: Partial<ContentIdea>) => void,
  options?: { signal?: AbortSignal }
): Promise<ContentIdea> {
  const result = await fetchFromBackend<ContentIdea>("/generate", {
    trend, visualStyle, visualGenerationType, segmentLength, totalDuration, character, brand, genre, persona, platform, customGenre, variationId
  }, options);

  if (onProgress) {
    onProgress(result);
  }

  return result;
}

