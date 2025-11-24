// 内容脚本 v3.0 - 完全去中心化架构，避免Extension context invalidated

console.log("🚀 小报童下载器 v3.0 开始加载...");

let apiData = [];
let isScrapingActive = false;
let downloadUI = null;
let uiCreationAttempts = 0;
const MAX_UI_ATTEMPTS = 5;

// 检查页面是否为小报童专栏页面
function isXiaobotPage() {
  const url = window.location.href;
  const isXiaobot = url.includes('xiaobot.net');
  console.log("📍 当前页面:", url, "是否为小报童页面:", isXiaobot);
  return isXiaobot;
}

// 等待DOM准备就绪
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// HTML转Markdown的简单实现
function htmlToMarkdown(html) {
  // 安全检查：处理空值情况
  if (!html || html === null || html === undefined) {
    console.log("⚠️ HTML内容为空，返回默认文本");
    return "内容为空";
  }
  
  // 确保html是字符串类型
  if (typeof html !== 'string') {
    console.log("⚠️ HTML内容不是字符串类型，尝试转换:", typeof html);
    html = String(html);
  }
  
  try {
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
    
  } catch (error) {
    console.error("❌ HTML转Markdown时出错:", error, "原始HTML:", html);
    return `转换失败: ${error.message}`;
  }
}

// 创建下载UI
function createDownloadUI() {
  console.log("🎨 开始创建下载器UI...");
  
  if (downloadUI) {
    console.log("✅ UI已存在，直接返回");
    return downloadUI;
  }
  
  // 检查是否已存在UI
  const existingUI = document.getElementById('xiaobot-download-ui');
  if (existingUI) {
    console.log("⚠️ 发现已存在的UI，移除后重新创建");
    existingUI.remove();
  }
  
  try {
    const ui = document.createElement('div');
    ui.id = 'xiaobot-download-ui';
    ui.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 350px !important;
      background: white !important;
      border: 2px solid #007cba !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    ui.innerHTML = `
      <div style="background: #007cba; color: white; padding: 12px; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">小报童文章下载器 v3.0</span>
        <button id="xiaobot-close-ui" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px;">×</button>
      </div>
      <div style="padding: 16px;">
        <div id="xiaobot-status" style="margin-bottom: 12px; color: #666;">✅ UI已成功加载</div>
        <div id="xiaobot-progress" style="margin-bottom: 12px;">
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
          <strong>说明：</strong>v3.0支持三种下载方式：ZIP打包（推荐）、单个文件、合并文件。
        </div>
        <div style="font-size: 10px; color: #999; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">
          调试信息：页面URL: ${window.location.href}
        </div>
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
    
    // 显示成功提示
    setTimeout(() => {
      updateUI("准备就绪，请点击开始抓取");
    }, 1000);
    
    return ui;
    
  } catch (error) {
    console.error("❌ 创建UI时出错:", error);
    
    // 创建简化版UI作为备用
    const fallbackUI = document.createElement('div');
    fallbackUI.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: red; color: white; padding: 10px; z-index: 999999; border-radius: 4px;">
        ❌ UI创建失败: ${error.message}
        <br>请检查控制台获取更多信息
      </div>
    `;
    document.body.appendChild(fallbackUI);
    
    return null;
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
  console.log("💉 开始注入API拦截脚本...");
  
  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/inject.js");
    script.onload = function() {
      console.log("✅ API拦截脚本注入成功");
      this.remove();
    };
    script.onerror = function() {
      console.error("❌ API拦截脚本注入失败");
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error("❌ 注入脚本时出错:", error);
  }
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
      
      console.log("📄 收到新文章数据:", newArticles.length, "篇，总计:", apiData.length, "篇");
      
      // 更新UI
      const progress = Math.min(100, (apiData.length / Math.max(totalCount, apiData.length)) * 100);
      updateUI(`已获取 ${apiData.length} 篇文章`, progress, `${apiData.length} / ${Math.max(totalCount, apiData.length)} 篇文章`);
    }
  }
  
  if (event.data.type === "START_SCRAPING_AND_DOWNLOAD") {
    startScrapingAndDownload();
  }
  
  if (event.data.type === "SCRAPING_COMPLETE") {
    updateUI(`抓取完成，共获取 ${apiData.length} 篇文章`, 100, `${apiData.length} / ${apiData.length} 篇文章`);
  }
});

// 开始抓取流程
async function startScrapingAndDownload() {
  if (isScrapingActive) return;
  
  isScrapingActive = true;
  apiData = [];
  
  console.log("🚀 开始抓取小报童文章...");
  updateUI("正在初始化...", 0, "0 / 0 篇文章");
  
  try {
    await waitForPageLoad();
    
    // 清除之前的数据
    if (window.clearXiaobotData) {
      window.clearXiaobotData();
    }
    
    updateUI("正在加载页面内容...", 5);
    triggerInitialLoad();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    updateUI("正在智能滚动加载...", 10);
    // 使用改进的滚动加载策略
    await smartScrollToLoadAll();
    
    console.log("✅ 抓取完成，共获取", apiData.length, "篇文章");
    updateUI(`抓取完成，共获取 ${apiData.length} 篇文章`, 100, `${apiData.length} / ${apiData.length} 篇文章`);
    
    window.postMessage({ type: "SCRAPING_COMPLETE" }, "*");
    
  } catch (error) {
    console.error("❌ 抓取过程中出错:", error);
    updateUI(`抓取出错: ${error.message}`, null, `已获取 ${apiData.length} 篇文章`);
  } finally {
    isScrapingActive = false;
    updateUI(`抓取完成，共获取 ${apiData.length} 篇文章`, 100, `${apiData.length} / ${apiData.length} 篇文章`);
  }
}

// 等待页面加载
function waitForPageLoad() {
  console.log("⏳ 等待页面加载完成...");
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      console.log("✅ 页面已加载完成");
      resolve();
    } else {
      window.addEventListener("load", () => {
        console.log("✅ 页面加载事件触发");
        resolve();
      });
    }
  });
}

// 触发初始内容加载
function triggerInitialLoad() {
  console.log("🔄 触发初始内容加载...");
  const activeElement = document.querySelector("div.active");
  if (activeElement) {
    activeElement.click();
    console.log("✅ 点击了激活元素");
  }
  
  window.scrollTo(0, 0);
  console.log("⬆️ 滚动到页面顶部");
}

// 智能滚动加载所有内容
async function smartScrollToLoadAll() {
  console.log("🔄 开始智能滚动加载所有内容...");
  let lastApiCount = 0;
  let noNewDataCount = 0;
  const maxScrollAttempts = 50;
  let lastScrollHeight = 0;
  let noScrollHeightChangeCount = 0;

  for (let i = 0; i < maxScrollAttempts; i++) {
    // 记录当前页面高度
    const currentScrollHeight = document.body.scrollHeight;
    
    // 滚动到页面底部
    window.scrollTo(0, document.body.scrollHeight);
    
    // 等待内容加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 更新进度
    const progress = 10 + (i / maxScrollAttempts) * 80; // 10-90%的进度用于滚动
    updateUI(`正在滚动加载... (${i + 1}/${maxScrollAttempts})`, progress);

    // 检查是否有新的文章数据
    if (apiData.length === lastApiCount) {
      noNewDataCount++;
      console.log(`📊 第${i + 1}次滚动，无新数据，连续${noNewDataCount}次`);

      // 检查页面高度是否有变化
      if (currentScrollHeight === lastScrollHeight) {
        noScrollHeightChangeCount++;
        console.log(`📏 页面高度无变化，连续${noScrollHeightChangeCount}次`);
      } else {
        noScrollHeightChangeCount = 0;
        lastScrollHeight = currentScrollHeight;
      }

      // 如果连续3次无新数据且页面高度也不再变化，则停止滚动
      if (noNewDataCount >= 3 && noScrollHeightChangeCount >= 2) {
        console.log("🛑 连续3次无新数据且页面高度不再变化，停止滚动");
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
      console.log(`📈 第${i + 1}次滚动，当前文章数:`, apiData.length);
    }

    // 检查是否已经滚动到真正的底部
    const scrollTarget = document.documentElement;
    if (scrollTarget.scrollHeight - scrollTarget.scrollTop <= scrollTarget.clientHeight + 50) {
      console.log("⬇️ 已滚动到页面底部");
      // 在底部多等待一会儿，确保所有内容都加载完成
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (apiData.length === lastApiCount) {
        console.log("✅ 在页面底部等待后仍无新数据，停止滚动");
        break;
      }
    }
  }
  
  console.log("🏁 智能滚动加载完成，最终文章数:", apiData.length);
}

// 生成ZIP下载（主要功能）
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
    
    updateUI("正在验证文章数据...", null, `验证 ${apiData.length} 篇文章`);
    
    // 数据验证和清理
    const validArticles = [];
    const invalidArticles = [];
    
    apiData.forEach((article, index) => {
      try {
        // 验证文章数据完整性
        const articleData = validateArticleData(article, index);
        if (articleData) {
          validArticles.push(articleData);
        } else {
          invalidArticles.push({ index, reason: '数据验证失败' });
        }
      } catch (error) {
        console.error(`❌ 验证第${index + 1}篇文章时出错:`, error);
        invalidArticles.push({ index, reason: error.message });
      }
    });
    
    console.log(`✅ 数据验证完成: ${validArticles.length} 篇有效, ${invalidArticles.length} 篇无效`);
    
    if (validArticles.length === 0) {
      throw new Error('没有有效的文章数据可以打包');
    }
    
    if (invalidArticles.length > 0) {
      console.log("⚠️ 跳过的无效文章:", invalidArticles);
    }
    
    updateUI("正在生成ZIP文件...", null, `打包 ${validArticles.length} 篇有效文章`);
    
    const zip = new JSZip();
    const folder = zip.folder("小报童文章");
    
    // 分批处理文章，避免内存问题
    const batchSize = 20;
    for (let i = 0; i < validArticles.length; i += batchSize) {
      const batch = validArticles.slice(i, i + batchSize);
      
      updateUI("正在处理文章...", null, `处理第 ${i + 1}-${Math.min(i + batchSize, validArticles.length)} 篇`);
      
      batch.forEach((articleData, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const fileName = `${String(globalIndex + 1).padStart(3, '0')}_${articleData.safeTitle}.md`;
          folder.file(fileName, articleData.content);
          
          if ((globalIndex + 1) % 10 === 0) {
            console.log(`📄 已处理 ${globalIndex + 1} 篇文章`);
          }
        } catch (error) {
          console.error(`❌ 添加第${globalIndex + 1}篇文章到ZIP时出错:`, error);
        }
      });
      
      // 给浏览器一些时间处理其他任务
      if (i + batchSize < validArticles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 生成目录文件
    try {
      const indexContent = validArticles.map((articleData, index) => {
        return `${index + 1}. [${articleData.originalTitle}](${String(index + 1).padStart(3, '0')}_${articleData.safeTitle}.md)`;
      }).join('\n');
      
      const summaryContent = `# 小报童文章目录\n\n共 ${validArticles.length} 篇文章\n\n${indexContent}\n\n---\n\n## 统计信息\n\n- 总文章数: ${apiData.length}\n- 有效文章数: ${validArticles.length}\n- 跳过文章数: ${invalidArticles.length}\n- 生成时间: ${new Date().toLocaleString()}`;
      
      folder.file("目录.md", summaryContent);
      
      if (invalidArticles.length > 0) {
        const errorLog = `# 跳过的文章列表\n\n${invalidArticles.map(item => `- 第${item.index + 1}篇: ${item.reason}`).join('\n')}`;
        folder.file("跳过的文章.md", errorLog);
      }
    } catch (error) {
      console.error("❌ 生成目录文件时出错:", error);
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
    
    const successMessage = invalidArticles.length > 0 
      ? `ZIP文件已生成，包含 ${validArticles.length} 篇文章（跳过 ${invalidArticles.length} 篇异常文章）`
      : `ZIP文件已生成，包含 ${validArticles.length} 篇文章`;
    
    updateUI(successMessage, 100, `${validArticles.length} 篇文章已打包`);
    console.log("✅ ZIP文件下载完成");
    
  } catch (error) {
    console.error("❌ 生成ZIP文件时出错:", error);
    updateUI(`ZIP生成失败: ${error.message}`, null, `已获取 ${apiData.length} 篇文章`);
    
    // 如果ZIP功能失败，提供备选方案
    if (confirm('ZIP功能暂时不可用，是否改为下载合并文件？')) {
      generateMergedDownload();
    }
  }
}

// 验证文章数据
function validateArticleData(article, index) {
  try {
    // 检查基本字段
    if (!article || typeof article !== 'object') {
      console.log(`⚠️ 第${index + 1}篇文章: 不是有效对象`);
      return null;
    }
    
    // 处理标题
    let title = article.title;
    if (!title || title === null || title === undefined) {
      title = `未命名文章_${index + 1}`;
      console.log(`⚠️ 第${index + 1}篇文章: 标题为空，使用默认标题`);
    } else if (typeof title !== 'string') {
      title = String(title);
    }
    
    // 处理内容
    let content = article.content;
    if (!content || content === null || content === undefined) {
      content = '';
      console.log(`⚠️ 第${index + 1}篇文章: 内容为空`);
    }
    
    // 处理时间
    const publishTime = article.published_at || article.created_at || '未知时间';
    
    // 转换内容
    const markdown = htmlToMarkdown(content);
    const safeTitle = sanitizeFileName(title);
    
    // 生成最终内容
    const finalContent = `# ${title}\n\n发布时间: ${publishTime}\n\n${markdown}`;
    
    return {
      originalTitle: title,
      safeTitle: safeTitle,
      content: finalContent,
      publishTime: publishTime
    };
    
  } catch (error) {
    console.error(`❌ 验证第${index + 1}篇文章时出错:`, error);
    return null;
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

// 清理文件名
function sanitizeFileName(fileName) {
  // 安全检查：处理空值情况
  if (!fileName || fileName === null || fileName === undefined) {
    console.log("⚠️ 文件名为空，使用默认名称");
    return "未命名文章";
  }
  
  // 确保fileName是字符串类型
  if (typeof fileName !== 'string') {
    console.log("⚠️ 文件名不是字符串类型，尝试转换:", typeof fileName);
    fileName = String(fileName);
  }
  
  try {
    return fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  } catch (error) {
    console.error("❌ 清理文件名时出错:", error, "原始文件名:", fileName);
    return "文件名处理失败";
  }
}

// 尝试创建UI的函数
async function attemptCreateUI() {
  console.log(`🔄 尝试创建UI (第${uiCreationAttempts + 1}次)`);
  
  if (!isXiaobotPage()) {
    console.log("❌ 不是小报童页面，跳过UI创建");
    return;
  }
  
  uiCreationAttempts++;
  
  // 等待DOM准备就绪
  await waitForDOM();
  
  // 等待一段时间确保页面完全加载
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const ui = createDownloadUI();
    if (ui) {
      console.log("🎉 UI创建成功！");
      return;
    }
  } catch (error) {
    console.error("❌ UI创建失败:", error);
  }
  
  // 如果失败且未达到最大尝试次数，则重试
  if (uiCreationAttempts < MAX_UI_ATTEMPTS) {
    console.log(`⏳ ${3000}ms后重试创建UI...`);
    setTimeout(attemptCreateUI, 3000);
  } else {
    console.error("❌ 达到最大尝试次数，UI创建失败");
    
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; 
      background: #dc3545; color: white; padding: 12px; 
      border-radius: 4px; z-index: 999999; max-width: 300px;
    `;
    errorDiv.innerHTML = `
      ❌ 下载器UI创建失败<br>
      请刷新页面重试<br>
      <small>尝试次数: ${uiCreationAttempts}</small>
    `;
    document.body.appendChild(errorDiv);
  }
}

// 初始化
async function initialize() {
  console.log("🚀 小报童下载器 v3.0 开始初始化...");
  
  // 注入API拦截脚本
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectScript);
  } else {
    injectScript();
  }
  
  // 尝试创建UI
  attemptCreateUI();
}

// 启动初始化
initialize();

console.log("✅ 小报童下载器内容脚本 v3.0 已加载 - 去中心化架构");

