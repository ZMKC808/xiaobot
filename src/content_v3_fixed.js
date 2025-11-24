// 小报童文章下载器 v3.1.4 - 修复大数据量ZIP生成问题
// 基于v3.1版本，专门修复100篇文章时的null错误

// 全局变量
let downloadUI = null;
let apiData = [];
let isScrapingActive = false;
let uiCreationAttempts = 0;

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDownloader);
} else {
  initializeDownloader();
}

// 初始化下载器
function initializeDownloader() {
  console.log("🚀 小报童下载器 v3.1.4 开始加载...");
  console.log("📍 当前页面:", window.location.href, "是否为小报童页面:", window.location.href.includes('xiaobot.net'));
  
  if (window.location.href.includes('xiaobot.net')) {
    attemptCreateUI();
  } else {
    console.log("❌ 不是小报童页面，跳过初始化");
  }
}

// 检查是否为小报童页面
function isXiaobotPage() {
  return window.location.href.includes('xiaobot.net');
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
      <div style="font-weight: bold; color: #007cba; font-size: 16px;">📥 小报童下载器 v3.1.4</div>
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
      <strong>说明：</strong>先手动滚动到页面底部，再点击开始抓取。v3.1.4修复大数据量ZIP生成问题。
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
  console.log(`🔄 尝试创建UI (第${uiCreationAttempts + 1}次)`);
  
  if (!isXiaobotPage()) {
    console.log("❌ 不是小报童页面，跳过UI创建");
    return;
  }
  
  uiCreationAttempts++;
  
  try {
    if (document.body) {
      const ui = createDownloadUI();
      if (ui && document.getElementById('xiaobot-downloader-ui')) {
        console.log("✅ UI创建成功！");
        return;
      }
    }
    
    if (uiCreationAttempts < 5) {
      console.log(`⏳ 第${uiCreationAttempts}次尝试失败，等待3秒后重试...`);
      setTimeout(attemptCreateUI, 3000);
    } else {
      console.error("❌ 5次尝试后仍无法创建UI，请刷新页面重试");
      alert("下载器UI创建失败，请刷新页面重试。如果问题持续存在，请检查是否有其他扩展冲突。");
    }
  } catch (error) {
    console.error(`❌ 第${uiCreationAttempts}次创建UI时出错:`, error);
    if (uiCreationAttempts < 5) {
      setTimeout(attemptCreateUI, 3000);
    }
  }
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
  const maxScrollAttempts = 500;
  const maxNoNewDataCount = 10;
  
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

// 安全的HTML转Markdown函数
function htmlToMarkdown(html) {
  // 安全检查
  if (!html || typeof html !== 'string') {
    return "内容为空";
  }
  
  try {
    let markdown = html;
    
    // HTML标签转换
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
    
    // 列表处理
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
    });
    
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + "\n";
    });
    
    // 代码块处理
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n");
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
    
    // 引用处理
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return content.split("\n").map(line => `> ${line}`).join("\n") + "\n\n";
    });
    
    // 清理HTML标签
    markdown = markdown.replace(/<[^>]*>/g, "");
    
    // 清理多余换行
    markdown = markdown.replace(/\n{3,}/g, "\n\n");
    
    // HTML实体解码
    markdown = markdown.replace(/&lt;/g, "<");
    markdown = markdown.replace(/&gt;/g, ">");
    markdown = markdown.replace(/&amp;/g, "&");
    markdown = markdown.replace(/&quot;/g, "\"");
    markdown = markdown.replace(/&#39;/g, "\'");
    
    return markdown.trim();
  } catch (error) {
    console.error("HTML转Markdown失败:", error);
    return "内容转换失败";
  }
}

// 安全的文件名清理函数 - 重点修复
function sanitizeFileName(fileName) {
  try {
    // 多重安全检查
    if (fileName === null || fileName === undefined) {
      console.warn("文件名为null或undefined，使用默认名称");
      return "未命名文章";
    }
    
    // 确保是字符串
    let safeFileName = String(fileName);
    
    // 检查转换后的字符串
    if (!safeFileName || safeFileName === 'null' || safeFileName === 'undefined') {
      console.warn("文件名转换后无效，使用默认名称");
      return "未命名文章";
    }
    
    // 安全的字符替换
    const cleanFileName = safeFileName.replace(/[<>:"/\\|?*]/g, '_');
    
    // 检查替换结果
    if (!cleanFileName) {
      console.warn("文件名清理后为空，使用默认名称");
      return "未命名文章";
    }
    
    // 安全的截取
    const result = cleanFileName.substring(0, 50);
    
    return result || "未命名文章";
    
  } catch (error) {
    console.error("文件名清理失败:", error, "原始文件名:", fileName);
    return "文件名处理失败";
  }
}

// 生成ZIP下载 - 重点修复大数据量问题
async function generateZipDownload() {
  if (apiData.length === 0) {
    alert('没有可下载的文章数据');
    return;
  }
  
  console.log("📦 开始生成ZIP文件...");
  updateUI("正在加载ZIP库...", null, `准备打包 ${apiData.length} 篇文章`);
  
  try {
    // 动态加载JSZip库
    if (typeof JSZip === 'undefined') {
      console.log("📚 动态加载JSZip库...");
      await loadJSZip();
    }
    
    console.log("✅ JSZip库加载成功");
    updateUI("正在生成ZIP文件...", null, `准备打包 ${apiData.length} 篇文章`);
    
    const zip = new JSZip();
    const folder = zip.folder("小报童文章");
    
    // 数据预处理和验证
    console.log("🔍 开始数据预处理...");
    const validArticles = [];
    const skippedArticles = [];
    
    for (let i = 0; i < apiData.length; i++) {
      const article = apiData[i];
      
      try {
        // 验证文章数据
        if (!article) {
          console.warn(`第${i + 1}篇文章数据为空，跳过`);
          skippedArticles.push(`第${i + 1}篇: 文章数据为空`);
          continue;
        }
        
        // 验证标题
        const title = article.title;
        if (!title) {
          console.warn(`第${i + 1}篇文章标题为空，跳过`);
          skippedArticles.push(`第${i + 1}篇: 标题为空`);
          continue;
        }
        
        // 验证内容
        const content = article.content || '';
        
        // 添加到有效文章列表
        validArticles.push({
          index: i + 1,
          title: title,
          content: content,
          publishTime: article.published_at || article.created_at || '未知时间'
        });
        
      } catch (error) {
        console.error(`验证第${i + 1}篇文章时出错:`, error);
        skippedArticles.push(`第${i + 1}篇: 验证失败 - ${error.message}`);
      }
    }
    
    console.log(`✅ 数据预处理完成: ${validArticles.length} 篇有效, ${skippedArticles.length} 篇跳过`);
    
    if (validArticles.length === 0) {
      throw new Error("没有有效的文章数据可以打包");
    }
    
    // 处理有效文章
    console.log("📝 开始处理文章内容...");
    
    for (let i = 0; i < validArticles.length; i++) {
      const article = validArticles[i];
      
      try {
        // 安全处理每个步骤
        const markdown = htmlToMarkdown(article.content);
        const safeTitle = sanitizeFileName(article.title);
        const fileName = `${String(article.index).padStart(3, '0')}_${safeTitle}.md`;
        const finalContent = `# ${article.title}\n\n发布时间: ${article.publishTime}\n\n${markdown}`;
        
        // 添加到ZIP
        folder.file(fileName, finalContent);
        
        // 更新进度
        if ((i + 1) % 10 === 0 || i === validArticles.length - 1) {
          updateUI("正在处理文章...", null, `已处理 ${i + 1}/${validArticles.length} 篇`);
        }
        
      } catch (error) {
        console.error(`处理第${article.index}篇文章时出错:`, error);
        skippedArticles.push(`第${article.index}篇: 处理失败 - ${error.message}`);
      }
    }
    
    // 添加目录文件
    try {
      const indexContent = validArticles.map((article) => {
        const safeTitle = sanitizeFileName(article.title);
        return `${article.index}. [${article.title}](${String(article.index).padStart(3, '0')}_${safeTitle}.md)`;
      }).join('\n');
      
      let summaryContent = `# 小报童文章目录\n\n共 ${validArticles.length} 篇文章\n\n${indexContent}`;
      
      if (skippedArticles.length > 0) {
        summaryContent += `\n\n## 跳过的文章 (${skippedArticles.length} 篇)\n\n${skippedArticles.join('\n')}`;
      }
      
      folder.file("目录.md", summaryContent);
      console.log("✅ 目录文件生成完成");
    } catch (error) {
      console.error("目录文件生成失败:", error);
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
    link.download = `小报童文章_${validArticles.length}篇_${new Date().toISOString().split('T')[0]}.zip`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    updateUI(`ZIP文件已生成，包含 ${validArticles.length} 篇文章`, 100, `${validArticles.length} 篇文章已打包`);
    console.log("✅ ZIP文件下载完成");
    
    if (skippedArticles.length > 0) {
      console.warn(`⚠️ 跳过了 ${skippedArticles.length} 篇文章，详情请查看ZIP中的目录文件`);
    }
    
  } catch (error) {
    console.error("❌ 生成ZIP文件时出错:", error);
    updateUI(`ZIP生成失败: ${error.message}`, null, `已获取 ${apiData.length} 篇文章`);
    
    // 提供备选方案
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

