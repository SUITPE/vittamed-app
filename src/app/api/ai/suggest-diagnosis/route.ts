/**
 * API: POST /api/ai/suggest-diagnosis
 * TASK: VT-232
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAIClient, getDefaultProvider } from '@/lib/ai';
import type { AIProvider } from '@/types/nlp';

const Schema = z.object({
  symptoms: z.array(z.string().min(1)).min(1),
  clinicalText: z.string().optional(),
  patientContext: z.object({
    age: z.number().optional(),
    gender: z.enum(['M', 'F', 'other']).optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic', 'deepseek']).optional(),
  maxSuggestions: z.number().min(1).max(10).default(5),
});

const PROMPT = `Sugiere diagnósticos para los síntomas dados. Responde JSON:
{"suggestions":[{"diagnosis":"...","icd10Code":"X00","confidence":"low|medium|high","reasoning":"..."}]}`;

const DISCLAIMER = `AVISO: Sugerencias orientativas. Requieren validación médica profesional.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const v = Schema.safeParse(body);
    if (!v.success) return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });

    const { symptoms, clinicalText, patientContext, provider, maxSuggestions } = v.data;
    const p: AIProvider = provider || getDefaultProvider() || 'openai';
    const keys: Record<AIProvider, string> = { openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', deepseek: 'DEEPSEEK_API_KEY' };
    if (!process.env[keys[p]]) return NextResponse.json({ success: false, error: `${p} not configured` }, { status: 503 });

    const ai = createAIClient(p);
    let prompt = `Síntomas: ${symptoms.join(', ')}`;
    if (clinicalText) prompt += `\nTexto: ${clinicalText}`;
    if (patientContext?.age) prompt += `\nEdad: ${patientContext.age}`;

    const resContent = await ai.complete(prompt, PROMPT);
    let parsed;
    try {
      let json = resContent;
      const m = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) json = m[1];
      parsed = JSON.parse(json.trim());
    } catch { return NextResponse.json({ success: false, error: 'Parse error' }, { status: 500 }); }

    const suggestions = await Promise.all((parsed.suggestions || []).slice(0, maxSuggestions).map(async (s: { diagnosis: string; icd10Code?: string; confidence: string; reasoning: string }) => {
      let desc = null;
      if (s.icd10Code) {
        const { data } = await supabase.from('icd10_codes').select('description').eq('code', s.icd10Code.toUpperCase()).single();
        if (data) desc = data.description;
      }
      return { ...s, icd10Description: desc, confidenceScore: s.confidence === 'high' ? 0.85 : s.confidence === 'medium' ? 0.65 : 0.4 };
    }));

    return NextResponse.json({ success: true, data: { suggestions, disclaimer: DISCLAIMER, provider: p, processingTime: Date.now() - startTime } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
