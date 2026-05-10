# MMD Desktop Mascot

Electron + React + Vite + TypeScript の最小構成です。今回はMMD表示、PMX/VMD読み込み、衣装変更などはまだ実装していません。

## 初回セットアップ

```bash
npm install
```

PowerShellで `npm` が実行ポリシーに止められる場合は、次のように実行してください。

```bash
npm.cmd install
```

## 開発起動

```bash
npm run dev
```

PowerShellで止められる場合:

```bash
npm.cmd run dev
```

Viteの開発サーバーが起動し、その上でElectronウィンドウが開きます。

## ビルド確認

```bash
npm run build
```

PowerShellで止められる場合:

```bash
npm.cmd run build
```

TypeScriptの型チェック、Electron main/preloadのビルド、React rendererのビルドを行います。ビルド結果は `dist/` に出力されます。

## 今回の範囲

- `src/main`: Electron main process
- `src/preload`: rendererへ公開する安全なAPI
- `src/renderer`: React UI
- `src/core`: UIやWindows固有処理から分けた将来用の型とインターフェース

次の段階では、StorageAdapterのJSON実装やThree.js描画領域を小さく追加していく想定です。
