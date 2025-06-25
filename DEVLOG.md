# 開発ログ - Figma to eDocument Converter

このファイルはプロジェクトの開発履歴を時系列で記録しています。

## 2025-06-25 (v3.0) - セキュリティ強化と機能追加

### 🎯 主要な改善

#### 1. 用紙サイズ・向き対応
- **用紙の向き選択機能**を追加
  - 縦向き（Portrait）と横向き（Landscape）対応
  - 全用紙サイズ（A4, A3, B4, B5, Letter, Legal）で対応
  - 動的サイズ表示機能
- **座標変換システム**を向きに対応
  - `paperSizes`構造を更新（portrait/landscape分離）
  - `convertFigmaToEDocument()`メソッドに`orientation`パラメータ追加

#### 2. セキュリティ強化（一般公開対応）
- **包括的な`.gitignore`**を作成
  - サンプルファイル・機密情報の除外
  - テストデータ・個人情報の保護
- **Git履歴のクリーンアップ**
  - `git filter-branch`による機密ファイルの完全削除
  - 強制プッシュによるリモートリポジトリの洗い替え
- **ハードコーディング削除**
  - 特定の顧客名・会社名を汎用パターンに変更
  - 汎用的な要素認識メソッドを実装

#### 3. CLAUDE.md日本語化
- 開発ガイドを完全日本語化
- 一般公開対応の開発ルールを追加
- セキュリティ注意事項を詳細化

### 🔧 技術的変更

#### UIコンポーネント追加
```html
<select id="orientationSelect">
    <option value="portrait">縦向き (Portrait)</option>
    <option value="landscape">横向き (Landscape)</option>
</select>
```

#### コア変換エンジン更新
```javascript
// 用紙サイズ構造の変更
this.paperSizes = {
    'A4': { 
        portrait: { width: 210, height: 297 },
        landscape: { width: 297, height: 210 }
    }
    // ...
};

// メソッドシグネチャ更新
convertFigmaToEDocument(figmaData, paperType = 'A4', orientation = 'portrait', scaleFactor = 1.0)
```

#### 汎用要素認識システム
```javascript
// ハードコーディング置き換え例
// Before: elementName.includes('説明担当者')
// After: this.isHeaderElement(elementName)

isHeaderElement(elementName) {
    const headerPatterns = [
        /会社/, /企業/, /法人/, /組織/, /団体/,
        /担当/, /責任/, /連絡/, /窓口/,
        /logo/i, /header/i, /top/i
    ];
    return headerPatterns.some(pattern => pattern.test(elementName));
}
```

### 📁 削除されたファイル
- `Test_preprod_precontract.json` - 実際の契約書サンプル
- `eDoc_Invoice_Sample.json` - 請求書サンプル
- `Figma design - スクリーンショット...png.json` - 特定顧客データ
- `formatted_figma.json` - テスト用フォーマット済みJSON
- `converted-edocument.json` - 変換結果サンプル

### 🛡️ セキュリティ対策
- **.gitignore**による自動除外設定
- **履歴からの完全削除**（`git filter-branch`使用）
- **汎用パターンマッチング**による特定情報の除去
- **一般公開対応**の開発ルール策定

---

## 2025-06-22～24 (v2.0) - pathベース変換と高精度化

### 🎯 主要改善

#### 1. pathベース変換システム実装
- **textContent配列の活用**
  - Figma Rawプラグインの`textContent`配列を自動検出
  - 階層パス文字列による正確な要素マッピング
  - フォールバック機能で従来方式もサポート
- **座標計算の高精度化**
  - `calculatePathBasedPosition()`メソッド実装
  - 要素名ベースの詳細位置計算
  - ドキュメント構造に基づくレイアウト推定

#### 2. 座標システム改良
- **衝突検出アルゴリズム**
  - 50回試行の配置システム
  - グリッドベース配置のフォールバック
  - 要素重複の完全回避
- **A4最適化**
  - 用紙サイズ制約の厳密化
  - 適切なマージン設定
  - サイズ制限の改良

#### 3. プレビュー・デバッグ機能強化
- **要素マッピング表**
  - Figma→eDocument変換詳細の可視化
  - path変換された要素の統計表示
  - デバッグ情報の包括的表示
- **スマート要素フィルタリング**
  - 無意味な画像要素の自動除外
  - `type: "RECTANGLE"`, `name: "Image"`の除外
  - デバッグ追跡による詳細ログ

### 🔧 技術実装

#### pathベース変換の核心
```javascript
processWithTextContent(figmaData, printElements) {
    console.log(`📝 textContent配列から ${figmaData.textContent.length} 個のテキスト要素を処理します`);
    
    const nodeMap = this.buildNodeMap(figmaData);
    
    figmaData.textContent.forEach((textItem, index) => {
        const node = this.findNodeByPath(textItem.path, nodeMap);
        
        if (node) {
            const position = this.calculatePathBasedPosition(textItem.path, node, nodeMap);
            this.convertTextNodeWithPath(node, textItem, printElements, position.x, position.y);
        }
    });
}
```

#### 衝突検出システム
```javascript
findNonOverlappingPosition(x, y, width, height) {
    let currentX = x, currentY = y;
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const hasOverlap = this.placedElements.some(placed => 
            this.isOverlapping(currentX, currentY, width, height, placed)
        );
        
        if (!hasOverlap) {
            return { x: currentX, y: currentY };
        }
        
        // 位置調整ロジック...
    }
}
```

### 📊 成果指標
- **変換精度**: 従来の階層推測からpath直接指定により大幅向上
- **要素配置**: 衝突検出により重複ゼロを実現
- **デバッグ効率**: マッピング表により問題特定時間を短縮

---

## 2025-06-21 (v1.0) - 初期実装

### 🎯 基本機能実装

#### 1. コア変換エンジン
- **FigmaToEDocumentConverter**クラス作成
- **基本座標変換**（pixel → mm）
- **テキスト要素変換**
- **図形・画像要素の基本対応**

#### 2. ブラウザGUI作成
- **ドラッグ&ドロップ**ファイルアップロード
- **リアルタイムプレビュー**機能
- **用紙サイズ選択**（A4, A3, B4, B5, Letter, Legal）
- **スケール調整**（0.1x～3.0x）

#### 3. Node.js CLI版
- **コマンドライン**変換ツール
- **npmスクリプト**対応
- **基本テスト**スイート

### 🔧 初期アーキテクチャ

#### ファイル構成
```
├── figma-to-edocument-converter.js  # CLI版変換器
├── converter-browser.js             # ブラウザ版変換器
├── index.html                      # WebGUI
├── app.js                         # フロントエンド制御
├── styles.css                     # スタイリング
├── package.json                   # Node.js設定
└── test-converter.js             # テストスクリプト
```

#### 基本変換フロー
1. **JSON解析**: Figma Raw形式の読み込み
2. **階層探索**: ネストされた要素の再帰処理
3. **座標計算**: 相対位置から絶対座標への変換
4. **出力生成**: eDocument互換JSON作成

### 📈 初期課題と解決
- **座標クラスタリング**: 要素が左上に集中
  - → 階層レイアウト計算の実装
- **サイズ不適合**: A4用紙からの要素はみ出し
  - → 厳密なサイズ制約の導入
- **要素重複**: 複数要素の位置衝突
  - → 次版での衝突検出実装につながる

---

## 開発統計

### バージョン別変更規模
- **v1.0**: 約1,500行（初期実装）
- **v2.0**: 約2,800行（+1,300行、pathベース変換追加）
- **v3.0**: 約3,200行（+400行、セキュリティ強化・向き対応）

### 主要機能の進化
| 機能 | v1.0 | v2.0 | v3.0 |
|------|------|------|------|
| 基本変換 | ✅ | ✅ | ✅ |
| プレビュー | ✅ | ✅ | ✅ |
| 衝突検出 | ❌ | ✅ | ✅ |
| pathベース変換 | ❌ | ✅ | ✅ |
| 用紙向き対応 | ❌ | ❌ | ✅ |
| セキュリティ対応 | ❌ | ❌ | ✅ |

### 解決した課題
1. **v1.0 → v2.0**: 座標精度、要素重複、デバッグ効率
2. **v2.0 → v3.0**: セキュリティ、一般公開対応、用紙柔軟性

---

## 次期開発予定

### 検討中の機能
- [ ] **多言語対応**: UI・ドキュメントの国際化
- [ ] **テンプレート機能**: 業界別の変換プリセット
- [ ] **バッチ処理**: 複数ファイルの一括変換
- [ ] **API化**: REST APIとしての提供
- [ ] **Figmaプラグイン**: Figma内での直接変換

### 技術的改善案
- [ ] **WebAssembly**: 高速変換エンジン
- [ ] **ワーカー並列化**: 大容量ファイル対応
- [ ] **キャッシュ機能**: 変換結果の保存・再利用
- [ ] **差分変換**: 増分更新の効率化