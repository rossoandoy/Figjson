const { convertFigmaToEDocument } = require('./figma-to-edocument-converter');
const path = require('path');

// テスト実行
function runTest() {
    try {
        console.log('=== Figma to eDocument 変換テスト ===\n');
        
        const inputFile = path.join(__dirname, 'Figma design - スクリーンショット 2025-06-22 5.43.20のコピー.png.json');
        const outputFile = path.join(__dirname, 'converted-edocument.json');
        
        console.log(`入力ファイル: ${inputFile}`);
        console.log(`出力ファイル: ${outputFile}\n`);
        
        const result = convertFigmaToEDocument(inputFile, outputFile);
        
        console.log('\n=== 変換結果サマリー ===');
        console.log(`パネル数: ${result.panels.length}`);
        console.log(`印刷要素数: ${result.panels[0].printElements.length}`);
        console.log(`用紙サイズ: ${result.panels[0].paperType}`);
        console.log(`用紙幅: ${result.panels[0].width}mm`);
        console.log(`用紙高さ: ${result.panels[0].height}mm`);
        
        console.log('\n=== 最初の5つの要素 ===');
        result.panels[0].printElements.slice(0, 5).forEach((element, index) => {
            console.log(`${index + 1}. ${element.options.title} (${element.options.left}, ${element.options.top}) ${element.options.width}×${element.options.height}mm`);
        });
        
        console.log('\n✅ テスト完了');
        
    } catch (error) {
        console.error('❌ テストエラー:', error.message);
        process.exit(1);
    }
}

runTest();