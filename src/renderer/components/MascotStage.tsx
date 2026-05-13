import { useEffect, useRef, useState } from 'react';
import type { CharacterInstance } from '../../core';
import { MascotPreviewScene } from '../three/mascotPreviewScene';

type MascotStageProps = {
  characters: CharacterInstance[];
  maxFps: number;
  renderScale: number;
  transparentBackground: boolean;
};

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const MascotStage = ({
  characters,
  maxFps,
  renderScale,
  transparentBackground
}: MascotStageProps): JSX.Element => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const previewSceneRef = useRef<MascotPreviewScene | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!surfaceRef.current) {
      return undefined;
    }

    try {
      const previewScene = new MascotPreviewScene({
        container: surfaceRef.current,
        characters,
        maxFps,
        renderScale,
        transparentBackground
      });

      previewSceneRef.current = previewScene;
      setPreviewError(null);

      return () => {
        previewScene.dispose();
        previewSceneRef.current = null;
      };
    } catch (error: unknown) {
      console.error('Failed to initialize Three.js mascot preview.', error);
      setPreviewError(getErrorMessage(error));
      return undefined;
    }
  }, []);

  useEffect(() => {
    previewSceneRef.current?.setCharacters(characters);
  }, [characters]);

  useEffect(() => {
    previewSceneRef.current?.updateSettings({
      maxFps,
      renderScale,
      transparentBackground
    });
  }, [maxFps, renderScale, transparentBackground]);

  return (
    <section className="mascot-stage" aria-label="Mascot stage">
      <div className="stage-surface" ref={surfaceRef}>
        {previewError ? (
          <p className="stage-error" role="status">
            Three.js描画の初期化に失敗しました: {previewError}
          </p>
        ) : null}
      </div>
    </section>
  );
};
