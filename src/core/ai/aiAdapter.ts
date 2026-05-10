import type { MascotAIRequest, MascotAIResponse } from './aiTypes';

export interface AIAdapter {
  generateResponse(request: MascotAIRequest): Promise<MascotAIResponse>;
}
