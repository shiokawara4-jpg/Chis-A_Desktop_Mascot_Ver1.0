import type { ScreenObservationResult } from '../screen/screenObservationAdapter';

export type TextReadingResult = {
  text: string;
  source: ScreenObservationResult['source'];
  confidence?: number;
  metadata?: Record<string, unknown>;
};

export interface TextReadingAdapter {
  extractReadableText(observation: ScreenObservationResult): Promise<TextReadingResult>;
}
