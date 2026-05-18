/**
 * 姐姐视频 - Legado Tauri 视频源
 * 源地址: https://wap.jiejiesp27.xyz/
 * 源分类: R-18 可用免翻
 */

const BASE_URL = "https://wap.jiejiesp27.xyz";
const API_PATH = "/jiejie/index.php/vod";

// 分类映射
const categories = {
    "最新": 1,
    "国产视频": 90,
    "国产精品": 91,
    "绿帽淫妻": 96,
    "精品推荐": 102,
    "国产色情": 116,
    "主播直播": 122,
    "剧情个绍": 120,
    "91探花": 157,
    "网红流": 156,
    "日本品": 158,
    "亚洲无码": 169,
    "SWAG": 169,
    "cosplay": 170,
    "中文字幕": 254,
    "AVM说": 269,
    "网红精选": 287,
    "SM调教": 290,
    "女网红": 298,
    "欧美精品": 303
};

/**
 * 获取分类列表
 */
function getCategories() {
    let result = [];
    for (let [name, id] of Object.entries(categories)) {
        result.push({
            name: name,
            url: `${API_PATH}/type/id/${id}.html`
        });
    }
    return result;
}

/**
 * 搜索视频
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 */
function search(keyword, page = 1) {
    if (!keyword) return [];
    
    let url = `${BASE_URL}${API_PATH}/search.html?wd=${encodeURIComponent(keyword)}&p=${page}`;
    
    try {
        let html = http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15"
            }
        });
        
        return parseVideoList(html);
    } catch (e) {
        console.error("搜索失败:", e.message);
        return [];
    }
}

/**
 * 获取分类视频列表
 * @param {string} url - 分类URL
 * @param {number} page - 页码
 */
function getCategory(url, page = 1) {
    try {
        let fullUrl = `${BASE_URL}${url}?p=${page}`;
        let html = http.get(fullUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15"
            }
        });
        
        return parseVideoList(html);
    } catch (e) {
        console.error("获取分类失败:", e.message);
        return [];
    }
}

/**
 * 解析视频列表
 */
function parseVideoList(html) {
    let videos = [];
    
    try {
        // 使用 XPath 或 CSS 选择器解析视频列表
        // 根据实际 HTML 结构调整选择器
        let items = html.select("div.vod-item, li.vod-list-item, a.vod-link");
        
        items.forEach(item => {
            try {
                let titleEl = item.select("span.vod-name, h2, a");
                let linkEl = item.select("a");
                let posterEl = item.select("img");
                
                if (titleEl.length > 0 && linkEl.length > 0) {
                    let title = titleEl.eq(0).text();
                    let link = linkEl.eq(0).attr("href");
                    let poster = posterEl.length > 0 ? posterEl.eq(0).attr("src") : "";
                    
                    // 补全相对 URL
                    if (link && !link.startsWith("http")) {
                        link = BASE_URL + (link.startsWith("/") ? link : "/" + link);
                    }
                    if (poster && !poster.startsWith("http")) {
                        poster = BASE_URL + (poster.startsWith("/") ? poster : "/" + poster);
                    }
                    
                    if (title && link) {
                        videos.push({
                            title: title.trim(),
                            url: link,
                            cover: poster,
                            description: ""
                        });
                    }
                }
            } catch (e) {
                console.error("解析单个视频失败:", e.message);
            }
        });
    } catch (e) {
        console.error("解析视频列表失败:", e.message);
    }
    
    return videos;
}

/**
 * 获取视频详情
 * @param {string} detailUrl - 详情页 URL
 */
function getBookInfo(detailUrl) {
    try {
        let html = http.get(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": BASE_URL
            }
        });
        
        let title = html.select("h1, span.vod-name").eq(0).text() || "未知";
        let poster = html.select("img.vod-poster, img.poster").eq(0).attr("src") || "";
        let description = html.select("div.vod-content, p.vod-desc, div.desc").eq(0).text() || "";
        
        // 补全相对 URL
        if (poster && !poster.startsWith("http")) {
            poster = BASE_URL + (poster.startsWith("/") ? poster : "/" + poster);
        }
        
        return {
            title: title.trim(),
            cover: poster,
            description: description.substring(0, 200),
            author: "",
            status: ""
        };
    } catch (e) {
        console.error("获取详情失败:", e.message);
        return {
            title: "获取失败",
            cover: "",
            description: "",
            author: "",
            status: ""
        };
    }
}

/**
 * 获取播放列表（剧集/集数）
 * @param {string} detailUrl - 详情页 URL
 */
function getTableOfContents(detailUrl) {
    try {
        let html = http.get(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": BASE_URL
            }
        });
        
        let episodes = [];
        
        // 查找播放列表
        let playLists = html.select("div.play-list, ul.play-list, div.vod-play");
        
        playLists.forEach(list => {
            let links = list.select("a, li");
            links.forEach(link => {
                try {
                    let episodeUrl = link.attr("href");
                    let episodeName = link.text();
                    
                    if (episodeUrl && episodeName) {
                        // 补全相对 URL
                        if (!episodeUrl.startsWith("http")) {
                            episodeUrl = BASE_URL + (episodeUrl.startsWith("/") ? episodeUrl : "/" + episodeUrl);
                        }
                        
                        episodes.push({
                            name: episodeName.trim(),
                            url: episodeUrl
                        });
                    }
                } catch (e) {
                    // 跳过错误的剧集
                }
            });
        });
        
        return episodes.length > 0 ? episodes : [];
    } catch (e) {
        console.error("获取播放列表失败:", e.message);
        return [];
    }
}

/**
 * 获取视频播放地址 - 最关键的函数
 * @param {string} playUrl - 播放页 URL
 */
function getVideoPlayUrl(playUrl) {
    try {
        let html = http.get(playUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": BASE_URL
            }
        });
        
        // 方案1: 查找直链 MP4 URL
        let mp4Match = html.match(/https?:\/\/[^\s"'<>]+\.mp4/i);
        if (mp4Match) {
            return {
                url: mp4Match[0],
                type: "mp4"
            };
        }
        
        // 方案2: 查找 m3u8 链接
        let m3u8Match = html.match(/https?:\/\/[^\s"'<>]+\.m3u8/i);
        if (m3u8Match) {
            return {
                url: m3u8Match[0],
                type: "m3u8"
            };
        }
        
        // 方案3: 查找 iframe 嵌入的播放器
        let iframeMatch = html.select("iframe");
        if (iframeMatch.length > 0) {
            let iframeSrc = iframeMatch.eq(0).attr("src");
            if (iframeSrc) {
                if (!iframeSrc.startsWith("http")) {
                    iframeSrc = BASE_URL + (iframeSrc.startsWith("/") ? iframeSrc : "/" + iframeSrc);
                }
                return {
                    url: iframeSrc,
                    type: "iframe"
                };
            }
        }
        
        // 方案4: 查找视频源在 script 标签中的数据
        let scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
        if (scriptMatches) {
            for (let script of scriptMatches) {
                // 查找 url、src、video 等字段
                let urlMatch = script.match(/"(?:url|src|video)":\s*"([^"]+)"/i);
                if (urlMatch && (urlMatch[1].includes("mp4") || urlMatch[1].includes("m3u8"))) {
                    return {
                        url: urlMatch[1],
                        type: urlMatch[1].includes("m3u8") ? "m3u8" : "mp4"
                    };
                }
            }
        }
        
        console.warn("未找到视频播放地址");
        return {
            url: "",
            type: "unknown"
        };
    } catch (e) {
        console.error("获取播放地址失败:", e.message);
        return {
            url: "",
            type: "error"
        };
    }
}

/**
 * 获取推荐视频（首页）
 */
function getRecommend() {
    try {
        let html = http.get(BASE_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15"
            }
        });
        
        return parseVideoList(html);
    } catch (e) {
        console.error("获取推荐失败:", e.message);
        return [];
    }
}

/**
 * 源配置导出
 */
const sourceConfig = {
    name: "姐姐视频",
    icon: "https://8wx27o6v.91gaoqing.rest/upload/vod/20250428-1/cfc014ec16937c7f415afd712b482842.gif",
    url: BASE_URL,
    group: "R-18 可用免翻",
    comment: "jiejiesp.xyz",
    functions: {
        getCategories,
        search,
        getCategory,
        getBookInfo,
        getTableOfContents,
        getVideoPlayUrl,
        getRecommend
    }
};

// 导出函数供 Legado Tauri 调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sourceConfig;
}
