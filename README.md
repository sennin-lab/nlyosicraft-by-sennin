<!-- FILE: README.md -->
<!-- RESPONSIBILITY: プロジェクトの実行方法・iPadでの使い方・配信設定を簡潔に示す。 -->
<!-- EDIT: 自由 -->

# Voxel Survival（ブラウザ版 Minecraft風ゲーム）

## 概要
- **ビルド不要**: ES Modules と WebGL2 のみで動く静的サイトです。npm・バンドラ・サーバーコードは使いません。
- 対応: PC（Chrome / Safari / Edge）、iPad（iPadOS 15以降のSafari）

## ローカルでの動作確認
リポジトリのルートで以下を実行し、ブラウザで `http://localhost:8080` を開きます。

```bash
python3 -m http.server 8080
```

## iPadでの使い方
1. Safariで開く（共有ボタン → 「ホーム画面に追加」で全画面表示になります）
2. 画面左側をドラッグで移動、右側をなぞって視点
3. 右下「壊す」を長押しで破壊、「置く」で設置（押し続けると連打）、「跳ぶ」でジャンプ
4. 画面下のホットバーをタップして使うブロックを選択
5. 画面左上「||」でメニュー（新しいワールド、クリエイティブ切替、バグ報告）

## PCでの操作
- 移動: WASD / 矢印キー、ジャンプ: Space
- 破壊: マウス左長押し（または F キー）、設置: 右クリック（または E キー）
- 視点: 右ボタンをドラッグ、スロット: 数字キー 1〜9 またはホイール

## Render 配信設定
- 種別: Static Site
- Build Command: 空欄
- Publish Directory: `.`
- Branch: `main`
- ルーティング(rewrite): なし

クライアント側ルーティングを使わないため rewrite は不要です。`/*` を `index.html` に rewrite すると `/src/*.js` まで `index.html` になり、`type="module"` が壊れます。
