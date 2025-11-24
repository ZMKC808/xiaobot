// 注入脚本 - 拦截XHR请求
(function() {
  'use strict';
  
  console.log('小报童API拦截脚本已注入');
  
  // 存储拦截到的数据
  window.xiaobotApiData = [];
  window.xiaobotAllArticles = [];
  
  // 保存原始的XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  
  // 重写XMLHttpRequest
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    // 重写open方法，记录请求URL
    xhr.open = function(method, url) {
      this._url = url;
      this._method = method;
      return originalOpen.apply(this, arguments);
    };
    
    // 重写send方法，拦截小报童API响应
    xhr.send = function(data) {
      if (this._url && this._url.includes('api.xiaobot.net')) {
        const originalOnReadyStateChange = this.onreadystatechange;
        
        this.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            try {
              const responseData = JSON.parse(this.responseText);
              
              // 检查是否是文章列表API
              if (this._url.includes('/post') && responseData.data && Array.isArray(responseData.data)) {
                console.log('拦截到文章API响应:', this._url, responseData.data.length, '篇文章');
                
                // 提取文章数据
                const articles = responseData.data.map(item => ({
                  id: item.uuid || item.id,
                  title: item.title,
                  content: item.content,
                  published_at: item.published_at,
                  tags: item.tags || [],
                  created_at: item.created_at,
                  updated_at: item.updated_at
                }));
                
                // 存储到全局变量
                window.xiaobotApiData.push(responseData);
                
                // 合并文章数据，避免重复
                articles.forEach(article => {
                  if (!window.xiaobotAllArticles.find(existing => existing.id === article.id)) {
                    window.xiaobotAllArticles.push(article);
                  }
                });
                
                // 发送消息给content script
                window.postMessage({
                  type: 'XIAOBOT_API_DATA',
                  data: articles,
                  url: this._url,
                  totalCount: window.xiaobotAllArticles.length
                }, '*');
              }
              
            } catch (e) {
              console.log('解析API响应失败:', e);
            }
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
      }
      
      return originalSend.apply(this, arguments);
    };
    
    return xhr;
  };
  
  // 保持原型链
  window.XMLHttpRequest.prototype = originalXHR.prototype;
  
  // 也拦截fetch请求（如果小报童使用fetch）
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const promise = originalFetch.apply(this, arguments);
    
    if (typeof url === 'string' && url.includes('api.xiaobot.net')) {
      promise.then(response => {
        if (response.ok && url.includes('/post')) {
          response.clone().json().then(data => {
            if (data.data && Array.isArray(data.data)) {
              console.log('Fetch拦截到文章API响应:', url, data.data.length, '篇文章');
              
              const articles = data.data.map(item => ({
                id: item.uuid || item.id,
                title: item.title,
                content: item.content,
                published_at: item.published_at,
                tags: item.tags || [],
                created_at: item.created_at,
                updated_at: item.updated_at
              }));
              
              window.xiaobotApiData.push(data);
              
              // 合并文章数据，避免重复
              articles.forEach(article => {
                if (!window.xiaobotAllArticles.find(existing => existing.id === article.id)) {
                  window.xiaobotAllArticles.push(article);
                }
              });
              
              window.postMessage({
                type: 'XIAOBOT_API_DATA',
                data: articles,
                url: url,
                totalCount: window.xiaobotAllArticles.length
              }, '*');
            }
          }).catch(e => {
            console.log('解析Fetch响应失败:', e);
          });
        }
      }).catch(e => {
        console.log('Fetch请求失败:', e);
      });
    }
    
    return promise;
  };
  
  // 添加获取所有文章的方法
  window.getAllXiaobotArticles = function() {
    return window.xiaobotAllArticles;
  };
  
  // 添加清除数据的方法
  window.clearXiaobotData = function() {
    window.xiaobotApiData = [];
    window.xiaobotAllArticles = [];
  };
  
  console.log('XHR和Fetch拦截器设置完成');
})();


