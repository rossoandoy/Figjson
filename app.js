// メインアプリケーションロジック
class FigmaConverterApp {
    constructor() {
        this.converter = new FigmaToEDocumentConverter();
        this.selectedFile = null;
        this.convertedData = null;
        this.startTime = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // DOM要素の取得
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeBtn = document.getElementById('removeBtn');
        this.paperTypeSelect = document.getElementById('paperTypeSelect');
        this.scaleFactorInput = document.getElementById('scaleFactorInput');
        this.scaleFactorValue = document.getElementById('scaleFactorValue');
        this.convertBtn = document.getElementById('convertBtn');
        this.progressBar = document.getElementById('progressBar');
        this.statusMessage = document.getElementById('statusMessage');
        this.resultSection = document.getElementById('resultSection');
        this.elementCount = document.getElementById('elementCount');
        this.paperSize = document.getElementById('paperSize');
        this.processingTime = document.getElementById('processingTime');
        this.figmaSize = document.getElementById('figmaSize');
        this.previewBtn = document.getElementById('previewBtn');
        this.previewSection = document.getElementById('previewSection');
        this.previewPaper = document.getElementById('previewPaper');
        this.mappingBtn = document.getElementById('mappingBtn');
        this.mappingTable = document.getElementById('mappingTable');
        this.mappingContent = document.getElementById('mappingContent');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    setupEventListeners() {
        // ファイル選択関連
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeBtn.addEventListener('click', () => this.removeFile());

        // ドラッグ&ドロップ
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 設定関連
        this.scaleFactorInput.addEventListener('input', (e) => {
            this.scaleFactorValue.textContent = e.target.value;
        });

        // 変換・ダウンロード・プレビュー
        this.convertBtn.addEventListener('click', () => this.convertFile());
        this.previewBtn.addEventListener('click', () => this.showPreview());
        this.mappingBtn.addEventListener('click', () => this.showMapping());
        this.downloadBtn.addEventListener('click', () => this.downloadFile());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.validateAndSetFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.validateAndSetFile(files[0]);
        }
    }

    validateAndSetFile(file) {
        // ファイル拡張子のチェック
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showStatus('JSONファイルを選択してください', 'error');
            return;
        }

        // ファイルサイズのチェック (10MB制限)
        if (file.size > 10 * 1024 * 1024) {
            this.showStatus('ファイルサイズが大きすぎます（10MB以下）', 'error');
            return;
        }

        this.selectedFile = file;
        this.showFileInfo();
        this.convertBtn.disabled = false;
        this.hideStatus();
    }

    showFileInfo() {
        this.fileName.textContent = this.selectedFile.name;
        this.fileSize.textContent = this.formatFileSize(this.selectedFile.size);
        
        this.uploadArea.style.display = 'none';
        this.fileInfo.style.display = 'block';
    }

    removeFile() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.convertBtn.disabled = true;
        
        this.uploadArea.style.display = 'block';
        this.fileInfo.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.hideStatus();
    }

    async convertFile() {
        if (!this.selectedFile) return;

        try {
            this.startTime = Date.now();
            this.setConvertingState(true);
            this.showStatus('ファイルを読み込み中...', 'info');
            
            // ファイルを読み込み
            const fileContent = await this.readFileAsText(this.selectedFile);
            
            this.showStatus('JSONを解析中...', 'info');
            await this.sleep(500); // UIの更新を見せるための待機
            
            // JSONをパース
            let figmaData;
            try {
                figmaData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error('JSONファイルの形式が正しくありません');
            }

            this.showStatus('Figmaデータを変換中...', 'info');
            await this.sleep(500);

            // 設定値を取得
            const paperType = this.paperTypeSelect.value;
            const scaleFactor = parseFloat(this.scaleFactorInput.value);

            // 変換実行
            this.convertedData = this.converter.convertFigmaToEDocument(figmaData, paperType, scaleFactor);
            
            this.showStatus('変換完了！', 'success');
            await this.sleep(500);

            // 結果表示
            this.showResults();
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showStatus(`変換エラー: ${error.message}`, 'error');
        } finally {
            this.setConvertingState(false);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    setConvertingState(isConverting) {
        this.convertBtn.disabled = isConverting;
        
        const btnText = this.convertBtn.querySelector('.btn-text');
        const btnLoader = this.convertBtn.querySelector('.btn-loader');
        
        if (isConverting) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            this.progressBar.style.display = 'block';
            this.animateProgress();
        } else {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            this.progressBar.style.display = 'none';
        }
    }

    animateProgress() {
        const progressFill = this.progressBar.querySelector('.progress-fill');
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 30;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
            }
            progressFill.style.width = width + '%';
        }, 200);
    }

    showResults() {
        const stats = this.converter.getConversionStats(this.convertedData);
        const processingTimeMs = Date.now() - this.startTime;
        
        // pathベース変換の情報を含めた統計表示
        let elementCountText = `${stats.totalElements} (テキスト: ${stats.textElements}`;
        if (stats.imageElements > 0) elementCountText += `, 画像: ${stats.imageElements}`;
        if (stats.skippedElements > 0) elementCountText += `, スキップ: ${stats.skippedElements}`;
        if (stats.pathBasedElements > 0) elementCountText += `, path変換: ${stats.pathBasedElements}`;
        if (stats.pathNotFoundElements > 0) elementCountText += `, path未発見: ${stats.pathNotFoundElements}`;
        elementCountText += ')';
        
        this.elementCount.textContent = elementCountText;
        this.paperSize.textContent = `${stats.paperSize} (${stats.paperWidth}×${stats.paperHeight}mm)`;
        this.processingTime.textContent = `${(processingTimeMs / 1000).toFixed(2)}秒`;
        this.figmaSize.textContent = `${this.converter.figmaWidth}×${this.converter.figmaHeight}px`;
        
        this.resultSection.style.display = 'block';
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    showPreview() {
        if (!this.convertedData) return;

        const panel = this.convertedData.panels[0];
        const paperWidth = panel.width;
        const paperHeight = panel.height;
        
        // プレビューエリアのサイズを設定（実際の縮尺で表示）
        const scale = Math.min(600 / paperWidth, 400 / paperHeight, 1);
        const previewWidth = paperWidth * scale;
        const previewHeight = paperHeight * scale;
        
        this.previewPaper.style.width = previewWidth + 'px';
        this.previewPaper.style.height = previewHeight + 'px';
        
        // 既存のプレビュー要素をクリア
        this.previewPaper.innerHTML = '';
        
        // 各要素をプレビューに追加
        panel.printElements.forEach((element, index) => {
            const options = element.options;
            const previewElement = document.createElement('div');
            previewElement.className = 'preview-element';
            
            // 位置とサイズを設定
            previewElement.style.left = (options.left * scale) + 'px';
            previewElement.style.top = (options.top * scale) + 'px';
            previewElement.style.width = (options.width * scale) + 'px';
            previewElement.style.height = (options.height * scale) + 'px';
            
            // テキスト内容を設定
            const title = options.title || `Element ${index + 1}`;
            previewElement.textContent = title.length > 20 ? title.substring(0, 17) + '...' : title;
            previewElement.title = `${title}\n位置: (${options.left}, ${options.top})\nサイズ: ${options.width}×${options.height}mm\nフォント: ${options.fontSize}pt`;
            
            // 背景色があれば設定
            if (options.backgroundColor) {
                previewElement.style.backgroundColor = options.backgroundColor;
            }
            
            this.previewPaper.appendChild(previewElement);
        });
        
        // プレビューセクションを表示
        this.previewSection.style.display = 'block';
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    showMapping() {
        if (!this.convertedData) return;

        const panel = this.convertedData.panels[0];
        let mappingHtml = '<div class="mapping-header">変換マッピング詳細</div>';
        
        // 統計情報
        const stats = this.converter.getConversionStats(this.convertedData);
        mappingHtml += `
            <div class="mapping-stats">
                <strong>変換統計:</strong><br>
                • 総要素数: ${panel.printElements.length}<br>
                • テキスト要素: ${stats.textElements}<br>
                • 画像要素: ${stats.imageElements}<br>
                • スキップ要素: ${stats.skippedElements}<br>
                ${stats.pathBasedElements > 0 ? `• pathベース変換: ${stats.pathBasedElements}<br>` : ''}
                ${stats.pathNotFoundElements > 0 ? `• path未発見要素: ${stats.pathNotFoundElements}<br>` : ''}
                • 用紙サイズ: ${panel.paperType} (${panel.width}×${panel.height}mm)<br>
                • Figmaキャンバス: ${this.converter.figmaWidth}×${this.converter.figmaHeight}px<br>
                • スケール: ${this.converter.scaleFactor}
            </div><hr>
        `;

        // 各要素のマッピング情報
        mappingHtml += '<div class="mapping-elements"><strong>要素別マッピング:</strong><br><br>';
        
        panel.printElements.forEach((element, index) => {
            const options = element.options;
            const figmaEstimate = {
                x: Math.round(options.left / 0.264583 / this.converter.scaleFactor),
                y: Math.round(options.top / 0.264583 / this.converter.scaleFactor),
                width: Math.round(options.width / 0.264583 / this.converter.scaleFactor),
                height: Math.round(options.height / 0.264583 / this.converter.scaleFactor)
            };

            mappingHtml += `
                <div class="mapping-item">
                    <strong>${index + 1}. ${options.title || 'Unnamed'}</strong><br>
                    📍 Figma推定位置: (${figmaEstimate.x}, ${figmaEstimate.y})px<br>
                    📐 Figmaサイズ: ${figmaEstimate.width}×${figmaEstimate.height}px<br>
                    📍 eDocument位置: (${options.left}, ${options.top})mm<br>
                    📐 eDocumentサイズ: ${options.width}×${options.height}mm<br>
                    🎨 フォント: ${options.fontSize || 'N/A'}pt<br>
                    🏷️ タイプ: ${element.printElementType.type}<br>
                    ${options.backgroundColor ? `🎨 背景色: ${options.backgroundColor}<br>` : ''}
                </div><hr>
            `;
        });

        // pathベース変換された要素の情報を追加
        const pathBasedElements = this.converter.debugInfo.filter(info => info.type === 'PATH_BASED_TEXT');
        if (pathBasedElements.length > 0) {
            mappingHtml += '<br><strong>🎯 pathベース変換要素:</strong><br><br>';
            pathBasedElements.forEach((element) => {
                mappingHtml += `
                    <div class="mapping-item" style="background: #eeffee; border-left: 3px solid #66bb6a;">
                        <strong>🎯 ${element.name}</strong><br>
                        📝 テキスト: "${element.text}"<br>
                        🗂️ path: ${element.path.split('/').slice(-2).join('/')}<br>
                        📐 Figmaサイズ: ${element.figmaSize.width}×${element.figmaSize.height}px<br>
                        📍 計算座標: (${element.calculatedPosition.x}, ${element.calculatedPosition.y})px<br>
                        📍 eDocument位置: (${element.eDocumentPosition.left}, ${element.eDocumentPosition.top})mm<br>
                        🎨 フォント: ${element.figmaFont || 'N/A'}pt<br>
                        ✅ pathベース変換済み
                    </div><hr>
                `;
            });
        }

        // path未発見要素の情報を追加
        const pathNotFoundElements = this.converter.debugInfo.filter(info => info.type === 'PATH_NOT_FOUND');
        if (pathNotFoundElements.length > 0) {
            mappingHtml += '<br><strong>⚠️ path未発見要素:</strong><br><br>';
            pathNotFoundElements.forEach((element) => {
                mappingHtml += `
                    <div class="mapping-item" style="background: #fff3cd; border-left: 3px solid #ffc107;">
                        <strong>⚠️ ${element.name}</strong><br>
                        📝 テキスト: "${element.text}"<br>
                        🗂️ path: ${element.path.split('/').slice(-2).join('/')}<br>
                        理由: ${element.reason}<br>
                        ❌ 変換されていません（ノードが見つからない）
                    </div><hr>
                `;
            });
        }

        // スキップされた要素の情報を追加
        const skippedElements = this.converter.debugInfo.filter(info => info.type === 'SKIPPED_IMAGE');
        if (skippedElements.length > 0) {
            mappingHtml += '<br><strong>🚫 スキップされた要素:</strong><br><br>';
            skippedElements.forEach((element) => {
                mappingHtml += `
                    <div class="mapping-item" style="background: #ffeeee; border-left: 3px solid #ff6666;">
                        <strong>🚫 ${element.name}</strong><br>
                        理由: ${element.reason}<br>
                        📐 Figmaサイズ: ${element.figmaSize.width}×${element.figmaSize.height}px<br>
                        🔑 ImageHash: ${element.imageHash || 'N/A'}<br>
                        ✅ 除外済み（eDocumentに含まれません）
                    </div><hr>
                `;
            });
        }

        mappingHtml += '</div>';

        this.mappingContent.innerHTML = mappingHtml;
        
        // マッピングテーブルの表示切り替え
        if (this.mappingTable.style.display === 'none') {
            this.mappingTable.style.display = 'block';
            this.mappingBtn.textContent = '🗺️ マッピング表を非表示';
        } else {
            this.mappingTable.style.display = 'none';
            this.mappingBtn.textContent = '🗺️ マッピング表を表示';
        }
    }

    downloadFile() {
        if (!this.convertedData) return;

        try {
            const jsonString = JSON.stringify(this.convertedData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.generateFileName();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showStatus('ファイルをダウンロードしました', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showStatus('ダウンロードに失敗しました', 'error');
        }
    }

    generateFileName() {
        const originalName = this.selectedFile.name.replace('.json', '');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        return `${originalName}_eDocument_${timestamp}.json`;
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => this.hideStatus(), 3000);
        }
    }

    hideStatus() {
        this.statusMessage.style.display = 'none';
        this.statusMessage.className = 'status-message';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new FigmaConverterApp();
});