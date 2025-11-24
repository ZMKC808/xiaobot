// 后台脚本 - 处理数据和下载
let articleData = [];
let isDownloading = false;
let currentTabId = null; // 新增：用于存储当前活动标签页的ID

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ARTICLE_DATA') {
    // 接收文章数据
    articleData.push(...message.data);
    console.log('收到文章数据:', message.data.length, '篇');
    
    // 通知popup更新状态
    chrome.runtime.sendMessage({
      type: 'UPDATE_STATUS',
      count: articleData.length
    }).catch(() => {
      // 忽略popup未打开的错误
    });
    
    sendResponse({ success: true });
  }
  
  if (message.type === 'START_DOWNLOAD') {
    startDownload(message.url);
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_STATUS') {
    sendResponse({
      isDownloading,
      articleCount: articleData.length
    });
  }
  
  if (message.type === 'CLEAR_DATA') {
    articleData = [];
    sendResponse({ success: true });
  }
  
  // 新增：处理来自content.js的下载请求
  if (message.type === 'DOWNLOAD_ARTICLES') {
    articleData = message.articles;
    downloadArticles();
    sendResponse({ success: true });
  }
});

// 开始下载流程
async function startDownload(url) {
  if (isDownloading) return;
  
  isDownloading = true;
  articleData = [];
  
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id; // 存储tab.id
    
    if (!tab.url.includes('xiaobot.net')) {
      // 如果当前页面不是小报童，则导航到指定URL
      if (url) {
        await chrome.tabs.update(tab.id, { url });
        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        throw new Error('请在小报童页面使用此插件');
      }
    }
    
    // 注入内容脚本开始抓取
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: startScrapingAndDownload
    });
    
  } catch (error) {
    console.error('下载失败:', error);
    isDownloading = false;
    
    // 通知popup错误
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_ERROR',
      error: error.message
    }).catch(() => {});
  }
}

// 注入到页面的抓取函数
function startScrapingAndDownload() {
  // 发送消息给content script开始抓取和下载
  window.postMessage({ type: 'START_SCRAPING_AND_DOWNLOAD' }, '*');
}

// 下载文章
async function downloadArticles() {
  if (articleData.length === 0) {
    console.log('没有文章数据可下载');
    return;
  }
  
  if (currentTabId === null) {
    console.error('未知的标签页ID，无法发送消息。');
    isDownloading = false;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_ERROR',
      error: '未知的标签页ID，无法发送消息。'
    }).catch(() => {});
    return;
  }

  try {
    // 获取当前时间戳作为文件夹名称
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const folderName = `xiaobot_articles_${timestamp}`;
    
    for (let i = 0; i < articleData.length; i++) {
      const article = articleData[i];
      // 通过消息传递给content.js处理htmlToMarkdown
      const response = await chrome.tabs.sendMessage(currentTabId, {
        type: 'CONVERT_HTML_TO_MARKDOWN',
        html: article.content
      });
      const markdown = response.markdown;
      
      // 生成文件名（移除特殊字符）
      const fileName = `${article.title.replace(/[<>:"/\\|?*]/g, '_')}.md`;
      
      // 使用data: URL方式下载，并指定统一的文件夹
      const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);

      await chrome.downloads.download({
        url: dataUrl,
        filename: `${folderName}/${fileName}`,
        saveAs: false
      });
      
      // 通知进度
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_PROGRESS',
        current: i + 1,
        total: articleData.length
      }).catch(() => {});
      
      // 避免下载过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 下载完成
    isDownloading = false;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_COMPLETE',
      count: articleData.length
    }).catch(() => {});
    
  } catch (error) {
    console.error('下载过程中出错:', error);
    isDownloading = false;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_ERROR',
      error: error.message
    }).catch(() => {});
  }
}

// 监听抓取完成消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPING_COMPLETE') {
    console.log('抓取完成，开始下载');
    downloadArticles();
    sendResponse({ success: true });
  }

  if (message.type === 'SCRAPING_ERROR') {
    console.error('抓取失败:', message.error);
    isDownloading = false;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_ERROR',
      error: '抓取失败: ' + message.error
    }).catch(() => {});
    sendResponse({ success: true });
  }
});

