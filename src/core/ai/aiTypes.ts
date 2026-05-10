import type { CharacterInstance } from '../character/characterTypes';
import type { SpeechBubbleContent } from '../speech/speechTypes';
import type { VoiceDirection } from '../voice/voiceTypes';

export type MascotAIResponse = {
  text: string;
  emotion: string;
  facialExpression: string;
  motion: string;
  gaze: string;
  pose: string;
  costumeReaction?: string;
  seasonalReaction?: string;
  timeReaction?: string;
  voiceDirection: VoiceDirection;
  speechBubble: SpeechBubbleContent;
};

export type MascotAIRequest = {
  userInput: string;
  activeCharacters: CharacterInstance[];
  targetCharacterInstanceId?: string;
};
