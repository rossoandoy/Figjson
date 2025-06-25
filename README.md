# Figma to eDocument Converter

FigmaからエクスポートしたJSONファイルを、Salesforce eDocumentにインポート可能な形式に変換するツールです。

## 🚀 オンライン版を使用

**GitHub Pages でWebアプリケーションを公開中！**

**👉 [Figma to eDocument Converter を使う](https://rossoandoy.github.io/Figjson/)**

ブラウザ上で直接変換でき、プレビュー機能付きの使いやすいインターフェースを提供しています。

## ✨ 主な機能

- 🎯 **Figma Raw プラグイン**のJSONファイルを完全対応
- 📄 **用紙サイズ・向き選択**（A4縦横、A3、B4、B5、Letter、Legal）
- 🔍 **リアルタイムプレビュー**で変換結果を事前確認
- 🗺️ **要素マッピング表**でFigma→eDocument変換詳細を表示
- 🤖 **pathベース変換**で高精度な要素配置
- 🛡️ **スマート要素フィルタリング**で不要な要素を自動除外

## 📖 使用方法

### 🌐 Webアプリ（推奨）

1. **[GitHub Pages版](https://rossoandoy.github.io/Figjson/)** にアクセス
2. Figma RawプラグインでエクスポートしたJSONファイルをアップロード
3. 用紙サイズと向きを選択
4. 「変換開始」をクリック
5. プレビューで結果を確認
6. 「ダウンロード」でeDocument JSONを取得

### 💻 コマンドライン版

```bash
node figma-to-edocument-converter.js <入力ファイル> <出力ファイル>
```

例:
```bash
node figma-to-edocument-converter.js "figma-design.json" "edocument-output.json"
```

### 🔧 開発者向け

```bash
# 依存関係インストール
npm install

# テスト実行
npm test

# npmスクリプト使用
npm run convert -- "input.json" "output.json"
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

## 🆕 v3.0の新機能

### 📐 用紙の向き対応
- **縦向き（Portrait）** と **横向き（Landscape）** の選択
- 全用紙サイズで向き選択可能（A4, A3, B4, B5, Letter, Legal）
- 動的サイズ表示でリアルタイム確認

### 🤖 pathベース変換システム
- Figma Rawプラグインの`textContent`配列を自動検出
- 階層パス文字列による高精度な要素マッピング
- フォールバック機能で従来の変換方式もサポート

### 🛡️ セキュリティ強化
- 機密情報を含むサンプルファイルの除外
- 汎用的なパターンマッチングでハードコーディング回避
- 一般公開対応のセキュリティ設計

### 🎯 改善された座標変換
- 親子関係を考慮した絶対座標計算
- より正確なピクセル→mm変換
- 用紙サイズに応じた適切なスケーリング

### 👁️ 高度なプレビュー機能
- 変換結果の視覚的確認
- 要素マッピング表で詳細情報表示
- 衝突検出とレイアウト最適化

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