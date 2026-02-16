// __tests__/extract-tweet.test.js
// URL抽出機能のテスト

/**
 * ローカルでテストする場合:
 * 
 * 1. テスト用HTMLサンプルを用意
 * 2. extractTweetText関数を単体テスト
 * 3. 実際のXのURLでE2Eテスト
 */

import { extractTweetText, cleanTweetText } from '../pages/api/extract-tweet';

describe('Tweet Text Extraction', () => {
  
  test('og:description から抽出できる', () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:description" content="商談準備、3時間かかってませんか？AIで15分に短縮できました。" />
        </head>
      </html>
    `;
    
    const result = extractTweetText(mockHtml);
    
    expect(result.success).toBe(true);
    expect(result.text).toBe('商談準備、3時間かかってませんか？AIで15分に短縮できました。');
    expect(result.metadata.method).toBe('og:description');
  });
  
  test('twitter:description から抽出できる', () => {
    const mockHtml = `
      <html>
        <head>
          <meta name="twitter:description" content="営業の生産性が3倍になった話" />
        </head>
      </html>
    `;
    
    const result = extractTweetText(mockHtml);
    
    expect(result.success).toBe(true);
    expect(result.text).toBe('営業の生産性が3倍になった話');
  });
  
  test('HTMLエンティティが正しくデコードされる', () => {
    const text = '&quot;AI活用&quot;で&amp;効率化';
    const cleaned = cleanTweetText(text);
    
    expect(cleaned).toBe('"AI活用"で&効率化');
  });
  
  test('末尾のt.co URLが削除される', () => {
    const text = '素晴らしい記事です https://t.co/abc123xyz';
    const cleaned = cleanTweetText(text);
    
    expect(cleaned).toBe('素晴らしい記事です');
  });
  
  test('抽出失敗時にfallbackフラグが立つ', () => {
    const mockHtml = '<html><body>No meta tags</body></html>';
    
    const result = extractTweetText(mockHtml);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
});

/**
 * E2Eテスト（実際のXのURLで試す場合）
 * 
 * 手動でテストする手順:
 * 1. 任意のX投稿URLを用意
 * 2. ブラウザで開いて「ページのソースを表示」
 * 3. og:description や twitter:description の内容を確認
 * 4. APIが同じ内容を抽出できるか確認
 */

describe('E2E: Real Twitter URLs', () => {
  
  // ⚠️ このテストは実際のネットワークリクエストを行うので注意
  test.skip('実際のTwitter URLから抽出できる', async () => {
    const testUrl = 'https://twitter.com/example/status/1234567890';
    
    const response = await fetch('http://localhost:3000/api/extract-tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });
    
    const result = await response.json();
    
    console.log('抽出結果:', result);
    
    // 成功 or fallback のどちらかになるはず
    expect(result).toHaveProperty('success');
    
    if (result.success) {
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
    } else {
      expect(result.fallback).toBe(true);
    }
  });
  
});

/**
 * パフォーマンステスト
 */
describe('Performance', () => {
  
  test('抽出処理が5秒以内に完了する', async () => {
    const startTime = Date.now();
    
    // モックHTMLで実行
    const mockHtml = '<meta property="og:description" content="test" />';
    const result = extractTweetText(mockHtml);
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
    expect(result.success).toBe(true);
  });
  
});
