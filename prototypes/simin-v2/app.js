'use strict';
// This standalone prototype only persists demo data under its own browser key.
const KEY = 'simin.prototype.v2';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();
const paths = {
  star: '<path d="M12 1.5 14.3 9.7 22.5 12l-8.2 2.3L12 22.5l-2.3-8.2L1.5 12l8.2-2.3z" fill="currentColor" stroke="none"/>',
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  files: '<path d="M8 3h10a2 2 0 0 1 2 2v12M4 7h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><path d="M6 12h6M6 16h4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  template: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  circle: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5m0 3h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  settings: '<path d="M9 3h6l.7 3 2.6 1.5 3-.9 3 5.2-2.3 2.1v3l2.3 2.1-3 5.2-3-.9-2.6 1.5-.7 3H9l-.7-3-2.6-1.5-3 .9-3-5.2L2 17v-3l-2.3-2.1 3-5.2 3 .9L8.3 5z" transform="translate(3 0) scale(.75)"/><circle cx="12" cy="12" r="3"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 9-9h2a8 8 0 0 1 8 9Z"/><path d="M7 10h10M7 14h6"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  collapse: '<path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/>',
  send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  restore: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l3 2"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  quote: '<path d="M10 5H4v7h6V5zm10 0h-6v7h6V5zM10 12c0 4-2 6-6 7M20 12c0 4-2 6-6 7"/>',
  light: '<path d="M8 15c-6-6 2-14 7-9 3 3 1 6-2 9v3H8zM9 21h3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 13h.1M10 13h.1M14 13h.1M18 13h.1M7 16h10"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const button = (label, action, type = '', attrs = '') => `<button type="button" class="btn ${type}" data-action="${action}" ${attrs}>${label}</button>`;
const iconButton = (name, label, action, attrs = '') => `<button type="button" class="icon-btn" aria-label="${esc(label)}" title="${esc(label)}" data-action="${action}" ${attrs}>${icon(name)}</button>`;
const folder = color => `<div class="folder-drawing ${color || ''}"><svg viewBox="0 0 60 46" fill="none" aria-hidden="true"><path d="M5 9a4 4 0 0 1 4-4h15l5 6h22a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="currentColor" opacity=".12"/><path d="M5 15h50v23a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="currentColor" opacity=".08"/><path d="M5 15h50M5 9a4 4 0 0 1 4-4h15l5 6h22a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" stroke="currentColor" opacity=".55"/></svg></div>`;
const seedBody = `# 产品想法与已知信息\n\n> 这份文档记录已经聊清楚的内容。没有证据的部分继续保留为问题。\n\n## 我们想解决什么\n\n让正在学习 AI 产品的人，把零散的知识用到一个具体任务里。每次学习围绕一个真实问题展开，完成后能解释自己的判断，也能在新场景里再做一次。\n\n## 目前已知\n\n- 使用者：已经接触过 AI 工具，但知识比较零散的学习者。\n- 使用场景：在课程或自学后，尝试完成一个具体产品任务。\n- 当前问题：知道一些术语，却不确定从哪里开始，以及怎样判断结果。\n\n## 第一次体验\n\n| 环节 | 使用者做什么 | 留下什么 |\n| --- | --- | --- |\n| 选一个任务 | 说明想完成什么 | 一个明确的任务 |\n| 一起拆解 | 补充输入与限制 | 已知信息和待确认问题 |\n| 动手尝试 | 做一次并观察结果 | 实际输出和判断 |\n\n## 还需要补的信息\n\n- 学习者最近一次遇到这类问题的真实经历。\n- 他们现在用什么方式解决，具体卡在哪一步。\n- 是否愿意反复使用，以及使用频率。\n\n## 下一步\n\n先找一个真实任务跑通一次，再决定需要哪些功能。`;
const questionsBody = `# 待补信息\n\n## 先问清楚的三个问题\n\n- 最近一次学完工具却用不起来，具体发生了什么？\n- 当时想交付什么，已有的输入是什么？\n- 你怎样判断一个结果已经够用了？\n\n## 信息状态\n\n> 目前还没有访谈记录，不能据此下需求强度的结论。\n\n已有描述用于提出问题，后续用实际任务和使用者原话补充。`;
const voiceBody = `# 选题助手的使用场景\n\n## 目标\n\n把日常积累的素材，变成自己愿意讲、观众也能听懂的口播选题。\n\n## 已经确认\n\n- 由我自己决定最后讲哪个选题。\n- 助手先帮我对齐受众、具体问题和可用证据。\n- 确认观点后再写初稿，不直接套固定结构。\n\n## 还没确认\n\n选题从哪里进入、怎样回看旧素材，需要用真实内容试一次。`;
function seed() {
  const time = '2026-10-08T02:00:00.000Z';
  return {
    version: 2,
    projects: [
      { id: 'p1', name: 'AI 学习搭子', description: '让学到的知识，在一个真实任务里用起来', color: '', updated: time, docs: [
        { id: 'd1', name: '产品想法与已知信息.md', body: seedBody, updated: time },
        { id: 'd2', name: '待补信息.md', body: questionsBody, updated: time },
      ], facts: ['先围绕一个真实任务展开', '完成后能够解释自己的判断', '有证据再确定功能优先级'], unknowns: ['需要补充学习者的真实经历', '还没有使用频率和需求强度证据'], messages: [
        { role: 'user', text: '我想做一个 AI 学习搭子，让学完 AI 工具的人能真正用起来。先帮我梳理，不要急着写方案。' },
        { role: 'assistant', text: '我们先从一个真实场景开始。你描述的核心问题是：知道一些术语，但不确定怎么完成具体任务。\n\n目前可以确认的是“围绕真实任务学习”；使用频率和需求强度还没有证据。你希望第一次体验结束后，使用者能独立完成什么？' },
        { role: 'user', text: '至少能自己说明判断，然后拿一个新案例再做一次。把这些确认的信息整理成一篇文档。' },
        { role: 'assistant', text: '已经整理到「产品想法与已知信息」。还缺的内容单独放在「待补信息」里，方便下次继续。', savedDoc: 'd1' },
      ], lastDoc: 'd1', lastTab: 'document', draft: '' },
      { id: 'p2', name: '口播选题助手', description: '从日常素材里，找到值得讲的具体问题', color: 'sage', updated: time, docs: [{ id: 'd3', name: '选题助手的使用场景.md', body: voiceBody, updated: time }], facts: ['选题由我自己决定', '确认观点后再写初稿'], unknowns: ['需要拿真实素材试一次'], messages: [{ role: 'user', text: '我想做个口播选题助手，但希望最后还是由我来决定讲什么。' }, { role: 'assistant', text: '可以。我们先把“助手帮你做什么”和“由你决定什么”分开。已确认的使用场景已经留下，下一步可以拿一条真实素材试试。', savedDoc: 'd3' }], lastDoc: 'd3', lastTab: 'overview', draft: '' },
      { id: 'p3', name: '需求梳理', description: '一个还没成形的想法，从这里开始', color: 'sand', updated: time, docs: [], facts: [], unknowns: [], messages: [], lastDoc: null, lastTab: 'chat', draft: '' },
    ],
    trash: [{ id: 'deleted-example', projectId: 'p1', projectName: 'AI 学习搭子', doc: { id: 'd-old', name: '最初的想法.md', body: '# 最初的想法\n\n想让学习者从真实任务开始学习。具体流程还需要继续讨论。', updated: time }, deleted: time }],
    prefs: { density: 'comfortable', sendMode: 'enter', remember: true, autoOpen: true, confirm: true, reduceMotion: false },
    lastProject: 'p1', lastRoute: '#home',
  };
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 2 && Array.isArray(saved.projects) && Array.isArray(saved.trash) && saved.prefs) return saved;
  } catch (error) { /* A malformed demo store restarts with sample content. */ }
  return seed();
}
let data = load();
let route = { page: 'home', projectId: null, tab: null, docId: null };
let modalKind = null, modalTarget = null, lastFocus = null, toastTimer = null;
let homeView = 'grid', docsFilter = 'all', templateFilter = 'all', settingTab = 'preferences';
let focusMode = false, sourceMode = false, mobileDoc = false, quoteText = '', busyProject = null, busyTimer = null;
let newProjectError = '', failedMessage = null, queryDocs = '', mobileSide = false, lastOperation = null;
const templates = [
  { id: 'idea', name: '把想法聊清楚', desc: '从一个还没成形的想法开始，先对齐要解决的问题和手头的证据。', color: '', category: '开始讨论', icon: 'light', prompt: '我有一个新的产品想法。请先问我想解决谁的什么问题、我已有的证据和限制，帮我把已知信息与待补问题分开。确认后再写文档。' },
  { id: 'evidence', name: '整理已有信息', desc: '把零散输入分成已经知道、仍需核实和下一步要补的内容。', color: 'sage', category: '整理信息', icon: 'files', prompt: '请帮我整理已有的信息。先区分我提供的事实、暂时的判断和缺少的证据，不要替我填补空结论。我们确认后再留下独立文档。' },
  { id: 'review', name: '一起审阅文档', desc: '围绕现有文档找出不清楚的地方，先讨论修改，再确认写入。', color: 'sand', category: '继续推进', icon: 'edit', prompt: '请帮我审阅当前项目的文档，找出需要补证据或表达不清楚的地方。先给修改建议和理由，等我确认后再改。' },
];
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (error) { toast('浏览器暂时无法保存演示数据，本次内容仍可继续查看'); }
}
function greeting() { return new Date().getHours() < 12 ? '上午好，思敏' : '下午好，思敏'; }
function projectById(id) { return data.projects.find(p => p.id === id); }
function currentProject() { return projectById(route.projectId); }
function docById(p, id) { return p?.docs.find(d => d.id === id); }
function plainName(name) { return name.replace(/\.(md|txt)$/i, ''); }
function allDocs() { return data.projects.flatMap(p => p.docs.map(d => ({ p, d }))); }
function shortDate(value) { return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '.'); }
function inline(text) { return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>'); }
function markdown(text) {
  const lines = String(text).split('\n'); let result = '', list = false, table = false;
  const closeList = () => { if (list) { result += '</ul>'; list = false; } };
  const closeTable = () => { if (table) { result += '</tbody></table>'; table = false; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|')) {
      closeList();
      const cells = line.split('|').slice(1, -1).map(x => x.trim());
      if (cells.every(x => /^:?-+:?$/.test(x))) continue;
      if (!table) { result += '<table><thead><tr>' + cells.map(x => `<th>${inline(x)}</th>`).join('') + '</tr></thead><tbody>'; table = true; }
      else result += '<tr>' + cells.map(x => `<td>${inline(x)}</td>`).join('') + '</tr>';
      continue;
    }
    closeTable();
    if (/^- /.test(line)) { if (!list) { result += '<ul>'; list = true; } result += `<li>${inline(line.slice(2))}</li>`; continue; }
    closeList();
    if (line === '') continue;
    if (/^#{1,3} /.test(line)) { const level = line.match(/^#+/)[0].length; result += `<h${level}>${inline(line.slice(level + 1))}</h${level}>`; }
    else if (line.startsWith('> ')) result += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    else result += `<p>${inline(line)}</p>`;
  }
  closeList(); closeTable(); return result;
}
function parseRoute() {
  const parts = (location.hash || '#home').slice(1).split('/').map(decodeURIComponent);
  if (parts[0] === 'project') {
    const p = projectById(parts[1]);
    if (!p) { route = { page: 'home' }; return; }
    route = { page: 'project', projectId: p.id, tab: parts[2] || p.lastTab || (p.docs.length ? 'overview' : 'chat'), docId: parts[3] || p.lastDoc || p.docs[0]?.id || null };
    if (!['overview', 'chat', 'document'].includes(route.tab)) route.tab = 'overview';
    if (route.tab === 'document' && !docById(p, route.docId)) route.docId = p.docs[0]?.id || null;
    p.lastTab = route.tab; if (route.docId) p.lastDoc = route.docId;
    data.lastProject = p.id;
  } else route = { page: ['home','documents','templates','trash','settings','first-use'].includes(parts[0]) ? parts[0] : 'home' };
  data.lastRoute = location.hash || '#home'; persist();
}
function go(hash) {
  closeModal(); focusMode = false; sourceMode = false; quoteText = ''; mobileSide = false;
  if (location.hash === hash) { parseRoute(); render(); } else location.hash = hash;
}
function openProject(id, tab, doc) {
  const p = projectById(id); if (!p) return;
  const targetTab = tab || (data.prefs.remember ? p.lastTab : null) || (p.docs.length ? 'overview' : 'chat');
  go(`#project/${id}/${targetTab}${targetTab === 'document' ? '/' + (doc || p.lastDoc || p.docs[0]?.id || '') : ''}`);
}
const globalNavs = [['home','home','工作台'],['documents','files','全部文档'],['templates','template','模板'],['trash','trash','回收站']];
function mobileNavigation() {
  return `<nav class="nav mobile-global-nav" aria-label="主导航">${globalNavs.map(([page,ico,label]) => `<button class="nav-item ${route.page === page ? 'active' : ''}" data-action="nav" data-route="#${page}">${icon(ico)}<span>${label}</span></button>`).join('')}<button class="nav-item" data-action="nav" data-route="#settings">${icon('settings')}设置</button></nav>`;
}
function appRail() {
  const active = route.page === 'project' || route.page === 'first-use' ? 'home' : route.page;
  return `<nav class="app-rail" aria-label="应用导航"><a class="rail-brand orb" href="#home" aria-label="Simin 工作台">${icon('star')}</a><div class="rail-links">${globalNavs.map(([page,ico,label]) => `<button class="rail-button ${active===page?'active':''}" aria-label="${label}" title="${label}" ${active===page?'aria-current="page"':''} data-action="nav" data-route="#${page}">${icon(ico)}</button>`).join('')}</div><div class="rail-bottom"><button class="rail-button ${active==='settings'?'active':''}" aria-label="打开设置" title="设置" data-action="nav" data-route="#settings">${icon('settings')}</button><div class="rail-avatar" title="思敏的个人工作空间">S</div></div></nav>`;
}
function sidebarBrand() {
  return `<div class="sidebar-heading"><a class="brand" href="#home">Simin<span>个人工作台</span></a><button class="icon-btn mobile-close" aria-label="收起导航" data-action="mobile-menu">${icon('close')}</button></div>`;
}
function profile() { return `<div class="side-foot"><div class="workspace-note">${icon('folder')}<div><span>思敏的工作空间</span><small>一个项目，一条主线</small></div></div></div>`; }
function globalSidebar() {
  const recent = allDocs().slice().sort((a,b)=>b.d.updated.localeCompare(a.d.updated)).slice(0,4);
  return `<aside class="sidebar ${mobileSide ? 'mobile-open' : ''}">${sidebarBrand()}${mobileNavigation()}${button(icon('plus')+'新建项目','new-project','primary sidebar-create','aria-label="创建新项目"')}<div class="nav-label"><span>我的项目</span><span>${data.projects.length}</span></div><nav class="nav" aria-label="项目">${data.projects.map(p => `<button class="nav-item project-nav" title="${esc(p.name)}" data-action="open-project" data-project="${p.id}"><span class="project-marker ${p.color}">${icon('folder')}</span><span>${esc(p.name)}</span></button>`).join('')}</nav><div class="side-divider"></div><div class="nav-label"><span>最近文档</span>${icon('clock')}</div><nav class="nav" aria-label="最近文档">${recent.map(({p,d})=>`<button class="nav-item recent-doc" title="${esc(d.name)}" data-action="open-doc" data-project="${p.id}" data-doc="${d.id}">${icon('file')}<span>${esc(plainName(d.name))}</span></button>`).join('')}</nav>${!recent.length ? '<p class="side-empty">聊清楚之后，把结论留下来</p>' : ''}${profile()}</aside>`;
}
function projectSidebar(p) {
  return `<aside class="sidebar project-side ${mobileSide ? 'mobile-open' : ''}">${sidebarBrand()}${mobileNavigation()}<button class="nav-item back-home" data-action="nav" data-route="#home">${icon('back')}返回工作台</button><div class="project-side-title"><span class="project-marker ${p.color}">${icon('folder')}</span><span>${esc(p.name)}</span></div><nav class="nav" aria-label="项目导航"><button class="nav-item ${route.tab==='overview' ? 'active' : ''}" data-action="project-tab" data-tab="overview">${icon('home')}项目概览</button><button class="nav-item ${route.tab==='chat' ? 'active' : ''}" data-action="project-tab" data-tab="chat">${icon('chat')}继续对话<span class="count">${p.messages.filter(m=>m.role==='user').length || ''}</span></button></nav><div class="side-divider"></div><div class="nav-label">项目文档 <span>${p.docs.length}</span></div><nav class="nav" aria-label="项目文档">${p.docs.map(d => `<button class="nav-item doc-nav ${route.tab==='document' && route.docId===d.id ? 'active' : ''}" title="${esc(d.name)}" data-action="open-doc" data-project="${p.id}" data-doc="${d.id}">${icon('file')}<span>${esc(plainName(d.name))}</span></button>`).join('')}</nav>${!p.docs.length ? '<p class="side-empty">还没有文档<br>先把想法聊清楚，再留下结论</p>' : ''}<div class="side-foot"><div class="side-path">项目文件夹<br>projects/${esc(p.name)}/</div>${button(icon('template')+'从模板开始','templates-here','sidebar-template')}</div></aside>`;
}
function topbar(title, extra = '') {
  return `<header class="topbar"><div class="breadcrumb"><button class="icon-btn mobile-menu" aria-label="打开导航" data-action="mobile-menu">${icon('menu')}</button><button data-action="nav" data-route="#home">工作台</button>${icon('chevron')}<span>${esc(title)}</span></div><div class="toolbar">${extra}${button(icon('search')+'<span class="wide-label">搜索</span><span class="kbd">⌘ K</span>','search','ghost','aria-label="搜索"')}</div></header>`;
}
function projectFolder(p, last) {
  // Each paper represents one existing document; the front paper also carries the project title.
  const papers = p.docs.slice(0, 3).map((d, index) => {
    const snippet = d.body.replace(/^#+\s+.*$/gm, '').replace(/[>#*`|\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 95);
    return `<span class="folder-paper paper-${index}" data-doc="${esc(d.id)}"><span class="paper-eyebrow">${index === 0 ? '项目' : 'Markdown'}</span><span class="paper-title">${esc(index === 0 ? p.name : plainName(d.name))}</span>${index === 0 ? `<span class="paper-doc-name">${icon('file')}${esc(plainName(d.name))}</span>` : ''}<span class="paper-preview">${esc(snippet)}</span></span>`;
  }).join('');
  const recent = p.id === last.id;
  return `<button class="project-card folder-card ${recent ? 'featured' : ''}" data-action="open-project" data-project="${p.id}" title="${esc(p.name)} · ${p.docs.length} 篇文档${recent ? ' · 继续上次工作' : ''}" aria-label="打开项目：${esc(p.name)}，${p.docs.length} 篇文档">
    <span class="folder-art ${p.docs.length ? '' : 'empty-folder'}" data-doc-count="${p.docs.length}" aria-hidden="true">
      <span class="folder-backing"></span>${papers}<span class="folder-glass"></span>
      <svg class="folder-pocket" viewBox="0 0 240 160" preserveAspectRatio="none" fill="none">
        <path class="pocket-surface" d="M0 27Q0 14 12 14Q18 14 24 18L120 76L216 18Q222 14 228 14Q240 14 240 27V132Q240 158 213 158H27Q0 158 0 132Z"/>
        <path class="pocket-left" d="M12 14Q18 14 24 18L120 76L188 117L24 155Q0 151 0 132V27Q0 14 12 14Z"/>
        <path class="pocket-edge" d="M12 14Q18 14 24 18L188 117M120 76L216 18Q222 14 228 14"/>
      </svg>
      ${!p.docs.length ? `<span class="folder-empty-title">${esc(p.name)}</span>` : ''}
      <span class="folder-count">${icon('files')}<span>${p.docs.length} 篇文档</span></span>
    </span>
  </button>`;
}
function home(first = false) {
  const welcome = `<div class="home-welcome"><div class="orb welcome-orb">${icon('star')}</div><h1 class="home-title">${greeting()}</h1><p class="subtitle">${first || !data.projects.length ? '给想法一个地方，慢慢把它聊清楚' : '每一个好想法，都从一个具体问题开始'}</p></div>`;
  if (first || data.projects.length === 0) return `${topbar('工作空间')}<div class="scroll home-scroll"><div class="page home-page first-home">${welcome}<div class="empty-page"><h2>从一个想法开始</h2><p>建一个项目，把想法放进来。<br>一起聊清楚，再把确定的结论留下来。</p>${button(icon('plus')+'新建第一个项目','new-project','primary')}<span class="welcome-foot">可以只有一句话，也可以暂时是空的</span></div></div></div>`;
  const last = projectById(data.lastProject) || data.projects[0];
  return `${topbar('工作空间',button(icon('plus')+'新建项目','new-project','primary','aria-label="新建项目"'))}<div class="scroll home-scroll"><div class="page home-page">${welcome}<div class="home-projects"><div class="section-head"><h2>我的项目 <small>${data.projects.length}</small></h2><div class="segmented" aria-label="项目展示方式"><button class="seg ${homeView==='grid'?'active':''}" aria-label="网格视图" data-action="home-view" data-view="grid">${icon('home')}</button><button class="seg ${homeView==='list'?'active':''}" aria-label="列表视图" data-action="home-view" data-view="list">${icon('menu')}</button></div></div><div class="${homeView==='grid'?'project-grid':'project-list'}">${data.projects.map(p=>projectFolder(p,last)).join('')}</div><div class="quick-actions">${button('<span class="quick-icon">'+icon('plus')+'</span>新建项目','new-project','','aria-label="新建一个项目"')}${button('<span class="quick-icon sage">'+icon('files')+'</span>全部文档','nav','','data-route="#documents"')}${button('<span class="quick-icon sand">'+icon('template')+'</span>从模板开始','nav','','data-route="#templates"')}${button('<span class="quick-icon">'+icon('search')+'</span>搜索内容','search','','aria-label="搜索内容"')}</div></div><p class="home-note">先一起聊清楚，再把确定的结论留下来。</p></div></div>`;
}
function overview(p) {
  const facts = p.facts.length ? p.facts : ['项目可以从一句想法开始', '聊清楚之后再留下独立文档'];
  return `${projectTopbar(p)}<div class="scroll"><div class="page"><div class="page-head"><div><div class="eyebrow">项目概览</div><h1>${esc(p.name)}</h1><p class="subtitle">${esc(p.description)}</p></div>${button('继续对话 '+icon('arrow'),'project-tab','primary','data-tab="chat"')}</div><div class="overview-grid"><div><section class="panel"><h2>我们现在聊到哪了</h2><p>${p.docs.length ? '先把要解决的问题和已有的信息留下来。还没确认的内容继续讨论，不急着变成一套完整方案。' : '这里还没有留下结论。先在对话里说出你的想法，助手会和你一起补齐信息。'}</p><div class="panel-note"><div class="eyebrow">已经清楚的部分</div><ul class="fact-list">${facts.map(f=>`<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul></div><div class="panel-note"><div class="eyebrow">接下来一起补</div><ul class="fact-list">${(p.unknowns.length?p.unknowns:['你想解决谁的什么问题？','手头有什么信息或真实经历？']).map(f=>`<li class="unknown">${icon('circle')}<span>${esc(f)}</span></li>`).join('')}</ul></div></section><section class="panel" style="margin-top:22px"><div class="section-head"><h2 style="margin:0">已经留下的文档</h2><span class="badge">${p.docs.length} 篇</span></div>${p.docs.length ? p.docs.map(d=>`<div class="doc-row">${icon('file')}<div><div class="doc-row-title">${esc(plainName(d.name))}</div><div class="doc-row-sub">${esc(d.name)} · ${shortDate(d.updated)} 更新</div></div>${button('打开','open-doc','small ghost',`data-project="${p.id}" data-doc="${d.id}"`)}</div>`).join('') : '<p>还没有文档，先聊清楚再写</p>'}</section></div><section class="panel"><h2>最近的推进</h2>${p.docs.length ? p.docs.slice().reverse().map(d=>`<div class="activity"><i class="activity-line"></i><div><p>留下「${esc(plainName(d.name))}」</p><small>${shortDate(d.updated)} · 已保存</small></div></div>`).join('') : '<div class="activity"><i class="activity-line"></i><div><p>创建了一个空项目</p><small>还没有开始对话</small></div></div>'}<div class="activity"><i class="activity-line"></i><div><p>开始梳理这个想法</p><small>${p.messages.length ? '对话保留在项目里' : '从右侧对话开始'}</small></div></div><div class="panel-note"><div class="eyebrow">下一步</div><p>${p.unknowns[0] ? esc(p.unknowns[0]) : '先说一个你最近遇到的具体问题'}</p>${button('一起补充 '+icon('arrow'),'project-tab','small ghost','data-tab="chat" style="margin-top:9px;padding-left:0"')}</div></section></div></div></div>`;
}
function projectTopbar(p) { return topbar(p.name, `<span class="badge green">${icon('check')} 已保留进度</span>${iconButton('more','项目操作','project-menu',`data-project="${p.id}"`)}`); }
function proposalCard(p, m, index) {
  const prop = m.proposal;
  if (!prop) return '';
  const exists = prop.status === 'saved';
  return `<div class="proposal"><div class="proposal-top"><div class="file-icon ${prop.kind==='edit'?'sage':''}">${icon(prop.kind==='edit'?'edit':'file')}</div><div><div class="proposal-title">${esc(prop.name)}</div><div class="proposal-sub">${prop.kind==='edit'?'修改建议':'独立 Markdown'} · ${prop.status==='pending'?'等你确认':exists?'已保存':'已取消'}</div></div></div>${prop.status==='pending' ? `<div class="proposal-body"><p>${esc(prop.summary)}</p></div><div class="proposal-actions">${button('查看'+(prop.kind==='edit'?'修改':'内容'),'preview-proposal','',`data-index="${index}"`)}${button(prop.kind==='edit'?'确认修改':'确认写入','confirm-proposal','primary',`data-index="${index}"`)}${button('先不写','cancel-proposal','ghost',`data-index="${index}"`)}</div>` : `<div class="proposal-state ${exists?'':'cancelled'}">${icon(exists?'check':'close')}${exists?'已保存到项目文档':'已取消，原有内容保留'}${exists?button('打开','open-doc','small ghost',`data-project="${p.id}" data-doc="${prop.docId}"`):''}</div>`}</div>`;
}
function messageHTML(p, m, index) {
  if (m.role === 'user') return `<div class="msg user" data-message-index="${index}"><div class="msg-role">思敏</div><div class="bubble">${esc(m.text)}</div></div>`;
  return `<div class="msg" data-message-index="${index}"><div class="msg-role">${icon('star')}Simin 助手</div><div class="msg-content">${markdown(m.text)}</div>${proposalCard(p,m,index)}${m.savedDoc ? `<div class="proposal"><div class="proposal-state">${icon('check')}已保存在项目里${button('打开文档','open-doc','small ghost',`data-project="${p.id}" data-doc="${m.savedDoc}"`)}</div></div>` : ''}${m.next && index === p.messages.length-1 && busyProject !== p.id ? `<div class="message-next">${button(icon('file')+'整理成文档','prepare-doc','small')}${button('继续补信息','suggest','small ghost','data-text="我想再补充一个具体的使用场景。"')}</div>` : ''}</div>`;
}
function chat(p, expanded = false) {
  const doc = docById(p, route.docId || p.lastDoc);
  const hasMessages = p.messages.length > 0;
  const processing = busyProject === p.id;
  const lastPending = p.messages.some(m=>m.proposal?.status==='pending');
  return `<section class="chat-pane ${expanded ? 'expanded' : ''}" aria-label="项目对话" data-project="${p.id}"><header class="chat-head"><div class="chat-head-title">${icon('star')}<span>Simin 助手</span><small>项目主线</small></div><div class="toolbar">${expanded && doc ? button(icon('file')+'查看文档','open-doc','small ghost',`data-project="${p.id}" data-doc="${doc.id}"`) : ''}${!expanded ? iconButton('expand','展开对话','project-tab','data-tab="chat"') : ''}</div></header>${hasMessages ? `<div class="messages" id="messages">${p.messages.map((m,i)=>messageHTML(p,m,i)).join('')}${processing ? `<div class="msg"><div class="msg-role">${icon('star')}Simin 助手</div><div class="typing"><i></i><i></i><i></i><span>正在梳理你的信息</span></div></div>` : ''}${failedMessage?.projectId===p.id ? `<div class="notice error"><span>刚才没能完成回复，输入已保留</span>${button('重试','retry-message','small')}</div>` : ''}</div>` : `<div class="chat-welcome"><div class="orb welcome-orb">${icon('star')}</div><h2>先说说你的想法</h2><p>不需要一份完整方案。<br>从你想解决的问题，或最近遇到的一件事开始。</p><div class="suggestions"><button class="suggestion" data-action="suggest" data-text="我有一个新的产品想法，先陪我梳理一下。">${icon('light')}我有一个新想法</button><button class="suggestion" data-action="suggest" data-text="我遇到了一个具体问题，想一起判断值不值得做。">${icon('chat')}从一个真实问题开始</button><button class="suggestion" data-action="suggest" data-text="我已经有一些信息，先帮我分清已知事实和待补证据。">${icon('files')}整理手头的信息</button><button class="suggestion" data-action="templates-here">${icon('template')}用一个讨论起点</button></div><span class="welcome-foot">聊清楚之后，再确认要留下哪些文档</span></div>`}<div class="composer-area">${lastPending ? '<div class="notice" style="margin-bottom:10px">有一份内容等你确认，也可以继续聊</div>' : ''}<div class="composer">${quoteText ? `<div class="context-chip">${icon('quote')}<span>引用：${esc(quoteText.slice(0,55))}${quoteText.length>55?'…':''}</span>${iconButton('close','取消引用','clear-quote')}</div>` : (!expanded && doc ? `<div class="context-chip">${icon('file')}<span>正在讨论：${esc(plainName(doc.name))}</span></div>` : '')}<textarea id="chat-input" aria-label="给 Simin 助手的消息" placeholder="${doc && !expanded ? '说说这篇文档，你想继续补充或修改什么…' : '把想法说出来，我们一起聊清楚…'}" ${processing?'disabled':''}>${esc(p.draft || '')}</textarea><div class="composer-bottom"><div class="composer-tools">${icon('folder')}<span>${esc(p.name)}</span></div><button class="send-btn" aria-label="${processing?'停止回复':'发送消息'}" title="${processing?'停止回复':'发送消息'}" data-action="${processing?'stop-message':'send-message'}" ${!processing && !p.draft?.trim()?'disabled':''}>${icon(processing?'stop':'send')}<span>${processing?'停止':'发送'}</span></button></div></div><p class="composer-note">${data.prefs.sendMode==='enter'?'Enter 发送 · Shift + Enter 换行':'⌘ / Ctrl + Enter 发送'} · 确认后再把结论写成文档</p></div></section>`;
}
function documentView(p) {
  const doc = docById(p, route.docId);
  return `${projectTopbar(p)}<div class="mobile-tabs" style="padding:8px 17px;border-bottom:1px solid var(--line)"><button class="btn small ${mobileDoc?'primary':''}" data-action="mobile-pane" data-pane="document">${icon('file')}文档</button><button class="btn small ${!mobileDoc?'primary':''}" data-action="mobile-pane" data-pane="chat">${icon('chat')}对话</button></div><div class="workspace-content ${focusMode?'focus-mode':''} ${mobileDoc?'mobile-doc':''}"><section class="document-pane" aria-label="文档内容"><header class="doc-toolbar"><div class="doc-status">${icon('check')}已保存<span>${doc?shortDate(doc.updated):''}</span></div><div class="toolbar">${doc ? iconButton('copy','复制 Markdown','copy-doc',`data-doc="${doc.id}"`) : ''}${iconButton('file',sourceMode?'查看排版':'查看 Markdown 源文','source-mode')}${iconButton(focusMode?'collapse':'expand',focusMode?'退出专注阅读':'专注阅读','focus-mode')}</div></header><div class="scroll" id="doc-scroll">${doc ? `<article class="reading" id="reading"><div class="doc-meta"><span>${esc(doc.name)}</span><span>思敏 · ${shortDate(doc.updated)} 更新</span></div>${sourceMode?`<pre class="source-text">${esc(doc.body)}</pre>`:markdown(doc.body)}<div class="inline-ask">${button(icon('quote')+'引用到对话','quote-doc','small')}${button(icon('edit')+'讨论修改','discuss-edit','small ghost')}</div></article>` : `<div class="document-empty">${icon('file')}<p>还没有文档。先在对话里聊清楚，再确认写入项目。</p>${button('继续对话','project-tab','small','data-tab="chat"')}</div>`}</div></section>${chat(p)}</div>`;
}
function documentsPage() {
  const docs = allDocs().filter(({p,d}) => (docsFilter==='all'||p.id===docsFilter) && (d.name+p.name+d.body).toLowerCase().includes(queryDocs.toLowerCase()));
  return `${topbar('全部文档')}<div class="scroll"><div class="page"><div class="page-head"><div><h1>全部文档</h1><p class="subtitle">结论留在文件里，对话保留来时的思路</p></div><span class="badge" style="margin-top:10px">${allDocs().length} 篇文档</span></div><div class="filter-bar"><div class="filter-tabs"><button class="filter-tab ${docsFilter==='all'?'active':''}" data-action="docs-filter" data-filter="all">全部</button>${data.projects.filter(p=>p.docs.length).map(p=>`<button class="filter-tab ${docsFilter===p.id?'active':''}" data-action="docs-filter" data-filter="${p.id}">${esc(p.name)}</button>`).join('')}</div><label class="search-input">${icon('search')}<input id="docs-search" value="${esc(queryDocs)}" placeholder="查找文档" aria-label="查找文档"></label></div><div id="docs-table">${documentTable(docs)}</div></div></div>`;
}
function documentTable(docs) {
  return docs.length ? `<table class="data-table"><thead><tr><th>文档名称</th><th>所属项目</th><th>更新</th><th>格式</th><th></th></tr></thead><tbody>${docs.map(({p,d})=>`<tr><td><button class="table-name" data-action="open-doc" data-project="${p.id}" data-doc="${d.id}">${icon('file')}${esc(plainName(d.name))}</button></td><td>${esc(p.name)}</td><td>${shortDate(d.updated)}</td><td><span class="badge">Markdown</span></td><td><div class="table-actions">${iconButton('edit','重命名 '+d.name,'rename-doc',`data-project="${p.id}" data-doc="${d.id}"`)}${iconButton('trash','移入回收站 '+d.name,'delete-doc',`data-project="${p.id}" data-doc="${d.id}"`)}</div></td></tr>`).join('')}</tbody></table>` : '<div class="no-results">没有找到对应文档<br><span style="color:var(--faint)">试试另一个词，或换一个项目</span></div>';
}
function templatesPage() {
  const items = templates.filter(t=>templateFilter==='all'||templateFilter===t.category);
  return `${topbar('模板')}<div class="scroll"><div class="page"><div class="page-head"><div><h1>一个讨论起点</h1><p class="subtitle">模板帮你开始提问，结论仍由真实信息决定</p></div></div><div class="filter-bar"><div class="filter-tabs">${['all','开始讨论','整理信息','继续推进'].map(f=>`<button class="filter-tab ${templateFilter===f?'active':''}" data-action="template-filter" data-filter="${f}">${f==='all'?'全部':f}</button>`).join('')}</div></div><div class="template-grid">${items.map(t=>`<button class="template-card" data-action="preview-template" data-template="${t.id}"><div class="file-icon ${t.color}">${icon(t.icon)}</div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><div class="card-bottom"><span>${esc(t.category)}</span><span>预览 ${icon('arrow')}</span></div></button>`).join('')}</div><div class="hint-strip">${icon('circle')}<span>模板不会自动创建文档，也不会替你决定项目阶段。</span></div></div></div>`;
}
function trashPage() {
  return `${topbar('回收站')}<div class="scroll"><div class="page"><div class="page-head"><div><h1>回收站</h1><p class="subtitle">暂时放下的文档，随时可以回到原来的项目</p></div><span class="badge" style="margin-top:10px">${data.trash.length} 篇文档</span></div>${data.trash.length ? `<table class="data-table"><thead><tr><th>文档名称</th><th>原项目</th><th>移入时间</th><th></th></tr></thead><tbody>${data.trash.map(item=>`<tr><td><button class="table-name" data-action="preview-trash" data-trash="${item.id}">${icon('file')}${esc(plainName(item.doc.name))}</button></td><td>${esc(item.projectName)}</td><td>${shortDate(item.deleted)}</td><td><div class="table-actions">${button(icon('restore')+'恢复','restore-doc','small',`data-trash="${item.id}"`)}${iconButton('trash','永久删除 '+item.doc.name,'permanent-delete',`data-trash="${item.id}"`)}</div></td></tr>`).join('')}</tbody></table><div class="hint-strip">${icon('circle')}<span>恢复会放回原项目；永久删除前会再次确认。</span></div>` : `<div class="empty-page"><div class="empty-symbol">${icon('trash')}</div><h2>这里很干净</h2><p>移入回收站的文档会出现在这里。<br>你可以恢复，也可以确认后永久删除。</p>${button('回到全部文档','nav','','data-route="#documents"')}</div>`}</div></div>`;
}
function toggle(key, label) { return `<button class="toggle ${data.prefs[key]?'on':''}" role="switch" aria-checked="${data.prefs[key]}" aria-label="${esc(label)}" data-action="toggle-pref" data-pref="${key}"></button>`; }
function settingsPage() {
  let content;
  if (settingTab==='preferences') content = `<section class="settings-group"><div class="settings-group-title">阅读与操作</div><div class="setting-row"><div><div class="setting-title">消息发送方式</div><div class="setting-desc">换行与发送各有自己的习惯</div></div><select data-setting="sendMode" aria-label="消息发送方式"><option value="enter" ${data.prefs.sendMode==='enter'?'selected':''}>Enter 发送</option><option value="command" ${data.prefs.sendMode==='command'?'selected':''}>⌘ / Ctrl + Enter</option></select></div><div class="setting-row"><div><div class="setting-title">记住项目进度</div><div class="setting-desc">重新进入项目时，接着上次的文档与对话</div></div>${toggle('remember','记住项目进度')}</div><div class="setting-row"><div><div class="setting-title">自动打开第一篇文档</div><div class="setting-desc">空项目确认写入第一篇文档后，直接查看</div></div>${toggle('autoOpen','自动打开第一篇文档')}</div><div class="setting-row"><div><div class="setting-title">减少动态效果</div><div class="setting-desc">页面和浮层直接切换</div></div>${toggle('reduceMotion','减少动态效果')}</div></section>`;
  else if (settingTab==='workspace') content = `<section class="settings-group"><div class="settings-group-title">个人工作空间</div><div class="setting-row"><div><div class="setting-title">项目位置</div><div class="setting-desc">每个项目一个文件夹，文档放在项目里</div></div><span class="badge">当前工作区 / projects</span></div><div class="setting-row"><div><div class="setting-title">文件格式</div><div class="setting-desc">结论保存为独立文件，便于查看和继续修改</div></div><span class="badge">Markdown · TXT</span></div><div class="setting-row"><div><div class="setting-title">当前内容</div><div class="setting-desc">${data.projects.length} 个项目 · ${allDocs().length} 篇文档</div></div>${button('查看项目','nav','small','data-route="#home"')}</div></section><div class="notice">原型使用浏览器内的示例数据，不访问真实项目目录</div>`;
  else content = `<section class="settings-group"><div class="settings-group-title">协作方式</div><div class="setting-row"><div><div class="setting-title">一个项目，一条主线</div><div class="setting-desc">继续已有的讨论，不因重新打开而另起一段</div></div><span class="badge green">默认</span></div><div class="setting-row"><div><div class="setting-title">写入前确认</div><div class="setting-desc">先看内容和修改，再决定是否留下</div></div><span class="badge green">始终启用</span></div><div class="setting-row"><div><div class="setting-title">未知信息保持未知</div><div class="setting-desc">用真实输入补信息，不自动填空结论</div></div><span class="badge green">默认</span></div></section><div class="notice">原型中的回复仅用于演示；正式应用沿用现有 Agent</div>`;
  return `${topbar('设置')}<div class="scroll"><div class="page settings"><div class="page-head"><div><h1>按你的习惯来</h1><p class="subtitle">让工作空间保持简单，也保持顺手</p></div></div><div class="settings-grid"><nav class="settings-tabs" aria-label="设置分类">${[['preferences','settings','使用偏好'],['workspace','folder','工作空间'],['assistant','star','助手协作']].map(([tab,ico,label])=>`<button class="nav-item ${settingTab===tab?'active':''}" data-action="settings-tab" data-tab="${tab}">${icon(ico)}${label}</button>`).join('')}</nav><div class="settings-body">${content}</div></div></div></div>`;
}
function render(options = {}) {
  const oldMessages = $('#messages');
  const oldScroll = oldMessages ? {
    projectId: oldMessages.closest('.chat-pane')?.dataset.project,
    top: oldMessages.scrollTop,
    pinned: oldMessages.scrollHeight - oldMessages.clientHeight - oldMessages.scrollTop < 32,
  } : null;
  const p = currentProject();
  let main;
  if (route.page==='project' && p) main = route.tab==='overview' ? overview(p) : route.tab==='document' ? documentView(p) : `${projectTopbar(p)}<div class="workspace-content">${chat(p,true)}</div>`;
  else if (route.page==='documents') main = documentsPage();
  else if (route.page==='templates') main = templatesPage();
  else if (route.page==='trash') main = trashPage();
  else if (route.page==='settings') main = settingsPage();
  else main = home(route.page==='first-use');
  $('#app').innerHTML = `<div class="navigation-shell">${appRail()}${p && route.page==='project' ? projectSidebar(p) : globalSidebar()}</div><main class="main">${main}</main>`;
  applyPrefs();
  const messages = $('#messages');
  if (messages) messages.scrollTop = options.scrollChat || !oldScroll || oldScroll.pinned || oldScroll.projectId !== p?.id
    ? messages.scrollHeight : oldScroll.top;
}
function applyPrefs() {
  let sheet = $('#pref-style');
  if (!sheet) { sheet = document.createElement('style'); sheet.id = 'pref-style'; document.head.append(sheet); }
  sheet.textContent = data.prefs.reduceMotion ? '*,*::before,*::after{animation:none!important;transition:none!important}' : '';
}
function toast(text, undo = false) {
  clearTimeout(toastTimer);
  $('#toast').innerHTML = `${icon('check')}<span>${esc(text)}</span>${undo ? '<button data-action="undo-delete">撤销</button>' : ''}`;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(()=>$('#toast').classList.remove('show'), 3800);
}
function closeModal() {
  $('#overlay').innerHTML = ''; modalKind = null; modalTarget = null;
  $('#desktop').inert = false;
  if (lastFocus?.isConnected) lastFocus.focus();
  lastFocus = null;
}
function showModal(kind, content, target = null, className = '') {
  if (!modalKind) lastFocus = document.activeElement;
  modalKind = kind; modalTarget = target;
  $('#desktop').inert = true;
  $('#overlay').innerHTML = `<div class="overlay" data-overlay="true"><section class="modal ${className}" role="dialog" aria-modal="true" aria-label="${esc({create:'新建项目',search:'搜索',guide:'页面导览',preview:'文档预览',template:'模板预览',rename:'重命名',remove:'移入回收站',permanent:'永久删除',project:'项目操作',reset:'重置演示数据'}[kind] || '内容详情')}">${content}</section></div>`;
  requestAnimationFrame(()=>{ const focus = $('#overlay input') || $('#overlay textarea') || $('#overlay button'); focus?.focus(); });
}
function modalHead(title) { return `<div class="modal-head"><h2>${esc(title)}</h2>${iconButton('close','关闭','close-modal')}</div>`; }
function newProjectModal(idea = '') {
  newProjectError = '';
  showModal('create',`${modalHead('给这个想法一个地方')}<form id="project-form" class="modal-body"><p class="modal-sub">先建一个项目。不需要先想好阶段，也不用准备文档。</p><div class="field"><label for="project-name">项目名称</label><input id="project-name" name="name" autocomplete="off" maxlength="50" placeholder="比如：我的 AI 产品想法" required><div class="field-path" id="project-path">projects / 新项目 /</div><div class="field-error" id="project-error" aria-live="polite"></div></div><div class="field"><label for="project-idea">先记下一句话 <small>选填</small></label><textarea id="project-idea" name="idea" placeholder="你想解决什么问题？也可以稍后再说。">${esc(idea)}</textarea></div><div class="modal-footer"><small>创建后，进入这个项目的对话</small>${button('取消','close-modal')}<button type="submit" class="btn primary">创建项目 ${icon('arrow')}</button></div></form>`);
}
function createProjectFromForm(form) {
  const name = form.elements.name.value.trim();
  const idea = form.elements.idea.value.trim();
  let error = '';
  if (!name) error = '先给项目起个名字';
  else if (/[\\/<>:"|?*]/.test(name) || name==='.' || name==='..') error = '项目名称里不要使用路径或特殊符号';
  else if (data.projects.some(p=>p.name.toLowerCase()===name.toLowerCase())) error = '这个项目名称已经用过了，换个名字试试';
  if (error) { $('#project-error').textContent = error; $('#project-name').focus(); return; }
  const p = { id: uid('project'), name, description: idea || '一个还没成形的想法，从这里开始', color: ['','sage','sand'][data.projects.length%3], updated: now(), docs: [], facts: [], unknowns: [], messages: [], lastDoc: null, lastTab: 'chat', draft: '' };
  data.projects.unshift(p); data.lastProject = p.id; persist();
  openProject(p.id,'chat'); toast(`已创建「${name}」`);
  if (idea) { p.draft = idea; sendMessage(p, idea); }
}
function searchModal() {
  showModal('search',`<div class="search-box">${icon('search')}<input id="global-search" autocomplete="off" aria-label="搜索项目、文档和对话" placeholder="搜索项目、文档或对话…"><span class="kbd">ESC</span></div><div class="search-results" id="search-results">${searchResults('')}</div><div class="search-bottom"><span>↑ ↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span></div>`,null,'search-modal');
}
function searchResults(query) {
  const q = query.trim().toLowerCase();
  const projects = data.projects.filter(p=>(p.name+' '+p.description).toLowerCase().includes(q));
  const docs = allDocs().filter(({p,d})=>(p.name+d.name+d.body).toLowerCase().includes(q));
  const matches = q ? data.projects.flatMap(p=>p.messages.map((m,i)=>({p,m,i}))).filter(({m})=>m.text.toLowerCase().includes(q)).slice(0,3) : [];
  if (!projects.length&&!docs.length&&!matches.length) return `<div class="no-results">没有找到“${esc(query)}”<br><span style="color:var(--faint)">试试项目名、文档名，或对话里的一句话</span></div>`;
  return `${projects.length ? `<div class="search-label">${q?'项目':'最近项目'}</div>${projects.slice(0,4).map(p=>`<button class="result" data-action="open-project" data-project="${p.id}">${icon('folder')}<div><div class="result-title">${esc(p.name)}</div><div class="result-desc">${p.docs.length} 篇文档 · ${esc(p.description.slice(0,30))}</div></div>${icon('arrow')}</button>`).join('')}` : ''}${docs.length ? `<div class="search-label">文档</div>${docs.slice(0,5).map(({p,d})=>`<button class="result" data-action="open-doc" data-project="${p.id}" data-doc="${d.id}">${icon('file')}<div><div class="result-title">${esc(plainName(d.name))}</div><div class="result-desc">${esc(p.name)} · ${esc(d.body.replace(/[#>\n|*-]/g,' ').slice(0,45))}</div></div>${icon('arrow')}</button>`).join('')}` : ''}${matches.length ? `<div class="search-label">对话</div>${matches.map(({p,m,i})=>`<button class="result" data-action="search-message" data-project="${p.id}" data-index="${i}">${icon('chat')}<div><div class="result-title">${esc(m.text.slice(0,43))}${m.text.length>43?'…':''}</div><div class="result-desc">${esc(p.name)} · ${m.role==='user'?'思敏':'Simin 助手'}</div></div>${icon('arrow')}</button>`).join('')}` : ''}`;
}
const scenes = [
  ['01','工作台','项目入口与继续上次工作','home'],
  ['02','第一次使用','空工作台与创建引导','first-use'],
  ['03','创建项目','名称、想法与重名提示','create'],
  ['04','空项目对话','从一句话开始讨论','empty-chat'],
  ['05','项目概览','已知信息、待补问题、最近推进','overview'],
  ['06','文档与对话','阅读、引用与继续修改','document'],
  ['07','专注阅读','把空间留给文档','focus'],
  ['08','确认新文档','看内容再写入项目','proposal'],
  ['09','审阅修改','确认差异后更新文档','edit'],
  ['10','全部文档','跨项目查找与重命名','documents'],
  ['11','搜索','项目、文档和对话互相定位','search'],
  ['12','讨论模板','预览后带入项目对话','templates'],
  ['13','回收站','预览、恢复与删除确认','trash'],
  ['14','设置','阅读、发送习惯与进度恢复','settings'],
  ['15','回复失败','保留输入，支持重试','failure'],
];
function guideModal() {
  showModal('guide',`${modalHead('从想法，到留下结论')}<div class="modal-body"><p class="modal-sub">15 个页面与关键状态，围绕同一个项目主线连接起来。</p><div class="guide-flow"><div><strong>完整走一次</strong><p>建项目 → 聊清楚 → 预览文档 → 确认写入 → 讨论修改 → 回来继续</p></div>${button('体验核心流程 '+icon('arrow'),'walkthrough','primary')}</div><div class="guide-grid">${scenes.map(([num,title,desc,scene])=>`<button class="guide-card" data-action="scene" data-scene="${scene}"><small>${num}</small><strong>${title}</strong><p>${desc}</p></button>`).join('')}</div><div class="guide-bottom"><span>示例数据保存在这个浏览器中，不连接真实 Agent 或项目文件夹</span><button class="btn small ghost" data-action="reset-demo">重置演示</button></div></div>`,null,'large');
}
function walkthrough() {
  const p = { id: uid('demo'), name: '我的新产品想法'+(data.projects.some(p=>p.name==='我的新产品想法')?' '+(data.projects.length+1):''), description: '一起把一句想法，变成有依据的结论', color: '', updated: now(), docs: [], messages: [], facts: [], unknowns: [], lastDoc:null, lastTab:'chat', draft:'我想做一个给自学 AI 的人用的产品。先陪我把问题梳理清楚，不要直接写方案。' };
  data.projects.unshift(p); persist(); openProject(p.id,'chat');
  toast('先发送这句话，再试试把讨论整理成文档');
}
function getEmptyDemo() {
  let p = data.projects.find(p=>p.id==='p3'&&!p.docs.length&&!p.messages.length);
  if (!p) { p = { id:uid('empty'),name:'从一个想法开始 '+(data.projects.length+1),description:'一个还没成形的想法',color:'sand',updated:now(),docs:[],messages:[],facts:[],unknowns:[],lastDoc:null,lastTab:'chat',draft:'' }; data.projects.push(p); persist(); }
  return p;
}
function scene(sceneName) {
  const p = data.projects.find(p=>p.docs.length) || data.projects[0];
  if (['home','first-use','documents','templates','trash','settings'].includes(sceneName)) { go('#'+sceneName); return; }
  if (sceneName==='create') { closeModal(); newProjectModal(); return; }
  if (sceneName==='search') { closeModal(); searchModal(); return; }
  if (sceneName==='empty-chat') { openProject(getEmptyDemo().id,'chat'); return; }
  if (!p) { walkthrough(); return; }
  if (sceneName==='overview') { openProject(p.id,'overview'); return; }
  if (sceneName==='document' || sceneName==='focus') {
    openProject(p.id,'document',p.docs[0]?.id);
    if (sceneName==='focus') setTimeout(()=>{ focusMode=true; render(); },0);
    return;
  }
  if (sceneName==='proposal') {
    const demo = getEmptyDemo(); demo.messages.push({role:'user',text:'我想先帮自学 AI 的人，把一个真实任务做出来。使用频率和需求强度还没确定。把这些已经聊清楚的内容留下来。'});
    const proposal = makeProposal(demo, 'create');
    demo.messages.push({role:'assistant',text:'先看这份整理。有依据的内容和待补问题分开保留，确认后再写进项目。',proposal}); persist(); openProject(demo.id,'chat');
    return;
  }
  if (sceneName==='edit') {
    if (!p.docs.length) { scene('proposal'); return; }
    const d = p.docs[0];
    const prop = makeProposal(p,'edit',d,'这版先只服务自学 AI 的学习者，首次体验围绕一个真实任务展开。');
    p.messages.push({role:'user',text:'把第一次体验的范围再收窄一点，先给我看修改。'},{role:'assistant',text:'修改前后放在一起了。其他已有内容保留，等你确认后再更新。',proposal:prop});persist();
    openProject(p.id,'document',d.id);setTimeout(()=>previewProposal(p,p.messages.length-1),0);return;
  }
  if (sceneName==='failure') {
    openProject(p.id,'chat');
    failedMessage={projectId:p.id,text:'继续补充这个项目还缺的信息'};
    setTimeout(()=>render({scrollChat:true}),0);
  }
}
function templateModal(id, targetProject) {
  const t = templates.find(t=>t.id===id); if (!t) return;
  const defaultP = targetProject || currentProject()?.id || data.lastProject || data.projects[0]?.id;
  showModal('template',`${modalHead(t.name)}<div class="modal-body"><p class="modal-sub">${esc(t.desc)}</p><div class="panel-note" style="margin:0"><div class="eyebrow">带入对话的起点</div><p style="font-size:13px;line-height:1.9">${esc(t.prompt)}</p></div><div class="field"><label for="template-project">在哪个项目里开始？</label><select id="template-project">${data.projects.map(p=>`<option value="${p.id}" ${defaultP===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}<option value="new">新建一个项目…</option></select></div><p style="font-size:11px;color:var(--faint)">先进入输入框，由你决定是否发送。不自动生成文档。</p><div class="modal-footer">${button('取消','close-modal')}${button('带入对话 '+icon('arrow'),'use-template','primary',`data-template="${id}"`)}</div></div>`,id);
}
function makeProposal(p, kind, targetDoc = null, instruction = '') {
  const userTexts = p.messages.filter(m=>m.role==='user').map(m=>m.text).filter(t=>!/(整理成|写成|写入|生成).*(文档|Markdown)/i.test(t)).slice(-4);
  const draftName = /(.+?)\.md/.exec(p.messages.filter(m=>m.role==='user').at(-1)?.text || '')?.[0];
  let name = draftName ? draftName.replace(/[\\/<>:"|?*]/g,'').trim() : '想法与已知信息.md';
  if (kind==='create' && p.docs.some(d=>d.name===name)) {
    targetDoc = p.docs.find(d=>d.name===name); kind='edit';
  }
  if (kind==='edit' && targetDoc) {
    const addition = instruction || p.messages.filter(m=>m.role==='user').at(-1)?.text || '继续核实真实使用场景，确认后再确定功能。';
    const replacement = addition.match(/[「“"]([^」”"]+)[」”"]\s*(?:改成|替换为|改为)\s*[「“"]([^」”"]+)[」”"]/);
    if (replacement && targetDoc.body.includes(replacement[1])) {
      return {kind:'edit',name:targetDoc.name,docId:targetDoc.id,status:'pending',before:targetDoc.body,
        beforePart:replacement[1],afterPart:replacement[2],replace:true,
        after:targetDoc.body.replace(replacement[1],replacement[2]),
        summary:'替换你指定的这段文字，其他内容保持原样。确认后更新文档。'};
    }
    const newText = `## 本次补充\n\n> 思敏提供的修改方向\n\n${addition}\n\n这部分作为当前讨论输入，后续仍需结合真实案例核实。`;
    const lastParagraph = targetDoc.body.split('\n\n').filter(line=>line.trim() && !line.startsWith('#')).at(-1);
    return {kind:'edit',name:targetDoc.name,docId:targetDoc.id,status:'pending',before:targetDoc.body,
      beforePart:lastParagraph || targetDoc.body.slice(-100),afterPart:newText,
      after:targetDoc.body+'\n\n'+newText,addition:newText,summary:'根据你提供的方向补充一段说明，保留原有内容。确认后更新这篇文档。'};
  }
  const body = `# ${plainName(name)}\n\n> 记录思敏提供的信息。没有确认的内容保留为问题。\n\n## 当前想法\n\n${userTexts.length ? userTexts.map((t,i)=>`${i+1}. ${t}`).join('\n\n') : '这个想法还需要继续聊清楚，目前不下具体结论。'}\n\n## 已经明确的协作方式\n\n- 先围绕真实问题补信息。\n- 有依据的内容再留下来。\n- 功能范围和优先级等讨论清楚后再决定。\n\n## 还需要补\n\n- 想解决谁在什么场景里的具体问题？\n- 最近一次发生这个问题时，已有的输入和限制是什么？\n- 什么结果才算完成第一次体验？\n\n## 下一步\n\n用一个真实案例继续讨论，把缺少的证据补上。`;
  return {kind:'create',name,status:'pending',body,summary:'留下你提供的想法、已经明确的协作方式和待补问题。不会自动填入未经确认的结论。'};
}
function previewProposal(p,index) {
  const prop=p?.messages[index]?.proposal;if(!prop)return;
  if(prop.kind==='edit') {
    showModal('preview',`${modalHead('先看这次修改')}<div class="modal-body"><div class="preview-meta">${icon('file')}<span>${esc(prop.name)}</span><span class="badge purple">${prop.status==='pending'?'待确认':'已处理'}</span></div><p class="modal-sub" style="margin-top:16px;margin-bottom:12px">${prop.replace?'只替换下面这段文字，其他内容保留。':'保留已有内容，追加你提供的修改方向。'}</p><div class="preview-reading"><div class="diff-label">${prop.replace?'− 原来的内容':'当前文档末尾'}</div><div class="diff-block ${prop.replace?'removed':''}">${esc(prop.beforePart || prop.before.slice(-100))}</div><div class="diff-label">${prop.replace?'+ 修改后的内容':'+ 本次新增'}</div><div class="diff-block added">${esc(prop.afterPart || prop.addition)}</div></div><div class="modal-footer"><small>确认前，项目里的文档保持原样</small>${button('继续讨论','close-modal')}${button('确认修改','confirm-proposal','primary',`data-project="${p.id}" data-index="${index}" ${prop.status!=='pending'?'disabled':''}`)}</div></div>`,{projectId:p.id,index},'wide');
  } else {
    showModal('preview',`${modalHead('把聊清楚的内容留下来')}<div class="modal-body"><div class="preview-meta">${icon('file')}<span>${esc(prop.name)}</span><span class="badge purple">${prop.status==='pending'?'待确认':'已处理'}</span></div><div class="preview-reading"><article class="reading">${markdown(prop.body)}</article></div><div class="modal-footer"><small>保存到 projects/${esc(p.name)}/${esc(prop.name)}</small>${button('继续讨论','close-modal')}${button('确认写入','confirm-proposal','primary',`data-project="${p.id}" data-index="${index}" ${prop.status!=='pending'?'disabled':''}`)}</div></div>`,{projectId:p.id,index},'wide');
  }
}
function confirmProposal(p,index) {
  const prop=p?.messages[index]?.proposal;if(!prop||prop.status!=='pending')return;
  const wasEmpty=p.docs.length===0;
  let doc;
  if(prop.kind==='edit') {
    doc=docById(p,prop.docId);
    if(!doc) {toast('这篇文档已不在项目里，先恢复后再修改');return;}
    if(doc.body!==prop.before) {toast('文档在预览后已有变化，请重新讨论修改');return;}
    doc.body=prop.after;doc.updated=now();
  } else {
    if(p.docs.some(d=>d.name===prop.name)) {toast('已有同名文档，先讨论是更新原文还是换个名字');return;}
    doc={id:uid('doc'),name:prop.name,body:prop.body,updated:now()};p.docs.push(doc);prop.docId=doc.id;
  }
  prop.status='saved';p.lastDoc=doc.id;p.updated=now();
  if(!p.facts.length) {p.facts=['已保留你提供的想法','已知信息和待补问题分开记录'];p.unknowns=['用一个真实案例验证要解决的问题'];}
  persist();closeModal();
  if((wasEmpty&&data.prefs.autoOpen)||route.tab==='document') openProject(p.id,'document',doc.id);else render({scrollChat:true});
  toast(prop.kind==='edit'?'修改已保存，文档内容已更新':'文档已写入，左侧列表已更新');
}
function renameModal(projectId,docId) {
  const p=projectById(projectId), d=docById(p,docId);if(!d)return;
  showModal('rename',`${modalHead('重命名文档')}<form id="rename-form" class="modal-body"><p class="modal-sub">内容和所属项目保持原样。</p><div class="field"><label for="doc-name">文档名称</label><input id="doc-name" name="name" value="${esc(plainName(d.name))}" maxlength="70" autocomplete="off"><div class="field-error" id="rename-error" aria-live="polite"></div></div><div class="modal-footer">${button('取消','close-modal')}<button type="submit" class="btn primary">保存名称</button></div></form>`,{projectId,docId});
}
function removeModal(projectId,docId) {
  const p=projectById(projectId),d=docById(p,docId);if(!d)return;
  showModal('remove',`${modalHead('先把这篇文档放下？')}<div class="modal-body"><p class="modal-sub">「${esc(plainName(d.name))}」会移入回收站，你可以随时恢复到「${esc(p.name)}」。</p><div class="modal-footer">${button('保留文档','close-modal')}${button('移入回收站','confirm-delete','',`data-project="${p.id}" data-doc="${d.id}"`)}</div></div>`,{projectId,docId});
}
function deleteDoc(p,d) {
  if(!p||!d)return;
  const item={id:uid('trash'),projectId:p.id,projectName:p.name,doc:d,deleted:now()};data.trash.unshift(item);lastOperation=item.id;
  p.docs=p.docs.filter(doc=>doc.id!==d.id);
  if(p.lastDoc===d.id)p.lastDoc=p.docs[0]?.id||null;
  persist();closeModal();
  if(route.page==='project'&&route.docId===d.id)openProject(p.id,p.docs.length?'document':'chat',p.lastDoc);else render();
  toast('文档已移入回收站',true);
}
function restoreDoc(id) {
  const item=data.trash.find(x=>x.id===id);if(!item)return;
  const p=projectById(item.projectId);if(!p){toast('原项目不存在，暂时无法恢复');return;}
  if(p.docs.some(d=>d.name===item.doc.name)){toast('原项目已有同名文档，先重命名后再恢复');return;}
  p.docs.push(item.doc);p.updated=now();data.trash=data.trash.filter(x=>x.id!==id);persist();closeModal();render();toast(`已恢复到「${p.name}」`);
}
function previewTrash(id) {
  const item=data.trash.find(x=>x.id===id);if(!item)return;
  showModal('preview',`${modalHead(plainName(item.doc.name))}<div class="modal-body"><div class="preview-meta">${icon('folder')}${esc(item.projectName)}<span class="badge">在回收站中</span></div><div class="preview-reading"><article class="reading">${markdown(item.doc.body)}</article></div><div class="modal-footer">${button('关闭','close-modal')}${button(icon('restore')+'恢复到原项目','restore-doc','primary',`data-trash="${id}"`)}</div></div>`,id,'wide');
}
function projectMenu(p) {
  showModal('project',`${modalHead(p.name)}<div class="modal-body"><p class="modal-sub">一个项目，一条持续推进的主线。</p><div class="field-path">projects/${esc(p.name)}/</div><div class="modal-footer">${button('项目概览','project-tab','','data-tab="overview"')}${button('继续对话','project-tab','primary','data-tab="chat"')}</div></div>`,p.id);
}
function sendMessage(p, text) {
  if (!p||busyProject) return;
  const input=text.trim();if(!input)return;
  const quoted=quoteText ? `引用文档：${quoteText}\n\n${input}` : input;
  p.messages.push({role:'user',text:quoted});p.draft='';p.updated=now();quoteText='';failedMessage=null;
  busyProject=p.id;persist();render({scrollChat:true});
  busyTimer=setTimeout(()=>{
    busyProject=null;busyTimer=null;
    if(/模拟失败/.test(input)) {failedMessage={projectId:p.id,text:input.replace('模拟失败','继续讨论'),alreadyAdded:true};if(currentProject()?.id===p.id)render({scrollChat:true});return;}
    replyTo(p,input);persist();if(currentProject()?.id===p.id)render({scrollChat:true});
  },1050);
}
function replyTo(p,input) {
  const target=docById(p,route.projectId===p.id?route.docId:p.lastDoc)||p.docs[0];
  const asksDocument=/(整理成|写成|写入|保存|生成|留下|整理).{0,25}(文档|Markdown|结论|内容)/i.test(input)||/整理成文档|确认的信息整理|把这些.*留下/.test(input);
  const inDocument = route.projectId === p.id && route.tab === 'document';
  const asksEdit=!!target&&(/修改|调整|收窄|改成|改一下|删掉/.test(input)
    || (/补充/.test(input)&&(inDocument||/这篇|文档|原文/.test(input))))&&!/新文档|另一篇/.test(input);
  if(asksEdit) {
    p.messages.push({role:'assistant',text:'我先把你的修改方向放进预览，原有文档暂时保留。\n\n你可以查看新增内容，确认后再更新；还没想清楚也可以继续讨论。',proposal:makeProposal(p,'edit',target,input)});
  } else if(asksDocument) {
    const pending=p.messages.find(m=>m.proposal?.status==='pending');
    if(pending){p.messages.push({role:'assistant',text:'前面还有一份内容等你确认。可以先预览，再决定写入或继续讨论；同一份内容不会重复创建。'});}
    else p.messages.push({role:'assistant',text:'已经把你提供的信息整理成一份预览。\n\n还没有证据的部分保留为问题。先看一眼，确认后再保存到这个项目里。',proposal:makeProposal(p,'create')});
  } else if(p.messages.filter(m=>m.role==='user').length===1) {
    p.messages.push({role:'assistant',text:`我们先从这句话开始：\n\n> ${input}\n\n先不急着确定功能。我想和你补清楚两个问题：\n\n- 你最想帮谁解决这个问题？\n- 最近一次遇到它时，发生了什么？\n\n有具体经历就从经历讲起，没有也可以先说明你已经知道的部分。`,next:true});
    p.facts=['先围绕你提供的想法继续讨论'];p.unknowns=['需要补充具体使用者与真实经历'];
  } else {
    p.messages.push({role:'assistant',text:`收到，这也是项目的讨论输入：\n\n> ${input}\n\n我们可以先保留你已经提供的信息，把还不确定的使用场景和完成标准继续问清楚。\n\n如果这部分已经足够清楚，可以先整理成文档；后面仍能继续补充。`,next:true});
  }
}
function stopReply() {
  if(!busyProject)return;
  clearTimeout(busyTimer);busyTimer=null;const p=projectById(busyProject);busyProject=null;
  if(p)p.messages.push({role:'assistant',text:'这次回复已停止。你的输入还在，可以继续补充，或重新发起讨论。'});
  persist();render({scrollChat:true});toast('已停止回复，输入和已有内容保留');
}
async function copyDoc(p,id) {
  const doc=docById(p,id);if(!doc)return;
  try {await navigator.clipboard.writeText(doc.body);toast('已复制 Markdown');}
  catch(error) {
    const input=document.createElement('textarea');input.value=doc.body;document.body.append(input);input.select();
    const copied=document.execCommand('copy');input.remove();toast(copied?'已复制 Markdown':'复制暂时不可用，可以切到源文后选择复制');
  }
}
function action(event) {
  const target=event.target.closest('[data-action]');if(!target)return;
  const a=target.dataset.action, ds=target.dataset;
  const p=projectById(ds.project)||currentProject();
  const d=docById(p,ds.doc||route.docId);
  if(a==='nav'){go(ds.route);return;}
  if(a==='open-project'){openProject(ds.project);return;}
  if(a==='open-doc'){mobileDoc=true;openProject(ds.project,'document',ds.doc);return;}
  if(a==='project-tab'){closeModal();openProject(p?.id,ds.tab);return;}
  if(a==='new-project'){newProjectModal();return;}
  if(a==='search'){searchModal();return;}
  if(a==='guide'){guideModal();return;}
  if(a==='close-modal'){closeModal();return;}
  if(a==='home-view'){homeView=ds.view;render();return;}
  if(a==='docs-filter'){docsFilter=ds.filter;render();return;}
  if(a==='template-filter'){templateFilter=ds.filter;render();return;}
  if(a==='settings-tab'){settingTab=ds.tab;render();return;}
  if(a==='source-mode'){sourceMode=!sourceMode;render();return;}
  if(a==='focus-mode'){focusMode=!focusMode;mobileDoc=true;render();return;}
  if(a==='mobile-pane'){mobileDoc=ds.pane==='document';render();return;}
  if(a==='copy-doc'){void copyDoc(p,ds.doc);return;}
  if(a==='mobile-menu'){mobileSide=!mobileSide;render();return;}
  if(a==='suggest'){if(p){p.draft=ds.text;persist();render();$('#chat-input')?.focus();}return;}
  if(a==='clear-quote'){quoteText='';render();$('#chat-input')?.focus();return;}
  if(a==='quote-doc'){
    const selected=window.getSelection();const reading=$('#reading');
    quoteText=selected?.anchorNode&&reading?.contains(selected.anchorNode)&&selected.toString().trim()?selected.toString().trim():d?`${plainName(d.name)}：${d.body.replace(/[#>*|]/g,'').trim().slice(0,130)}`:'';
    focusMode=false;mobileDoc=false;render();$('#chat-input')?.focus();return;
  }
  if(a==='discuss-edit'){
    if(p&&d){p.draft='我想继续修改这篇文档，先帮我看一下需要补充哪些信息。';persist();focusMode=false;mobileDoc=false;render();$('#chat-input')?.focus();}return;
  }
  if(a==='send-message'){sendMessage(p,$('#chat-input')?.value||'');return;}
  if(a==='stop-message'){stopReply();return;}
  if(a==='retry-message'){
    const failure=failedMessage;if(!failure)return;failedMessage=null;
    const project=projectById(failure.projectId);
    if(project){busyProject=project.id;render({scrollChat:true});busyTimer=setTimeout(()=>{busyProject=null;replyTo(project,failure.text);persist();if(currentProject()?.id===project.id)render({scrollChat:true});},900);}return;
  }
  if(a==='prepare-doc'){sendMessage(p,'把已经确认的信息整理成一篇独立 Markdown 文档，先给我看内容。');return;}
  if(a==='preview-proposal'){previewProposal(p,Number(ds.index));return;}
  if(a==='confirm-proposal'){confirmProposal(p,Number(ds.index));return;}
  if(a==='cancel-proposal'){
    const prop=p?.messages[Number(ds.index)]?.proposal;if(prop?.status==='pending'){prop.status='cancelled';persist();render({scrollChat:true});toast('先继续聊，项目文档没有变化');}return;
  }
  if(a==='templates-here'){
    if(!p){go('#templates');return;}
    templateModal('idea',p.id);return;
  }
  if(a==='preview-template'){templateModal(ds.template);return;}
  if(a==='use-template'){
    const t=templates.find(t=>t.id===ds.template);const id=$('#template-project')?.value;if(!t)return;
    if(id==='new'){closeModal();newProjectModal(t.prompt);return;}
    const project=projectById(id);if(project){project.draft=t.prompt;persist();openProject(id,'chat');setTimeout(()=>$('#chat-input')?.focus(),0);toast('讨论起点已带入，还没有发送');}return;
  }
  if(a==='rename-doc'){renameModal(ds.project,ds.doc);return;}
  if(a==='delete-doc'){removeModal(ds.project,ds.doc);return;}
  if(a==='confirm-delete'){deleteDoc(p,d);return;}
  if(a==='restore-doc'){restoreDoc(ds.trash);return;}
  if(a==='undo-delete'){if(lastOperation)restoreDoc(lastOperation);lastOperation=null;return;}
  if(a==='preview-trash'){previewTrash(ds.trash);return;}
  if(a==='permanent-delete'){
    const item=data.trash.find(x=>x.id===ds.trash);if(!item)return;
    showModal('permanent',`${modalHead('永久删除这篇文档？')}<div class="modal-body"><p class="modal-sub">「${esc(plainName(item.doc.name))}」会从回收站删除。此操作无法恢复。</p><div class="modal-footer">${button('保留','close-modal')}${button('永久删除','confirm-permanent','danger',`data-trash="${item.id}"`)}</div></div>`,item.id);return;
  }
  if(a==='confirm-permanent'){data.trash=data.trash.filter(x=>x.id!==ds.trash);persist();closeModal();render();toast('已从回收站永久删除');return;}
  if(a==='toggle-pref'){data.prefs[ds.pref]=!data.prefs[ds.pref];persist();render();toast('偏好已保存');return;}
  if(a==='project-menu'){projectMenu(p);return;}
  if(a==='walkthrough'){walkthrough();return;}
  if(a==='scene'){scene(ds.scene);return;}
  if(a==='reset-demo'){
    showModal('reset',`${modalHead('重新体验一次？')}<div class="modal-body"><p class="modal-sub">只重置这个原型里的演示项目和偏好，不影响真实工作台文件。</p><div class="modal-footer">${button('取消','close-modal')}${button('重置演示','confirm-reset','primary')}</div></div>`);return;
  }
  if(a==='confirm-reset'){
    clearTimeout(busyTimer);busyProject=null;failedMessage=null;data=seed();persist();docsFilter='all';queryDocs='';closeModal();go('#home');toast('演示数据已重置');return;
  }
  if(a==='search-message'){
    openProject(ds.project,'chat');setTimeout(()=>{const node=$(`[data-message-index="${ds.index}"]`);node?.scrollIntoView({block:'center',behavior:'smooth'});if(node){node.style.background='var(--accent-soft)';node.style.borderRadius='8px';node.style.padding='10px';}},50);return;
  }
}
document.addEventListener('click',event=>{
  if(event.target.classList.contains('overlay')){closeModal();return;}
  const link=event.target.closest('a[href^="#"]');if(link){event.preventDefault();go(link.getAttribute('href'));return;}
  action(event);
});
document.addEventListener('input',event=>{
  if(event.target.id==='chat-input'){
    const p=currentProject();if(p){p.draft=event.target.value;persist();const send=$('.send-btn');if(send)send.disabled=!p.draft.trim();}
    event.target.style.height='auto';event.target.style.height=Math.min(150,event.target.scrollHeight)+'px';
  }
  if(event.target.id==='project-name'){$('#project-path').textContent=`projects / ${event.target.value.trim()||'新项目'} /`;$('#project-error').textContent='';}
  if(event.target.id==='global-search')$('#search-results').innerHTML=searchResults(event.target.value);
  if(event.target.id==='docs-search'){
    queryDocs=event.target.value;
    const items=allDocs().filter(({p,d})=>(docsFilter==='all'||p.id===docsFilter)&&(d.name+p.name+d.body).toLowerCase().includes(queryDocs.toLowerCase()));
    $('#docs-table').innerHTML=documentTable(items);
  }
});
document.addEventListener('change',event=>{
  if(event.target.dataset.setting){data.prefs[event.target.dataset.setting]=event.target.value;persist();toast('偏好已保存');}
});
document.addEventListener('submit',event=>{
  if(event.target.id==='project-form'){event.preventDefault();createProjectFromForm(event.target);}
  if(event.target.id==='rename-form'){
    event.preventDefault();const p=projectById(modalTarget.projectId),d=docById(p,modalTarget.docId);if(!d)return;
    const raw=event.target.elements.name.value.trim().replace(/\.(md|txt)$/i,'');
    const name=raw+(d.name.toLowerCase().endsWith('.txt')?'.txt':'.md');
    let error='';if(!raw)error='名称不能为空';else if(/[\\/<>:"|?*]/.test(raw)||raw==='.'||raw==='..')error='名称里不要使用路径或特殊符号';else if(p.docs.some(x=>x.id!==d.id&&x.name.toLowerCase()===name.toLowerCase()))error='这个项目已有同名文档';
    if(error){$('#rename-error').textContent=error;return;}
    const old=d.name;d.name=name;d.updated=now();
    for(const m of p.messages){if(m.proposal?.docId===d.id)m.proposal.name=name;}
    persist();closeModal();render();toast(`已将「${plainName(old)}」重命名`);
  }
});
document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(modalKind!=='search')searchModal();return;}
  if(event.key==='Escape'){
    if(modalKind){closeModal();return;}
    if(focusMode){focusMode=false;render();return;}
    if(mobileSide){mobileSide=false;render();return;}
  }
  if(event.target.id==='chat-input'&&event.key==='Enter'&&!event.isComposing){
    const shouldSend=data.prefs.sendMode==='enter'?!event.shiftKey:(event.metaKey||event.ctrlKey);
    if(shouldSend){event.preventDefault();sendMessage(currentProject(),event.target.value);}return;
  }
  if(modalKind==='search'){
    const nodes=[...document.querySelectorAll('#search-results .result')];const at=nodes.indexOf(document.activeElement);
    if(event.key==='ArrowDown'){event.preventDefault();nodes[Math.min(nodes.length-1,at+1)]?.focus();return;}
    if(event.key==='ArrowUp'){event.preventDefault();if(at<=0)$('#global-search').focus();else nodes[at-1]?.focus();return;}
    if(event.key==='Enter'&&event.target.id==='global-search'){event.preventDefault();nodes[0]?.click();return;}
  }
  if(modalKind&&event.key==='Tab'){
    const nodes=[...document.querySelectorAll('#overlay button:not(:disabled),#overlay input,#overlay textarea,#overlay select,#overlay a[href]')].filter(x=>x.offsetParent!==null);
    if(!nodes.length)return;
    const first=nodes[0],last=nodes.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
window.addEventListener('hashchange',()=>{parseRoute();render();});
if(!location.hash&&data.prefs.remember&&data.lastRoute?.startsWith('#project/'))location.hash=data.lastRoute;
parseRoute();render();
