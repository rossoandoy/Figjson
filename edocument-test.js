// Playwright を使用したeDocumentテスト自動化
// 注意：実際のeDocumentのURLとSalesforce認証情報が必要です

/**
 * eDocumentテスト自動化クラス
 * 
 * 使用方法：
 * 1. Salesforce環境のURL、ユーザー名、パスワードを設定
 * 2. eDocumentアプリのURLを設定
 * 3. テストを実行
 */
class EDocumentTester {
    constructor(config) {
        this.salesforceUrl = config.salesforceUrl || 'https://your-org.salesforce.com';
        this.username = config.username;
        this.password = config.password;
        this.eDocumentUrl = config.eDocumentUrl;
        this.browser = null;
        this.page = null;
    }

    /**
     * ブラウザを起動してSalesforceにログイン
     */
    async initialize() {
        if (typeof require === 'undefined') {
            throw new Error('この機能はNode.js環境でのみ利用可能です');
        }
        
        const { chromium } = require('playwright');
        
        this.browser = await chromium.launch({ 
            headless: false, // デバッグ用に表示モードで実行
            slowMo: 500 // 操作を遅くして確認しやすく
        });
        
        this.page = await this.browser.newPage();
        
        // Salesforceにログイン
        await this.loginToSalesforce();
    }

    /**
     * Salesforceにログインする
     */
    async loginToSalesforce() {
        console.log('Salesforceにログイン中...');
        
        await this.page.goto(this.salesforceUrl);
        
        // ユーザー名とパスワードを入力
        await this.page.fill('#username', this.username);
        await this.page.fill('#password', this.password);
        
        // ログインボタンをクリック
        await this.page.click('#Login');
        
        // ログイン完了まで待機
        await this.page.waitForURL('**/lightning/**', { timeout: 10000 });
        
        console.log('Salesforceログイン完了');
    }

    /**
     * eDocumentアプリに移動
     */
    async navigateToEDocument() {
        console.log('eDocumentアプリに移動中...');
        
        if (this.eDocumentUrl) {
            await this.page.goto(this.eDocumentUrl);
        } else {
            // アプリランチャーからeDocumentを検索
            await this.page.click('.slds-icon-waffle');
            await this.page.fill('input[placeholder*="Search apps"]', 'eDocument');
            await this.page.click('text=eDocument');
        }
        
        await this.page.waitForLoadState('networkidle');
        console.log('eDocumentアプリに移動完了');
    }

    /**
     * JSONファイルをeDocumentにインポート
     */
    async importJsonFile(filePath) {
        console.log(`JSONファイルをインポート中: ${filePath}`);
        
        try {
            // インポートボタンまたはアップロード領域を探す
            const importButton = await this.page.locator('text=Import').or(
                this.page.locator('text=インポート')
            ).or(
                this.page.locator('input[type="file"]')
            ).first();
            
            if (await importButton.count() > 0) {
                // ファイル選択
                await importButton.setInputFiles(filePath);
                
                // アップロード処理の完了を待機
                await this.page.waitForTimeout(2000);
                
                console.log('ファイルアップロード完了');
                return true;
            } else {
                console.error('インポートボタンまたはファイル入力フィールドが見つかりません');
                return false;
            }
        } catch (error) {
            console.error('ファイルインポートエラー:', error);
            return false;
        }
    }

    /**
     * 変換結果を確認
     */
    async verifyConversionResult() {
        console.log('変換結果を確認中...');
        
        try {
            // 要素の配置を確認
            const elements = await this.page.locator('.print-element').count();
            console.log(`検出された要素数: ${elements}`);
            
            // 座標の確認
            const firstElement = this.page.locator('.print-element').first();
            if (await firstElement.count() > 0) {
                const boundingBox = await firstElement.boundingBox();
                console.log('最初の要素の位置:', boundingBox);
            }
            
            // スクリーンショットを撮影
            await this.page.screenshot({ 
                path: './edocument-result.png',
                fullPage: true 
            });
            
            console.log('変換結果の確認完了（スクリーンショット保存済み）');
            return true;
        } catch (error) {
            console.error('変換結果確認エラー:', error);
            return false;
        }
    }

    /**
     * テストを実行
     */
    async runTest(jsonFilePath) {
        try {
            await this.initialize();
            await this.navigateToEDocument();
            
            const importSuccess = await this.importJsonFile(jsonFilePath);
            if (importSuccess) {
                await this.verifyConversionResult();
            }
            
            console.log('テスト完了');
        } catch (error) {
            console.error('テスト実行エラー:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * ブラウザを終了
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// 使用例（Node.js環境で実行）
async function runEDocumentTest() {
    const config = {
        salesforceUrl: 'https://your-org.salesforce.com',
        username: 'your-username@example.com',
        password: 'your-password',
        eDocumentUrl: 'https://your-org.lightning.force.com/lightning/n/eDocument'
    };
    
    const tester = new EDocumentTester(config);
    
    // 変換されたJSONファイルをテスト
    await tester.runTest('./converted-edocument.json');
}

// ブラウザ環境では利用不可の旨を表示
if (typeof window !== 'undefined') {
    console.log('注意: Playwright MCPによる自動テストはNode.js環境でのみ利用可能です。');
    console.log('実際のeDocumentテストには以下の手順を実行してください：');
    console.log('1. 変換されたJSONファイルをダウンロード');
    console.log('2. Salesforce eDocumentアプリにアクセス');
    console.log('3. インポート機能でJSONファイルをアップロード');
    console.log('4. 要素の配置と座標を確認');
}

module.exports = { EDocumentTester };