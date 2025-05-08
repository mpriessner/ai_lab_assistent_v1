// src/ai/flows/synthesize-instructions.ts
'use server';

/**
 * @fileOverview Breaks down chemical synthesis instructions into a detailed step-by-step list, 
 * including recommendations for glassware, materials, and safety warnings using GenAI.
 *
 * - synthesizeInstructions - A function that handles the instruction breakdown process.
 * - SynthesizeInstructionsInput - The input type for the synthesizeInstructions function.
 * - SynthesizeInstructionsOutput - The return type for the synthesizeInstructions function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit'; // For z.infer and schema usage with Genkit
import { 
  SynthesizeInstructionsInputSchema,
  SynthesizeInstructionsOutputSchema 
} from '@/ai/schemas';

export type SynthesizeInstructionsInput = z.infer<typeof SynthesizeInstructionsInputSchema>;
export type SynthesizeInstructionsOutput = z.infer<typeof SynthesizeInstructionsOutputSchema>;
// SynthesizeInstructionsOutputSchema is no longer exported from this file.

export async function synthesizeInstructions(input: SynthesizeInstructionsInput): Promise<SynthesizeInstructionsOutput> {
  return synthesizeInstructionsFlow(input);
}

const synthesizeInstructionsPrompt = ai.definePrompt({
  name: 'synthesizeInstructionsPrompt',
  input: {schema: SynthesizeInstructionsInputSchema},
  output: {schema: SynthesizeInstructionsOutputSchema},
  prompt: `You are an expert chemist. Please break down the following chemical synthesis instructions into a highly detailed, step-by-step list. Each step should be comprehensive, clear, and easy to follow for a lab chemist.

In addition to the detailed steps, provide the following separate lists:
1.  **Recommended Glassware:** Specific glassware needed (e.g., '500mL round-bottom flask', 'condenser', 'dropping funnel').
2.  **Recommended Materials:** Specific materials or specialized equipment (e.g., 'magnetic stirrer with hotplate', 'nitrogen gas line', 'filter paper grade X').
3.  **Safety Warnings:** Crucial safety precautions and warnings (e.g., 'Work in fume hood', 'Flammable solvent - avoid ignition sources', 'Corrosive - wear appropriate PPE').

Instructions: {{{instructions}}}`,
});

const synthesizeInstructionsFlow = ai.defineFlow(
  {
    name: 'synthesizeInstructionsFlow',
    inputSchema: SynthesizeInstructionsInputSchema,
    outputSchema: SynthesizeInstructionsOutputSchema,
  },
  async input => {
    const {output} = await synthesizeInstructionsPrompt(input);
    if (!output) {
      throw new Error("AI model did not return the expected output format for synthesizeInstructionsPrompt.");
    }
    return output;
  }
);
