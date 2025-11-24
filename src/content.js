// 内容脚本 - 在小报童页面中运行

let apiData = [];
let isScrapingActive = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// HTML转Markdown的简单实现
function htmlToMarkdown(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  let markdown = html;
  
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");
  
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, "![]($1)");
  
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
  });
  
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + "\n";
  });
  
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n");
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    return content.split("\n").map(line => `> ${line}`).join("\n") + "\n\n";
  });
  
  markdown = markdown.replace(/<[^>]*>/g, "");
  
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  
  markdown = markdown.replace(/&lt;/g, "<");
  markdown = markdown.replace(/&gt;/g, ">");
  markdown = markdown.replace(/&amp;/g, "&");
  markdown = markdown.replace(/&quot;/g, "\"");
  markdown = markdown.replace(/&#39;/g, "\'");
  
  return markdown.trim();
}

// 安全的消息发送函数
function safeRuntimeMessage(message, retries = 0) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Runtime message error:", chrome.runtime.lastError.message);
          if (retries < MAX_RETRIES && chrome.runtime.lastError.message.includes("Extension context invalidated")) {
            console.log(`重试发送消息 (${retries + 1}/${MAX_RETRIES})`);
            setTimeout(() => {
              safeRuntimeMessage(message, retries + 1).then(resolve).catch(reject);
            }, 1000);
          } else {
            reject(new Error(chrome.runtime.lastError.message));
          }
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.error("发送消息异常:", error);
      reject(error);
    }
  });
}

// 注入脚本到页面
function injectScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/inject.js");
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// 页面加载完成后注入脚本
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectScript);
} else {
  injectScript();
}

// 监听来自注入脚本的消息
window.addEventListener("message", function(event) {
  if (event.source !== window) return;
  
  if (event.data.type === "XIAOBOT_API_DATA") {
    const newArticles = event.data.data;
    const totalCount = event.data.totalCount || 0;
    
    if (newArticles && newArticles.length > 0) {
      // 合并新文章，避免重复
      newArticles.forEach(article => {
        if (!apiData.find(existing => existing.id === article.id)) {
          apiData.push(article);
        }
      });
      
      console.log("收到新文章数据:", newArticles.length, "篇，总计:", apiData.length, "篇");
      
      safeRuntimeMessage({
        type: "ARTICLE_DATA",
        data: newArticles,
        totalCount: apiData.length
      }).catch(error => {
        console.error("发送ARTICLE_DATA消息失败:", error);
      });
    }
  }
  
  if (event.data.type === "START_SCRAPING_AND_DOWNLOAD") {
    startScrapingAndDownload();
  }
  
  if (event.data.type === "SCRAPING_COMPLETE") {
    safeRuntimeMessage({
      type: "SCRAPING_COMPLETE",
      totalCount: apiData.length
    }).catch(error => {
      console.error("发送SCRAPING_COMPLETE消息失败:", error);
    });
  }
});

// 开始抓取流程
async function startScrapingAndDownload() {
  if (isScrapingActive) return;
  
  isScrapingActive = true;
  apiData = [];
  retryCount = 0;
  
  console.log("开始抓取小报童文章...");
  
  try {
    await waitForPageLoad();
    
    // 清除之前的数据
    if (window.clearXiaobotData) {
      window.clearXiaobotData();
    }
    
    triggerInitialLoad();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 使用改进的滚动加载策略
    await smartScrollToLoadAll();
    
    console.log("抓取完成，共获取", apiData.length, "篇文章");
    
    // 将抓取到的文章数据发送给background.js进行下载
    safeRuntimeMessage({
      type: "DOWNLOAD_ARTICLES",
      articles: apiData
    }).catch(error => {
      console.error("发送DOWNLOAD_ARTICLES消息失败:", error);
    });
    
    window.postMessage({ type: "SCRAPING_COMPLETE" }, "*");
    
  } catch (error) {
    console.error("抓取过程中出错:", error);
    safeRuntimeMessage({
      type: "SCRAPING_ERROR",
      error: error.message
    }).catch(err => {
      console.error("发送SCRAPING_ERROR消息失败:", err);
    });
  } finally {
    isScrapingActive = false;
  }
}

// 等待页面加载
function waitForPageLoad() {
  console.log("等待页面加载完成...");
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      console.log("页面已加载完成。");
      resolve();
    } else {
      window.addEventListener("load", () => {
        console.log("页面加载事件触发。");
        resolve();
      });
    }
  });
}

// 触发初始内容加载
function triggerInitialLoad() {
  console.log("触发初始内容加载...");
  const activeElement = document.querySelector("div.active");
  if (activeElement) {
    activeElement.click();
    console.log("点击了激活元素。");
  }
  
  window.scrollTo(0, 0);
  console.log("滚动到页面顶部。");
}

// 智能滚动加载所有内容
async function smartScrollToLoadAll() {
  console.log("开始智能滚动加载所有内容...");
  let lastApiCount = 0;
  let noNewDataCount = 0;
  const maxScrollAttempts = 50;
  let lastScrollHeight = 0;
  let noScrollHeightChangeCount = 0;

  // 发送进度更新消息
  function sendProgressUpdate() {
    safeRuntimeMessage({
      type: "PROGRESS_UPDATE",
      currentCount: apiData.length,
      scrollAttempt: Math.min(maxScrollAttempts, noNewDataCount + 1)
    }).catch(error => {
      console.error("发送进度更新消息失败:", error);
    });
  }

  for (let i = 0; i < maxScrollAttempts; i++) {
    // 记录当前页面高度
    const currentScrollHeight = document.body.scrollHeight;
    
    // 滚动到页面底部
    window.scrollTo(0, document.body.scrollHeight);
    
    // 等待内容加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 发送进度更新
    sendProgressUpdate();

    // 检查是否有新的文章数据
    if (apiData.length === lastApiCount) {
      noNewDataCount++;
      console.log(`第${i + 1}次滚动，无新数据，连续${noNewDataCount}次`);

      // 检查页面高度是否有变化
      if (currentScrollHeight === lastScrollHeight) {
        noScrollHeightChangeCount++;
        console.log(`页面高度无变化，连续${noScrollHeightChangeCount}次`);
      } else {
        noScrollHeightChangeCount = 0;
        lastScrollHeight = currentScrollHeight;
      }

      // 如果连续3次无新数据且页面高度也不再变化，则停止滚动
      if (noNewDataCount >= 3 && noScrollHeightChangeCount >= 2) {
        console.log("连续3次无新数据且页面高度不再变化，停止滚动");
        break;
      }
      
      // 尝试向上滚动一点再向下滚动，触发可能的懒加载
      if (noNewDataCount % 2 === 0) {
        window.scrollTo(0, Math.max(0, document.body.scrollHeight - 300));
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      noNewDataCount = 0;
      noScrollHeightChangeCount = 0;
      lastApiCount = apiData.length;
      lastScrollHeight = currentScrollHeight;
      console.log(`第${i + 1}次滚动，当前文章数:`, apiData.length);
    }

    // 检查是否已经滚动到真正的底部
    const scrollTarget = document.documentElement;
    if (scrollTarget.scrollHeight - scrollTarget.scrollTop <= scrollTarget.clientHeight + 50) {
      console.log("已滚动到页面底部");
      // 在底部多等待一会儿，确保所有内容都加载完成
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (apiData.length === lastApiCount) {
        console.log("在页面底部等待后仍无新数据，停止滚动");
        break;
      }
    }
  }
  
  console.log("智能滚动加载完成，最终文章数:", apiData.length);
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SCRAPING_AND_DOWNLOAD") {
    startScrapingAndDownload();
    sendResponse({ success: true });
  }
  
  if (message.type === "CONVERT_HTML_TO_MARKDOWN") {
    const markdown = htmlToMarkdown(message.html);
    sendResponse({ markdown });
  }
});

console.log("小报童下载器内容脚本已加载");


