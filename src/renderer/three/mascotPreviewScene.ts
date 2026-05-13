import * as THREE from 'three';
import type { CharacterInstance } from '../../core';

export type MascotPreviewSceneSettings = {
  maxFps: number;
  renderScale: number;
  transparentBackground: boolean;
};

export type MascotPreviewSceneOptions = MascotPreviewSceneSettings & {
  container: HTMLElement;
  characters: CharacterInstance[];
};

type PreviewMascotMesh = {
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  edges: THREE.LineSegments<THREE.EdgesGeometry<THREE.BoxGeometry>, THREE.LineBasicMaterial>;
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

  public constructor(private readonly options: MascotPreviewSceneOptions) {
    this.frameIntervalMs = getFrameIntervalMs(options.maxFps);
    this.renderScale = options.renderScale;
    this.transparentBackground = options.transparentBackground;
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
    this.setCharacters(options.characters);
    this.resize();
    this.start();
  }

  public updateSettings(settings: MascotPreviewSceneSettings): void {
    this.frameIntervalMs = getFrameIntervalMs(settings.maxFps);
    this.renderScale = clamp(settings.renderScale || 1, 0.25, 2);
    this.transparentBackground = settings.transparentBackground;

    this.scene.background = null;
    this.renderer.setClearColor(0x000000, this.transparentBackground ? 0 : 0);
    this.updatePixelRatio();
  }

  public setCharacters(characters: CharacterInstance[]): void {
    const activeIds = new Set(characters.map((character) => character.instanceId));

    for (const instanceId of this.mascots.keys()) {
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
    const group = new THREE.Group();

    mesh.position.set(0, -previewCubeSize * 0.5, 0);
    edges.position.copy(mesh.position);
    group.add(mesh, edges);
    this.scene.add(group);

    const mascot = { group, mesh, edges };
    this.mascots.set(character.instanceId, mascot);
    return mascot;
  }

  private removeMascot(instanceId: string): void {
    const mascot = this.mascots.get(instanceId);

    if (!mascot) {
      return;
    }

    this.scene.remove(mascot.group);
    mascot.mesh.geometry.dispose();
    mascot.mesh.material.dispose();
    mascot.edges.geometry.dispose();
    mascot.edges.material.dispose();
    this.mascots.delete(instanceId);
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

      this.lastFrameTime = time;
      this.render(time);
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
  }

  private render(time: number): void {
    for (const mascot of this.mascots.values()) {
      mascot.mesh.rotation.x = time * 0.00035;
      mascot.mesh.rotation.y = time * 0.0006;
      mascot.edges.rotation.copy(mascot.mesh.rotation);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
