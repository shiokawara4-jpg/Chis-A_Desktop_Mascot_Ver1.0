export type VoiceDirection = {
  text: string;
  voiceStyle: string;
  delivery: string;
  preset: string;
  intensity: number;
  styleWeights: Record<string, number>;
  globalParameters: Record<string, number>;
};

export type VoiceProfile = {
  voiceProfileId: string;
  displayName: string;
  adapterId: string;
  preset: string;
  description?: string;
};
