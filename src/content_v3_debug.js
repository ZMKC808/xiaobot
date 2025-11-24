// 小报童文章下载器 v3.1.3 - 调试版本
// 专门用于定位null错误的精确位置

// 全局变量
let downloadUI = null;
let apiData = [];
let isScrapingActive = false;

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDownloader);
} else {
  initializeDownloader();
}

// 初始化下载器
function initializeDownloader() {
  console.log("🚀 小报童下载器 v3.1.3-debug 开始加载...");
  console.log("📍 当前页面:", window.location.href, "是否为小报童页面:", window.location.href.includes('xiaobot.net'));
  
  if (window.location.href.includes('xiaobot.net')) {
    attemptCreateUI();
  } else {
    console.log("❌ 不是小报童页面，跳过初始化");
  }
}

// 安全的日志函数
function safeLog(message, data = null) {
  try {
    if (data !== null) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  } catch (error) {
    console.log("日志输出错误:", error);
  }
}

// 安全的HTML转Markdown函数 - 增强调试版本
function htmlToMarkdown(html) {
  safeLog("🔄 开始HTML转Markdown", typeof html);
  
  // 第一层检查：基本类型验证
  if (html === null) {
    safeLog("⚠️ HTML内容为null");
    return "内容为空(null)";
  }
  
  if (html === undefined) {
    safeLog("⚠️ HTML内容为undefined");
    return "内容为空(undefined)";
  }
  
  if (html === '') {
    safeLog("⚠️ HTML内容为空字符串");
    return "内容为空";
  }
  
  // 第二层检查：类型转换
  let safeHtml;
  try {
    if (typeof html !== 'string') {
      safeLog("⚠️ HTML不是字符串类型，当前类型:", typeof html);
      safeHtml = String(html);
      safeLog("✅ 已转换为字符串");
    } else {
      safeHtml = html;
    }
  } catch (error) {
    safeLog("❌ 类型转换失败:", error);
    return "类型转换失败";
  }
  
  // 第三层检查：DOM操作
  let tempDiv;
  try {
    tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHtml;
    safeLog("✅ DOM元素创建成功");
  } catch (error) {
    safeLog("❌ DOM元素创建失败:", error);
    return "DOM处理失败";
  }
  
  // 第四层检查：字符串处理
  let markdown = safeHtml;
  
  try {
    // 逐个进行替换操作，每个都用try-catch包装
    try {
      markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
    } catch (e) { safeLog("❌ h1替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    } catch (e) { safeLog("❌ h2替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
    } catch (e) { safeLog("❌ h3替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
    } catch (e) { safeLog("❌ h4替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
    } catch (e) { safeLog("❌ h5替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");
    } catch (e) { safeLog("❌ h6替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
    } catch (e) { safeLog("❌ p替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
    } catch (e) { safeLog("❌ br替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    } catch (e) { safeLog("❌ strong替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
    } catch (e) { safeLog("❌ b替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    } catch (e) { safeLog("❌ em替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
    } catch (e) { safeLog("❌ i替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
    } catch (e) { safeLog("❌ a替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");
    } catch (e) { safeLog("❌ img with alt替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, "![]($1)");
    } catch (e) { safeLog("❌ img替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
      });
    } catch (e) { safeLog("❌ ul替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + "\n";
      });
    } catch (e) { safeLog("❌ ol替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n");
    } catch (e) { safeLog("❌ pre code替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
    } catch (e) { safeLog("❌ code替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
        return content.split("\n").map(line => `> ${line}`).join("\n") + "\n\n";
      });
    } catch (e) { safeLog("❌ blockquote替换失败:", e); }
    
    try {
      markdown = markdown.replace(/<[^>]*>/g, "");
    } catch (e) { safeLog("❌ 标签清理失败:", e); }
    
    try {
      markdown = markdown.replace(/\n{3,}/g, "\n\n");
    } catch (e) { safeLog("❌ 换行清理失败:", e); }
    
    try {
      markdown = markdown.replace(/&lt;/g, "<");
      markdown = markdown.replace(/&gt;/g, ">");
      markdown = markdown.replace(/&amp;/g, "&");
      markdown = markdown.replace(/&quot;/g, "\"");
      markdown = markdown.replace(/&#39;/g, "\'");
    } catch (e) { safeLog("❌ HTML实体替换失败:", e); }
    
    try {
      markdown = markdown.trim();
    } catch (e) { safeLog("❌ trim失败:", e); }
    
    safeLog("✅ HTML转Markdown完成");
    return markdown;
    
  } catch (error) {
    safeLog("❌ HTML转Markdown总体失败:", error);
    return `转换失败: ${error.message}`;
  }
}

// 安全的文件名清理函数 - 增强调试版本
function sanitizeFileName(fileName) {
  safeLog("🔄 开始清理文件名", typeof fileName);
  
  // 第一层检查
  if (fileName === null) {
    safeLog("⚠️ 文件名为null");
    return "未命名文章_null";
  }
  
  if (fileName === undefined) {
    safeLog("⚠️ 文件名为undefined");
    return "未命名文章_undefined";
  }
  
  if (fileName === '') {
    safeLog("⚠️ 文件名为空字符串");
    return "未命名文章_empty";
  }
  
  // 第二层检查：类型转换
  let safeFileName;
  try {
    if (typeof fileName !== 'string') {
      safeLog("⚠️ 文件名不是字符串类型，当前类型:", typeof fileName);
      safeFileName = String(fileName);
      safeLog("✅ 已转换为字符串");
    } else {
      safeFileName = fileName;
    }
  } catch (error) {
    safeLog("❌ 文件名类型转换失败:", error);
    return "文件名转换失败";
  }
  
  // 第三层检查：字符串操作
  try {
    const result = safeFileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    safeLog("✅ 文件名清理完成");
    return result;
  } catch (error) {
    safeLog("❌ 文件名清理失败:", error);
    return "文件名处理失败";
  }
}

// 创建下载UI
function createDownloadUI() {
  console.log("🎨 开始创建下载器UI...");
  
  const ui = document.createElement('div');
  ui.id = 'xiaobot-downloader-ui';
  ui.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 320px !important;
    background: white !important;
    border: 2px solid #007cba !important;
    border-radius: 8px !important;
    padding: 16px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 999999 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;
  
  ui.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
      <div style="font-weight: bold; color: #007cba; font-size: 16px;">📥 小报童下载器 v3.1.3</div>
      <button id="xiaobot-close-ui" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
    </div>
    <div id="xiaobot-status" style="margin-bottom: 8px; color: #333; font-weight: 500;">准备就绪</div>
    <div style="margin-bottom: 12px;">
      <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
        <div id="xiaobot-progress-bar" style="background: #007cba; height: 100%; width: 0%; transition: width 0.3s;"></div>
      </div>
      <div id="xiaobot-progress-text" style="font-size: 12px; color: #666; margin-top: 4px;">0 / 0 篇文章</div>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <button id="xiaobot-start-btn" style="flex: 1; background: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">开始抓取</button>
      <button id="xiaobot-download-btn" style="flex: 1; background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;" disabled>下载ZIP</button>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <button id="xiaobot-download-single-btn" style="flex: 1; background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" disabled>单个文件</button>
      <button id="xiaobot-download-merged-btn" style="flex: 1; background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" disabled>合并文件</button>
    </div>
    <div id="xiaobot-download-links" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 8px; display: none;">
      <div style="font-weight: bold; margin-bottom: 8px;">下载链接：</div>
      <div id="xiaobot-links-container"></div>
    </div>
    <div style="font-size: 11px; color: #666; margin-top: 8px;">
      <strong>说明：</strong>v3.1.3调试版本，专门用于定位ZIP生成错误。
    </div>
    <div style="font-size: 10px; color: #999; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">
      调试信息：页面URL: ${window.location.href}
    </div>
  `;
  
  // 添加到页面
  document.body.appendChild(ui);
  console.log("✅ UI元素已添加到页面");
  
  // 绑定事件
  const closeBtn = document.getElementById('xiaobot-close-ui');
  const startBtn = document.getElementById('xiaobot-start-btn');
  const downloadBtn = document.getElementById('xiaobot-download-btn');
  const downloadSingleBtn = document.getElementById('xiaobot-download-single-btn');
  const downloadMergedBtn = document.getElementById('xiaobot-download-merged-btn');
  
  if (closeBtn) {
    closeBtn.onclick = () => {
      console.log("🔒 用户点击关闭按钮");
      ui.style.display = 'none';
    };
  }
  
  if (startBtn) {
    startBtn.onclick = () => {
      console.log("🚀 用户点击开始抓取按钮");
      startScrapingAndDownload();
    };
  }
  
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      console.log("📦 用户点击下载ZIP按钮");
      generateZipDownload();
    };
  }
  
  if (downloadSingleBtn) {
    downloadSingleBtn.onclick = () => {
      console.log("📄 用户点击单个文件按钮");
      generateDownloadLinks();
    };
  }
  
  if (downloadMergedBtn) {
    downloadMergedBtn.onclick = () => {
      console.log("📚 用户点击合并文件按钮");
      generateMergedDownload();
    };
  }
  
  downloadUI = ui;
  console.log("🎉 下载器UI创建成功！");
  
  return ui;
}

// 尝试创建UI的函数
async function attemptCreateUI() {
  console.log("🔄 尝试创建UI...");
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`📝 第${attempt}次尝试创建UI`);
      
      if (document.body) {
        const ui = createDownloadUI();
        if (ui && document.getElementById('xiaobot-downloader-ui')) {
          console.log("✅ UI创建成功！");
          return;
        }
      }
      
      console.log(`⏳ 第${attempt}次尝试失败，等待3秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ 第${attempt}次创建UI时出错:`, error);
    }
  }
  
  console.error("❌ 5次尝试后仍无法创建UI，请刷新页面重试");
  alert("下载器UI创建失败，请刷新页面重试。如果问题持续存在，请检查是否有其他扩展冲突。");
}

// 更新UI状态
function updateUI(status, progress = null, progressText = null) {
  if (!downloadUI) {
    console.log("⚠️ UI不存在，无法更新状态");
    return;
  }
  
  const statusEl = document.getElementById('xiaobot-status');
  const progressBarEl = document.getElementById('xiaobot-progress-bar');
  const progressTextEl = document.getElementById('xiaobot-progress-text');
  const startBtn = document.getElementById('xiaobot-start-btn');
  const downloadBtn = document.getElementById('xiaobot-download-btn');
  const downloadSingleBtn = document.getElementById('xiaobot-download-single-btn');
  const downloadMergedBtn = document.getElementById('xiaobot-download-merged-btn');
  
  if (statusEl) statusEl.textContent = status;
  
  if (progress !== null && progressBarEl) {
    progressBarEl.style.width = progress + '%';
  }
  
  if (progressText !== null && progressTextEl) {
    progressTextEl.textContent = progressText;
  }
  
  if (startBtn) {
    if (isScrapingActive) {
      startBtn.disabled = true;
      startBtn.textContent = '抓取中...';
    } else {
      startBtn.disabled = false;
      startBtn.textContent = '开始抓取';
    }
  }
  
  // 启用下载按钮
  if (apiData.length > 0) {
    if (downloadBtn) downloadBtn.disabled = false;
    if (downloadSingleBtn) downloadSingleBtn.disabled = false;
    if (downloadMergedBtn) downloadMergedBtn.disabled = false;
  }
}

// 注入脚本到页面
function injectScript() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log("📡 注入脚本开始执行");
      
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      const originalFetch = window.fetch;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(data) {
        this.addEventListener('load', function() {
          if (this._url && this._url.includes('/api/')) {
            console.log("🔍 拦截到XHR API请求:", this._url);
            try {
              const responseData = JSON.parse(this.responseText);
              window.postMessage({
                type: 'XIAOBOT_API_RESPONSE',
                url: this._url,
                data: responseData
              }, '*');
            } catch (e) {
              console.log("⚠️ XHR响应解析失败:", e);
            }
          }
        });
        return originalXHRSend.apply(this, [data]);
      };
      
      window.fetch = function(url, options) {
        return originalFetch(url, options).then(response => {
          if (url.includes('/api/')) {
            console.log("🔍 拦截到Fetch API请求:", url);
            response.clone().json().then(data => {
              window.postMessage({
                type: 'XIAOBOT_API_RESPONSE',
                url: url,
                data: data
              }, '*');
            }).catch(e => {
              console.log("⚠️ Fetch响应解析失败:", e);
            });
          }
          return response;
        });
      };
      
      console.log("✅ API拦截器注入完成");
    })();
  `;
  
  document.head.appendChild(script);
  console.log("✅ 脚本注入完成");
}

// 监听API响应
function setupAPIListener() {
  window.addEventListener('message', function(event) {
    if (event.data.type === 'XIAOBOT_API_RESPONSE') {
      const { url, data } = event.data;
      
      if (url.includes('/post') && data && data.data) {
        console.log("📥 收到文章API响应:", url, "文章数:", data.data.length);
        
        if (Array.isArray(data.data)) {
          // 合并数据，避免重复
          data.data.forEach(article => {
            if (!apiData.find(existing => existing.id === article.id)) {
              apiData.push(article);
            }
          });
          
          console.log("📊 当前总文章数:", apiData.length);
          updateUI(`已获取 ${apiData.length} 篇文章`, null, `${apiData.length} 篇文章`);
        }
      }
    }
  });
  
  console.log("✅ API监听器设置完成");
}

// 开始抓取和下载
async function startScrapingAndDownload() {
  if (isScrapingActive) {
    console.log("⚠️ 抓取已在进行中");
    return;
  }
  
  isScrapingActive = true;
  apiData = [];
  
  console.log("🚀 开始抓取文章数据...");
  updateUI("正在抓取文章数据...", 0, "0 篇文章");
  
  // 注入API拦截脚本
  injectScript();
  setupAPIListener();
  
  // 等待一段时间让API拦截器生效
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 开始智能滚动加载
  await smartScrollToLoadAll();
  
  isScrapingActive = false;
  
  if (apiData.length > 0) {
    updateUI(`抓取完成，共获取 ${apiData.length} 篇文章`, 100, `${apiData.length} 篇文章`);
    console.log("✅ 抓取完成，文章数:", apiData.length);
  } else {
    updateUI("未获取到文章数据，请重试", 0, "0 篇文章");
    console.log("⚠️ 未获取到任何文章数据");
  }
}

// 智能滚动加载所有文章
async function smartScrollToLoadAll() {
  console.log("📜 开始智能滚动加载...");
  
  let lastArticleCount = 0;
  let noNewDataCount = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 200;
  const maxNoNewDataCount = 15;
  
  while (scrollAttempts < maxScrollAttempts && noNewDataCount < maxNoNewDataCount) {
    // 滚动到页面底部
    window.scrollTo(0, document.body.scrollHeight);
    
    // 等待数据加载
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    scrollAttempts++;
    
    if (apiData.length > lastArticleCount) {
      lastArticleCount = apiData.length;
      noNewDataCount = 0;
      console.log(`📄 滚动第${scrollAttempts}次，获取到新文章，当前总数: ${apiData.length}`);
      updateUI(`正在加载更多文章...`, null, `已获取 ${apiData.length} 篇文章`);
    } else {
      noNewDataCount++;
      console.log(`⏳ 滚动第${scrollAttempts}次，无新数据，连续无数据次数: ${noNewDataCount}`);
    }
    
    // 每3次无新数据时，尝试向上滚动再向下滚动
    if (noNewDataCount > 0 && noNewDataCount % 3 === 0) {
      console.log("🔄 尝试向上滚动再向下滚动以触发懒加载");
      window.scrollTo(0, document.body.scrollHeight * 0.8);
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("🏁 智能滚动加载完成，最终文章数:", apiData.length);
}

// 生成ZIP下载（调试版本）
async function generateZipDownload() {
  if (apiData.length === 0) {
    alert('没有可下载的文章数据');
    return;
  }
  
  console.log("📦 开始生成ZIP文件...");
  console.log("📊 文章数据概览:", apiData.length, "篇文章");
  
  updateUI("正在加载ZIP库...", null, `准备打包 ${apiData.length} 篇文章`);
  
  try {
    // 动态加载JSZip库
    if (typeof JSZip === 'undefined') {
      console.log("📚 动态加载JSZip库...");
      await loadJSZip();
    }
    
    updateUI("正在生成ZIP文件...", null, `准备打包 ${apiData.length} 篇文章`);
    
    const zip = new JSZip();
    const folder = zip.folder("小报童文章");
    
    console.log("📝 开始处理每篇文章...");
    
    // 逐个处理文章，详细记录每个步骤
    for (let index = 0; index < apiData.length; index++) {
      const article = apiData[index];
      
      try {
        console.log(`🔄 处理第${index + 1}篇文章...`);
        
        // 详细检查文章数据
        safeLog("📋 文章数据检查:", {
          hasArticle: !!article,
          hasTitle: !!article?.title,
          hasContent: !!article?.content,
          titleType: typeof article?.title,
          contentType: typeof article?.content
        });
        
        // 安全获取标题
        let title;
        try {
          title = article.title;
          safeLog("📝 原始标题:", title);
        } catch (error) {
          safeLog("❌ 获取标题失败:", error);
          title = `文章_${index + 1}`;
        }
        
        // 安全获取内容
        let content;
        try {
          content = article.content || '';
          safeLog("📄 内容长度:", content.length);
        } catch (error) {
          safeLog("❌ 获取内容失败:", error);
          content = '';
        }
        
        // 安全转换HTML到Markdown
        let markdown;
        try {
          markdown = htmlToMarkdown(content);
          safeLog("✅ Markdown转换完成，长度:", markdown.length);
        } catch (error) {
          safeLog("❌ Markdown转换失败:", error);
          markdown = "内容转换失败";
        }
        
        // 安全清理文件名
        let safeFileName;
        try {
          const cleanTitle = sanitizeFileName(title);
          safeFileName = `${String(index + 1).padStart(3, '0')}_${cleanTitle}.md`;
          safeLog("📁 文件名:", safeFileName);
        } catch (error) {
          safeLog("❌ 文件名生成失败:", error);
          safeFileName = `${String(index + 1).padStart(3, '0')}_文章.md`;
        }
        
        // 安全生成最终内容
        let finalContent;
        try {
          const publishTime = article.published_at || article.created_at || '未知时间';
          finalContent = `# ${title}\n\n发布时间: ${publishTime}\n\n${markdown}`;
          safeLog("✅ 最终内容生成完成");
        } catch (error) {
          safeLog("❌ 最终内容生成失败:", error);
          finalContent = `# 文章_${index + 1}\n\n内容生成失败`;
        }
        
        // 安全添加到ZIP
        try {
          folder.file(safeFileName, finalContent);
          safeLog(`✅ 第${index + 1}篇文章已添加到ZIP`);
        } catch (error) {
          safeLog(`❌ 第${index + 1}篇文章添加到ZIP失败:`, error);
        }
        
        // 更新进度
        if ((index + 1) % 10 === 0) {
          updateUI("正在处理文章...", null, `已处理 ${index + 1}/${apiData.length} 篇`);
        }
        
      } catch (error) {
        safeLog(`❌ 处理第${index + 1}篇文章时发生未知错误:`, error);
        // 继续处理下一篇文章
      }
    }
    
    console.log("📋 开始生成目录文件...");
    
    // 生成目录文件
    try {
      const indexContent = apiData.map((article, index) => {
        const title = article.title || `文章_${index + 1}`;
        const safeTitle = sanitizeFileName(title);
        return `${index + 1}. [${title}](${String(index + 1).padStart(3, '0')}_${safeTitle}.md)`;
      }).join('\n');
      
      folder.file("目录.md", `# 小报童文章目录\n\n共 ${apiData.length} 篇文章\n\n${indexContent}`);
      console.log("✅ 目录文件生成完成");
    } catch (error) {
      console.error("❌ 目录文件生成失败:", error);
    }
    
    updateUI("正在压缩文件...", null, "生成ZIP中...");
    
    // 生成ZIP文件
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6
      }
    });
    
    // 创建下载链接
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `小报童文章_${apiData.length}篇_${new Date().toISOString().split('T')[0]}.zip`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    updateUI(`ZIP文件已生成，包含 ${apiData.length} 篇文章`, 100, `${apiData.length} 篇文章已打包`);
    console.log("✅ ZIP文件下载完成");
    
  } catch (error) {
    console.error("❌ 生成ZIP文件时出错:", error);
    console.error("❌ 错误堆栈:", error.stack);
    updateUI(`ZIP生成失败: ${error.message}`, null, `已获取 ${apiData.length} 篇文章`);
    
    // 如果ZIP功能失败，提供备选方案
    if (confirm('ZIP功能暂时不可用，是否改为下载合并文件？')) {
      generateMergedDownload();
    }
  }
}

// 动态加载JSZip库（已移除远程加载，使用本地JSZip）
function loadJSZip() {
  return new Promise((resolve, reject) => {
    // JSZip 库已通过 manifest.json 预加载，直接使用
    if (typeof JSZip !== 'undefined') {
      console.log("✅ JSZip库已可用");
      resolve();
    } else {
      console.error("❌ JSZip库未找到");
      reject(new Error('JSZip库未找到'));
    }
  });
}

// 生成合并文件下载
function generateMergedDownload() {
  if (apiData.length === 0) {
    alert('没有可下载的文章数据');
    return;
  }
  
  console.log("📚 开始生成合并文件...");
  
  const allContent = apiData.map((article, index) => {
    const markdown = htmlToMarkdown(article.content || '');
    return `# ${index + 1}. ${article.title}\n\n发布时间: ${article.published_at || article.created_at || '未知'}\n\n${markdown}\n\n---\n\n`;
  }).join('');
  
  const blob = new Blob([allContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `小报童文章合集_${new Date().toISOString().split('T')[0]}.md`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  
  updateUI(`合并文件已生成，包含 ${apiData.length} 篇文章`);
  console.log("✅ 合并文件下载完成");
}

// 生成单个文件下载链接
function generateDownloadLinks() {
  if (apiData.length === 0) {
    alert('没有可下载的文章数据');
    return;
  }
  
  console.log("📄 开始生成单个文件下载链接...");
  
  const linksContainer = document.getElementById('xiaobot-links-container');
  const downloadLinksDiv = document.getElementById('xiaobot-download-links');
  
  if (!linksContainer || !downloadLinksDiv) return;
  
  linksContainer.innerHTML = '';
  
  // 生成单个文章文件
  apiData.forEach((article, index) => {
    const markdown = htmlToMarkdown(article.content || '');
    const fileName = `${String(index + 1).padStart(3, '0')}_${sanitizeFileName(article.title)}.md`;
    const content = `# ${article.title}\n\n发布时间: ${article.published_at || article.created_at || '未知'}\n\n${markdown}`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.textContent = fileName;
    link.style.cssText = 'display: block; margin: 4px 0; color: #007cba; text-decoration: none; font-size: 12px;';
    link.onclick = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    
    linksContainer.appendChild(link);
  });
  
  downloadLinksDiv.style.display = 'block';
  updateUI(`已生成 ${apiData.length} 个下载链接`);
  
  console.log("✅ 单个文件下载链接生成完成");
}

