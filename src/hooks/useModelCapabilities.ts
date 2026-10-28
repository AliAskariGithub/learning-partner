'use client';

import { useMemo } from 'react';
import { getModelDefinition, ModelCapabilities, ProviderId } from '@/lib/ai/providers';

export type CapabilityFeature =
  | 'text'
  | 'vision'
  | 'audioInput'
  | 'audioOutput'
  | 'structuredOutput'
  | 'toolUse'
  | 'embeddings';

export interface UseModelCapabilitiesResult {
  modelId: string;
  provider: ProviderId;
  capabilities: ModelCapabilities;
  supports: (feature: CapabilityFeature) => boolean;
  getDisabledReason: (feature: CapabilityFeature) => string | null;
}

export function useModelCapabilities(modelId: string): UseModelCapabilitiesResult {
  const modelDef = useMemo(() => getModelDefinition(modelId), [modelId]);

  const supports = (feature: CapabilityFeature): boolean => {
    return Boolean(modelDef.capabilities[feature]);
  };

  const getDisabledReason = (feature: CapabilityFeature): string | null => {
    if (supports(feature)) return null;

    switch (feature) {
      case 'vision':
        return `${modelDef.name} doesn't support image inputs. Choose another model (e.g., GPT-4o, Gemini 2.5 Flash, or Claude 3.5 Sonnet) to upload images.`;
      case 'audioInput':
        return `${modelDef.name} doesn't support audio. Choose another model or API key to use microphone input.`;
      case 'audioOutput':
        return `The selected API key doesn't support voice generation. Add a key from a provider with text-to-speech (Google Gemini or OpenAI), or use Basic voice.`;
      case 'structuredOutput':
        return `${modelDef.name} doesn't support structured JSON schema output. This tool requires a structured output model.`;
      case 'toolUse':
        return `${modelDef.name} doesn't support tool calling or web execution.`;
      default:
        return `This feature is not supported by ${modelDef.name}. Choose another model or API key to use it.`;
    }
  };

  return {
    modelId: modelDef.id,
    provider: modelDef.provider,
    capabilities: modelDef.capabilities,
    supports,
    getDisabledReason,
  };
}

