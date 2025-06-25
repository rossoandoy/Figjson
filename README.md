# Figma to eDocument Converter

FigmaからエクスポートしたJSONファイルを、Salesforce eDocumentにインポート可能な形式に変換するツールです。

## 機能

- Figma Raw プラグインで出力されたJSONファイルを解析
- eDocument形式のJSONに変換
- テキスト要素の座標、サイズ、フォント情報を変換
- 画像・図形要素の基本情報を変換

## 使用方法

### 1. 基本的な変換

```bash
node figma-to-edocument-converter.js <入力ファイル> <出力ファイル>
```

例:
```bash
node figma-to-edocument-converter.js "Figma design.json" "edocument-output.json"
```

### 2. npmスクリプトを使用

```bash
npm run convert -- "Figma design.json" "edocument-output.json"
```

### 3. テスト実行

```bash
npm test
```

## ファイル構成

- `figma-to-edocument-converter.js` - メインの変換ツール
- `package.json` - Node.jsプロジェクト設定
- `test-converter.js` - テストスクリプト
- `Figjson_conversion_workflow.md` - 変換ワークフロー説明書

## 変換仕様

### 座標系変換
- Figma: ピクセル座標 (0,0が左上)
- eDocument: mm座標 (A4サイズ基準)
- 変換比率: 1pixel = 0.264583mm (96DPI基準)

### 対応要素

#### テキスト要素
- 位置・サイズ
- フォントサイズ・太さ
- 文字色・背景色
- テキストアライメント
- 文字間隔

#### 図形・画像要素
- 位置・サイズ
- 背景色
- 基本的な図形情報

### 新機能（v2.0）

### 🎯 改善された座標変換
- 親子関係を考慮した絶対座標計算
- より正確なピクセル→mm変換
- 用紙サイズに応じた適切なスケーリング

### 📐 用紙サイズ・スケール設定
- A4, A3, B4, B5, Letter, Legal対応
- ユーザー指定スケールファクター（0.1〜3.0倍）
- リアルタイムプレビュー機能

### 🖼️ 画像要素対応
- Figma画像要素の自動検出
- eDocument `type: "image"` 形式での出力
- 画像URLは手動設定が必要（セキュリティ上の理由）

### 👁️ プレビュー機能
- 変換結果の視覚的確認
- 要素の位置・サイズ表示
- eDocumentインポート前の事前チェック

### 🤖 自動テスト対応
- Playwright MCPによるeDocument自動テスト
- Salesforce環境での実際の動作確認
- スクリーンショット自動撮影

## 制限事項

以下の要素は手動調整が必要です：

- **データバインディング**: Salesforceオブジェクトとの連携
- **動的テーブル**: 行数が変わるテーブル
- **条件分岐**: 表示/非表示の条件
- **計算式**: 数式による値計算
- **画像URL**: セキュリティ上、実際のURLは手動設定
- **複雑な図形**: パスやベクター図形
- **アニメーション**: 動的効果

## トラブルシューティング

### 座標がずれる場合
- DPI設定を確認
- Figmaでの基準点を統一
- 変換比率を調整

### フォントが表示されない場合
- Salesforceで利用可能なフォントを確認
- フォールバックフォントを設定

### 要素が切れる場合
- 要素のサイズを確認
- パディング設定を調整

## 開発者向け情報

### クラス構造

```javascript
class FigmaToEDocumentConverter {
    convertFigmaToEDocument(figmaData) // メイン変換メソッド
    processNode(node, printElements)   // ノード処理
    convertTextNode(node, printElements) // テキスト変換
    convertImageOrShapeNode(node, printElements) // 図形変換
    convertPosition(position)          // 座標変換
    convertSize(size)                  // サイズ変換
    convertFontSize(fontSize)          // フォントサイズ変換
    convertColor(colorObj)             // 色変換
}
```

### 拡張方法

1. 新しい要素タイプの追加
2. 変換ロジックのカスタマイズ
3. 出力フォーマットの調整

## ライセンス

MIT License