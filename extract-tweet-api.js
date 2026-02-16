// pages/api/extract-tweet.js
// XのポストURLから本文を抽出するAPI

export default async function handler(req, res) {
  // CORSヘッダー（必要に応じて）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  
  // URL検証
  if (!url || !isValidTwitterUrl(url)) {
    return res.status(400).json({ 
      success: false, 
      error: '有効なTwitter/XのURLを入力してください' 
    });
  }
  
  try {
    // XのHTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ページの取得に失敗しました`);
    }
    
    const html = await response.text();
    
    // 本文を複数パターンで抽出
    const extractionResult = extractTweetText(html);
    
    if (!extractionResult.success) {
      return res.status(200).json({
        success: false,
        error: extractionResult.error,
        fallback: true, // フロントで手動入力モードに切り替え
        html_preview: html.substring(0, 500) // デバッグ用
      });
    }
    
    return res.status(200).json({
      success: true,
      text: extractionResult.text,
      metadata: extractionResult.metadata,
      url: url
    });
    
  } catch (error) {
    console.error('Tweet extraction error:', error);
    
    return res.status(200).json({
      success: false,
      error: error.message,
      fallback: true
    });
  }
}

/**
 * Twitter/XのURL検証
 */
function isValidTwitterUrl(url) {
  const patterns = [
    /^https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/,
    /^https?:\/\/(www\.)?(twitter|x)\.com\/i\/web\/status\/\d+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * HTMLから投稿本文を抽出（複数パターンで試行）
 */
function extractTweetText(html) {
  const methods = [
    extractFromOgDescription,
    extractFromTwitterMeta,
    extractFromJsonLd,
    extractFromArticleTag
  ];
  
  for (const method of methods) {
    try {
      const result = method(html);
      if (result) {
        return {
          success: true,
          text: cleanTweetText(result.text),
          metadata: {
            method: result.method,
            author: result.author || null,
            timestamp: result.timestamp || null
          }
        };
      }
    } catch (e) {
      console.warn(`Extraction method failed: ${e.message}`);
    }
  }
  
  return {
    success: false,
    error: '投稿本文を抽出できませんでした。手動で貼り付けてください。'
  };
}

/**
 * 方法1: og:description メタタグから抽出
 */
function extractFromOgDescription(html) {
  const match = html.match(/<meta property="og:description" content="([^"]+)"/);
  if (match && match[1]) {
    return {
      text: match[1],
      method: 'og:description'
    };
  }
  return null;
}

/**
 * 方法2: twitter:description メタタグから抽出
 */
function extractFromTwitterMeta(html) {
  const match = html.match(/<meta name="twitter:description" content="([^"]+)"/);
  if (match && match[1]) {
    return {
      text: match[1],
      method: 'twitter:description'
    };
  }
  return null;
}

/**
 * 方法3: JSON-LD構造化データから抽出
 */
function extractFromJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">({.+?})<\/script>/s);
  if (match && match[1]) {
    try {
      const data = JSON.parse(match[1]);
      if (data.text || data.description) {
        return {
          text: data.text || data.description,
          author: data.author?.name || null,
          timestamp: data.datePublished || null,
          method: 'json-ld'
        };
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 方法4: article タグから抽出（最終手段）
 */
function extractFromArticleTag(html) {
  // これは実際のDOM操作が必要なので、サーバーサイドでは難しい
  // Puppeteerを使う場合のみ有効
  return null;
}

/**
 * 抽出したテキストをクリーンアップ
 */
function cleanTweetText(text) {
  return text
    // HTMLエンティティをデコード
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // 末尾のt.co短縮URLを削除
    .replace(/\s*https?:\/\/t\.co\/\w+\s*$/g, '')
    // 複数の空白を1つに
    .replace(/\s+/g, ' ')
    // 前後の空白削除
    .trim();
}
