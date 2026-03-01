import { TrendAnalysis, ContentIdea, ProductionWorkflow, ScriptCritique, ScriptSegment } from "../types";
import { parse } from 'partial-json';

const API_BASE_URL = "http://localhost:3001/api";

async function fetchFromBackend<T>(endpoint: string, body: any, retries = 3, delay = 1000): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(errorData.error || "API overload. Please wait a minute, the Google model is busy.");
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (retries > 0 && !error.message?.includes('API overload')) {
      console.warn(`API call to ${endpoint} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchFromBackend<T>(endpoint, body, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function critiqueScript(script: string, hook: string): Promise<ScriptCritique> {
  return fetchFromBackend<ScriptCritique>("/critique", { script, hook });
}

export async function generateImprovement(script: string, critique: string, visualStyle: string, visualGenerationType: 'image' | 'video', videoDuration?: number): Promise<Partial<ScriptCritique>> {
  return fetchFromBackend<Partial<ScriptCritique>>("/improve", { script, critique, visualStyle, visualGenerationType, videoDuration });
}

export async function analyzeTrends(niche?: string): Promise<TrendAnalysis> {
  return fetchFromBackend<TrendAnalysis>("/analyze", { niche });
}

export async function generateContentIdea(
  trend: string,
  visualStyle: string,
  visualGenerationType: 'image' | 'video',
  videoDuration?: number,
  onProgress?: (partial: Partial<ContentIdea>) => void
): Promise<ContentIdea> {
  const result = await fetchFromBackend<ContentIdea>("/generate", { trend, visualStyle, visualGenerationType, videoDuration });

  if (onProgress) {
    onProgress(result);
  }

  return result;
}

export async function getWorkflow(): Promise<ProductionWorkflow> {
  return fetchFromBackend<ProductionWorkflow>("/workflow", {});
}
