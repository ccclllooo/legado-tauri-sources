# Legado Tauri 视频源集合

这是为 Legado Tauri 应用编写的视频源集合。

## 📋 已包含的源

### 1. 姐姐视频 (`jiejie_video.js`)

- **源地址**: https://wap.jiejiesp27.xyz/
- **类型**: 视频源
- **分类**: R-18 可用免翻
- **源站**: jiejiesp.xyz

#### 功能特性

- ✅ **分类浏览**: 4个分类（最新、国产视频、日本等）
- ✅ **搜索功能**: 支持关键词搜索
- ✅ **视频详情**: 获取标题、封面、描述
- ✅ **播放列表**: 获取剧集/集数列表
- ✅ **播放地址**: 支持MP4、M3U8、iframe等多种格式
- ✅ **推荐视频**: 首页推荐内容

#### 使用方法

1. 在 Legado Tauri 中打开「源管理」
2. 选择「新增」并选择「JavaScript 源」
3. 复制 `jiejie_video.js` 的全部代码
4. 粘贴到源编辑器中
5. 保存并刷新

#### 支持的分类

| 分类 | URL ID |
|------|--------|
| 最新 | 1 |


## 🔧 技术细节

### 播放地址解析方案（4层递进）

源文件支持多种播放地址格式，按优先级：

1. **直链 MP4** - 直接可播放的MP4链接
2. **M3U8 流媒体** - HLS流媒体链接
3. **iframe 嵌入播放器** - 第三方播放器嵌入
4. **JavaScript 脚本数据** - 从HTML中提取的视频数据

### 配置参数

```javascript
const BASE_URL = "https://wap.jiejiesp27.xyz";  // 基础URL
const API_PATH = "/jiejie/index.php/vod";       // API路径
