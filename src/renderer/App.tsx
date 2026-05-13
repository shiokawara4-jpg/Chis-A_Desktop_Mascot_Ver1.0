import { useEffect, useState } from 'react';
import { defaultAppSettings, defaultCharacterInstances } from '../core';
import type { AppInfo, AppSettings, CharacterInstance } from '../core';
import { MascotStage } from './components/MascotStage';

type ConnectionState =
  | { status: 'checking'; label: string }
  | { status: 'ready'; label: string; appInfo: AppInfo }
  | { status: 'error'; label: string };

const getAppInfoSafely = async (): Promise<AppInfo> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  return window.desktopMascot.getAppInfo();
};

const getCharacterInstancesSafely = async (): Promise<CharacterInstance[]> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  const characterData = await window.desktopMascot.storage.getCharacters();
  return characterData.instances;
};

const getAppSettingsSafely = async (): Promise<AppSettings> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  return window.desktopMascot.storage.getSettings();
};

export const App = (): JSX.Element => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'checking',
    label: 'Electron API確認中'
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => defaultAppSettings);
  const [characterInstances, setCharacterInstances] = useState<CharacterInstance[]>(() => defaultCharacterInstances);

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
          label: 'Electron API確認失敗'
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getAppSettingsSafely()
      .then((settings) => {
        if (!isMounted) {
          return;
        }

        setAppSettings(settings);
      })
      .catch((error: unknown) => {
        console.error('Failed to read app settings.', error);
      });

    getCharacterInstancesSafely()
      .then((storedCharacters) => {
        if (!isMounted || storedCharacters.length === 0) {
          return;
        }

        setCharacterInstances(storedCharacters);
      })
      .catch((error: unknown) => {
        console.error('Failed to read stored characters.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className={`app-shell ${appSettings.transparentBackground ? 'app-shell--transparent' : 'app-shell--opaque'}`}>
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Step 1 scaffold</p>
            <h1>MMD Desktop Mascot</h1>
          </div>
          <span className={`status-pill status-pill--${connection.status}`}>{connection.label}</span>
        </header>

        <div className="content-grid">
          <MascotStage
            characters={characterInstances}
            maxFps={appSettings.maxFps}
            renderScale={appSettings.renderScale}
            transparentBackground={appSettings.transparentBackground}
          />

          <aside className="inspector-panel" aria-label="Project status">
            <h2>Project Core</h2>
            <dl className="info-list">
              <div>
                <dt>Renderer</dt>
                <dd>Three.js preview</dd>
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
