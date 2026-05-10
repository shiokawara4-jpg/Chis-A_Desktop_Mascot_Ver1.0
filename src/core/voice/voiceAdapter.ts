import type { VoiceDirection } from './voiceTypes';

export interface VoiceAdapter {
  speak(direction: VoiceDirection): Promise<void>;
}
