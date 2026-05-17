import { useEffect, useState, type ChangeEvent } from 'react';
import { defaultAppSettings, defaultCharacterData } from '../core';
import type { AppInfo, AppSettings, CharacterStorageData } from '../core';
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

const getCharacterDataSafely = async (): Promise<CharacterStorageData> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  return window.desktopMascot.storage.getCharacters();
};

const getAppSettingsSafely = async (): Promise<AppSettings> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  return window.desktopMascot.storage.getSettings();
};

const saveAppSettingsSafely = async (settings: AppSettings): Promise<void> => {
  if (!window.desktopMascot) {
    throw new Error('Desktop mascot preload API is not available.');
  }

  await window.desktopMascot.storage.saveSettings(settings);
};

export const App = (): JSX.Element => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'checking',
    label: 'Electron API確認中'
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => defaultAppSettings);
  const [characterData, setCharacterData] = useState<CharacterStorageData>(() => defaultCharacterData);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

    getCharacterDataSafely()
      .then((storedCharacterData) => {
        if (!isMounted) {
          return;
        }

        setCharacterData(storedCharacterData);
      })
      .catch((error: unknown) => {
        console.error('Failed to read stored characters.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePhysicsEnabledChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const previousSettings = appSettings;
    const nextSettings: AppSettings = {
      ...appSettings,
      physicsEnabled: event.currentTarget.checked
    };

    setAppSettings(nextSettings);
    setSettingsSaveError(null);
    setIsSavingSettings(true);

    void saveAppSettingsSafely(nextSettings)
      .catch((error: unknown) => {
        console.error('Failed to save physics setting.', error);
        setAppSettings(previousSettings);
        setSettingsSaveError('物理演算設定を保存できませんでした。');
      })
      .finally(() => {
        setIsSavingSettings(false);
      });
  };

  return (
    <main className={`app-shell ${appSettings.transparentBackground ? 'app-shell--transparent' : 'app-shell--opaque'}`}>
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Step 6 PMX preview</p>
            <h1>MMD Desktop Mascot</h1>
          </div>
          <span className={`status-pill status-pill--${connection.status}`}>{connection.label}</span>
        </header>

        <div className="content-grid">
          <MascotStage
            characters={characterData.instances}
            characterProfiles={characterData.profiles}
            maxFps={appSettings.maxFps}
            renderScale={appSettings.renderScale}
            transparentBackground={appSettings.transparentBackground}
            physicsEnabled={appSettings.physicsEnabled}
          />

          <aside className="inspector-panel" aria-label="Project status">
            <h2>Project Core</h2>
            <dl className="info-list">
              <div>
                <dt>Renderer</dt>
                <dd>Three.js PMX preview</dd>
              </div>
              <div>
                <dt>Characters</dt>
                <dd>{characterData.instances.length} instance</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{characterData.instances[0]?.state ?? 'none'}</dd>
              </div>
              <div>
                <dt>Physics</dt>
                <dd>
                  <label className="toggle-control">
                    <input
                      type="checkbox"
                      checked={appSettings.physicsEnabled}
                      disabled={isSavingSettings}
                      onChange={handlePhysicsEnabledChange}
                    />
                    <span>{appSettings.physicsEnabled ? 'ON' : 'OFF'}</span>
                  </label>
                </dd>
              </div>
              <div>
                <dt>App</dt>
                <dd>{connection.status === 'ready' ? `${connection.appInfo.appName} ${connection.appInfo.version}` : '-'}</dd>
              </div>
            </dl>
            {settingsSaveError ? (
              <p className="settings-error" role="status">
                {settingsSaveError}
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
};
