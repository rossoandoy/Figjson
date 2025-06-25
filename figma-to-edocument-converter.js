const fs = require('fs');

class FigmaToEDocumentConverter {
    constructor() {
        this.pointToMm = 0.352778; // 1 point = 0.352778 mm
    }

    convertFigmaToEDocument(figmaData) {
        const eDocumentData = {
            panels: [{
                index: 0,
                name: 1,
                paperType: "A4",
                height: 210,
                width: 297,
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

        this.processNode(figmaData, eDocumentData.panels[0].printElements);
        
        return eDocumentData;
    }

    processNode(node, printElements) {
        if (!node || !node.children) {
            if (node && this.isTextNode(node)) {
                this.convertTextNode(node, printElements);
            } else if (node && this.isImageOrShapeNode(node)) {
                this.convertImageOrShapeNode(node, printElements);
            }
            return;
        }

        for (const child of node.children) {
            this.processNode(child, printElements);
        }
    }

    isTextNode(node) {
        return node.type === 'TEXT' && node.characters;
    }

    isImageOrShapeNode(node) {
        return node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || 
               node.type === 'POLYGON' || node.type === 'VECTOR';
    }

    convertTextNode(node, printElements) {
        const element = {
            options: {
                left: this.convertPosition(node.x || 0),
                top: this.convertPosition(node.y || 0),
                height: this.convertSize(node.height),
                width: this.convertSize(node.width),
                borderWidth: "0.75",
                fontSize: this.convertFontSize(node.fontSize || 12),
                title: node.characters || node.name || "テキスト",
                coordinateSync: false,
                widthHeightSync: false,
                letterSpacing: this.convertLetterSpacing(node.letterSpacing),
                contentPaddingLeft: 0,
                contentPaddingTop: 0,
                contentPaddingRight: 0,
                contentPaddingBottom: 0,
                qrCodeLevel: 0,
                textContentVerticalAlign: this.convertVerticalAlign(node.textAlignVertical),
                right: this.convertPosition((node.x || 0) + node.width),
                bottom: this.convertPosition((node.y || 0) + node.height),
                vCenter: this.convertPosition((node.x || 0) + node.width / 2),
                hCenter: this.convertPosition((node.y || 0) + node.height / 2)
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

        printElements.push(element);
    }

    convertImageOrShapeNode(node, printElements) {
        // 画像や図形はテキスト要素として処理（プレースホルダー）
        const element = {
            options: {
                left: this.convertPosition(node.x || 0),
                top: this.convertPosition(node.y || 0),
                height: this.convertSize(node.height),
                width: this.convertSize(node.width),
                borderWidth: "0.75",
                fontSize: 10,
                title: node.name || "図形要素",
                coordinateSync: false,
                widthHeightSync: false,
                letterSpacing: 0,
                contentPaddingLeft: 0,
                contentPaddingTop: 0,
                contentPaddingRight: 0,
                contentPaddingBottom: 0,
                qrCodeLevel: 0,
                textContentVerticalAlign: "middle",
                right: this.convertPosition((node.x || 0) + node.width),
                bottom: this.convertPosition((node.y || 0) + node.height),
                vCenter: this.convertPosition((node.x || 0) + node.width / 2),
                hCenter: this.convertPosition((node.y || 0) + node.height / 2)
            },
            printElementType: {
                title: "テキスト",
                type: "text"
            }
        };

        // 背景色
        if (node.fills && node.fills[0] && node.fills[0].color) {
            element.options.backgroundColor = this.convertColor(node.fills[0].color);
        }

        printElements.push(element);
    }

    convertPosition(position) {
        // Figmaのピクセル座標をeDocumentのmm座標に変換
        // 仮定: 1pixel = 0.264583mm (96DPI基準)
        return Math.round(position * 0.264583 * 100) / 100;
    }

    convertSize(size) {
        return Math.round(size * 0.264583 * 100) / 100;
    }

    convertFontSize(fontSize) {
        // フォントサイズの変換（必要に応じて調整）
        return Math.round(fontSize * 0.75 * 100) / 100;
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
        
        const r = Math.round(colorObj.r * 255);
        const g = Math.round(colorObj.g * 255);
        const b = Math.round(colorObj.b * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// メイン実行関数
function convertFigmaToEDocument(inputPath, outputPath) {
    try {
        // Figma JSONファイルを読み込み
        const figmaData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        
        // 変換実行
        const converter = new FigmaToEDocumentConverter();
        const eDocumentData = converter.convertFigmaToEDocument(figmaData);
        
        // eDocument形式で出力
        fs.writeFileSync(outputPath, JSON.stringify(eDocumentData, null, 2));
        
        console.log(`変換完了: ${inputPath} -> ${outputPath}`);
        console.log(`生成された要素数: ${eDocumentData.panels[0].printElements.length}`);
        
        return eDocumentData;
        
    } catch (error) {
        console.error('変換エラー:', error.message);
        throw error;
    }
}

// CLIとして実行する場合
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('使用方法: node figma-to-edocument-converter.js <入力ファイル> <出力ファイル>');
        console.log('例: node figma-to-edocument-converter.js figma-design.json edocument-output.json');
        process.exit(1);
    }
    
    const [inputPath, outputPath] = args;
    convertFigmaToEDocument(inputPath, outputPath);
}

module.exports = { FigmaToEDocumentConverter, convertFigmaToEDocument };