// ブラウザ用のFigma to eDocument Converter
class FigmaToEDocumentConverter {
    constructor() {
        this.pointToMm = 0.352778; // 1 point = 0.352778 mm
        this.paperSizes = {
            'A4': { 
                portrait: { width: 210, height: 297 },
                landscape: { width: 297, height: 210 }
            },
            'A3': { 
                portrait: { width: 297, height: 420 },
                landscape: { width: 420, height: 297 }
            },
            'B4': { 
                portrait: { width: 257, height: 364 },
                landscape: { width: 364, height: 257 }
            },
            'B5': { 
                portrait: { width: 182, height: 257 },
                landscape: { width: 257, height: 182 }
            },
            'Letter': { 
                portrait: { width: 216, height: 279 },
                landscape: { width: 279, height: 216 }
            },
            'Legal': { 
                portrait: { width: 216, height: 356 },
                landscape: { width: 356, height: 216 }
            }
        };
    }

    convertFigmaToEDocument(figmaData, paperType = 'A4', orientation = 'portrait', scaleFactor = 1.0) {
        const paperSize = this.paperSizes[paperType][orientation];
        
        const eDocumentData = {
            panels: [{
                index: 0,
                name: 1,
                paperType: paperType,
                height: paperSize.height,
                width: paperSize.width,
                paperHeader: 20,
                paperFooter: 566.9927622683529,
                printElements: [],
                paperNumberLeft: 811,
                paperNumberTop: 573,
                paperNumberDisabled: true,
                paperNumberContinue: false,
                fontFamily: "sans-serif",
                overPrintOptions: {
                    content: "",
                    opacity: 0.7,
                    type: 1
                },
                watermarkOptions: {
                    content: "",
                    fillStyle: "rgba(184, 184, 184, 0.3)",
                    fontSize: "14px",
                    rotate: 25,
                    width: 200,
                    height: 200,
                    timestamp: false,
                    format: "YYYY-MM-DD HH:mm"
                }
            }]
        };

        // Figmaのキャンバスサイズを取得
        this.figmaWidth = figmaData.width || 1024;
        this.figmaHeight = figmaData.height || 724;
        this.scaleFactor = scaleFactor;
        this.targetPaperSize = paperSize;
        this.debugInfo = []; // デバッグ情報を格納
        this.placedElements = []; // 配置済み要素の位置管理

        // textContentがある場合はpathベース変換、ない場合は従来の変換
        if (figmaData.textContent && Array.isArray(figmaData.textContent)) {
            console.log('🎯 pathベース変換を使用します');
            this.processWithTextContent(figmaData, eDocumentData.panels[0].printElements);
        } else {
            console.log('📄 従来の階層探索変換を使用します');
            this.processNode(figmaData, eDocumentData.panels[0].printElements);
        }
        
        // デバッグ情報をコンソールに出力
        console.log('🔍 Figma→eDocument 変換デバッグ情報:', this.debugInfo);
        
        return eDocumentData;
    }

    processWithTextContent(figmaData, printElements) {
        console.log(`📝 textContent配列から ${figmaData.textContent.length} 個のテキスト要素を処理します`);
        
        // pathでノードを見つけるためのマップを作成
        const nodeMap = this.buildNodeMap(figmaData);
        
        // textContentの各要素を処理
        figmaData.textContent.forEach((textItem, index) => {
            // pathから該当ノードを検索
            const node = this.findNodeByPath(textItem.path, nodeMap);
            
            if (node) {
                // pathベースでより正確な座標を計算
                const position = this.calculatePathBasedPosition(textItem.path, node, nodeMap);
                
                this.convertTextNodeWithPath(node, textItem, printElements, position.x, position.y);
                
                // デバッグ情報を記録
                this.debugInfo.push({
                    type: 'PATH_BASED_TEXT',
                    name: textItem.name,
                    path: textItem.path,
                    text: textItem.text.substring(0, 50) + (textItem.text.length > 50 ? '...' : ''),
                    figmaSize: { width: node.width, height: node.height },
                    figmaFont: node.fontSize,
                    calculatedPosition: position,
                    eDocumentPosition: { 
                        left: this.convertPosition(position.x), 
                        top: this.convertPosition(position.y) 
                    }
                });
            } else {
                console.warn(`⚠️ pathに対応するノードが見つかりません: ${textItem.path}`);
                this.debugInfo.push({
                    type: 'PATH_NOT_FOUND',
                    name: textItem.name,
                    path: textItem.path,
                    text: textItem.text.substring(0, 50) + (textItem.text.length > 50 ? '...' : ''),
                    reason: 'pathに対応するノードが見つからない'
                });
            }
        });
    }

    buildNodeMap(node, path = '', map = new Map()) {
        // 現在のノードをマップに追加
        if (node.name) {
            const currentPath = path ? `${path}/${node.name}` : node.name;
            map.set(currentPath, node);
        }
        
        // 子ノードを再帰的に処理
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => {
                const childPath = path ? `${path}/${node.name || 'unnamed'}` : (node.name || 'unnamed');
                this.buildNodeMap(child, childPath, map);
            });
        }
        
        return map;
    }

    findNodeByPath(targetPath, nodeMap) {
        // pathの形式: "Figma design - [ファイル名].../Root/Groups/[要素名]"
        // ルートファイル名部分を除去して正規化
        const normalizedPath = targetPath.split('/').slice(1).join('/'); // "Root/Groups/[要素名]"
        
        // 完全一致を試行
        if (nodeMap.has(normalizedPath)) {
            return nodeMap.get(normalizedPath);
        }
        
        // 部分一致を試行（最後の要素名で検索）
        const elementName = targetPath.split('/').pop();
        for (const [mapPath, node] of nodeMap.entries()) {
            if (mapPath.endsWith(`/${elementName}`) || mapPath === elementName) {
                return node;
            }
        }
        
        return null;
    }

    calculatePathBasedPosition(path, node, nodeMap) {
        // pathの階層から位置を計算
        const pathSegments = path.split('/').slice(1); // ファイル名を除去
        const elementName = pathSegments[pathSegments.length - 1];
        
        // A4文書の実際のレイアウトに基づく座標計算（mmベース）
        let x = 40; // 基本左マージン（mm）
        let y = 40; // 基本上マージン（mm）
        
        console.log(`🎯 要素配置: "${elementName}"`);
        
        // ドキュメント構造に基づく詳細配置
        
        // === ヘッダーエリア ===
        if (elementName.includes('担当者') || elementName.match(/^[A-Z]{2,}/) || this.isHeaderElement(elementName)) {
            x = 200; y = 15; // 右上ヘッダー
        }
        
        // === メインタイトル ===
        else if (this.isTitleElement(elementName)) {
            x = 50; y = 50; // センター寄りタイトル
        } else if (this.isSubtitleElement(elementName)) {
            x = 50; y = 75; // サブタイトル
        }
        
        // === 契約者情報ブロック ===
        else if (this.isContractorElement(elementName)) {
            x = 40; y = 100; // 左側ラベル
        } else if (this.isDateElement(elementName)) {
            x = 120; y = 100; // 日付入力欄
        }
        
        // === 個人情報テーブルヘッダー ===
        else if (this.isPersonalInfoElement(elementName)) {
            const infoIndex = this.getPersonalInfoIndex(elementName);
            x = 40 + (infoIndex > 0 ? 160 : 0); 
            y = 140 + (infoIndex * 30); // テーブル行
        }
        
        // === セクションヘッダー ===
        else if (this.isSectionHeaderElement(elementName)) {
            x = 40; y = 210; // セクションタイトル
        } else if (this.isSectionDescriptionElement(elementName)) {
            x = 150; y = 210; // 説明文
        }
        
        // === コンテンツセクション ===
        else if (this.isContentSectionElement(elementName)) {
            x = 40; y = 240; // セクションタイトル
        }
        
        // === 費用・金額セクション ===
        else if (this.isCostElement(elementName)) {
            x = 40; y = 350; // 費用セクション
        }
        
        // === 右側説明エリア (Groups要素) ===
        else if (pathSegments.includes('Groups') || this.isRightPanelElement(elementName)) {
            // 右側説明パネルの配置
            x = 300; // 右側開始位置
            
            const rightPanelY = this.calculateRightPanelY(elementName);
            y = rightPanelY;
        }
        
        // === テキストタイプ別処理 ===
        else if (node.characters || (node.height && node.height > 40)) {
            // 長いテキストコンテンツ
            x = 40;
            y = 400 + (this.simpleHash(elementName) % 8) * 25;
        }
        
        // === その他要素のデフォルト配置 ===
        else {
            // 基本的な左カラム配置
            const hashOffset = this.simpleHash(elementName) % 10;
            x = 40 + (hashOffset % 3) * 15;
            y = 300 + hashOffset * 20;
        }
        
        // === 境界調整 ===
        // A4サイズ内に収める（210mm x 297mm、マージン考慮）
        const maxX = 180; // 右マージン考慮
        const maxY = 280; // 下マージン考慮
        
        x = Math.max(20, Math.min(x, maxX));
        y = Math.max(20, Math.min(y, maxY));
        
        console.log(`📍 最終座標: (${x}, ${y})`);
        
        return { x, y };
    }

    isHeaderElement(elementName) {
        // ヘッダー要素の汎用的な判定
        const headerPatterns = [
            /会社/, /企業/, /法人/, /組織/, /団体/,
            /担当/, /責任/, /連絡/, /窓口/,
            /logo/i, /header/i, /top/i
        ];
        return headerPatterns.some(pattern => pattern.test(elementName));
    }

    isTitleElement(elementName) {
        // タイトル要素の汎用的な判定
        const titlePatterns = [
            /について/, /書/, /表/, /票/, /証/, /書面/,
            /title/i, /heading/i, /main/i
        ];
        return titlePatterns.some(pattern => pattern.test(elementName));
    }

    isSubtitleElement(elementName) {
        // サブタイトル要素の汎用的な判定
        const subtitlePatterns = [
            /法/, /規約/, /条項/, /概要/, /説明/,
            /subtitle/i, /sub/i, /description/i
        ];
        return subtitlePatterns.some(pattern => pattern.test(elementName));
    }

    isContractorElement(elementName) {
        // 契約者・顧客情報要素の判定
        const contractorPatterns = [
            /契約者/, /顧客/, /お客/, /申込/, /依頼者/,
            /customer/i, /client/i, /contractor/i
        ];
        return contractorPatterns.some(pattern => pattern.test(elementName));
    }

    isDateElement(elementName) {
        // 日付要素の判定
        const datePatterns = [
            /年.*月.*日/, /日付/, /年月日/, /date/i, /時刻/, /time/i
        ];
        return datePatterns.some(pattern => pattern.test(elementName));
    }

    isPersonalInfoElement(elementName) {
        // 個人情報要素の判定
        const personalPatterns = [
            /名前/, /氏名/, /カナ/, /学年/, /年齢/, /住所/, /電話/,
            /name/i, /age/i, /address/i, /phone/i
        ];
        return personalPatterns.some(pattern => pattern.test(elementName));
    }

    getPersonalInfoIndex(elementName) {
        // 個人情報要素のインデックスを取得（テーブル配置用）
        if (elementName.includes('カナ') || elementName.includes('kana')) return 0;
        if (elementName.includes('名前') || elementName.includes('氏名') || elementName.includes('name')) return 1;
        if (elementName.includes('学年') || elementName.includes('年齢') || elementName.includes('age')) return 2;
        return 0;
    }

    isSectionHeaderElement(elementName) {
        // セクションヘッダー要素の判定
        const sectionPatterns = [
            /契約/, /追加/, /変更/, /新規/, /更新/,
            /section/i, /header/i, /title/i
        ];
        return sectionPatterns.some(pattern => pattern.test(elementName));
    }

    isSectionDescriptionElement(elementName) {
        // セクション説明要素の判定
        return elementName.includes('場合') || elementName.includes('について') || 
               elementName.includes('説明') || /description/i.test(elementName);
    }

    isContentSectionElement(elementName) {
        // コンテンツセクション要素の判定
        const contentPatterns = [
            /内容/, /詳細/, /項目/, /リスト/, /一覧/,
            /content/i, /detail/i, /item/i, /list/i
        ];
        return contentPatterns.some(pattern => pattern.test(elementName));
    }

    isCostElement(elementName) {
        // 費用・金額要素の判定
        const costPatterns = [
            /費用/, /料金/, /金額/, /価格/, /代金/, /請求/,
            /cost/i, /price/i, /fee/i, /amount/i, /bill/i
        ];
        return costPatterns.some(pattern => pattern.test(elementName));
    }

    isRightPanelElement(elementName) {
        // 右側パネル要素の判定
        const rightPanelPatterns = [
            /解除/, /変更/, /支払/, /方法/, /オフ/, /その他/, /回目/, /振替/, /内訳/,
            /cancellation/i, /payment/i, /method/i, /change/i, /other/i
        ];
        return rightPanelPatterns.some(pattern => pattern.test(elementName));
    }

    calculateRightPanelY(elementName) {
        // 右側パネル要素の縦位置を計算
        if (elementName.includes('解除') || elementName.includes('cancel')) return 120;
        if (elementName.includes('支払') || elementName.includes('payment')) return 160;
        if (elementName.includes('変更') || elementName.includes('change')) return 200;
        if (elementName.includes('その他') || elementName.includes('other')) return 240;
        if (elementName.includes('回目') || elementName.includes('回数')) return 280;
        if (elementName.includes('振替') || elementName.includes('内訳')) return 320;
        
        // デフォルト：ハッシュベース配置
        const groupIndex = this.simpleHash(elementName) % 12;
        return 120 + (groupIndex * 20);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return Math.abs(hash);
    }

    convertTextNodeWithPath(node, textItem, printElements, absoluteX, absoluteY) {
        // 基本的なconvertTextNodeと同じ処理だが、textItem.textを使用
        let elementWidth = this.convertSize(node.width || 80);
        let elementHeight = this.convertSize(node.height || 12);
        
        const maxWidth = this.targetPaperSize.width - 40;
        const maxHeight = this.targetPaperSize.height - 60;
        
        elementWidth = Math.min(elementWidth, maxWidth * 0.9);
        elementHeight = Math.min(elementHeight, Math.max(15, maxHeight * 0.15));
        
        const adjustedPosition = this.findNonOverlappingPosition(
            this.convertPosition(absoluteX),
            this.convertPosition(absoluteY),
            elementWidth,
            elementHeight
        );

        const element = {
            options: {
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                height: elementHeight,
                width: elementWidth,
                borderWidth: "0.75",
                fontSize: this.convertFontSize(node.fontSize || 12),
                title: this.sanitizeText(textItem.text || textItem.name || "テキスト"), // textItem.textを優先使用
                coordinateSync: false,
                widthHeightSync: false,
                letterSpacing: this.convertLetterSpacing(node.letterSpacing),
                contentPaddingLeft: 0,
                contentPaddingTop: 0,
                contentPaddingRight: 0,
                contentPaddingBottom: 0,
                qrCodeLevel: 0,
                textContentVerticalAlign: this.convertVerticalAlign(node.textAlignVertical),
                right: adjustedPosition.x + elementWidth,
                bottom: adjustedPosition.y + elementHeight,
                vCenter: adjustedPosition.x + elementWidth / 2,
                hCenter: adjustedPosition.y + elementHeight / 2
            },
            printElementType: {
                title: "テキスト",
                type: "text"
            }
        };

        // スタイル設定（既存のconvertTextNodeと同じ）
        if (node.fontWeight >= 600) {
            element.options.fontWeight = "bold";
        }

        if (node.textAlignHorizontal) {
            element.options.textAlign = this.convertTextAlign(node.textAlignHorizontal);
        }

        if (node.fills && node.fills[0] && node.fills[0].color) {
            element.options.color = this.convertColor(node.fills[0].color);
        }

        if (node.backgroundColor) {
            element.options.backgroundColor = node.backgroundColor;
        }

        if (node.strokes && node.strokes.length > 0) {
            element.options.borderLeft = "solid";
            element.options.borderTop = "solid";
            element.options.borderRight = "solid";
            element.options.borderBottom = "solid";
        }

        // 配置した要素の情報を記録
        this.placedElements.push({
            x: adjustedPosition.x,
            y: adjustedPosition.y,
            width: elementWidth,
            height: elementHeight
        });

        printElements.push(element);
    }

    processNode(node, printElements, layoutInfo = { x: 0, y: 0, flowDirection: 'vertical' }) {
        if (!node) return;

        // レイアウト情報を計算
        const currentLayout = this.calculateLayout(node, layoutInfo);

        // ノード自体を処理
        if (this.isTextNode(node)) {
            this.convertTextNode(node, printElements, currentLayout.x, currentLayout.y);
            
            // デバッグ情報を記録
            this.debugInfo.push({
                type: 'TEXT',
                name: node.name || 'Unnamed',
                figmaSize: { width: node.width, height: node.height },
                figmaFont: node.fontSize,
                estimatedPosition: { x: currentLayout.x, y: currentLayout.y },
                eDocumentPosition: { 
                    left: this.convertPosition(currentLayout.x), 
                    top: this.convertPosition(currentLayout.y) 
                }
            });
        } else if (this.isImageOrShapeNode(node) && !this.shouldSkipImageNode(node)) {
            this.convertImageOrShapeNode(node, printElements, currentLayout.x, currentLayout.y);
            
            // デバッグ情報を記録
            this.debugInfo.push({
                type: node.type,
                name: node.name || 'Unnamed',
                figmaSize: { width: node.width, height: node.height },
                estimatedPosition: { x: currentLayout.x, y: currentLayout.y },
                eDocumentPosition: { 
                    left: this.convertPosition(currentLayout.x), 
                    top: this.convertPosition(currentLayout.y) 
                }
            });
        } else if (this.shouldSkipImageNode(node)) {
            // スキップされた画像要素をデバッグ情報に記録
            this.debugInfo.push({
                type: 'SKIPPED_IMAGE',
                name: node.name || 'Unnamed',
                reason: 'Meaningless image element (type:RECTANGLE, name:Image with imageHash)',
                figmaSize: { width: node.width, height: node.height },
                imageHash: this.getImageHash(node)
            });
        }

        // 子ノードを再帰的に処理
        if (node.children && Array.isArray(node.children)) {
            let childX = currentLayout.x;
            let childY = currentLayout.y;
            
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                
                // 子要素のレイアウト情報を計算
                const childLayout = {
                    x: childX,
                    y: childY,
                    flowDirection: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical'
                };

                this.processNode(child, printElements, childLayout);

                // 次の子要素の位置を更新
                if (node.layoutMode === 'HORIZONTAL') {
                    childX += (child.width || 0) + 10; // 10px間隔
                } else {
                    childY += (child.height || 0) + 5; // 5px間隔
                }
            }
        }
    }

    calculateLayout(node, parentLayout) {
        // フレームタイプごとに異なるレイアウト計算
        if (node.type === 'FRAME') {
            return this.calculateFrameLayout(node, parentLayout);
        }
        
        // テキストや画像要素の場合
        return {
            x: parentLayout.x,
            y: parentLayout.y
        };
    }

    calculateFrameLayout(frame, parentLayout) {
        // フレーム名に基づく推定レイアウト
        const frameName = frame.name.toLowerCase();
        
        // ヘッダー領域の推定
        if (frameName.includes('header') || frameName.includes('top')) {
            return {
                x: parentLayout.x,
                y: parentLayout.y
            };
        }
        
        // サイドバー領域の推定（右側）
        if (frameName.includes('groups') && frame.width < this.figmaWidth * 0.7) {
            return {
                x: parentLayout.x + (this.figmaWidth - frame.width),
                y: parentLayout.y
            };
        }
        
        // メインコンテンツ領域の推定
        if (frameName.includes('text') || frameName.includes('content')) {
            return {
                x: parentLayout.x + 20, // 左マージン
                y: parentLayout.y + 20  // 上マージン
            };
        }
        
        // デフォルト
        return {
            x: parentLayout.x,
            y: parentLayout.y
        };
    }

    isTextNode(node) {
        return node.type === 'TEXT' && node.characters;
    }

    isImageOrShapeNode(node) {
        return ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'VECTOR', 'IMAGE'].includes(node.type);
    }

    shouldSkipImageNode(node) {
        // type:RECTANGLEでname:Imageは情報がない（imageHashがあっても画像のインポートはできない）
        // ため、除外する
        if (node.type === 'RECTANGLE' && 
            node.name && 
            node.name.toLowerCase() === 'image' &&
            this.getImageHash(node)) {
            return true;
        }
        
        // 非常に小さな画像要素（装飾的なアイコンなど）も除外
        if (node.type === 'RECTANGLE' && 
            this.getImageHash(node) &&
            node.width && node.height &&
            node.width < 20 && node.height < 20) {
            return true;
        }
        
        return false;
    }

    getImageHash(node) {
        if (node.fills && Array.isArray(node.fills)) {
            for (const fill of node.fills) {
                if (fill.type === 'IMAGE' && fill.imageHash) {
                    return fill.imageHash;
                }
            }
        }
        return null;
    }

    convertTextNode(node, printElements, absoluteX, absoluteY) {
        // 適切なサイズを計算
        let elementWidth = this.convertSize(node.width || 80);
        let elementHeight = this.convertSize(node.height || 12);
        
        // 用紙サイズに収まるように調整（より厳密な制約）
        const maxWidth = this.targetPaperSize.width - 40; // 20mmマージン×2
        const maxHeight = this.targetPaperSize.height - 60; // 30mmマージン×2
        
        // テキスト要素の適切なサイズ制限
        elementWidth = Math.min(elementWidth, maxWidth * 0.9);
        elementHeight = Math.min(elementHeight, Math.max(15, maxHeight * 0.15));
        
        // 衝突回避位置を計算
        const adjustedPosition = this.findNonOverlappingPosition(
            this.convertPosition(absoluteX),
            this.convertPosition(absoluteY),
            elementWidth,
            elementHeight
        );

        const element = {
            options: {
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                height: elementHeight,
                width: elementWidth,
                borderWidth: "0.75",
                fontSize: this.convertFontSize(node.fontSize || 12),
                title: this.sanitizeText(node.characters || node.name || "テキスト"),
                coordinateSync: false,
                widthHeightSync: false,
                letterSpacing: this.convertLetterSpacing(node.letterSpacing),
                contentPaddingLeft: 0,
                contentPaddingTop: 0,
                contentPaddingRight: 0,
                contentPaddingBottom: 0,
                qrCodeLevel: 0,
                textContentVerticalAlign: this.convertVerticalAlign(node.textAlignVertical),
                right: adjustedPosition.x + elementWidth,
                bottom: adjustedPosition.y + elementHeight,
                vCenter: adjustedPosition.x + elementWidth / 2,
                hCenter: adjustedPosition.y + elementHeight / 2
            },
            printElementType: {
                title: "テキスト",
                type: "text"
            }
        };

        // フォント設定
        if (node.fontWeight >= 600) {
            element.options.fontWeight = "bold";
        }

        // テキストアライメント
        if (node.textAlignHorizontal) {
            element.options.textAlign = this.convertTextAlign(node.textAlignHorizontal);
        }

        // 色設定
        if (node.fills && node.fills[0] && node.fills[0].color) {
            element.options.color = this.convertColor(node.fills[0].color);
        }

        // 背景色設定
        if (node.backgroundColor) {
            element.options.backgroundColor = node.backgroundColor;
        }

        // ボーダー設定
        if (node.strokes && node.strokes.length > 0) {
            element.options.borderLeft = "solid";
            element.options.borderTop = "solid";
            element.options.borderRight = "solid";
            element.options.borderBottom = "solid";
        }

        // 配置した要素の情報を記録
        this.placedElements.push({
            x: adjustedPosition.x,
            y: adjustedPosition.y,
            width: elementWidth,
            height: elementHeight
        });

        printElements.push(element);
    }

    findNonOverlappingPosition(x, y, width, height) {
        let currentX = x;
        let currentY = y;
        const maxAttempts = 50;
        let attempt = 0;
        
        while (attempt < maxAttempts) {
            // 現在の位置で重複チェック
            const hasOverlap = this.placedElements.some(placed => 
                this.isOverlapping(currentX, currentY, width, height, placed)
            );
            
            if (!hasOverlap) {
                // 用紙の境界内に収まるかチェック
                if (currentX + width <= this.targetPaperSize.width - 10 && 
                    currentY + height <= this.targetPaperSize.height - 10 &&
                    currentX >= 10 && currentY >= 10) {
                    return { x: currentX, y: currentY };
                }
            }
            
            // 重複がある場合、位置を調整
            if (attempt < 25) {
                // 最初は右側に移動
                currentX += width + 5;
                
                // 右端に達したら下に移動して左端に戻る
                if (currentX + width > this.targetPaperSize.width - 10) {
                    currentX = 10;
                    currentY += height + 5;
                }
            } else {
                // 25回以降はグリッド配置を試行
                const gridSize = 20;
                const gridX = 10 + (attempt - 25) % 10 * gridSize;
                const gridY = 10 + Math.floor((attempt - 25) / 10) * gridSize;
                currentX = gridX;
                currentY = gridY;
            }
            
            attempt++;
        }
        
        // 最終的に適切な位置が見つからない場合は元の位置を返す
        return { x: Math.max(10, Math.min(x, this.targetPaperSize.width - width - 10)), 
                 y: Math.max(10, Math.min(y, this.targetPaperSize.height - height - 10)) };
    }

    isOverlapping(x1, y1, w1, h1, placed) {
        const x2 = placed.x;
        const y2 = placed.y;
        const w2 = placed.width;
        const h2 = placed.height;
        
        // 2つの矩形が重複しているかチェック
        return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
    }

    convertImageOrShapeNode(node, printElements, absoluteX, absoluteY) {
        // 画像とその他の図形を区別して処理
        const isImage = node.type === 'RECTANGLE' && node.fills && 
                       node.fills.some(fill => fill.type === 'IMAGE');
        
        if (isImage) {
            // 画像要素として処理
            const element = {
                options: {
                    left: this.convertPosition(absoluteX),
                    top: this.convertPosition(absoluteY),
                    height: this.convertSize(node.height || 20),
                    width: this.convertSize(node.width || 100),
                    borderWidth: "0.75",
                    coordinateSync: false,
                    widthHeightSync: false,
                    right: this.convertPosition(absoluteX + (node.width || 100)),
                    bottom: this.convertPosition(absoluteY + (node.height || 20)),
                    vCenter: this.convertPosition(absoluteX + (node.width || 100) / 2),
                    hCenter: this.convertPosition(absoluteY + (node.height || 20) / 2),
                    fit: "contain", // 画像のフィット方法
                    src: "", // 実際の画像URLは手動で設定が必要
                    field: `image_${Date.now()}` // 一意のフィールド名
                },
                printElementType: {
                    title: "图片",
                    type: "image"
                }
            };
            
            printElements.push(element);
        } else {
            // 図形要素はテキスト要素として処理（プレースホルダー）
            const element = {
                options: {
                    left: this.convertPosition(absoluteX),
                    top: this.convertPosition(absoluteY),
                    height: this.convertSize(node.height || 20),
                    width: this.convertSize(node.width || 100),
                    borderWidth: "0.75",
                    fontSize: 8,
                    title: `[${node.type}] ${node.name || "図形要素"}`,
                    coordinateSync: false,
                    widthHeightSync: false,
                    letterSpacing: 0,
                    contentPaddingLeft: 2,
                    contentPaddingTop: 2,
                    contentPaddingRight: 2,
                    contentPaddingBottom: 2,
                    qrCodeLevel: 0,
                    textContentVerticalAlign: "middle",
                    textAlign: "center",
                    right: this.convertPosition(absoluteX + (node.width || 100)),
                    bottom: this.convertPosition(absoluteY + (node.height || 20)),
                    vCenter: this.convertPosition(absoluteX + (node.width || 100) / 2),
                    hCenter: this.convertPosition(absoluteY + (node.height || 20) / 2)
                },
                printElementType: {
                    title: "テキスト",
                    type: "text"
                }
            };

            // 背景色（図形要素のみ）
            if (node.fills && node.fills[0] && node.fills[0].color) {
                element.options.backgroundColor = this.convertColor(node.fills[0].color);
            }

            // ストローク
            if (node.strokes && node.strokes.length > 0) {
                element.options.borderLeft = "solid";
                element.options.borderTop = "solid";
                element.options.borderRight = "solid";
                element.options.borderBottom = "solid";
                if (node.strokes[0].color) {
                    element.options.borderColor = this.convertColor(node.strokes[0].color);
                }
            }

            printElements.push(element);
        }
    }

    convertPosition(position) {
        // Figmaのピクセル座標をeDocumentのmm座標に変換
        // より正確な変換式: 1pixel ≈ 0.264583mm (96DPI基準) で基本変換
        // その後、用紙サイズとスケールファクターを適用
        const mmPosition = position * 0.264583;
        
        // 用紙サイズに合わせたスケーリング
        const scaleX = (this.targetPaperSize.width - 20) / (this.figmaWidth * 0.264583);
        const scaleY = (this.targetPaperSize.height - 20) / (this.figmaHeight * 0.264583);
        const scale = Math.min(scaleX, scaleY) * this.scaleFactor;
        
        const scaledPosition = mmPosition * scale;
        
        return Math.round(scaledPosition * 100) / 100 + 10; // 10mmマージン追加
    }

    convertSize(size) {
        // サイズは基本的なピクセル→mm変換のみで、過度なスケーリングは避ける
        const mmSize = size * 0.264583;
        
        // 軽微なスケール調整のみ（ユーザー指定のスケールファクターのみ適用）
        let scaledSize = mmSize * this.scaleFactor;
        
        // A4用紙のサイズ制約を考慮したより適切なサイズ調整
        const maxWidth = this.targetPaperSize.width - 40; // 20mmマージン×2
        const maxHeight = this.targetPaperSize.height - 60; // 30mmマージン×2
        
        // 極端に大きいサイズを制限
        if (scaledSize > maxWidth * 0.8) {
            scaledSize = maxWidth * 0.8;
        }
        if (scaledSize > maxHeight * 0.6) {
            scaledSize = maxHeight * 0.6;
        }
        
        // 最小サイズを確保（読みやすさのため）
        const minSize = 8;
        
        return Math.max(minSize, Math.round(scaledSize * 100) / 100);
    }

    convertFontSize(fontSize) {
        // フォントサイズは実用的な範囲に保つ（6-18pt）
        const ptSize = fontSize * 0.75; // ピクセルからポイントへの基本変換
        const scaledSize = ptSize * this.scaleFactor;
        
        // 実用的な範囲内に制限
        return Math.max(6, Math.min(18, Math.round(scaledSize * 100) / 100));
    }

    convertLetterSpacing(letterSpacing) {
        if (!letterSpacing || letterSpacing.unit === 'PERCENT') {
            return letterSpacing ? letterSpacing.value : 0;
        }
        return 0;
    }

    convertVerticalAlign(align) {
        const alignMap = {
            'TOP': 'top',
            'CENTER': 'middle',
            'BOTTOM': 'bottom'
        };
        return alignMap[align] || 'middle';
    }

    convertTextAlign(align) {
        const alignMap = {
            'LEFT': 'left',
            'CENTER': 'center',
            'RIGHT': 'right'
        };
        return alignMap[align] || 'left';
    }

    convertColor(colorObj) {
        if (!colorObj) return '#000000';
        
        const r = Math.round((colorObj.r || 0) * 255);
        const g = Math.round((colorObj.g || 0) * 255);
        const b = Math.round((colorObj.b || 0) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    sanitizeText(text) {
        if (!text) return "";
        // 改行文字を適切に処理し、HTMLエスケープ
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').substring(0, 200);
    }

    getConversionStats(eDocumentData) {
        const elements = eDocumentData.panels[0].printElements;
        const textElements = elements.filter(el => el.printElementType.type === 'text');
        const imageElements = elements.filter(el => el.printElementType.type === 'image');
        const skippedElements = this.debugInfo.filter(info => info.type === 'SKIPPED_IMAGE');
        const pathBasedElements = this.debugInfo.filter(info => info.type === 'PATH_BASED_TEXT');
        const pathNotFoundElements = this.debugInfo.filter(info => info.type === 'PATH_NOT_FOUND');
        
        return {
            totalElements: elements.length,
            textElements: textElements.length,
            imageElements: imageElements.length,
            skippedElements: skippedElements.length,
            pathBasedElements: pathBasedElements.length,
            pathNotFoundElements: pathNotFoundElements.length,
            paperSize: eDocumentData.panels[0].paperType,
            paperWidth: eDocumentData.panels[0].width,
            paperHeight: eDocumentData.panels[0].height
        };
    }
}

// グローバルに公開
window.FigmaToEDocumentConverter = FigmaToEDocumentConverter;