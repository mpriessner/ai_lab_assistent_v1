// src/ai/schemas.ts
import { z } from 'genkit'; // Use Genkit's Zod export for schemas used in flows

// Schemas previously in synthesize-instructions.ts
export const SynthesizeInstructionsInputSchema = z.object({
  instructions: z.string().describe('The chemical synthesis instructions to break down.'),
});

export const SynthesizeInstructionsOutputSchema = z.object({
  detailedSteps: z.array(z.string()).describe(
    'The highly detailed step-by-step breakdown of the instructions. Each step should be comprehensive and easy to follow.'
  ),
  recommendedGlassware: z.array(z.string()).describe(
    "A list of specific glassware recommended for the overall procedure (e.g., '500mL round-bottom flask', '250mL separatory funnel')."
  ),
  recommendedMaterials: z.array(z.string()).describe(
    "A list of recommended materials or specialized equipment (e.g., 'Teflon-coated stir bar', 'vacuum grease', 'inert atmosphere setup')."
  ),
  safetyWarnings: z.array(z.string()).describe(
    "A list of important safety warnings and precautions relevant to the procedure (e.g., 'Perform in a well-ventilated fume hood', 'Wear nitrile gloves and safety goggles')."
  ),
});

// Schemas previously in chat-with-instructions-flow.ts
export const ChatHistoryEntrySchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

export const ChatWithInstructionsInputSchema = z.object({
  originalInstructions: z.string().describe("The initial, raw chemical synthesis instructions provided by the user."),
  synthesisContext: SynthesizeInstructionsOutputSchema.describe("The AI-generated detailed breakdown and recommendations for the synthesis."),
  currentStepNumber: z.number().optional().describe("The 1-based index of the current step the user might be referring to."),
  chatHistory: z.array(ChatHistoryEntrySchema).optional().describe("The history of the current conversation."),
  userQuery: z.string().describe("The user's current question or statement."),
});

export const ChatWithInstructionsOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user's query."),
});
