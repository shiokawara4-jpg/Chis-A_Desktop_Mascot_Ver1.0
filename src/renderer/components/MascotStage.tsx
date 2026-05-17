import { useEffect, useRef, useState } from 'react';
import type { CharacterInstance, CharacterProfile } from '../../core';
import { reportRendererDiagnostic } from '../diagnostics/rendererDiagnostics';
import { MascotPreviewScene, type MascotModelStatus } from '../three/mascotPreviewScene';

type MascotStageProps = {
  characters: CharacterInstance[];
  characterProfiles: CharacterProfile[];
  maxFps: number;
  renderScale: number;
  transparentBackground: boolean;
  physicsEnabled: boolean;
};

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const MascotStage = ({
  characters,
  characterProfiles,
  maxFps,
  renderScale,
  transparentBackground,
  physicsEnabled
}: MascotStageProps): JSX.Element => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const previewSceneRef = useRef<MascotPreviewScene | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [modelStatuses, setModelStatuses] = useState<Record<string, MascotModelStatus>>({});
  const visibleModelStatuses = Object.values(modelStatuses);

  useEffect(() => {
    if (!surfaceRef.current) {
      return undefined;
    }

    try {
      setModelStatuses({});

      const previewScene = new MascotPreviewScene({
        container: surfaceRef.current,
        characters,
        characterProfiles,
        maxFps,
        renderScale,
        transparentBackground,
        physicsEnabled,
        onModelStatusChange: (status) => {
          setModelStatuses((currentStatuses) => {
            const nextStatuses = { ...currentStatuses };

            if (status.kind === 'idle' || status.kind === 'ready') {
              delete nextStatuses[status.instanceId];
              return nextStatuses;
            }

            nextStatuses[status.instanceId] = status;
            return nextStatuses;
          });
        },
        onDiagnostic: (entry) => {
          void reportRendererDiagnostic(entry);
        }
      });

      previewSceneRef.current = previewScene;
      setPreviewError(null);

      return () => {
        previewScene.dispose();
        previewSceneRef.current = null;
        setModelStatuses({});
      };
    } catch (error: unknown) {
      console.error('Failed to initialize Three.js mascot preview.', error);
      setPreviewError(getErrorMessage(error));
      return undefined;
    }
  }, []);

  useEffect(() => {
    previewSceneRef.current?.setCharacters(characters, characterProfiles);
  }, [characters, characterProfiles]);

  useEffect(() => {
    previewSceneRef.current?.updateSettings({
      maxFps,
      renderScale,
      transparentBackground,
      physicsEnabled
    });
  }, [maxFps, renderScale, transparentBackground, physicsEnabled]);

  return (
    <section className="mascot-stage" aria-label="Mascot stage">
      <div className="stage-surface" ref={surfaceRef}>
        {previewError ? (
          <p className="stage-error" role="status">
            Three.js描画の初期化に失敗しました: {previewError}
          </p>
        ) : null}
        {visibleModelStatuses.length > 0 ? (
          <div className="stage-status-stack" aria-live="polite">
            {visibleModelStatuses.map((status) => (
              <p
                className={`stage-status stage-status--${status.kind}`}
                key={status.instanceId}
                role={status.kind === 'error' ? 'alert' : 'status'}
              >
                {status.message}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
