// 完全基于原HTML逻辑的Cloudflare Worker实现
// 配置信息
const APP_CONFIG = {
  title: '云音乐 - 在线音乐播放器',
  version: '2.0.0',
  apiBase: 'https://music-api.gdstudio.xyz/api.php'
};

// 基础HTML模板 - 完全复制原HTML结构
const BASE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_CONFIG.title}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="/styles.css" rel="stylesheet">
</head>
<body>
    <div class="bg-animation"></div>
    <div class="bg-overlay"></div>

    <!-- 顶部导航 -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="logo">
                <i class="fas fa-music"></i>
                <span>云音乐</span>
            </div>
            
            <div class="search-container">
                <div class="search-wrapper">
                    <input type="text" class="search-input" placeholder="搜索音乐、歌手、专辑..." id="searchInput">
                    <select class="source-select" id="sourceSelect">
                        <option value="netease">网易云音乐</option>
                        <option value="tencent">QQ音乐</option>
                        <option value="kuwo">酷我音乐</option>
                        <option value="joox">JOOX</option>
                        <option value="kugou">酷狗音乐</option>
                        <option value="migu">咪咕音乐</option>
                        <option value="deezer">Deezer</option>
                        <option value="spotify">Spotify</option>
                        <option value="apple">Apple Music</option>
                        <option value="ytmusic">YouTube Music</option>
                        <option value="tidal">TIDAL</option>
                        <option value="qobuz">Qobuz</option>
                        <option value="ximalaya">喜马拉雅</option>
                    </select>
                    <button class="search-btn" onclick="searchMusic()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主要内容 -->
    <div class="main-container">
        <!-- 搜索结果区域 -->
        <div class="content-section">
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('search')">
                    <i class="fas fa-search"></i> 搜索结果
                </button>
                <button class="tab-btn" onclick="switchTab('playlist')">
                    <i class="fas fa-list-music"></i> 网易云歌单
                </button>
            </div>

            <div id="searchTab" class="tab-content active">
                <div class="search-results" id="searchResults">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <div>在上方搜索框输入关键词开始搜索音乐</div>
                    </div>
                </div>
            </div>

            <div id="playlistTab" class="tab-content">
                <div class="playlist-input-container">
                    <input type="text" id="playlistIdInput" class="playlist-input" placeholder="输入网易云歌单ID...">
                    <button class="playlist-btn" onclick="parsePlaylist()">
                        <i class="fas fa-check"></i> 解析歌单
                    </button>
                </div>
                <div class="search-results" id="playlistResults">
                    <div class="empty-state">
                        <i class="fas fa-list-ol"></i>
                        <div>输入歌单ID后点击解析</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 播放器区域 -->
        <div class="player-section">
            <div class="current-song">
                <div class="current-cover-container">
                    <img class="current-cover" id="currentCover" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDIyMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMjAiIGhlaWdodD0iMjIwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHJ4PSIyMCIvPgo8cGF0aCBkPSJNMTEwIDcwTDE0MCAx MTBIMTIwVjE1MEg5MFYxMTBINzBMMTEwIDcwWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjwvc3ZnPgo=" alt="专辑封面">
                </div>
                <div class="current-info">
                    <h3 id="currentTitle">未选择歌曲</h3>
                    <p id="currentArtist">请搜索并选择要播放的歌曲</p>
                </div>
            </div>

            <div class="player-controls">
                <button class="control-btn small" onclick="previousSong()">
                    <i class="fas fa-step-backward"></i>
                </button>
                <button class="control-btn play-btn" id="playBtn" onclick="togglePlay()">
                    <i class="fas fa-play"></i>
                </button>
                <button class="control-btn small" onclick="nextSong()">
                    <i class="fas fa-step-forward"></i>
                </button>
            </div>

            <div class="progress-container">
                <div class="progress-bar" onclick="seekTo(event)">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="time-info">
                    <span id="currentTime">0:00</span>
                    <span id="totalTime">0:00</span>
                </div>
            </div>

            <!-- 音质选择 -->
            <div class="quality-container">
                <div class="quality-label">
                    <i class="fas fa-music"></i>
                    <span>音质</span>
                </div>
                <select class="quality-select" id="qualitySelect">
                    <option value="128">标准 128K</option>
                    <option value="192">较高 192K</option>
                    <option value="320" selected>高品质 320K</option>
                    <option value="740">无损 FLAC</option>
                    <option value="999">Hi-Res</option>
                </select>
            </div>

            <div class="volume-container">
                <i class="fas fa-volume-up volume-icon"></i>
                <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="80" onchange="setVolume(this.value)">
            </div>

            <!-- 下载区域 -->
            <div class="download-container">
                <button class="download-btn" onclick="downloadCurrentSong()" id="downloadSongBtn" disabled>
                    <i class="fas fa-download"></i>
                    <span>下载音乐</span>
                </button>
                <button class="download-btn" onclick="downloadCurrentLyric()" id="downloadLyricBtn" disabled>
                    <i class="fas fa-file-text"></i>
                    <span>下载歌词</span>
                </button>
            </div>

            <audio id="audioPlayer" preload="metadata"></audio>
        </div>

        <!-- 歌词区域 -->
        <div class="lyrics-section">
            <h2 class="section-title">
                <i class="fas fa-align-left"></i>
                歌词
            </h2>
            <div class="lyrics-container" id="lyricsContainer">
                <div class="lyric-line">暂无歌词</div>
            </div>
        </div>
    </div>

    <!-- 音频可视化波浪 -->
    <div class="audio-visualizer">
        <canvas id="waveCanvas"></canvas>
    </div>

    <script src="/app.js?v=${Date.now()}"></script>
</body>
</html>`;

// Worker主处理函数
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // API代理请求
  if (url.pathname.startsWith('/api')) {
    const apiUrl = new URL(APP_CONFIG.apiBase);
    // 复制查询参数
    url.searchParams.forEach((value, key) => {
      apiUrl.searchParams.set(key, value);
    });
    
    try {
      console.log('代理API请求:', apiUrl.toString());
      const response = await fetch(apiUrl.toString(), {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });
      
      const data = await response.text();
      
      return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      console.error('API代理失败:', error);
      return new Response(JSON.stringify({ error: 'API request failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
  
  // 音频代理请求
  if (url.pathname.startsWith('/audio-proxy')) {
    const audioUrl = url.searchParams.get('url');
    if (!audioUrl) {
      return new Response('Missing audio URL', { status: 400 });
    }
    
    try {
      console.log('代理音频请求:', audioUrl);
      const response = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Accept': 'audio/mpeg, audio/*, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
          'Content-Length': response.headers.get('Content-Length') || '',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('音频代理失败:', error);
      return new Response('Audio proxy failed', { 
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
  
  // 图片代理请求
  if (url.pathname.startsWith('/image-proxy')) {
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }
    
    try {
      console.log('代理图片请求:', imageUrl);
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.163.com/',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Content-Length': response.headers.get('Content-Length') || '',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      console.error('图片代理失败:', error);
      return new Response('Image proxy failed', { 
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
  
  // 静态资源请求 - CSS
  if (url.pathname === '/styles.css') {
    return new Response(getCSS(), {
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
  
  // 静态资源请求 - JavaScript
  if (url.pathname === '/app.js') {
    return new Response(getJS(), {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
  
  // OPTIONS 请求处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // 默认返回主页面
  return new Response(BASE_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// CSS样式函数
function getCSS() {
  return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: #0c0c0c;
            color: #fff;
            overflow-x: hidden;
        }

        /* 背景动画 */
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            z-index: -2;
        }

        .bg-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(20px);
            z-index: -1;
        }

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* 顶部导航 */
        .navbar {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: bold;
            color: #fff;
        }

        .logo i {
            color: #ff6b6b;
            font-size: 28px;
        }

        .search-container {
            flex: 1;
            max-width: 600px;
            margin: 0 40px;
            position: relative;
        }

        .search-wrapper {
            display: flex;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }

        .search-wrapper:focus-within {
            background: rgba(255, 255, 255, 0.2);
            border-color: #ff6b6b;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }

        .search-input {
            flex: 1;
            padding: 12px 20px;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 16px;
            outline: none;
        }

        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }

        .source-select {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            padding: 12px 15px;
            outline: none;
            cursor: pointer;
        }

        .source-select option {
            background: #2a2a2a;
            color: #fff;
            padding: 8px;
        }

        .search-btn {
            background: #ff6b6b;
            border: none;
            color: #fff;
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .search-btn:hover {
            background: #ff5252;
        }

        /* 主要内容区域 */
        .main-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 30px;
            display: grid;
            grid-template-columns: 600px 450px 350px;
            gap: 25px;
            min-height: calc(100vh - 200px);
            align-items: start;
        }

        /* 搜索结果区域 */
        .content-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 0;
            display: flex;
            flex-direction: column;
            height: calc(100vh - 240px);
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* 标签页样式 */
        .tabs {
            display: flex;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 20px;
        }

        .tab-btn {
            padding: 12px 20px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
            transition: all 0.3s ease;
            border-bottom: 2px solid transparent;
        }

        .tab-btn:hover {
            color: #fff;
        }

        .tab-btn.active {
            color: #ff6b6b;
            border-bottom-color: #ff6b6b;
        }

        .tab-content {
            display: none;
            flex: 1;
            overflow: auto;
            flex-direction: column;
        }

        .tab-content.active {
            display: flex;
        }

        .playlist-input-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .playlist-input {
            flex: 1;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            outline: none;
        }

        .playlist-btn {
            padding: 12px 20px;
            background: #ff6b6b;
            border: none;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .playlist-btn:hover {
            background: #ff5252;
        }

        .search-results {
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .search-results::-webkit-scrollbar {
            width: 6px;
        }

        .search-results::-webkit-scrollbar-track {
            background: transparent;
        }

        .search-results::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }

        .song-item {
            display: flex;
            align-items: center;
            padding: 15px 20px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 8px;
            position: relative;
            overflow: hidden;
        }

        .song-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s ease;
        }

        .song-item:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .song-item:hover::before {
            left: 100%;
        }

        .song-item.active {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 107, 107, 0.1));
            border: 1px solid rgba(255, 107, 107, 0.5);
        }

        .song-index {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
        }

        .song-item.active .song-index {
            background: linear-gradient(135deg, #ff6b6b, #ff5252);
            color: #fff;
        }

        .song-info {
            flex: 1;
            min-width: 0;
        }

        .song-name {
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .song-artist {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .song-duration {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            margin-left: 15px;
        }

        /* 播放器区域 */
        .player-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: calc(100vh - 240px);
        }

        .current-song {
            text-align: center;
            margin-bottom: 25px;
        }

        .current-cover-container {
            position: relative;
            display: inline-block;
            margin-bottom: 20px;
        }

        .current-cover {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            transition: all 0.3s ease;
            border: 6px solid rgba(255, 255, 255, 0.1);
            position: relative;
        }

        .current-cover::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            backdrop-filter: blur(10px);
        }

        .current-cover::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
        }

        .current-cover.playing {
            animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .current-info h3 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #fff;
        }

        .current-info p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
        }

        /* 播放控制 */
        .player-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-bottom: 25px;
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 50%;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        .control-btn.small {
            width: 45px;
            height: 45px;
            font-size: 18px;
        }

        .play-btn {
            width: 65px;
            height: 65px;
            font-size: 28px;
            background: linear-gradient(135deg, #ff6b6b, #ff5252);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .play-btn:hover {
            background: linear-gradient(135deg, #ff5252, #ff4444);
            box-shadow: 0 12px 35px rgba(255, 107, 107, 0.6);
        }

        /* 进度条 */
        .progress-container {
            margin-bottom: 20px;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            cursor: pointer;
            margin-bottom: 10px;
            position: relative;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #ff8a80);
            border-radius: 3px;
            width: 0%;
            transition: width 0.1s ease;
            position: relative;
        }

        .progress-fill::after {
            content: '';
            position: absolute;
            right: -2px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
        }

        /* 音量控制 */
        .volume-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 25px;
        }

        .volume-icon {
            color: rgba(255, 255, 255, 0.7);
            font-size: 18px;
        }

        .volume-slider {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
        }

        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            background: #ff6b6b;
            border-radius: 50%;
            cursor: pointer;
        }

        /* 音质选择 */
        .quality-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quality-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
        }

        .quality-select {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            padding: 8px 12px;
            outline: none;
            cursor: pointer;
            font-size: 14px;
        }

        .quality-select option {
            background: #2a2a2a;
            color: #fff;
            padding: 8px;
        }

        /* 下载区域 */
        .download-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
        }

        .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
        }

        .download-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
            border-color: #ff6b6b;
            color: #ff6b6b;
        }

        .download-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* 歌曲操作按钮 */
        .song-actions {
            display: flex;
            gap: 8px;
            margin-right: 15px;
        }

        .action-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .action-btn:hover {
            background: rgba(255, 107, 107, 0.3);
            color: #ff6b6b;
            transform: scale(1.1);
        }

        /* 歌词区域 */
        .lyrics-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            height: calc(100vh - 240px);
        }

        .lyrics-container {
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            padding-right: 10px;
        }

        .lyrics-container::-webkit-scrollbar {
            width: 6px;
        }

        .lyrics-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .lyrics-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }

        .lyric-line {
            padding: 8px 0;
            transition: all 0.3s ease;
            cursor: pointer;
            border-radius: 6px;
            padding-left: 10px;
            margin-bottom: 4px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.6;
        }

        .lyric-line:hover {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.8);
        }

        .lyric-line.active {
            color: #ff6b6b;
            font-weight: 600;
            background: rgba(255, 107, 107, 0.1);
            transform: scale(1.02);
            border-left: 3px solid #ff6b6b;
        }

        /* 加载和错误状态 */
        .loading, .error, .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.7);
        }

        .loading i, .error i, .empty-state i {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }

        .loading i {
            animation: spin 1s linear infinite;
            color: #ff6b6b;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .error i {
            color: #ff5252;
        }

        .empty-state i {
            color: rgba(255, 255, 255, 0.4);
        }

        /* 响应式设计 */
        @media (max-width: 1400px) {
            .main-container {
                grid-template-columns: 1fr 400px;
                gap: 20px;
                max-width: 1200px;
            }
            
            .lyrics-section {
                display: none;
            }
        }
        
        @media (max-width: 1024px) {
            .main-container {
                grid-template-columns: 1fr;
                gap: 20px;
                padding: 20px;
            }
            
            .nav-container {
                padding: 0 20px;
            }
            
            .search-container {
                margin: 0 20px;
            }
            
            .lyrics-section {
                display: block;
                position: static;
                max-height: 300px;
            }
            
            .player-section {
                position: static;
                min-height: auto;
                height: auto;
            }
        }

        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .search-container {
                margin: 0;
                max-width: none;
            }
            
            .current-cover {
                width: 180px;
                height: 180px;
            }
            
            .player-controls {
                gap: 15px;
            }
        }

        /* 自定义滚动条样式 */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        /* 音频可视化波浪样式 */
        .audio-visualizer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100px;
            z-index: 10;
            pointer-events: none;
        }

        #waveCanvas {
            width: 100%;
            height: 100%;
            opacity: 0.8;
        }
  `;
}

// JavaScript代码函数
function getJS() {
  return `
        // 完全复制原HTML的JavaScript逻辑
        const API_BASE = '/api';
        let currentPlaylist = [];
        let currentIndex = -1;
        let currentLyrics = [];
        let isPlaying = false;
        let isUserScrolling = false;
        let userScrollTimeout;
        let playlistData = [];

        const audioPlayer = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const progressFill = document.getElementById('progressFill');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalTimeSpan = document.getElementById('totalTime');
        const lyricsContainer = document.getElementById('lyricsContainer');
        const currentCover = document.getElementById('currentCover');
        
        const canvas = document.getElementById('waveCanvas');
        const canvasCtx = canvas.getContext('2d');
        let animationId;

        async function searchMusic() {
            const keyword = document.getElementById('searchInput').value.trim();
            const source = document.getElementById('sourceSelect').value;
            
            if (!keyword) {
                showNotification('请输入搜索关键词', 'warning');
                return;
            }

            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.innerHTML = \`
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    <div>正在搜索音乐...</div>
                </div>
            \`;

            try {
                const response = await fetch(\`\${API_BASE}?types=search&source=\${source}&name=\${encodeURIComponent(keyword)}&count=30\`);
                const data = await response.json();

                if (data && data.length > 0) {
                    currentPlaylist = data;
                    displaySearchResults(data, 'searchResults', currentPlaylist);
                } else {
                    resultsContainer.innerHTML = \`
                        <div class="error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>未找到相关歌曲，请尝试其他关键词</div>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('搜索失败:', error);
                resultsContainer.innerHTML = \`
                    <div class="error">
                        <i class="fas fa-wifi"></i>
                        <div>网络连接失败，请检查网络后重试</div>
                    </div>
                \`;
            }
        }

        async function getAlbumCoverUrl(song, size = 300) {
            if (!song.pic_id) {
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA1NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU1IiBoZWlnaHQ9IjU1IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHJ4PSI4Ii8+CjxwYXRoIGQ9Ik0yNy41IDE4TDM1IDI3LjVIMzBWMzdIMjVWMjcuNUgyMEwyNy41IDE4WiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjwvc3ZnPgo=';
            }

            try {
                const response = await fetch(\`\${API_BASE}?types=pic&source=\${song.source}&id=\${song.pic_id}&size=\${size}\`);
                const data = await response.json();
                
                if (data && data.url) {
                    // 使用图片代理
                    return \`/image-proxy?url=\${encodeURIComponent(data.url)}\`;
                }
            } catch (error) {
                console.error('获取专辑图失败:', error);
            }
            
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA1NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU1IiBoZWlnaHQ9IjU1IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHJ4PSI4Ii8+CjxwYXRoIGQ9Ik0yNy41IDE4TDM1IDI3LjVIMzBWMzdIMjVWMjcuNUgyMEwyNy41IDE4WiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+Cjwvc3ZnPgo=';
        }

        async function displaySearchResults(songs, containerId, playlistForPlayback) {
            const resultsContainer = document.getElementById(containerId);
            resultsContainer.innerHTML = '';

            for (let index = 0; index < songs.length; index++) {
                const song = songs[index];
                const songItem = document.createElement('div');
                songItem.className = 'song-item';
                songItem.onclick = () => playSong(index, playlistForPlayback);

                songItem.innerHTML = \`
                    <div class="song-index">\${(index + 1).toString().padStart(2, '0')}</div>
                    <div class="song-info">
                        <div class="song-name">\${song.name}</div>
                        <div class="song-artist">\${Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist} · \${song.album}</div>
                    </div>
                    <div class="song-actions">
                        <button class="action-btn" onclick="downloadSong(\${index})" title="下载音乐">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="downloadLyric(\${index})" title="下载歌词">
                            <i class="fas fa-file-text"></i>
                        </button>
                    </div>
                    <div class="song-duration">--:--</div>
                \`;

                resultsContainer.appendChild(songItem);
            }
        }

        async function playSong(index, playlist) {
            if (!playlist || index < 0 || index >= playlist.length) return;
            
            currentPlaylist = playlist;
            currentIndex = index;
            const song = currentPlaylist[index];

            await updateCurrentSongInfo(song);
            updateActiveItem();

            try {
                showNotification('正在加载音乐...', 'info');
                
                const quality = document.getElementById('qualitySelect').value;
                const urlResponse = await fetch(\`\${API_BASE}?types=url&source=\${song.source}&id=\${song.id}&br=\${quality}\`);
                const urlData = await urlResponse.json();

                if (urlData && urlData.url) {
                    // 使用音频代理
                    const proxyUrl = \`/audio-proxy?url=\${encodeURIComponent(urlData.url)}\`;
                    audioPlayer.src = proxyUrl;
                    audioPlayer.load();
                    
                    loadLyrics(song);
                    
                    document.getElementById('downloadSongBtn').disabled = false;
                    document.getElementById('downloadLyricBtn').disabled = false;
                    
                    const playPromise = audioPlayer.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            isPlaying = true;
                            updatePlayButton();
                            currentCover.classList.add('playing');
                            
                            try {
                                startVisualization();
                            } catch (e) {
                                console.error('启动音频可视化失败:', e);
                            }
                            
                            showNotification(\`开始播放 (\${getQualityText(urlData.br || quality)})\`, 'success');
                    }).catch(error => {
                        console.error('播放失败:', error);
                            // 如果代理失败，尝试直接访问
                            console.log('尝试直接访问音频URL...');
                            audioPlayer.src = urlData.url;
                            audioPlayer.load();
                            audioPlayer.play().catch(directError => {
                                console.error('直接访问也失败:', directError);
                        showNotification('播放失败，请尝试其他歌曲', 'error');
                            });
                    });
                    }
                } else {
                    showNotification('无法获取音乐链接，请尝试其他歌曲或更换音质', 'error');
                }
            } catch (error) {
                console.error('播放失败:', error);
                showNotification('播放失败，请检查网络连接', 'error');
            }
        }

        function getQualityText(br) {
            const qualityMap = {
                '128': '标准音质',
                '192': '较高音质', 
                '320': '高品质',
                '740': '无损音质',
                '999': 'Hi-Res音质'
            };
            return qualityMap[br] || \`\${br}K\`;
        }

        async function downloadCurrentSong() {
            if (currentIndex === -1) {
                showNotification('请先选择要下载的歌曲', 'warning');
                return;
            }
            
            const song = currentPlaylist[currentIndex];
            await downloadSong(currentIndex);
        }

        async function downloadCurrentLyric() {
            if (currentIndex === -1) {
                showNotification('请先选择要下载歌词的歌曲', 'warning');
                return;
            }
            
            await downloadLyric(currentIndex);
        }

        async function downloadSong(index) {
            const song = currentPlaylist[index];
            const quality = document.getElementById('qualitySelect').value;
            
            try {
                showNotification('正在获取下载链接...', 'info');
                
                const response = await fetch(\`\${API_BASE}?types=url&source=\${song.source}&id=\${song.id}&br=\${quality}\`);
                const data = await response.json();
                
                if (data && data.url) {
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.download = \`\${song.name} - \${Array.isArray(song.artist) ? song.artist.join(', ') : song.artist}.mp3\`;
                    link.target = '_blank';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showNotification('开始下载音乐文件', 'success');
                } else {
                    showNotification('无法获取下载链接', 'error');
                }
            } catch (error) {
                console.error('下载失败:', error);
                showNotification('下载失败，请稍后重试', 'error');
            }
        }

        async function downloadLyric(index) {
            const song = currentPlaylist[index];
            
            try {
                showNotification('正在获取歌词...', 'info');
                
                const response = await fetch(\`\${API_BASE}?types=lyric&source=\${song.source}&id=\${song.lyric_id || song.id}\`);
                const data = await response.json();
                
                if (data && data.lyric) {
                    let lyricContent = \`歌曲：\${song.name}\\n\`;
                    lyricContent += \`歌手：\${Array.isArray(song.artist) ? song.artist.join(', ') : song.artist}\\n\`;
                    lyricContent += \`专辑：\${song.album}\\n\`;
                    lyricContent += \`来源：\${song.source}\\n\\n\`;
                    lyricContent += data.lyric;
                    
                    if (data.tlyric) {
                        lyricContent += '=== 翻译歌词 ===';
                        lyricContent += data.tlyric;
                    }
                    
                    const blob = new Blob([lyricContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = \`\${song.name} - \${Array.isArray(song.artist) ? song.artist.join(', ') : song.artist}.lrc\`;
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    URL.revokeObjectURL(url);
                    showNotification('歌词下载完成', 'success');
                } else {
                    showNotification('该歌曲暂无歌词', 'warning');
                }
            } catch (error) {
                console.error('下载歌词失败:', error);
                showNotification('下载歌词失败，请稍后重试', 'error');
            }
        }

        document.getElementById('qualitySelect').addEventListener('change', () => {
            if (currentIndex !== -1 && audioPlayer.src) {
                const currentTime = audioPlayer.currentTime;
                const wasPlaying = isPlaying;
                
                playSong(currentIndex, currentPlaylist).then(() => {
                    audioPlayer.currentTime = currentTime;
                    if (!wasPlaying) {
                        audioPlayer.pause();
                    }
                });
            }
        });

        async function updateCurrentSongInfo(song) {
            document.getElementById('currentTitle').textContent = song.name;
            document.getElementById('currentArtist').textContent = 
                \`\${Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist} · \${song.album}\`;

            const coverUrl = await getAlbumCoverUrl(song, 500);
            currentCover.src = coverUrl;
        }

        function updateActiveItem() {
            document.querySelectorAll('.song-item').forEach(item => {
                item.classList.remove('active');
            });

            const activeListItems = document.querySelectorAll(
                (currentPlaylist === playlistData ? '#playlistResults' : '#searchResults') + ' .song-item'
            );
            if (activeListItems[currentIndex]) {
                activeListItems[currentIndex].classList.add('active');
            }
        }

        function updatePlayButton() {
            const icon = playBtn.querySelector('i');
            if (isPlaying) {
                icon.className = 'fas fa-pause';
            } else {
                icon.className = 'fas fa-play';
            }
        }

        async function loadLyrics(song) {
            try {
                const response = await fetch(\`\${API_BASE}?types=lyric&source=\${song.source}&id=\${song.lyric_id || song.id}\`);
                const data = await response.json();

                if (data && data.lyric) {
                    parseLyrics(data.lyric);
                } else {
                    lyricsContainer.innerHTML = '<div class="lyric-line">暂无歌词</div>';
                    currentLyrics = [];
                }
            } catch (error) {
                console.error('获取歌词失败:', error);
                lyricsContainer.innerHTML = '<div class="lyric-line">歌词加载失败</div>';
                currentLyrics = [];
            }
        }

        function parseLyrics(lrcText) {
            const lines = lrcText.split('\\n');
            currentLyrics = [];

            lines.forEach(line => {
                const match = line.match(/\\[(\\d{2}):(\\d{2})\\.(\\d{2,3})\\](.*)/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    const text = match[4].trim();

                    if (text) {
                        const time = minutes * 60 + seconds + milliseconds / 1000;
                        currentLyrics.push({ time, text });
                    }
                }
            });

            currentLyrics.sort((a, b) => a.time - b.time);
            displayLyrics();
        }

        function displayLyrics() {
            lyricsContainer.innerHTML = '';
            if (currentLyrics.length === 0) {
                lyricsContainer.innerHTML = '<div class="lyric-line">暂无歌词</div>';
                return;
            }

            currentLyrics.forEach((lyric, index) => {
                const lyricLine = document.createElement('div');
                lyricLine.className = 'lyric-line';
                lyricLine.textContent = lyric.text;
                lyricLine.onclick = () => {
                    audioPlayer.currentTime = lyric.time;
                };
                lyricsContainer.appendChild(lyricLine);
            });
        }

        function updateLyricHighlight() {
            const currentTime = audioPlayer.currentTime;
            let activeIndex = -1;

            for (let i = 0; i < currentLyrics.length; i++) {
                if (currentLyrics[i].time <= currentTime) {
                    activeIndex = i;
                } else {
                    break;
                }
            }

            const lyricLines = document.querySelectorAll('.lyric-line');
            lyricLines.forEach((line, index) => {
                line.classList.toggle('active', index === activeIndex);
            });

            if (activeIndex >= 0 && activeIndex < lyricLines.length && !isUserScrolling) {
                const activeLine = lyricLines[activeIndex];
                const container = document.getElementById('lyricsContainer');
                
                if (activeLine && container) {
                    const containerHeight = container.clientHeight;
                    const lineHeight = activeLine.offsetHeight;
                    const lineOffsetTop = activeLine.offsetTop;
                    
                    const idealScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
                    
                    container.scrollTo({
                        top: Math.max(0, idealScrollTop),
                        behavior: 'smooth'
                    });
                }
            }
        }

        function togglePlay() {
            if (audioPlayer.src) {
                if (isPlaying) {
                    audioPlayer.pause();
                } else {
                    audioPlayer.play();
                }
            } else {
                showNotification('请先选择要播放的歌曲', 'warning');
            }
        }

        function previousSong() {
            if (currentIndex > 0) {
                playSong(currentIndex - 1, currentPlaylist);
            } else {
                showNotification('已经是第一首歌曲', 'info');
            }
        }

        function nextSong() {
            if (currentIndex < currentPlaylist.length - 1) {
                playSong(currentIndex + 1, currentPlaylist);
            } else {
                showNotification('已经是最后一首歌曲', 'info');
            }
        }

        function seekTo(event) {
            if (audioPlayer.duration) {
                const rect = event.target.getBoundingClientRect();
                const percent = (event.clientX - rect.left) / rect.width;
                audioPlayer.currentTime = percent * audioPlayer.duration;
            }
        }

        function setVolume(value) {
            audioPlayer.volume = value / 100;
            
            const volumeIcon = document.querySelector('.volume-icon');
            if (value == 0) {
                volumeIcon.className = 'fas fa-volume-mute volume-icon';
            } else if (value < 50) {
                volumeIcon.className = 'fas fa-volume-down volume-icon';
            } else {
                volumeIcon.className = 'fas fa-volume-up volume-icon';
            }
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 100px;
                right: 30px;
                background: \${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                           type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 
                           type === 'warning' ? 'rgba(255, 152, 0, 0.9)' : 
                           'rgba(33, 150, 243, 0.9)'};
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                z-index: 1000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-size: 14px;
            \`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = percent + '%';
            currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
            updateLyricHighlight();
            }
        });

        audioPlayer.addEventListener('loadedmetadata', () => {
            totalTimeSpan.textContent = formatTime(audioPlayer.duration);
        });

        audioPlayer.addEventListener('ended', () => {
                nextSong();
        });

        audioPlayer.addEventListener('play', () => {
            isPlaying = true;
            updatePlayButton();
            currentCover.classList.add('playing');
            
            try {
            startVisualization();
            } catch (e) {
                console.error('启动音频可视化失败:', e);
            }
        });

        audioPlayer.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayButton();
            currentCover.classList.remove('playing');
            
            try {
            stopVisualization();
            } catch (e) {
                console.error('停止音频可视化失败:', e);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowLeft' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                previousSong();
            } else if (e.code === 'ArrowRight' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                nextSong();
            }
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchMusic();
            }
        });

        lyricsContainer.addEventListener('scroll', () => {
            isUserScrolling = true;
            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
            }, 2000);
        });

        function initAudioVisualizer() {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = 100;
        }

        function connectAudioSource() {
            return;
        }
        
        function drawWave() {
            try {
                animationId = requestAnimationFrame(drawWave);
                
                canvasCtx.fillStyle = 'rgba(12, 12, 12, 0.2)';
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.5, '#ff8a80');
                gradient.addColorStop(1, '#ff6b6b');
                
                canvasCtx.lineWidth = 3;
                canvasCtx.strokeStyle = gradient;
                canvasCtx.beginPath();
                
                const time = Date.now() * 0.002;
                const amplitude = isPlaying ? 30 + Math.random() * 20 : 5;
                const frequency = 0.02;
                const points = 100;
                
                for (let i = 0; i <= points; i++) {
                    const x = (i / points) * canvas.width;
                    const noise = isPlaying ? Math.random() * 10 : 0;
                    const y = canvas.height / 2 + Math.sin(i * frequency + time) * amplitude + noise;
                    
                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                }
                
                canvasCtx.stroke();
                
                canvasCtx.beginPath();
                canvasCtx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
                
                for (let i = 0; i <= points; i++) {
                    const x = (i / points) * canvas.width;
                    const noise = isPlaying ? Math.random() * 10 : 0;
                    const y = canvas.height / 2 - Math.sin(i * frequency + time) * amplitude - noise;
                    
                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                }
                
                canvasCtx.stroke();
            } catch (e) {
                console.error('绘制波浪失败:', e);
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        }

        function startVisualization() {
            try {
                if (!animationId) {
                    drawWave();
            }
            } catch (e) {
                console.error('启动可视化失败:', e);
            }
        }

        function stopVisualization() {
            try {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
                }
                
                if (canvasCtx) {
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                }
            } catch (e) {
                console.error('停止可视化失败:', e);
            }
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(tabName + 'Tab').classList.add('active');
            event.currentTarget.classList.add('active');
        }

        async function parsePlaylist() {
            const playlistId = document.getElementById('playlistIdInput').value.trim();
            if (!playlistId) {
                showNotification('请输入歌单ID', 'warning');
                return;
            }

            const resultsContainer = document.getElementById('playlistResults');
            resultsContainer.innerHTML = \`
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    <div>正在解析歌单...</div>
                </div>
            \`;

            try {
                const response = await fetch(\`\${API_BASE}?types=playlist&id=\${playlistId}&source=netease\`);
                const data = await response.json();

                let songs = [];
                if (data && data.playlist && data.playlist.tracks) {
                    songs = data.playlist.tracks.map(track => ({
                        name: track.name,
                        artist: track.ar.map(a => a.name).join(' / '),
                        album: track.al.name,
                        id: track.id,
                        pic_id: track.al.pic_id_str || track.al.pic_str || track.al.pic,
                        lyric_id: track.id,
                        source: 'netease'
                    }));
                } else if (data && data.tracks) {
                     songs = data.tracks.map(track => ({
                        name: track.name,
                        artist: track.ar.map(a => a.name).join(' / '),
                        album: track.al.name,
                        id: track.id,
                        pic_id: track.al.pic_id_str || track.al.pic_str || track.al.pic,
                        lyric_id: track.id,
                        source: 'netease'
                    }));
                }

                if (songs.length > 0) {
                    playlistData = songs;
                    displaySearchResults(songs, 'playlistResults', playlistData);
                    showNotification(\`成功加载 \${songs.length} 首歌曲\`, 'success');
                } else {
                    resultsContainer.innerHTML = \`
                        <div class="error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>解析歌单失败，请检查ID是否正确或API是否正常</div>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('解析歌单失败:', error);
                resultsContainer.innerHTML = \`
                    <div class="error">
                        <i class="fas fa-wifi"></i>
                        <div>网络连接失败，请检查网络后重试</div>
                    </div>
                \`;
            }
        }

        setVolume(80);
        initAudioVisualizer();
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                showNotification('欢迎使用云音乐播放器！', 'success');
            }, 1000);
        });
  `;
}

// 监听请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
