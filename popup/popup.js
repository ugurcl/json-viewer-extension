const jsonInput = document.getElementById('json-input');
const btnFormat = document.getElementById('btn-format');
const btnPaste = document.getElementById('btn-paste');
const btnClear = document.getElementById('btn-clear');
const btnTree = document.getElementById('btn-tree');
const btnRaw = document.getElementById('btn-raw');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');
const btnCopy = document.getElementById('btn-copy');
const searchInput = document.getElementById('search-input');
const jsonTree = document.getElementById('json-tree');
const jsonRaw = document.getElementById('json-raw');
const errorMessage = document.getElementById('error-message');
const statusBar = document.getElementById('status-bar');

let parsedData = null;

btnFormat.addEventListener('click', formatJSON);
btnPaste.addEventListener('click', pasteFromClipboard);
btnClear.addEventListener('click', clearAll);
btnTree.addEventListener('click', () => switchView('tree'));
btnRaw.addEventListener('click', () => switchView('raw'));
btnExpandAll.addEventListener('click', expandAll);
btnCollapseAll.addEventListener('click', collapseAll);
btnCopy.addEventListener('click', copyJSON);
searchInput.addEventListener('input', handleSearch);

function formatJSON() {
  const input = jsonInput.value.trim();
  if (!input) {
    showError('Please enter some JSON');
    return;
  }

  try {
    parsedData = JSON.parse(input);
    hideError();
    renderTree(parsedData);
    renderRaw(parsedData);
    updateStatus(parsedData);
  } catch (e) {
    showError('Invalid JSON: ' + e.message);
    parsedData = null;
  }
}

function renderTree(data) {
  jsonTree.innerHTML = '';
  const tree = buildTree(data);
  jsonTree.appendChild(tree);
}

function buildTree(data, key) {
  const wrapper = document.createElement('div');

  if (data === null) {
    wrapper.innerHTML = formatLeaf(key, '<span class="json-null">null</span>');
    return wrapper;
  }

  if (typeof data !== 'object') {
    wrapper.innerHTML = formatLeaf(key, formatValue(data));
    return wrapper;
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data : Object.entries(data);
  const count = isArray ? data.length : Object.keys(data).length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  const header = document.createElement('div');
  const toggle = document.createElement('span');
  toggle.className = 'toggle-btn';
  toggle.textContent = '\u25BC';

  const keyPart = key !== undefined ? `<span class="json-key">"${key}"</span>: ` : '';
  const placeholder = document.createElement('span');
  placeholder.className = 'collapsed-placeholder';
  placeholder.style.display = 'none';
  placeholder.textContent = isArray ? `[${count} items]` : `{${count} keys}`;

  header.appendChild(toggle);
  header.insertAdjacentHTML('beforeend', keyPart);
  header.insertAdjacentHTML('beforeend', `<span class="json-bracket">${openBracket}</span>`);
  header.appendChild(placeholder);

  const content = document.createElement('div');
  content.className = 'collapsible-content';
  content.style.paddingLeft = '20px';

  if (isArray) {
    data.forEach((item, i) => {
      content.appendChild(buildTree(item, undefined));
    });
  } else {
    Object.entries(data).forEach(([k, v]) => {
      content.appendChild(buildTree(v, k));
    });
  }

  const closer = document.createElement('div');
  closer.innerHTML = `<span class="json-bracket">${closeBracket}</span>`;

  toggle.addEventListener('click', () => {
    const collapsed = content.classList.toggle('collapsed');
    toggle.textContent = collapsed ? '\u25B6' : '\u25BC';
    placeholder.style.display = collapsed ? 'inline' : 'none';
    closer.style.display = collapsed ? 'none' : 'block';
  });

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  wrapper.appendChild(closer);
  return wrapper;
}

function formatLeaf(key, valueHtml) {
  if (key !== undefined) {
    return `<span class="json-key">"${key}"</span>: ${valueHtml}`;
  }
  return valueHtml;
}

function formatValue(value) {
  if (typeof value === 'string') {
    return `<span class="json-string">"${escapeHtml(value)}"</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="json-number">${value}</span>`;
  }
  if (typeof value === 'boolean') {
    return `<span class="json-boolean">${value}</span>`;
  }
  return `<span class="json-null">${value}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderRaw(data) {
  jsonRaw.textContent = JSON.stringify(data, null, 2);
}

function switchView(view) {
  if (view === 'tree') {
    jsonTree.classList.remove('hidden');
    jsonRaw.classList.add('hidden');
    btnTree.classList.add('active');
    btnRaw.classList.remove('active');
  } else {
    jsonTree.classList.add('hidden');
    jsonRaw.classList.remove('hidden');
    btnRaw.classList.add('active');
    btnTree.classList.remove('active');
  }
}

function expandAll() {
  jsonTree.querySelectorAll('.collapsible-content').forEach(el => {
    el.classList.remove('collapsed');
  });
  jsonTree.querySelectorAll('.toggle-btn').forEach(el => {
    el.textContent = '\u25BC';
  });
  jsonTree.querySelectorAll('.collapsed-placeholder').forEach(el => {
    el.style.display = 'none';
  });
  jsonTree.querySelectorAll('.json-bracket').forEach(el => {
    if (el.nextElementSibling === null) el.parentElement.style.display = 'block';
  });
}

function collapseAll() {
  jsonTree.querySelectorAll('.collapsible-content').forEach(el => {
    el.classList.add('collapsed');
  });
  jsonTree.querySelectorAll('.toggle-btn').forEach(el => {
    el.textContent = '\u25B6';
  });
  jsonTree.querySelectorAll('.collapsed-placeholder').forEach(el => {
    el.style.display = 'inline';
  });
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  jsonTree.querySelectorAll('.highlight').forEach(el => {
    el.outerHTML = el.textContent;
  });

  if (!query) return;

  const walker = document.createTreeWalker(jsonTree, NodeFilter.SHOW_TEXT);
  const matches = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.toLowerCase().includes(query)) {
      matches.push(node);
    }
  }

  matches.forEach(node => {
    const text = node.textContent;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    const replaced = text.replace(regex, '<span class="highlight">$1</span>');
    const span = document.createElement('span');
    span.innerHTML = replaced;
    node.parentNode.replaceChild(span, node);
  });

  statusBar.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    jsonInput.value = text;
  } catch (e) {
    showError('Could not read clipboard');
  }
}

function clearAll() {
  jsonInput.value = '';
  jsonTree.innerHTML = '';
  jsonRaw.textContent = '';
  parsedData = null;
  hideError();
  statusBar.textContent = 'Ready';
}

async function copyJSON() {
  if (!parsedData) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
    statusBar.textContent = 'Copied to clipboard';
    setTimeout(() => updateStatus(parsedData), 2000);
  } catch (e) {
    showError('Could not copy to clipboard');
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function updateStatus(data) {
  const type = Array.isArray(data) ? 'Array' : 'Object';
  const count = Array.isArray(data) ? data.length : Object.keys(data).length;
  const size = new Blob([JSON.stringify(data)]).size;
  statusBar.textContent = `${type} \u00B7 ${count} items \u00B7 ${formatBytes(size)}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
