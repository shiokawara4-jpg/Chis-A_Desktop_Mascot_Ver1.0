import type { LookAtTarget, ModelProfile, ModelRendererAdapter, MotionProfile } from '../../core';

export class VrmRendererAdapter implements ModelRendererAdapter {
  private loadedModel?: ModelProfile;
  private activeMotion?: MotionProfile;
  private expressionId = '';
  private lookAtTarget: LookAtTarget = { x: 0, y: 0 };
  private scale = 1;

  public async loadModel(profile: ModelProfile): Promise<void> {
    if (profile.modelFormat !== 'vrm') {
      throw new Error(`VrmRendererAdapter only supports vrm models: ${profile.modelId}`);
    }

    // VRM display is intentionally left for the later VRM implementation step.
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

    if (motion.motionFormat !== 'vrma') {
      throw new Error(`VrmRendererAdapter only supports vrma motions: ${motion.motionId}`);
    }

    if (!motion.supportedModelFormats.includes('vrm')) {
      throw new Error(`Motion is not registered for vrm models: ${motion.motionId}`);
    }

    this.activeMotion = motion;
  }

  public stopMotion(): void {
    this.activeMotion = undefined;
  }

  public setExpression(expressionId: string): void {
    this.expressionId = expressionId;
  }

  public setLookAt(target: LookAtTarget): void {
    this.lookAtTarget = target;
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  public dispose(): void {
    this.stopMotion();
    this.loadedModel = undefined;
  }
}
