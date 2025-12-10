# 1.環境構築手順
このプロジェクトの開発環境をセットアップするために、以下を実行してください。

## 必要なパッケージをインストール
```bash  
npm install
```

## 開発サーバーの起動
開発用のローカルサーバーを起動するには、以下のコマンドを実行します。
これにより、ホットリロード対応の開発環境が立ち上がります。
```bash  
npm run start
```

## コードのフォーマットとLintチェック
### コードのフォーマット
```bash  
npm run format
```

### JavaScriptのLintチェック
```bash  
npm run lint:js
```

### CSSのLintチェック
```bash  
npm run lint:css
```

### HTMLのLintチェック
```bash  
npm run lint:html
```

### すべてのチェックを一括に実行
```bash  
npm run check
```

## ビルド
```bash  
npm run build
```


# 2.ブランチ管理

feature/xxx-xxx-xxxでブランチを作成して作業を行なってください。作業が完了したらmainブランチにPRを投げてください。

# 3.確認サーバー
- https://emoce-inoue.github.io/xxx-xxx

# 4.開発について

モバイルファーストでのコーディング

基本は、メディアクエリ（min-width:768px）とし、デザインに沿って適宜決定とします。

デザイン内同レイアウトに関しては、コンポーネントの概念で記述すること。

## 命名規則
### クラス命名 (BEM記法)
- Block: `.block`（コンポーネントを示す）
- Element: `.block__element`（Block内の要素を示す）
- Modifier: `.block--modifier`（BlockやElementの状態やバリエーションを示す）

参考
https://qiita.com/sueshin/items/dcbaf3d8a0adb6b087db


***Components***

コンポーネントにする場合は、`c-`をプレフィックスとしてつけるようにお願いします。

***Layouts***

3カラムの配置やコンポーネント間のスペース調整など、配置場所に関わるスタイルは`l-`をプレフィックスとしてつけるようにお願いします。

### ID命名 (キャメルケース)
```<div id="userProfile"></div>```

### JavaScript関数・変数命名 (キャメルケース)
```
hogeData() => {
  const userName = 'hoge';
}
```

### CSS変数命名 (ケバブケース)
```--main-color: #fff;```

## HTML
ユーザビリティやアクセシビリティを意識した構造化マークアップ

HTMLにスタイルやスクリプトを直接埋め込まない。



## CSS
### プロパティの順番

可読性とメンテナンス性の向上のためプロパティの順序を統一する。

外観に影響を与える要素から内側に向かって記述する。

***ボックスモデル・レイアウト関連***
- `display`
- `position`
- `width`, `height`
- `margin`,`padding`
etc...

***背景・色関連***
- `background`
- `color`
- `border`
etc...

***フォント・テキストスタイル***
- `font-family`
- `font-size`
- `font-weight`
- `text-align`
- `line-height`
- `letter-spacing`
etc...

***アニメーション関連***
- `transition`
- `animation`
etc...

## JavaScript

ES6記法でお願いします。
既存LPはjQueryを使用している場合もありますが、新規LPでは原則使用しない。

スライダー等のライブラリに関してもできる限りjQueryを使用していないものを選定。
