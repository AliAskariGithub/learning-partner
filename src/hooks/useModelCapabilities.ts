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
        return `${modelDef.name} does not support image inputs. Choose a vision-capable model (e.g. Gemini 2.5 Flash, GPT-4o, or Claude 3.5 Sonnet).`;
      case 'audioInput':
        return `${modelDef.name} does not support voice input. Choose a model with microphone audio capabilities.`;
      case 'audioOutput':
        return `${modelDef.name} does not support voice synthesis. Choose a provider with text-to-speech (Google Gemini or OpenAI).`;
      case 'structuredOutput':
        return `${modelDef.name} does not support structured JSON generation. This tool requires a model with structured output capabilities.`;
      case 'text':
        return `${modelDef.name} does not support text generation.`;
      case 'toolUse':
        return `${modelDef.name} does not support tool calling or web execution.`;
      default:
        return `This feature is not supported by ${modelDef.name}. Please select another model in the model switcher.`;
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
