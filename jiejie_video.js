// @name        姐姐视频
// @version     1.0.1
// @author      legado
// @url         https://wap.jiejiesp27.xyz/
// @type        video
// @enabled     true
// @tags        视频,VOD,日本
// @description 日本视频点播源

var BASE = 'https://wap.jiejiesp27.xyz';

async function explore(page, category) {
  legado.log('explore: page=' + page + ', category=' + category);
  
  var categories = ['最新', '国产精品', '日本品', '亚洲无码'];
  if (!category || category === 'GETALL') {
    return categories;
  }
  
  var categoryMap = {
    '最新': 1,
    '国产精品': 91,
    '日本品': 158,
    '亚洲无码': 169
  };
  
  var cid = categoryMap[category];
  if (!cid) {
    legado.log('Unknown category: ' + category);
    return [];
  }
  
  var url = BASE + '/jiejie/index.php/vod/type/id/' + cid + '.html?page=' + page;
  legado.log('Fetching: ' + url);
  
  var html = await legado.http.get(url);
  var doc = legado.dom.parse(html);
  var items = legado.dom.selectAll(doc, 'ul.stui-vodlist li');
  
  legado.log('Found ' + items.length + ' items');
  
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var allAs = legado.dom.selectAll(item, 'a');
    var titleEls = legado.dom.selectAll(item, 'h4.title a');
    
    if (allAs.length >= 1 && titleEls.length > 0) {
      var playA = allAs[0];
      var imgInA = legado.dom.selectAll(playA, 'img');
      
      var title = legado.dom.attr(playA, 'title');
      var coverUrl = '';
      if (imgInA.length > 0) {
        coverUrl = legado.dom.attr(imgInA[0], 'src');
      }
      
      var bookUrl = legado.dom.attr(titleEls[0], 'href');
      if (!bookUrl.startsWith('http')) {
        bookUrl = BASE + bookUrl;
      }
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = BASE + coverUrl;
      }
      
      result.push({
        name: title,
        author: '',
        bookUrl: bookUrl,
        coverUrl: coverUrl,
        kind: 'VOD',
        lastChapter: '',
        latestChapter: '',
        latestChapterUrl: '',
        wordCount: '',
        chapterCount: '',
        updateTime: '',
        status: ''
      });
    }
  }
  
  legado.log('Return ' + result.length + ' books');
  return result;
}

async function bookInfo(bookUrl) {
  legado.log('bookInfo: ' + bookUrl);
  
  var html = await legado.http.get(bookUrl);
  var doc = legado.dom.parse(html);
  
  var titleText = legado.dom.selectText(doc, 'title');
  var name = titleText.split('视频')[0].trim();
  
  var lazyImgs = legado.dom.selectAll(doc, 'img[data-original]');
  var coverUrl = '';
  if (lazyImgs.length > 0) {
    coverUrl = legado.dom.attr(lazyImgs[0], 'data-original');
  }
  
  var ps = legado.dom.selectAll(doc, 'p');
  var kind = '';
  var updateTime = '';
  var author = '';
  var intro = '';
  
  if (ps.length > 0) {
    var typeText = legado.dom.text(ps[0]);
    var typeMatch = typeText.match(/类型：([^/]+)/);
    if (typeMatch) {
      kind = typeMatch[1].trim();
    }
  }
  if (ps.length > 1) {
    var updateText = legado.dom.text(ps[1]);
    var updateMatch = updateText.match(/更新：(.+)/);
    if (updateMatch) {
      updateTime = updateMatch[1].trim();
    }
  }
  if (ps.length > 2) {
    var actorText = legado.dom.text(ps[2]);
    var actorMatch = actorText.match(/主演：(.+)/);
    if (actorMatch) {
      author = actorMatch[1].trim();
    }
  }
  if (ps.length > 4) {
    var introText = legado.dom.text(ps[4]);
    var introMatch = introText.match(/简介：([\s\S]+)/);
    if (introMatch) {
      intro = introMatch[1].trim().substring(0, 200);
    }
  }
  
  if (!coverUrl.startsWith('http')) {
    coverUrl = BASE + coverUrl;
  }
  
  var result = {
    name: name,
    author: author,
    coverUrl: coverUrl,
    intro: intro,
    kind: kind,
    lastChapter: '',
    latestChapter: '全1集',
    latestChapterUrl: bookUrl,
    wordCount: '',
    chapterCount: '1',
    updateTime: updateTime,
    status: '完结',
    tocUrl: bookUrl
  };
  
  legado.log('bookInfo result: name=' + result.name + ', kind=' + result.kind);
  return result;
}

async function chapterList(tocUrl) {
  legado.log('chapterList: ' + tocUrl);
  
  var match = tocUrl.match(/id\/(\d+)/);
  if (!match) {
    legado.log('Cannot extract ID from ' + tocUrl);
    return [];
  }
  
  var vodId = match[1];
  var playUrl = BASE + '/jiejie/index.php/vod/play/id/' + vodId + '/sid/1/nid/1.html';
  legado.log('Play URL: ' + playUrl);
  
  var result = [{ name: '正片', url: playUrl }];
  return result;
}

async function chapterContent(chapterUrl) {
  legado.log('chapterContent: ' + chapterUrl);
  
  var html = await legado.http.get(chapterUrl);
  
  // 核心修正：先锁定 player_aaaa 所在的脚本行，截断全局变量 maccms 的干扰
  var playerLineMatch = html.match(/player_aaaa\s*=\s*([^\n\r]+)/);
  if (!playerLineMatch) {
    legado.log('Error: 页面中未找到 player_aaaa 对象配置');
    return '';
  }
  
  var playerLine = playerLineMatch[1];
  // 从隔离后的 player_aaaa 字符串中精准匹配视频流 url
  var urlMatch = playerLine.match(/"url"\s*:\s*"([^"]+)"/);
  if (!urlMatch) {
    legado.log('Error: player_aaaa 中不包含 url 视频地址');
    return '';
  }
  
  // 移除反斜杠转义（将 \/ 恢复为 /）
  var videoUrl = urlMatch[1].replace(/\\/g, '');
  legado.log('【通关！】成功提取到真实视频流直链: ' + videoUrl);
  
  return videoUrl;
}

async function search(keyword, page) {
  legado.log('search: keyword=' + keyword + ', page=' + page);
  
  var url = BASE + '/jiejie/index.php/vod/search.html?wd=' + encodeURIComponent(keyword) + '&page=' + page;
  legado.log('Searching URL: ' + url);
  
  var html = await legado.http.get(url);
  var doc = legado.dom.parse(html);
  
  // 适配苹果 CMS 标准检索卡片样式
  var items = legado.dom.selectAll(doc, 'ul.stui-vodlist li, .stui-vodlist__media li');
  legado.log('Search found ' + items.length + ' items');
  
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var allAs = legado.dom.selectAll(item, 'a');
    var titleEls = legado.dom.selectAll(item, 'h4.title a, .title a');
    
    if (allAs.length >= 1 && titleEls.length > 0) {
      var playA = allAs[0];
      var imgInA = legado.dom.selectAll(playA, 'img');
      
      var title = legado.dom.attr(playA, 'title') || legado.dom.text(titleEls[0]);
      var coverUrl = '';
      if (imgInA.length > 0) {
        coverUrl = legado.dom.attr(imgInA[0], 'data-original') || legado.dom.attr(imgInA[0], 'src');
      }
      
      var bookUrl = legado.dom.attr(titleEls[0], 'href');
      if (!bookUrl.startsWith('http')) {
        bookUrl = BASE + bookUrl;
      }
      if (coverUrl && !coverUrl.startsWith('http')) {
        coverUrl = BASE + coverUrl;
      }
      
      result.push({
        name: title.trim(),
        author: '',
        bookUrl: bookUrl,
        coverUrl: coverUrl,
        kind: 'VOD',
        lastChapter: '',
        latestChapter: '',
        latestChapterUrl: '',
        wordCount: '',
        chapterCount: '',
        updateTime: '',
        status: ''
      });
    }
  }
  return result;
}

async function TEST(type) {
  if (type === '__list__') return ['search', 'explore'];
  if (type === 'search') {
    var r = await search('散步', 1);
    if (!r || r.length < 1) return { passed: false, message: '搜索无结果' };
    return { passed: true, message: '搜索返回 ' + r.length + ' 条' };
  }
  if (type === 'explore') {
    var b = await explore(1, '最新');
    if (!b || b.length < 1) return { passed: false, message: '发现页为空' };
    return { passed: true, message: '发现页 ' + b.length + ' 条' };
  }
  return { passed: false, message: '未知: ' + type };
}
