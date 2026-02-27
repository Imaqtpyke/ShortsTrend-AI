import { TrendAnalysis, ContentIdea, ProductionWorkflow, ScriptCritique, ScriptSegment } from "../types";

const API_BASE_URL = "http://localhost:3001/api";

async function fetchFromBackend<T>(endpoint: string, body: any, retries = 3, delay = 1000): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (retries > 0) {
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

export async function generateImprovement(script: string, critique: string, visualStyle: string, visualGenerationType: 'image' | 'video'): Promise<Partial<ScriptCritique>> {
  return fetchFromBackend<Partial<ScriptCritique>>("/improve", { script, critique, visualStyle, visualGenerationType });
}

export async function analyzeTrends(niche?: string): Promise<TrendAnalysis> {
  return fetchFromBackend<TrendAnalysis>("/analyze", { niche });
}

export async function generateContentIdea(trend: string, visualStyle: string, visualGenerationType: 'image' | 'video'): Promise<ContentIdea> {
  return fetchFromBackend<ContentIdea>("/generate", { trend, visualStyle, visualGenerationType });
}

export async function getWorkflow(): Promise<ProductionWorkflow> {
  return fetchFromBackend<ProductionWorkflow>("/workflow", {});
}
