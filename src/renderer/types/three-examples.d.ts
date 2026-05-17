declare module 'three/examples/jsm/loaders/MMDLoader.js' {
  import type { LoadingManager, Loader, SkinnedMesh } from 'three';

  export class MMDLoader extends Loader {
    constructor(manager?: LoadingManager);

    load(
      url: string,
      onLoad: (mesh: SkinnedMesh) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}

declare module 'three/examples/jsm/animation/MMDAnimationHelper.js' {
  import type { AnimationClip, Audio, Camera, SkinnedMesh, Vector3 } from 'three';

  export type MMDAnimationHelperParams = {
    sync?: boolean;
    afterglow?: number;
    resetPhysicsOnLoop?: boolean;
    pmxAnimation?: boolean;
  };

  export type MMDAnimationHelperMeshParams = {
    animation?: AnimationClip | AnimationClip[];
    physics?: boolean;
    warmup?: number;
    unitStep?: number;
    maxStepNum?: number;
    gravity?: Vector3;
    animationWarmup?: boolean;
  };

  export class MMDAnimationHelper {
    enabled: {
      animation: boolean;
      ik: boolean;
      grant: boolean;
      physics: boolean;
      cameraAnimation: boolean;
    };

    constructor(params?: MMDAnimationHelperParams);
    add(object: SkinnedMesh | Camera | Audio, params?: MMDAnimationHelperMeshParams): this;
    remove(object: SkinnedMesh | Camera | Audio): this;
    update(delta: number): this;
    enable(key: keyof MMDAnimationHelper['enabled'], enabled: boolean): this;
  }
}
