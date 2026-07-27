# 画像の配置場所

LPで使う画像はここに置きます。ファイル名は各コンポーネントが参照しているものに合わせてください。

## posts/（投稿例・自動横スクロール）
`components/Network.tsx` の `posts` 配列が参照します。

| ファイル名 | 内容 |
| --- | --- |
| `post-izakaya.png` | 新橋居酒屋5選 まとめ投稿 |
| `post-cosme.png` | Qoo10 新作コスメ まとめ投稿 |
| `post-toutvert.png` | トゥヴェール バランシングGAローション レビュー |
| `post-present.png` | AVVENTURA ポーチ プレゼント企画 |

推奨サイズ: 縦長 4:5（例 1080×1350px）

## results/（導入前後 Before / After）
`components/ResultsBeforeAfter.tsx` が参照します。

| ファイル名 | 内容 |
| --- | --- |
| `before-profile.png` | 導入前：プロフィール画面（フォロワーのみに届く状態） |
| `after-explore.png` | 導入後：発見・おすすめタブ掲載画面（「六本木グルメ」上位表示） |

推奨サイズ: スマホ画面のスクショ（縦長 9:16 前後）

## 画像を入れたあとの差し替え手順
各コンポーネント内の「［画像スロット］」プレースホルダー `<div>` を、`next/image` の `<Image>` に置き換えます。スニペットは各ファイル冒頭のコメント参照。
