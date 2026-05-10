import { useEffect, useMemo, useState } from 'react';
import type { AppInfo, CharacterInstance } from '../core';
import { MascotStage } from './components/MascotStage';

type ConnectionState =
  | { status: 'checking'; label: string }
  | { status: 'ready'; label: string; appInfo: AppInfo }
  | { status: 'error'; label: string };

const initialCharacterInstances: CharacterInstance[] = [
  {
    instanceId: 'main-character',
    characterId: 'placeholder-character',
    currentCostumeId: 'default',
    position: { x: 160, y: 260 },
    scale: 1,
    state: 'idleStanding',
    isVisible: true,
    zIndex: 1,
    performanceProfile: 'medium'
  }
];

const getAppInfoSafely = async (): Promise<AppInfo> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  return window.desktopMascot.getAppInfo();
};

export const App = (): JSX.Element => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'checking',
    label: 'Electron APIを確認中'
  });

  const characterInstances = useMemo<CharacterInstance[]>(() => initialCharacterInstances, []);

  useEffect(() => {
    let isMounted = true;

    getAppInfoSafely()
      .then((appInfo) => {
        if (!isMounted) {
          return;
        }

        setConnection({
          status: 'ready',
          label: 'Electron API接続済み',
          appInfo
        });
      })
      .catch((error: unknown) => {
        console.error('Failed to read app info.', error);

        if (!isMounted) {
          return;
        }

        setConnection({
          status: 'error',
          label: 'Electron APIの確認に失敗'
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Step 1 scaffold</p>
            <h1>MMD Desktop Mascot</h1>
          </div>
          <span className={`status-pill status-pill--${connection.status}`}>{connection.label}</span>
        </header>

        <div className="content-grid">
          <MascotStage characters={characterInstances} />

          <aside className="inspector-panel" aria-label="Project status">
            <h2>Project Core</h2>
            <dl className="info-list">
              <div>
                <dt>Renderer</dt>
                <dd>React + Vite</dd>
              </div>
              <div>
                <dt>Characters</dt>
                <dd>{characterInstances.length} instance</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{characterInstances[0]?.state ?? 'none'}</dd>
              </div>
              <div>
                <dt>App</dt>
                <dd>{connection.status === 'ready' ? `${connection.appInfo.appName} ${connection.appInfo.version}` : '-'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
};
