import * as THREE from 'three';
import type { CharacterInstance, CharacterProfile, ModelProfile, RendererDiagnosticEntry } from '../../core';
import { serializeError } from '../diagnostics/rendererDiagnostics';
import {
  createModelRendererAdapter,
  type RuntimeModelRendererAdapter
} from '../rendererAdapters/modelRendererFactory';
import type { MmdRendererWarning } from '../rendererAdapters/mmdRendererAdapter';

export type MascotPreviewSceneSettings = {
  maxFps: number;
  renderScale: number;
  transparentBackground: boolean;
  physicsEnabled: boolean;
};

export type MascotModelStatusKind = 'idle' | 'loading' | 'ready' | 'warning' | 'error';

export type MascotModelStatus = {
  instanceId: string;
  characterId: string;
  kind: MascotModelStatusKind;
  message: string;
  modelId?: string;
  progress?: number;
  details?: unknown;
};

export type MascotPreviewSceneOptions = MascotPreviewSceneSettings & {
  container: HTMLElement;
  characters: CharacterInstance[];
  characterProfiles: CharacterProfile[];
  onModelStatusChange?: (status: MascotModelStatus) => void;
  onDiagnostic?: (entry: RendererDiagnosticEntry) => void;
};

type PreviewPlaceholderMesh = {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  edges: THREE.LineSegments<THREE.EdgesGeometry<THREE.BoxGeometry>, THREE.LineBasicMaterial>;
};

type PreviewMascotMesh = {
  group: THREE.Group;
  placeholder?: PreviewPlaceholderMesh;
  adapter?: RuntimeModelRendererAdapter;
  modelProfile?: ModelProfile;
  modelKey?: string;
  loadToken: number;
};

const previewCubeSize = 84;
const minPixelRatio = 0.5;
const maxPixelRatio = 3;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const getFrameIntervalMs = (maxFps: number): number => {
  if (!Number.isFinite(maxFps) || maxFps <= 0) {
    return 1000 / 60;
  }

  return 1000 / clamp(maxFps, 1, 240);
};

const getModelColor = (characterId: string): THREE.ColorRepresentation => {
  let hash = 0;

  for (const character of characterId) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  return new THREE.Color().setHSL(hash / 360, 0.62, 0.58);
};

const getProfileDiagnosticDetails = (profile: ModelProfile): Record<string, unknown> => ({
  modelId: profile.modelId,
  displayName: profile.displayName,
  modelFormat: profile.modelFormat,
  modelPath: profile.modelPath,
  textureRootPath: profile.textureRootPath
});

const getModelKey = (profile: ModelProfile, physicsEnabled: boolean): string =>
  [profile.modelFormat, profile.modelId, profile.modelPath, profile.textureRootPath ?? '', physicsEnabled].join('|');

const getLoadingMessage = (profile: ModelProfile, progress?: number): string => {
  const displayName = profile.displayName || profile.modelId;

  if (progress === undefined) {
    return `PMX読み込み中: ${displayName}`;
  }

  return `PMX読み込み中: ${displayName} (${Math.round(progress * 100)}%)`;
};

export class MascotPreviewScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly mascots = new Map<string, PreviewMascotMesh>();
  private readonly resizeObserver: ResizeObserver;
  private animationFrameId?: number;
  private lastFrameTime = 0;
  private frameIntervalMs: number;
  private renderScale: number;
  private transparentBackground: boolean;
  private physicsEnabled: boolean;
  private characters: CharacterInstance[];
  private characterProfiles: CharacterProfile[];

  public constructor(private readonly options: MascotPreviewSceneOptions) {
    this.frameIntervalMs = getFrameIntervalMs(options.maxFps);
    this.renderScale = options.renderScale;
    this.transparentBackground = options.transparentBackground;
    this.physicsEnabled = options.physicsEnabled;
    this.characters = options.characters;
    this.characterProfiles = options.characterProfiles;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'stage-canvas';
    this.options.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(160, -240, 420);
    this.scene.add(keyLight);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.options.container);

    this.updateSettings(options);
    this.setCharacters(options.characters, options.characterProfiles);
    this.resize();
    this.start();
  }

  public updateSettings(settings: MascotPreviewSceneSettings): void {
    const previousPhysicsEnabled = this.physicsEnabled;

    this.frameIntervalMs = getFrameIntervalMs(settings.maxFps);
    this.renderScale = clamp(settings.renderScale || 1, 0.25, 2);
    this.transparentBackground = settings.transparentBackground;
    this.physicsEnabled = settings.physicsEnabled;

    this.scene.background = null;
    this.renderer.setClearColor(0x000000, this.transparentBackground ? 0 : 0);
    this.updatePixelRatio();

    if (previousPhysicsEnabled !== this.physicsEnabled) {
      this.reloadPmxMascots();
    }
  }

  public setCharacters(characters: CharacterInstance[], characterProfiles = this.characterProfiles): void {
    this.characters = characters;
    this.characterProfiles = characterProfiles;

    const activeIds = new Set(characters.map((character) => character.instanceId));

    for (const instanceId of [...this.mascots.keys()]) {
      if (!activeIds.has(instanceId)) {
        this.removeMascot(instanceId);
      }
    }

    for (const character of characters) {
      const mascot = this.mascots.get(character.instanceId) ?? this.createMascot(character);
      mascot.group.visible = character.isVisible;
      mascot.group.position.set(character.position.x, character.position.y, character.zIndex);
      mascot.group.scale.setScalar(character.scale);
      mascot.group.renderOrder = character.zIndex;
      this.updateMascotModel(mascot, character);
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== undefined) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    this.resizeObserver.disconnect();

    for (const instanceId of [...this.mascots.keys()]) {
      this.removeMascot(instanceId);
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createMascot(character: CharacterInstance): PreviewMascotMesh {
    const group = new THREE.Group();
    this.scene.add(group);

    const mascot: PreviewMascotMesh = {
      group,
      loadToken: 0
    };

    this.mascots.set(character.instanceId, mascot);
    this.ensurePlaceholder(mascot, character);
    return mascot;
  }

  private updateMascotModel(mascot: PreviewMascotMesh, character: CharacterInstance): void {
    const profile = this.resolveModelProfile(character);

    if (!profile || profile.modelFormat !== 'pmx') {
      this.usePlaceholderModel(mascot, character);
      return;
    }

    const modelKey = getModelKey(profile, this.physicsEnabled);

    if (mascot.modelKey === modelKey) {
      return;
    }

    mascot.modelKey = modelKey;
    mascot.modelProfile = profile;
    void this.loadPmxModel(mascot, character, profile, modelKey);
  }

  private resolveModelProfile(character: CharacterInstance): ModelProfile | undefined {
    const characterProfile = this.characterProfiles.find((profile) => profile.characterId === character.characterId);

    if (!characterProfile) {
      return undefined;
    }

    const costume =
      characterProfile.costumes.find((candidate) => candidate.costumeId === character.currentCostumeId) ??
      characterProfile.costumes.find((candidate) => candidate.costumeId === characterProfile.defaultCostumeId) ??
      characterProfile.costumes[0];
    const modelId = costume?.modelId;

    if (modelId) {
      return characterProfile.modelProfiles.find((profile) => profile.modelId === modelId);
    }

    return characterProfile.modelProfiles[0];
  }

  private async loadPmxModel(
    mascot: PreviewMascotMesh,
    character: CharacterInstance,
    profile: ModelProfile,
    modelKey: string
  ): Promise<void> {
    const loadToken = ++mascot.loadToken;
    const emitLoading = (progress?: number): void => {
      this.emitModelStatus({
        instanceId: character.instanceId,
        characterId: character.characterId,
        kind: 'loading',
        modelId: profile.modelId,
        message: getLoadingMessage(profile, progress),
        progress
      });
    };

    mascot.adapter?.dispose();
    mascot.adapter = undefined;
    this.ensurePlaceholder(mascot, character);
    emitLoading();

    let adapter: RuntimeModelRendererAdapter | undefined;

    try {
      adapter = createModelRendererAdapter('pmx', {
        modelRoot: mascot.group,
        physicsEnabled: this.physicsEnabled,
        onProgress: (progress) => {
          if (mascot.loadToken === loadToken && mascot.modelKey === modelKey) {
            emitLoading(progress.progress);
          }
        },
        onWarning: (warning) => {
          if (mascot.loadToken === loadToken && mascot.modelKey === modelKey) {
            this.handlePmxWarning(character, profile, warning);
          }
        }
      });

      mascot.adapter = adapter;
      await adapter.loadModel(profile);

      if (mascot.loadToken !== loadToken || mascot.modelKey !== modelKey) {
        adapter.dispose();
        return;
      }

      this.removePlaceholder(mascot);

      if ((adapter.getWarnings?.() ?? []).length > 0) {
        return;
      }

      this.emitModelStatus({
        instanceId: character.instanceId,
        characterId: character.characterId,
        kind: 'ready',
        modelId: profile.modelId,
        message: `PMX読み込み完了: ${profile.displayName || profile.modelId}`
      });
    } catch (error: unknown) {
      if (mascot.loadToken !== loadToken || mascot.modelKey !== modelKey) {
        adapter?.dispose();
        return;
      }

      adapter?.dispose();
      mascot.adapter = undefined;
      this.ensurePlaceholder(mascot, character);

      const message = `PMXモデルを読み込めませんでした。modelPathとファイル権限を確認してください: ${
        profile.displayName || profile.modelId
      }`;
      const details = {
        instanceId: character.instanceId,
        characterId: character.characterId,
        model: getProfileDiagnosticDetails(profile),
        error: serializeError(error)
      };

      this.emitModelStatus({
        instanceId: character.instanceId,
        characterId: character.characterId,
        kind: 'error',
        modelId: profile.modelId,
        message,
        details
      });
      this.emitDiagnostic({
        level: 'error',
        source: 'mmd-renderer',
        message,
        details
      });
    }
  }

  private handlePmxWarning(
    character: CharacterInstance,
    profile: ModelProfile,
    warning: MmdRendererWarning
  ): void {
    const details = {
      instanceId: character.instanceId,
      characterId: character.characterId,
      model: getProfileDiagnosticDetails(profile),
      warning: warning.details
    };

    this.emitModelStatus({
      instanceId: character.instanceId,
      characterId: character.characterId,
      kind: 'warning',
      modelId: profile.modelId,
      message: warning.message,
      details
    });
    this.emitDiagnostic({
      level: 'warning',
      source: 'mmd-renderer',
      message: warning.message,
      details
    });
  }

  private usePlaceholderModel(mascot: PreviewMascotMesh, character: CharacterInstance): void {
    mascot.loadToken += 1;
    mascot.modelKey = undefined;
    mascot.modelProfile = undefined;
    mascot.adapter?.dispose();
    mascot.adapter = undefined;
    this.ensurePlaceholder(mascot, character);
    this.emitModelStatus({
      instanceId: character.instanceId,
      characterId: character.characterId,
      kind: 'idle',
      message: 'Placeholder model'
    });
  }

  private reloadPmxMascots(): void {
    for (const character of this.characters) {
      const mascot = this.mascots.get(character.instanceId);

      if (!mascot || mascot.modelProfile?.modelFormat !== 'pmx') {
        continue;
      }

      mascot.modelKey = undefined;
      this.updateMascotModel(mascot, character);
    }
  }

  private ensurePlaceholder(mascot: PreviewMascotMesh, character: CharacterInstance): void {
    if (mascot.placeholder) {
      return;
    }

    const geometry = new THREE.BoxGeometry(previewCubeSize, previewCubeSize, previewCubeSize);
    const material = new THREE.MeshStandardMaterial({
      color: getModelColor(character.characterId),
      metalness: 0.12,
      roughness: 0.55
    });
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x223041 })
    );

    mesh.position.set(0, -previewCubeSize * 0.5, 0);
    edges.position.copy(mesh.position);
    mascot.group.add(mesh, edges);
    mascot.placeholder = { mesh, edges };
  }

  private removePlaceholder(mascot: PreviewMascotMesh): void {
    if (!mascot.placeholder) {
      return;
    }

    const { mesh, edges } = mascot.placeholder;
    mascot.group.remove(mesh, edges);
    mesh.geometry.dispose();
    mesh.material.dispose();
    edges.geometry.dispose();
    edges.material.dispose();
    mascot.placeholder = undefined;
  }

  private removeMascot(instanceId: string): void {
    const mascot = this.mascots.get(instanceId);

    if (!mascot) {
      return;
    }

    mascot.loadToken += 1;
    mascot.adapter?.dispose();
    this.removePlaceholder(mascot);
    this.scene.remove(mascot.group);
    this.mascots.delete(instanceId);
    this.emitModelStatus({
      instanceId,
      characterId: '',
      kind: 'idle',
      message: 'Removed'
    });
  }

  private resize(): void {
    const width = Math.max(1, this.options.container.clientWidth);
    const height = Math.max(1, this.options.container.clientHeight);

    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
    this.updatePixelRatio();
    this.renderer.setSize(width, height, false);
  }

  private updatePixelRatio(): void {
    const pixelRatio = clamp(window.devicePixelRatio * this.renderScale, minPixelRatio, maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
  }

  private start(): void {
    const animate = (time: number): void => {
      this.animationFrameId = window.requestAnimationFrame(animate);

      if (time - this.lastFrameTime < this.frameIntervalMs) {
        return;
      }

      const deltaSeconds = this.lastFrameTime > 0 ? (time - this.lastFrameTime) / 1000 : this.frameIntervalMs / 1000;
      this.lastFrameTime = time;
      this.render(time, deltaSeconds);
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
  }

  private render(time: number, deltaSeconds: number): void {
    for (const mascot of this.mascots.values()) {
      if (mascot.placeholder) {
        mascot.placeholder.mesh.rotation.x = time * 0.00035;
        mascot.placeholder.mesh.rotation.y = time * 0.0006;
        mascot.placeholder.edges.rotation.copy(mascot.placeholder.mesh.rotation);
      }

      mascot.adapter?.update?.(deltaSeconds);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private emitModelStatus(status: MascotModelStatus): void {
    this.options.onModelStatusChange?.(status);
  }

  private emitDiagnostic(entry: RendererDiagnosticEntry): void {
    this.options.onDiagnostic?.(entry);
  }
}
