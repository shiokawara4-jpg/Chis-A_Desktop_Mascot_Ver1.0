import type { LookAtTarget, ModelProfile, ModelRendererAdapter, MotionProfile } from '../../core';

export class MmdRendererAdapter implements ModelRendererAdapter {
  private loadedModel?: ModelProfile;
  private activeMotion?: MotionProfile;
  private scale = 1;

  public async loadModel(profile: ModelProfile): Promise<void> {
    if (profile.modelFormat !== 'pmx') {
      throw new Error(`MmdRendererAdapter only supports pmx models: ${profile.modelId}`);
    }

    // Step 6 will replace this placeholder with Three.js MMDLoader PMX loading.
    this.loadedModel = profile;
  }

  public async unloadModel(): Promise<void> {
    this.stopMotion();
    this.loadedModel = undefined;
  }

  public async playMotion(motion: MotionProfile): Promise<void> {
    if (motion.motionFormat === 'none') {
      this.stopMotion();
      return;
    }

    if (motion.motionFormat !== 'vmd') {
      throw new Error(`MmdRendererAdapter only supports vmd motions: ${motion.motionId}`);
    }

    if (!motion.supportedModelFormats.includes('pmx')) {
      throw new Error(`Motion is not registered for pmx models: ${motion.motionId}`);
    }

    // Step 7 will replace this placeholder with MMDAnimationHelper VMD playback.
    this.activeMotion = motion;
  }

  public stopMotion(): void {
    this.activeMotion = undefined;
  }

  public setExpression(_expressionId: string): void {
    // MMD expression mapping will be added with model-specific controls.
  }

  public setLookAt(_target: LookAtTarget): void {
    // MMD look-at or bone control will be added after PMX loading is stable.
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  public dispose(): void {
    this.stopMotion();
    this.loadedModel = undefined;
  }
}
