import * as THREE from 'three';
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import type { LookAtTarget, ModelProfile, ModelRendererAdapter, MotionProfile } from '../../core';
import { getErrorMessage, serializeError } from '../diagnostics/rendererDiagnostics';

export type MmdRendererLoadProgress = {
  loaded: number;
  total: number;
  progress?: number;
};

export type MmdRendererWarning = {
  message: string;
  details?: unknown;
};

export type MmdRendererAdapterOptions = {
  modelRoot: THREE.Group;
  physicsEnabled: boolean;
  onProgress?: (progress: MmdRendererLoadProgress) => void;
  onWarning?: (warning: MmdRendererWarning) => void;
};

const targetModelHeight = 260;
const minModelScale = 0.01;
const maxModelScale = 100;
const urlSchemePattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const encodeFilePathSegments = (filePath: string): string =>
  filePath
    .split('/')
    .map((segment) => (/^[A-Za-z]:$/.test(segment) ? segment : encodeURIComponent(segment)))
    .join('/');

const toFileUrl = (filePath: string): string => {
  const trimmedPath = filePath.trim();

  if (!trimmedPath) {
    throw new Error('PMX modelPath is empty.');
  }

  if (urlSchemePattern.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.replace(/\\/g, '/');

  if (normalizedPath.startsWith('//')) {
    const [, , host, ...segments] = normalizedPath.split('/');

    if (!host) {
      throw new Error(`Invalid UNC modelPath: ${filePath}`);
    }

    return `file://${host}/${segments.map(encodeURIComponent).join('/')}`;
  }

  if (/^[A-Za-z]:\//.test(normalizedPath)) {
    return `file:///${encodeFilePathSegments(normalizedPath)}`;
  }

  if (normalizedPath.startsWith('/')) {
    return `file://${encodeFilePathSegments(normalizedPath)}`;
  }

  throw new Error(`PMX modelPath must be an absolute local path or file URL: ${filePath}`);
};

const ensureTrailingSlash = (value: string): string => (value.endsWith('/') ? value : `${value}/`);

const toDirectoryFileUrl = (directoryPath: string): string => ensureTrailingSlash(toFileUrl(directoryPath));

const disposeMaterial = (material: THREE.Material): void => {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }

  material.dispose();
};

const disposeObject = (object: THREE.Object3D): void => {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
      return;
    }

    disposeMaterial(child.material);
  });
};

export class MmdRendererAdapter implements ModelRendererAdapter {
  private loadedModel?: ModelProfile;
  private activeMotion?: MotionProfile;
  private mesh?: THREE.SkinnedMesh;
  private helper?: MMDAnimationHelper;
  private readonly warnings: MmdRendererWarning[] = [];
  private scale = 1;
  private disposed = false;
  private physicsRuntimeWarningReported = false;

  public constructor(private readonly options: MmdRendererAdapterOptions) {}

  public async loadModel(profile: ModelProfile): Promise<void> {
    if (profile.modelFormat !== 'pmx') {
      throw new Error(`MmdRendererAdapter only supports pmx models: ${profile.modelId}`);
    }

    this.clearLoadedMesh();
    this.loadedModel = profile;
    this.warnings.length = 0;
    this.physicsRuntimeWarningReported = false;

    const mesh = await this.loadPmxMesh(profile);

    if (this.disposed) {
      disposeObject(mesh);
      return;
    }

    mesh.name = profile.displayName || profile.modelId;
    this.fitMeshToStage(mesh);
    this.options.modelRoot.add(mesh);
    this.mesh = mesh;
    this.setupPhysics(mesh);
  }

  public async unloadModel(): Promise<void> {
    this.stopMotion();
    this.loadedModel = undefined;
    this.clearLoadedMesh();
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

  public update(deltaSeconds: number): void {
    if (!this.helper) {
      return;
    }

    try {
      this.helper.update(deltaSeconds);
    } catch (error: unknown) {
      if (this.physicsRuntimeWarningReported) {
        return;
      }

      this.physicsRuntimeWarningReported = true;
      this.helper.enabled.physics = false;
      this.addWarning({
        message: 'PMXの物理演算更新に失敗したため、物理演算を無効化しました。',
        details: serializeError(error)
      });
    }
  }

  public getWarnings(): readonly MmdRendererWarning[] {
    return this.warnings;
  }

  public dispose(): void {
    this.disposed = true;
    this.stopMotion();
    this.loadedModel = undefined;
    this.clearLoadedMesh();
  }

  private async loadPmxMesh(profile: ModelProfile): Promise<THREE.SkinnedMesh> {
    const loader = new MMDLoader();
    const modelUrl = toFileUrl(profile.modelPath);

    if (profile.textureRootPath) {
      loader.setResourcePath(toDirectoryFileUrl(profile.textureRootPath));
    }

    return new Promise((resolve, reject) => {
      loader.load(
        modelUrl,
        resolve,
        (event) => {
          const progress =
            event.lengthComputable && event.total > 0 ? clamp(event.loaded / event.total, 0, 1) : undefined;

          this.options.onProgress?.({
            loaded: event.loaded,
            total: event.total,
            progress
          });
        },
        reject
      );
    });
  }

  private fitMeshToStage(mesh: THREE.SkinnedMesh): void {
    mesh.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const modelHeight = Math.max(size.y, 1);
    const fitScale = clamp(targetModelHeight / modelHeight, minModelScale, maxModelScale) * this.scale;

    mesh.scale.set(fitScale, -fitScale, fitScale);
    mesh.position.set(-center.x * fitScale, box.min.y * fitScale, -center.z * fitScale);
    mesh.updateMatrixWorld(true);
  }

  private setupPhysics(mesh: THREE.SkinnedMesh): void {
    if (!this.options.physicsEnabled) {
      return;
    }

    const helper = new MMDAnimationHelper({
      sync: false,
      resetPhysicsOnLoop: true
    });

    try {
      helper.add(mesh, {
        physics: true,
        warmup: 30,
        animationWarmup: false
      });
      helper.enabled.animation = false;
      this.helper = helper;
    } catch (error: unknown) {
      try {
        helper.remove(mesh);
      } catch (removeError: unknown) {
        console.warn('Failed to clean up MMD helper after physics setup failure.', removeError);
      }

      this.helper = undefined;
      this.addWarning({
        message: `PMXは表示できましたが、物理演算の初期化に失敗しました: ${getErrorMessage(error)}`,
        details: serializeError(error)
      });
    }
  }

  private addWarning(warning: MmdRendererWarning): void {
    this.warnings.push(warning);
    this.options.onWarning?.(warning);
  }

  private clearLoadedMesh(): void {
    if (this.mesh && this.helper) {
      try {
        this.helper.remove(this.mesh);
      } catch (error: unknown) {
        console.warn('Failed to remove PMX mesh from MMD helper.', error);
      }
    }

    if (this.mesh) {
      this.options.modelRoot.remove(this.mesh);
      disposeObject(this.mesh);
      this.mesh = undefined;
    }

    this.helper = undefined;
  }
}
