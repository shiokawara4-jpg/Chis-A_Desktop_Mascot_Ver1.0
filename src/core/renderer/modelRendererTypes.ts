import type { ModelProfile } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';

export type LookAtTarget = {
  x: number;
  y: number;
};

export interface ModelRendererAdapter {
  loadModel(profile: ModelProfile): Promise<void>;
  unloadModel(): Promise<void>;
  playMotion(motion: MotionProfile): Promise<void>;
  stopMotion(): void;
  setExpression(expressionId: string): void;
  setLookAt(target: LookAtTarget): void;
  setScale(scale: number): void;
  dispose(): void;
}
