import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfig } from './config';
import { OCR_SYSTEM_PROMPT } from '../utils/prompt';

function extractMediaType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

function extractBase64(dataUri: string): string {
  const commaIndex = dataUri.indexOf(',');
  return commaIndex !== -1 ? dataUri.slice(commaIndex + 1) : dataUri;
}

async function convertWithOpenAI(
  client: OpenAI,
  model: string,
  imageBase64: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const stream = await client.chat.completions.create(
    {
      model,
      stream: true,
      messages: [
        { role: 'system', content: OCR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
    },
    { signal },
  );

  let fullText = '';

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }

  return fullText;
}

async function convertWithAnthropic(
  client: Anthropic,
  model: string,
  imageBase64: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const mediaType = extractMediaType(imageBase64);
  const base64Data = extractBase64(imageBase64);

  const stream = await client.messages.stream(
    {
      model,
      max_tokens: 4096,
      system: OCR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
          ],
        },
      ],
    },
    { signal },
  );

  let fullText = '';

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
  }

  return fullText;
}

export async function convertImageToMarkdown(
  config: AppConfig,
  imageBase64: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  if (config.useApiKey && !config.apiKey) {
    throw new Error('API key is not configured. Please set your LLM API key in the config panel.');
  }

  if (!config.model) {
    throw new Error('Model is not configured. Please select a model in the config panel.');
  }

  if (!imageBase64.startsWith('data:image')) {
    throw new Error('Invalid image format. Expected a data URI (data:image/...;base64,...).');
  }

  signal.throwIfAborted();

  if (config.provider === 'anthropic') {
    const anthropicOpts: Record<string, unknown> = {
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    };
    const client = new Anthropic(anthropicOpts as never);

    return convertWithAnthropic(client, config.model, imageBase64, onChunk, signal);
  }

  const openAIOpts: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: config.apiKey || '',
    dangerouslyAllowBrowser: true,
  };

  if ((config.provider === 'openai-compatible' || config.provider === 'lmstudio') && config.baseUrl) {
    openAIOpts.baseURL = config.baseUrl;
  }

  const client = new OpenAI(openAIOpts);

  return convertWithOpenAI(client, config.model, imageBase64, onChunk, signal);
}
