# Figma → eDocument 変換ワークフロー

## 0. 機能要求の前提
Figmaから出力したJSONは「Figma design - スクリーンショット 2025-06-22 5.43.20のコピー.png.json」である。
Figmaから出力したJSONを「Test_preprod_precontract.JSON」の形式に変換し、Salesforceの帳票開発ツールであるeDocumentにインポートしたい。（https://ecloudsoft.github.io/edoc/）

JSONの構造を解析した上で、Figmaから出力したJSONをどのように変換すれば良いか検討して。（デザイン→Salesforceインポートの効率化を目指したい。）

## 1. 事前準備

### Figmaでのデザイン作成時の注意点
- **要素の命名**: 意味のある名前を付ける（例: "生徒名", "契約日" など）
- **レイヤー構造**: 論理的な階層構造を維持
- **テキスト要素**: 実際の文字を含める
- **座標の整理**: できるだけ整数座標に配置

### Figma Raw プラグインの設定
- プラグインをインストール
- デザインを選択してJSONエクスポート
- `textContent`配列が含まれることを確認

## 2. 変換手順

### Step 1: JSONファイルの準備
```bash
# Figmaからエクスポートしたファイル
figma-design.json

# 変換後の出力ファイル
edocument-output.json
```

### Step 2: 変換実行
```javascript
// Node.js環境での実行例
const fs = require('fs');
const { convertFigmaToEDocument } = require('./converter');

// FigmaのJSONを読み込み
const figmaData = JSON.parse(fs.readFileSync('figma-design.json', 'utf8'));

// 変換実行
const eDocumentData = convertFigmaToEDocument(figmaData);

// eDocument形式で出力
fs.writeFileSync('edocument-output.json', JSON.stringify(eDocumentData, null, 2));
```

### Step 3: eDocumentへのインポート
1. Salesforce組織にアクセス
2. eDocumentアプリを開く
3. 「インポート」機能を使用
4. 生成されたJSONファイルをアップロード

## 3. 変換後の調整が必要な項目

### 自動変換できない項目
- **データバインディング**: Salesforceオブジェクトとの連携
- **動的テーブル**: 行数が動的に変わるテーブル
- **条件分岐**: 表示/非表示の条件設定
- **計算式**: 金額計算などの数式

### 手動調整が推奨される項目
- **フォント設定**: システムで利用可能なフォントに調整
- **色設定**: 印刷時の色再現性確認
- **改ページ設定**: A4サイズでの改ページ位置
- **マージン調整**: 印刷時の余白設定

## 4. 品質確認チェックリスト

### レイアウト確認
- [ ] 要素の配置が正確
- [ ] 文字サイズが適切
- [ ] 行間・文字間隔が自然
- [ ] ボーダー・背景色が正確

### 機能確認
- [ ] テキストの動的挿入が可能
- [ ] テーブルの行追加が動作
- [ ] 改ページが適切に動作
- [ ] PDF出力が正常

### パフォーマンス確認
- [ ] ファイルサイズが適切
- [ ] 読み込み速度が許容範囲
- [ ] 印刷速度が許容範囲

## 5. トラブルシューティング

### よくある問題と対処法

#### 座標がずれる場合
- Figmaでの座標を確認
- 変換式の調整（DPI設定の確認）
- 基準点の統一

#### フォントが反映されない場合
- Salesforceで利用可能なフォントを確認
- フォールバックフォントの設定
- Webフォントの利用検討

#### テキストが切れる場合
- 要素のサイズを確認
- `textContentVerticalAlign`の調整
- `contentPadding`の設定

#### 色が正確に再現されない場合
- RGB値の確認
- 透明度設定の確認
- 印刷時のカラープロファイル確認

## 6. 効率化のためのベストプラクティス

### デザインテンプレート化
- 共通レイアウトをFigmaテンプレート化
- コンポーネント化による再利用性向上
- デザインシステムの構築

### 自動化の推進
- CI/CDパイプラインに組み込み
- APIを使った自動変換
- バージョン管理との連携

### チーム運用
- デザイナーとエンジニアの連携フロー確立
- 変換品質のレビュープロセス
- ドキュメント化とナレッジ共有

## 7. 今後の発展可能性

### 機能拡張
- より多くのFigma要素タイプへの対応
- アニメーション効果の変換
- レスポンシブ対応

### 統合強化
- Figma Plugin化
- Salesforce Appへの統合
- リアルタイム同期機能

### AI活用
- デザイン最適化提案
- 自動レイアウト調整
- 印刷最適化
