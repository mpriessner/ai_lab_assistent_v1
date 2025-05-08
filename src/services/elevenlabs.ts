// src/services/elevenlabs.ts
'use server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - a common default voice

/**
 * Converts text to speech using ElevenLabs API and returns audio as base64.
 * @param text The text to convert to speech.
 * @returns A promise that resolves to the base64 encoded audio data.
 * @throws If API key is missing or API call fails.
 */
export async function textToSpeech(text: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key is missing.');
    throw new Error('ElevenLabs API key is not configured.');
  }

  const XI_API_KEY = ELEVENLABS_API_KEY;
  const VOICE_ID_TO_USE = VOICE_ID; 

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID_TO_USE}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': XI_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1', // You can choose other models like eleven_multilingual_v2
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75, // Tweaked for potentially better results with concise answers
        style: 0.0, // Set to 0 for more neutral delivery, good for instructions
        use_speaker_boost: true 
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to generate speech: ${response.statusText}. ${errorBody}`);
  }

  const audioArrayBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
  return audioBase64;
}
