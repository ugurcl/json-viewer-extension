function init() {
  const raw = extractJSON();
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return;
  }

  if (typeof data !== 'object' || data === null) return;

  const originalJSON = raw;

  while (document.styleSheets.length > 0) {
    const sheet = document.styleSheets[0];
    if (sheet.ownerNode) sheet.ownerNode.remove();
  }

  document.title = 'JSON Viewer';
  document.body.innerHTML = '';
  document.body.className = 'jv-body';

  const container = document.createElement('div');
  container.className = 'jv-container';

  const info = document.createElement('div');
  info.className = 'jv-info-bar';
  const type = Array.isArray(data) ? 'Array' : 'Object';
  const count = Array.isArray(data) ? data.length : Object.keys(data).length;
  const size = new Blob([originalJSON]).size;
  info.textContent = `${type} \u00B7 ${count} items \u00B7 ${formatBytes(size)}`;

  const toolbar = document.createElement('div');
  toolbar.className = 'jv-toolbar';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search keys or values...';
  searchInput.className = 'jv-search';

  const expandBtn = createBtn('Expand All');
  const collapseBtn = createBtn('Collapse All');
  const copyBtn = createBtn('Copy');
  const rawBtn = createBtn('Raw');

  toolbar.appendChild(searchInput);
  toolbar.appendChild(expandBtn);
  toolbar.appendChild(collapseBtn);
  toolbar.appendChild(copyBtn);
  toolbar.appendChild(rawBtn);

  const output = document.createElement('div');
  output.className = 'jv-output';

  container.appendChild(info);
  container.appendChild(toolbar);
  container.appendChild(output);
  document.body.appendChild(container);

  let showRaw = false;

  function render() {
    output.innerHTML = '';
    if (showRaw) {
      const pre = document.createElement('pre');
      pre.className = 'jv-raw';
      pre.textContent = JSON.stringify(data, null, 2);
      output.appendChild(pre);
    } else {
      output.appendChild(buildNode(data));
    }
  }

  expandBtn.addEventListener('click', () => {
    output.querySelectorAll('.jv-content').forEach(el => el.style.display = 'block');
    output.querySelectorAll('.jv-toggle').forEach(el => el.textContent = '\u25BC');
    output.querySelectorAll('.jv-info').forEach(el => el.style.display = 'none');
    output.querySelectorAll('.jv-closer').forEach(el => el.style.display = 'block');
  });

  collapseBtn.addEventListener('click', () => {
    output.querySelectorAll('.jv-content').forEach(el => el.style.display = 'none');
    output.querySelectorAll('.jv-toggle').forEach(el => el.textContent = '\u25B6');
    output.querySelectorAll('.jv-info').forEach(el => el.style.display = 'inline');
    output.querySelectorAll('.jv-closer').forEach(el => el.style.display = 'none');
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1500);
  });

  rawBtn.addEventListener('click', () => {
    showRaw = !showRaw;
    rawBtn.textContent = showRaw ? 'Tree' : 'Raw';
    render();
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    output.querySelectorAll('.jv-hl').forEach(el => {
      el.outerHTML = el.textContent;
    });
    if (!q) return;

    const walker = document.createTreeWalker(output, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.toLowerCase().includes(q)) {
        nodes.push(walker.currentNode);
      }
    }

    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = node.textContent.replace(regex, '<span class="jv-hl">$1</span>');
      node.parentNode.replaceChild(span, node);
    });
  });

  render();
}

function extractJSON() {
  const body = document.body;
  if (!body) return null;

  const children = body.children;
  if (children.length === 1 && children[0].tagName === 'PRE') {
    return children[0].textContent.trim();
  }

  if (children.length === 0 || (children.length === 1 && children[0].tagName === 'PRE')) {
    const text = body.textContent.trim();
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      return text;
    }
  }

  const pre = body.querySelector('pre');
  if (pre && body.textContent.trim() === pre.textContent.trim()) {
    const text = pre.textContent.trim();
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      return text;
    }
  }

  return null;
}

function buildNode(val, key) {
  const wrapper = document.createElement('div');
  wrapper.className = 'jv-node';

  if (val === null || typeof val !== 'object') {
    wrapper.innerHTML = formatLeaf(key, val);
    return wrapper;
  }

  const isArray = Array.isArray(val);
  const count = isArray ? val.length : Object.keys(val).length;
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';

  const header = document.createElement('span');
  header.className = 'jv-header';

  const toggle = document.createElement('span');
  toggle.className = 'jv-toggle';
  toggle.textContent = '\u25BC';

  const keyStr = key !== undefined ? `<span class="jv-key">"${escapeHtml(String(key))}"</span>: ` : '';
  const infoSpan = document.createElement('span');
  infoSpan.className = 'jv-info';
  infoSpan.style.display = 'none';
  infoSpan.textContent = isArray ? `[${count} items]` : `{${count} keys}`;

  header.appendChild(toggle);
  header.insertAdjacentHTML('beforeend', keyStr);
  header.insertAdjacentHTML('beforeend', `<span class="jv-bracket">${open}</span>`);
  header.appendChild(infoSpan);

  const content = document.createElement('div');
  content.className = 'jv-content';

  if (isArray) {
    val.forEach(item => content.appendChild(buildNode(item)));
  } else {
    Object.entries(val).forEach(([k, v]) => content.appendChild(buildNode(v, k)));
  }

  const closer = document.createElement('div');
  closer.className = 'jv-closer';
  closer.innerHTML = `<span class="jv-bracket">${close}</span>`;

  toggle.addEventListener('click', () => {
    const hidden = content.style.display === 'none';
    content.style.display = hidden ? 'block' : 'none';
    closer.style.display = hidden ? 'block' : 'none';
    infoSpan.style.display = hidden ? 'none' : 'inline';
    toggle.textContent = hidden ? '\u25BC' : '\u25B6';
  });

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  wrapper.appendChild(closer);
  return wrapper;
}

function formatLeaf(key, val) {
  const k = key !== undefined ? `<span class="jv-key">"${escapeHtml(String(key))}"</span>: ` : '';
  return k + colorize(val);
}

function colorize(val) {
  if (val === null) return '<span class="jv-null">null</span>';
  if (typeof val === 'string') return `<span class="jv-string">"${escapeHtml(val)}"</span>`;
  if (typeof val === 'number') return `<span class="jv-number">${val}</span>`;
  if (typeof val === 'boolean') return `<span class="jv-bool">${val}</span>`;
  return String(val);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function createBtn(text) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = 'jv-btn';
  return btn;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
