// 弹出页面脚本
document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const clearBtn = document.getElementById('clearBtn');
  const columnUrlInput = document.getElementById('columnUrl');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  let currentStatus = null;
  
  // 初始化
  init();
  
  async function init() {
    // 获取当前状态
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      updateUI(response);
    } catch (error) {
      console.error('获取状态失败:', error);
    }
    
    // 尝试获取当前标签页URL
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && tab.url.includes('xiaobot.net/p/')) {
        columnUrlInput.value = tab.url;
      }
    } catch (error) {
      console.error('获取当前标签页失败:', error);
    }
  }
  
  // 开始下载
  startBtn.addEventListener('click', async function() {
    const url = columnUrlInput.value.trim();
    
    // 验证URL
    if (url && !isValidXiaobotUrl(url)) {
      showStatus('请输入有效的小报童专栏URL', 'error');
      return;
    }
    
    try {
      startBtn.disabled = true;
      showStatus('正在启动下载...', 'info');
      
      await chrome.runtime.sendMessage({
        type: 'START_DOWNLOAD',
        url: url
      });
      
    } catch (error) {
      console.error('启动下载失败:', error);
      showStatus('启动下载失败: ' + error.message, 'error');
      startBtn.disabled = false;
    }
  });
  
  // 清除数据
  clearBtn.addEventListener('click', async function() {
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
      showStatus('数据已清除', 'success');
      updateProgress(0, 0);
    } catch (error) {
      console.error('清除数据失败:', error);
      showStatus('清除数据失败: ' + error.message, 'error');
    }
  });
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'UPDATE_STATUS':
        showStatus(`已抓取 ${message.count} 篇文章`, 'info');
        break;
        
      case 'PROGRESS_UPDATE':
        showStatus(`正在滚动加载... 已获取 ${message.currentCount} 篇文章`, 'info');
        break;
        
      case 'DOWNLOAD_PROGRESS':
        updateProgress(message.current, message.total);
        showStatus(`正在下载第 ${message.current} / ${message.total} 篇文章`, 'info');
        break;
        
      case 'DOWNLOAD_COMPLETE':
        showStatus(`下载完成！共下载 ${message.count} 篇文章`, 'success');
        startBtn.disabled = false;
        progressDiv.style.display = 'none';
        break;
        
      case 'DOWNLOAD_ERROR':
        showStatus('下载失败: ' + message.error, 'error');
        startBtn.disabled = false;
        progressDiv.style.display = 'none';
        break;
        
      case 'SCRAPING_COMPLETE':
        showStatus('抓取完成，开始下载文件...', 'info');
        break;

      case 'SCRAPING_ERROR':
        showStatus('抓取失败: ' + message.error, 'error');
        startBtn.disabled = false;
        progressDiv.style.display = 'none';
        break;
    }
  });
  
  // 显示状态信息
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    currentStatus = { message, type };
  }
  
  // 更新进度
  function updateProgress(current, total) {
    if (total > 0) {
      const percentage = (current / total) * 100;
      progressFill.style.width = percentage + '%';
      progressText.textContent = `${current} / ${total}`;
      progressDiv.style.display = 'block';
    } else {
      progressDiv.style.display = 'none';
    }
  }
  
  // 更新UI状态
  function updateUI(status) {
    if (status.isDownloading) {
      startBtn.disabled = true;
      showStatus('正在下载中...', 'info');
    } else {
      startBtn.disabled = false;
    }
    
    if (status.articleCount > 0) {
      showStatus(`当前已抓取 ${status.articleCount} 篇文章`, 'info');
    }
  }
  
  // 验证小报童URL
  function isValidXiaobotUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'xiaobot.net' && urlObj.pathname.startsWith('/p/');
    } catch {
      return false;
    }
  }
});

