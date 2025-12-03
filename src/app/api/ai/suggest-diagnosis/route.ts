/**
 * API Route: POST /api/ai/suggest-diagnosis
 *
 * Sugerencias de diagnóstico basadas en síntomas usando AI
 * Integra VT-230 (códigos CIE-10) y VT-231 (NLP)
 *
 * TASK: VT-232
 * Epic: Historias Clínicas Inteligentes
 *
 * IMPORTANTE: Las sugerencias son solo orientativas y requieren
 * validación por un profesional médico.
 *
 * Request body:
 * {
 *   symptoms: string[],           // Lista de síntomas (requerido)
 *   clinicalText?: string,        // Texto clínico adicional
 *   patientContext?: {
 *     age?: number,
 *     gender?: 'M' | 'F' | 'other',
 *     knownConditions?: string[],
 *     currentMedications?: string[],
 *     allergies?: string[]
 *   },
 *   provider?: 'openai' | 'anthropic' | 'deepseek',
 *   maxSuggestions?: number       // Default: 5
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAIClient, getDefaultProvider, MEDICAL_SYSTEM_PROMPTS } from '@/lib/ai';
import type { AIProvider } from '@/types/nlp';

// Tipos para las sugerencias
interface DiagnosisSuggestion {
  diagnosis: string;
  icd10Code: string | null;
  icd10Description: string | null;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
  differentialDiagnoses?: string[];
  recommendedTests?: string[];
}

interface SuggestDiagnosisResponse {
  success: boolean;
  data?: {
    suggestions: DiagnosisSuggestion[];
    disclaimer: string;
    provider: AIProvider;
    model: string;
    processingTime: number;
  };
  error?: string;
}

// Schema de validación
const SuggestDiagnosisSchema = z.object({
  symptoms: z.array(z.string().min(1)).min(1, 'At least one symptom required'),
  clinicalText: z.string().optional(),
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
  maxSuggestions: z.number().min(1).max(10).optional().default(5),
});

// Schema para parsear respuesta del modelo
const AIResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      diagnosis: z.string(),
      icd10Code: z.string().optional(),
      confidence: z.enum(['low', 'medium', 'high']),
      reasoning: z.string(),
      differentialDiagnoses: z.array(z.string()).optional(),
      recommendedTests: z.array(z.string()).optional(),
    })
  ),
});

// Prompt especializado para diagnóstico
const DIAGNOSIS_SYSTEM_PROMPT = `Eres un asistente médico especializado en diagnóstico diferencial.
Tu tarea es sugerir posibles diagnósticos basándote en los síntomas proporcionados.

ADVERTENCIAS IMPORTANTES:
1. Estas son SUGERENCIAS, no diagnósticos definitivos
2. Siempre requieren validación por un médico profesional
3. No reemplaza el juicio clínico

INSTRUCCIONES:
- Analiza los síntomas proporcionados
- Sugiere diagnósticos ordenados por probabilidad
- Incluye código CIE-10 cuando sea posible (formato: letra + 2-3 dígitos, ej: I10, E11.9)
- Indica nivel de confianza: low (<50%), medium (50-75%), high (>75%)
- Explica brevemente el razonamiento
- Sugiere diagnósticos diferenciales cuando aplique
- Recomienda pruebas diagnósticas relevantes
- Responde SIEMPRE en español
- Responde SOLO con JSON válido

Formato de respuesta:
{
  "suggestions": [
    {
      "diagnosis": "Nombre del diagnóstico",
      "icd10Code": "Código CIE-10 o null",
      "confidence": "low|medium|high",
      "reasoning": "Explicación breve",
      "differentialDiagnoses": ["Diagnóstico 1", "Diagnóstico 2"],
      "recommendedTests": ["Test 1", "Test 2"]
    }
  ]
}`;

const MEDICAL_DISCLAIMER = `AVISO IMPORTANTE: Las sugerencias de diagnóstico generadas por IA son únicamente orientativas y NO constituyen un diagnóstico médico. Estas sugerencias deben ser evaluadas y validadas por un profesional de la salud calificado. No tome decisiones médicas basándose únicamente en estas sugerencias.`;

export async function POST(request: NextRequest): Promise<NextResponse<SuggestDiagnosisResponse>> {
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
    const validationResult = SuggestDiagnosisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        } as SuggestDiagnosisResponse & { details: unknown },
        { status: 400 }
      );
    }

    const { symptoms, clinicalText, patientContext, provider, maxSuggestions } =
      validationResult.data;

    // 3. Determinar proveedor AI
    const selectedProvider: AIProvider = provider || getDefaultProvider() || 'openai';

    // 4. Verificar configuración
    const envKeyMap: Record<AIProvider, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
    };

    if (!process.env[envKeyMap[selectedProvider]]) {
      return NextResponse.json(
        { success: false, error: `${selectedProvider} API key not configured` },
        { status: 503 }
      );
    }

    // 5. Crear cliente AI
    const aiClient = createAIClient(selectedProvider);

    // 6. Construir prompt
    let userPrompt = `Analiza los siguientes síntomas y sugiere hasta ${maxSuggestions} posibles diagnósticos:\n\n`;
    userPrompt += `SÍNTOMAS:\n${symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`;

    if (clinicalText) {
      userPrompt += `\nTEXTO CLÍNICO ADICIONAL:\n"${clinicalText}"\n`;
    }

    if (patientContext) {
      userPrompt += '\nCONTEXTO DEL PACIENTE:';
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
    const aiResponse = await aiClient.complete(userPrompt, DIAGNOSIS_SYSTEM_PROMPT);

    // 8. Parsear respuesta
    let parsedResponse;
    try {
      let jsonString = aiResponse.content;
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      const rawJson = JSON.parse(jsonString.trim());
      parsedResponse = AIResponseSchema.parse(rawJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // 9. Enriquecer con datos CIE-10 de la base de datos
    const suggestions: DiagnosisSuggestion[] = await Promise.all(
      parsedResponse.suggestions.map(async (suggestion) => {
        let icd10Description: string | null = null;
        let icd10Code = suggestion.icd10Code || null;

        // Buscar código CIE-10 en la base de datos si existe
        if (icd10Code) {
          const { data: icd10Data } = await supabase
            .from('icd10_codes')
            .select('code, description')
            .eq('code', icd10Code.toUpperCase())
            .single();

          if (icd10Data) {
            icd10Description = icd10Data.description;
            icd10Code = icd10Data.code;
          }
        }

        // Calcular score numérico
        const confidenceScore =
          suggestion.confidence === 'high'
            ? 0.85
            : suggestion.confidence === 'medium'
            ? 0.65
            : 0.4;

        return {
          diagnosis: suggestion.diagnosis,
          icd10Code,
          icd10Description,
          confidence: suggestion.confidence,
          confidenceScore,
          reasoning: suggestion.reasoning,
          differentialDiagnoses: suggestion.differentialDiagnoses,
          recommendedTests: suggestion.recommendedTests,
        };
      })
    );

    // 10. Ordenar por confianza
    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        disclaimer: MEDICAL_DISCLAIMER,
        provider: selectedProvider,
        model: aiResponse.model,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('[Suggest Diagnosis] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
