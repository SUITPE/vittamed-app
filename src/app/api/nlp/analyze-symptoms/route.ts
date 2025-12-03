/**
 * API Route: POST /api/nlp/analyze-symptoms
 *
 * Análisis de síntomas usando AI (OpenAI, Anthropic, DeepSeek)
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 *
 * Request body:
 * {
 *   text: string,              // Texto a analizar (requerido)
 *   patientContext?: {         // Contexto del paciente (opcional)
 *     age?: number,
 *     gender?: 'M' | 'F' | 'other',
 *     knownConditions?: string[],
 *     currentMedications?: string[],
 *     allergies?: string[]
 *   },
 *   provider?: 'openai' | 'anthropic' | 'deepseek',  // Proveedor (opcional)
 *   includeDiagnosisSuggestions?: boolean,           // Incluir sugerencias (opcional)
 *   language?: 'es' | 'en'                           // Idioma (default: 'es')
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     symptoms: [...],
 *     suggestedDiagnoses?: [...],
 *     medications?: [...],
 *     bodyParts?: [...],
 *     vitalSigns?: [...],
 *     summary?: string,
 *     urgencyLevel?: 'low' | 'medium' | 'high' | 'critical',
 *     provider: string,
 *     model: string,
 *     processingTime: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAIClient, getDefaultProvider, MEDICAL_SYSTEM_PROMPTS } from '@/lib/ai';
import type {
  AIProvider,
  SymptomAnalysisResult,
  MedicalEntity,
  AnalyzeSymptomsResponse,
} from '@/types/nlp';

// Schema de validación con Zod
const AnalyzeSymptomsSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  patientContext: z
    .object({
      age: z.number().min(0).max(150).optional(),
      gender: z.enum(['M', 'F', 'other']).optional(),
      knownConditions: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
    })
    .optional(),
  provider: z.enum(['openai', 'anthropic', 'deepseek']).optional(),
  includeDiagnosisSuggestions: z.boolean().optional().default(false),
  language: z.enum(['es', 'en']).optional().default('es'),
});

// Schema para parsear respuesta JSON del modelo
const AIResponseSchema = z.object({
  symptoms: z.array(
    z.object({
      value: z.string(),
      severity: z.enum(['leve', 'moderado', 'severo']).optional(),
      duration: z.string().optional(),
    })
  ).optional().default([]),
  medications: z.array(
    z.object({
      value: z.string(),
      dosage: z.string().optional(),
    })
  ).optional().default([]),
  bodyParts: z.array(z.string()).optional().default([]),
  vitalSigns: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    })
  ).optional().default([]),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  summary: z.string().optional(),
  suggestedDiagnoses: z.array(
    z.object({
      diagnosis: z.string(),
      icd10: z.string().optional(),
      confidence: z.enum(['low', 'medium', 'high']).optional(),
      reasoning: z.string().optional(),
    })
  ).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeSymptomsResponse>> {
  const startTime = Date.now();

  try {
    // 1. Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parsear y validar body
    const body = await request.json();
    const validationResult = AnalyzeSymptomsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        } as AnalyzeSymptomsResponse & { details: unknown },
        { status: 400 }
      );
    }

    const { text, patientContext, provider, includeDiagnosisSuggestions, language } =
      validationResult.data;

    // 3. Determinar proveedor AI
    const selectedProvider: AIProvider = provider || getDefaultProvider() || 'openai';

    // 4. Verificar que el proveedor esté configurado
    const envKeyMap: Record<AIProvider, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
    };

    if (!process.env[envKeyMap[selectedProvider]]) {
      return NextResponse.json(
        {
          success: false,
          error: `${selectedProvider} API key not configured`,
        },
        { status: 503 }
      );
    }

    // 5. Crear cliente AI
    const aiClient = createAIClient(selectedProvider);

    // 6. Construir prompt
    let systemPrompt = MEDICAL_SYSTEM_PROMPTS.symptomAnalysis;

    if (includeDiagnosisSuggestions) {
      systemPrompt += '\n\n' + MEDICAL_SYSTEM_PROMPTS.diagnosisSuggestion;
    }

    let userPrompt = `Analiza el siguiente texto clínico y extrae la información médica estructurada:\n\n"${text}"`;

    if (patientContext) {
      userPrompt += '\n\nContexto del paciente:';
      if (patientContext.age) userPrompt += `\n- Edad: ${patientContext.age} años`;
      if (patientContext.gender) {
        const genderMap = { M: 'Masculino', F: 'Femenino', other: 'Otro' };
        userPrompt += `\n- Género: ${genderMap[patientContext.gender]}`;
      }
      if (patientContext.knownConditions?.length) {
        userPrompt += `\n- Condiciones conocidas: ${patientContext.knownConditions.join(', ')}`;
      }
      if (patientContext.currentMedications?.length) {
        userPrompt += `\n- Medicamentos actuales: ${patientContext.currentMedications.join(', ')}`;
      }
      if (patientContext.allergies?.length) {
        userPrompt += `\n- Alergias: ${patientContext.allergies.join(', ')}`;
      }
    }

    userPrompt += '\n\nResponde SOLO con JSON válido.';

    // 7. Llamar al modelo AI
    const aiResponse = await aiClient.complete(userPrompt, systemPrompt);

    // 8. Parsear respuesta JSON
    let parsedResponse;
    try {
      // Extraer JSON de la respuesta (puede venir envuelto en markdown)
      let jsonString = aiResponse.content;
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      const rawJson = JSON.parse(jsonString.trim());
      parsedResponse = AIResponseSchema.parse(rawJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', aiResponse.content);

      // Retornar respuesta parcial
      return NextResponse.json({
        success: true,
        data: {
          symptoms: [],
          summary: aiResponse.content,
          provider: selectedProvider,
          model: aiResponse.model,
          processingTime: Date.now() - startTime,
        },
      });
    }

    // 9. Transformar a formato de respuesta
    const severityMap: Record<string, MedicalEntity['type']> = {
      leve: 'symptom',
      moderado: 'symptom',
      severo: 'symptom',
    };

    const result: SymptomAnalysisResult = {
      symptoms: parsedResponse.symptoms.map((s) => ({
        type: 'symptom' as const,
        value: s.value,
        confidence: s.severity === 'severo' ? 0.9 : s.severity === 'moderado' ? 0.7 : 0.5,
      })),
      medications: parsedResponse.medications.map((m) => ({
        type: 'medication' as const,
        value: m.value,
        normalizedValue: m.dosage,
        confidence: 0.8,
      })),
      bodyParts: parsedResponse.bodyParts.map((bp) => ({
        type: 'body_part' as const,
        value: bp,
        confidence: 0.8,
      })),
      vitalSigns: parsedResponse.vitalSigns.map((vs) => ({
        type: 'vital_sign' as const,
        value: `${vs.type}: ${vs.value}`,
        confidence: 0.9,
      })),
      summary: parsedResponse.summary,
      urgencyLevel: parsedResponse.urgencyLevel,
      provider: selectedProvider,
      model: aiResponse.model,
      processingTime: Date.now() - startTime,
    };

    if (includeDiagnosisSuggestions && parsedResponse.suggestedDiagnoses) {
      result.suggestedDiagnoses = parsedResponse.suggestedDiagnoses.map((d) => ({
        type: 'diagnosis' as const,
        value: d.diagnosis,
        icd10Code: d.icd10,
        confidence: d.confidence === 'high' ? 0.9 : d.confidence === 'medium' ? 0.7 : 0.5,
      }));
    }

    // 10. Retornar resultado
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[NLP Analyze] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nlp/analyze-symptoms
 *
 * Retorna información sobre proveedores disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers: { provider: AIProvider; configured: boolean; model: string }[] = [
      {
        provider: 'openai',
        configured: Boolean(process.env.OPENAI_API_KEY),
        model: 'gpt-4o',
      },
      {
        provider: 'anthropic',
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
        model: 'claude-3-5-sonnet-20241022',
      },
      {
        provider: 'deepseek',
        configured: Boolean(process.env.DEEPSEEK_API_KEY),
        model: 'deepseek-chat',
      },
    ];

    const defaultProvider = getDefaultProvider();

    return NextResponse.json({
      providers,
      defaultProvider,
      configuredCount: providers.filter((p) => p.configured).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
