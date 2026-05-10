export type ScreenObservationResult = {
  capturedAt: string;
  summary: string;
  source: 'desktop' | 'activeWindow' | 'unknown';
  metadata?: Record<string, unknown>;
};

export interface ScreenObservationAdapter {
  observeScreen(): Promise<ScreenObservationResult>;
}
