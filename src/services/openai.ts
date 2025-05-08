// src/services/openai.ts
'use server';

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  // In development, we might not have the key but still want the app to run.
  // For production, this warning is more critical.
  // The key check in `transcribeAudio` will throw an error if it's actually used without a key.
  console.warn(
    'OpenAI API key is missing. Transcription service will not work in deployed environments without it.'
  );
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "MISSING_KEY", // Provide a dummy key if missing to allow initialization
});

/**
 * Transcribes audio using OpenAI's Whisper API.
 * @param audioBase64 The base64 encoded audio data (expected to be webm or similar).
 * @returns A promise that resolves to the transcribed text.
 * @throws If API key is missing or API call fails.
 */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is not configured. Cannot transcribe audio.');
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // The OpenAI SDK's `file` parameter in `transcriptions.create` can accept a `File` object.
    // We can construct one from the buffer.
    // Ensure a filename with a valid extension is provided.
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio with OpenAI:', error);
    if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
    }
    throw new Error('Failed to transcribe audio due to an unexpected error.');
  }
}
