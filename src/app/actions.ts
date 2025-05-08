// src/app/actions.ts
'use server';

import { synthesizeInstructions, type SynthesizeInstructionsInput, type SynthesizeInstructionsOutput } from '@/ai/flows/synthesize-instructions';
import { z } from 'zod';

const BreakdownSchema = z.object({
  instructions: z.string().min(10, "Instructions must be at least 10 characters long.").max(5000, "Instructions cannot exceed 5000 characters."),
});

export interface BreakdownState {
  detailedSteps?: string[];
  recommendedGlassware?: string[];
  recommendedMaterials?: string[];
  safetyWarnings?: string[];
  error?: string;
  fieldErrors?: {
    instructions?: string[];
  };
  input?: string; // To repopulate textarea on error or pass to chat context
}

export async function handleBreakdownInstructions(
  prevState: BreakdownState | undefined, 
  formData: FormData
): Promise<BreakdownState> {
  const instructions = formData.get('instructions') as string;
  
  const validatedFields = BreakdownSchema.safeParse({
    instructions: instructions,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid input. Please check the instructions.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      input: instructions,
    };
  }

  try {
    const input: SynthesizeInstructionsInput = { instructions: validatedFields.data.instructions };
    const result: SynthesizeInstructionsOutput = await synthesizeInstructions(input);
    
    if (result.detailedSteps && result.detailedSteps.length === 0 && 
        (!result.recommendedGlassware || result.recommendedGlassware.length === 0) &&
        (!result.recommendedMaterials || result.recommendedMaterials.length === 0) &&
        (!result.safetyWarnings || result.safetyWarnings.length === 0)
    ) {
        // Success but no meaningful output
        return { 
            detailedSteps: [], 
            recommendedGlassware: [],
            recommendedMaterials: [],
            safetyWarnings: [],
            input: validatedFields.data.instructions 
        }; 
    }
    return { 
        detailedSteps: result.detailedSteps, 
        recommendedGlassware: result.recommendedGlassware,
        recommendedMaterials: result.recommendedMaterials,
        safetyWarnings: result.safetyWarnings,
        input: validatedFields.data.instructions 
    };
  } catch (e) {
    console.error("Error in handleBreakdownInstructions:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { 
        error: `Failed to break down instructions: ${errorMessage}. Please try again.`,
        input: validatedFields.data.instructions,
    };
  }
}
