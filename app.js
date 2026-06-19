// ── Database (localStorage) ──────────────────────────────────────────────────
const DEFAULTS = {
  users: [
    {id:'u1',username:'alice',email:'alice@demo.com',password:'alice123',joined:'2024-01-10'},
    {id:'u2',username:'bob',  email:'bob@demo.com',  password:'bob123',  joined:'2024-02-15'}
  ],
  posts: [
    {id:'p1',authorId:'u1',title:'Getting started with React Hooks',tags:['react','frontend'],
     content:'React Hooks changed how we write components forever. useState and useEffect alone cover 80% of use cases.\n\nThe mental model is simple: effects run after render, cleanup runs before the next effect or unmount. Start with small refactors and you will appreciate the patterns quickly.',
     likes:[],createdAt: new Date(Date.now()-172800000).toISOString()},
    {id:'p2',authorId:'u2',title:'Why I switched from REST to tRPC',tags:['backend','typescript'],
     content:'After two years of writing REST endpoints and their matching TypeScript interfaces, tRPC felt like magic.\n\nEnd-to-end type safety without a schema file. Procedures replace routes. The DX is unmatched for monorepos.',
     likes:['u1'],createdAt: new Date(Date.now()-86400000).toISOString()},
    {id:'p3',authorId:'u1',title:'Designing for dark mode from day one',tags:['design','css'],
     content:'Dark mode is not just an afterthought. Using CSS custom properties from the start lets you theme at the root level.\n\nDefine semantic tokens (--color-surface, --color-on-surface) rather than literal values. One media query handles everything.',
     likes:['u2'],createdAt: new Date(Date.now()-18000000).toISOString()}
  ],
  comments: [
    {id:'c1',postId:'p1',authorId:'u2',text:'Great intro! The tip about cleanup functions is what most tutorials skip.',createdAt:new Date(Date.now()-72000000).toISOString()},
    {id:'c2',postId:'p1',authorId:'u1',text:'Thanks! Cleanup is the hardest part to explain concisely.',createdAt:new Date(Date.now()-64800000).toISOString()},
    {id:'c3',postId:'p2',authorId:'u1',text:'tRPC is amazing. Router composition especially impressed me.',createdAt:new Date(Date.now()-36000000).toISOString()}
  ]
};

let DB = JSON.parse(localStorage.getItem('inkwell') || 'null') || JSON.parse(JSON.stringify(DEFAULTS));
let currentUser = null;
let editingPostId = null;

function save() { localStorage.setItem('inkwell', JSON.stringify(DB)); }
function uid()  { return '_' + Math.random().toString(36).slice(2); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}
function getUser(id) { return DB.users.find(u => u.id === id); }

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (name === 'feed')    renderFeed();
  if (name === 'profile') renderProfile();
  renderNav();
}

function renderNav() {
  const el = document.getElementById('navActions');
  if (!currentUser) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <span class="muted">Hi, <b>${esc(currentUser.username)}</b></span>
    <button class="btn sm" onclick="showPage('profile')">👤 Profile</button>
    <button class="btn sm" onclick="logout()">Sign out</button>
  `;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('loginForm').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('authAlert').innerHTML = '';
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const user = DB.users.find(x => x.username === u && x.password === p);
  if (!user) { showAlert('authAlert','error','Invalid username or password.'); return; }
  currentUser = user;
  showPage('feed');
}

function doRegister() {
  const u = document.getElementById('regUser').value.trim();
  const e = document.getElementById('regEmail').value.trim();
  const p = document.getElementById('regPass').value;
  if (!u || !e || !p)   { showAlert('authAlert','error','All fields are required.'); return; }
  if (p.length < 6)      { showAlert('authAlert','error','Password must be at least 6 characters.'); return; }
  if (DB.users.find(x => x.username === u)) { showAlert('authAlert','error','Username already taken.'); return; }
  const user = { id: uid(), username: u, email: e, password: p, joined: new Date().toISOString() };
  DB.users.push(user); save();
  currentUser = user;
  showPage('feed');
}

function logout() { currentUser = null; showPage('auth'); }

// ── Feed ──────────────────────────────────────────────────────────────────────
function renderFeed() {
  const el = document.getElementById('feedContent');
  const posts = [...DB.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!posts.length) { el.innerHTML = '<div class="empty">No posts yet. Be the first to write one!</div>'; return; }
  el.innerHTML = posts.map(p => {
    const author = getUser(p.authorId);
    const initials = author ? author.username.slice(0,2).toUpperCase() : '??';
    const commentCount = DB.comments.filter(c => c.postId === p.id).length;
    const tags = p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');
    return `<div class="card clickable" onclick="openPost('${p.id}')">
      <div class="post-title">${esc(p.title)}</div>
      <div class="post-excerpt">${esc(p.content.slice(0,160))}${p.content.length > 160 ? '…' : ''}</div>
      <div class="post-meta">
        <div class="row"><div class="avatar">${initials}</div>
          <span class="muted">${esc(author ? author.username : 'unknown')} · ${timeAgo(p.createdAt)}</span>
        </div>
        <div class="row">${tags}
          <span class="muted">❤️ ${p.likes.length}</span>
          <span class="muted">💬 ${commentCount}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Post detail ───────────────────────────────────────────────────────────────
function openPost(postId) {
  const post   = DB.posts.find(p => p.id === postId);
  if (!post) return;
  const author  = getUser(post.authorId);
  const initials = author ? author.username.slice(0,2).toUpperCase() : '??';
  const liked   = currentUser && post.likes.includes(currentUser.id);
  const isOwner = currentUser && post.authorId === currentUser.id;
  const tags    = post.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const comments = DB.comments.filter(c => c.postId === postId);

  document.getElementById('postDetail').innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem">
        <h2 style="font-size:20px;font-weight:700;flex:1;margin-right:8px">${esc(post.title)}</h2>
        ${isOwner ? `<div class="row">
          <button class="btn sm" onclick="editPost('${post.id}')">✏️ Edit</button>
          <button class="btn sm danger" onclick="deletePost('${post.id}')">🗑️</button>
        </div>` : ''}
      </div>
      <div class="row" style="margin-bottom:1rem">
        <div class="avatar">${initials}</div>
        <div><div style="font-size:13px;font-weight:600">${esc(author ? author.username : 'unknown')}</div>
          <div class="muted">${timeAgo(post.createdAt)}</div></div>
      </div>
      <div style="margin-bottom:1rem">${tags}</div>
      <p style="font-size:15px;line-height:1.8;white-space:pre-wrap">${esc(post.content)}</p>
      <div class="divider"></div>
      <div class="row">
        <button class="like-btn${liked ? ' liked' : ''}" id="likeBtn_${postId}" onclick="toggleLike('${postId}')">
          ❤️ <span id="likeCount_${postId}">${post.likes.length}</span> ${liked ? 'Liked' : 'Like'}
        </button>
        <span class="muted">💬 ${comments.length} comments</span>
      </div>
    </div>

    <div class="card">
      <h3 class="section">Comments (${comments.length})</h3>
      <div id="commentsSection">${renderComments(postId)}</div>
      <div class="divider"></div>
      ${currentUser ? `
        <div class="form-group"><label>Add a comment</label>
          <textarea id="commentInput" rows="3" placeholder="Share your thoughts…"></textarea>
        </div>
        <button class="btn primary sm" onclick="addComment('${postId}')">Post comment</button>
      ` : '<p class="muted">Sign in to leave a comment.</p>'}
    </div>
  `;
  showPage('post');
}

function renderComments(postId) {
  const comments = DB.comments
    .filter(c => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!comments.length) return '<p class="muted" style="text-align:center;padding:1rem">No comments yet.</p>';
  return comments.map(c => {
    const a = getUser(c.authorId);
    const initials = a ? a.username.slice(0,2).toUpperCase() : '??';
    const isOwner = currentUser && c.authorId === currentUser.id;
    return `<div class="comment">
      <div class="avatar">${initials}</div>
      <div class="comment-content">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="comment-name">${esc(a ? a.username : 'unknown')}</span>
          <div class="row"><span class="muted">${timeAgo(c.createdAt)}</span>
            ${isOwner ? `<button class="btn sm danger" onclick="deleteComment('${c.id}','${c.postId}')">🗑️</button>` : ''}
          </div>
        </div>
        <div class="comment-text">${esc(c.text)}</div>
      </div>
    </div>`;
  }).join('');
}

function addComment(postId) {
  const text = document.getElementById('commentInput').value.trim();
  if (!text) return;
  DB.comments.push({ id: uid(), postId, authorId: currentUser.id, text, createdAt: new Date().toISOString() });
  save();
  document.getElementById('commentInput').value = '';
  document.getElementById('commentsSection').innerHTML = renderComments(postId);
}

function deleteComment(commentId, postId) {
  if (!confirm('Delete this comment?')) return;
  const i = DB.comments.findIndex(c => c.id === commentId);
  if (i > -1) DB.comments.splice(i, 1);
  save();
  document.getElementById('commentsSection').innerHTML = renderComments(postId);
}

function toggleLike(postId) {
  if (!currentUser) return alert('Please sign in to like posts.');
  const post = DB.posts.find(p => p.id === postId);
  if (!post) return;
  const i = post.likes.indexOf(currentUser.id);
  if (i > -1) post.likes.splice(i, 1); else post.likes.push(currentUser.id);
  save();
  const liked = post.likes.includes(currentUser.id);
  const btn = document.getElementById('likeBtn_' + postId);
  btn.className = 'like-btn' + (liked ? ' liked' : '');
  btn.innerHTML = `❤️ <span id="likeCount_${postId}">${post.likes.length}</span> ${liked ? 'Liked' : 'Like'}`;
}

// ── Editor ────────────────────────────────────────────────────────────────────
function openEditor() {
  editingPostId = null;
  document.getElementById('editorHeading').textContent = 'New post';
  document.getElementById('postTitle').value   = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postTags').value    = '';
  document.getElementById('saveBtn').textContent = 'Publish';
  document.getElementById('editorAlert').innerHTML = '';
  showPage('editor');
}

function editPost(postId) {
  const post = DB.posts.find(p => p.id === postId);
  if (!post) return;
  editingPostId = postId;
  document.getElementById('editorHeading').textContent = 'Edit post';
  document.getElementById('postTitle').value   = post.title;
  document.getElementById('postContent').value = post.content;
  document.getElementById('postTags').value    = post.tags.join(', ');
  document.getElementById('saveBtn').textContent = 'Save changes';
  document.getElementById('editorAlert').innerHTML = '';
  showPage('editor');
}

function savePost() {
  const title   = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const tags    = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
  if (!title || !content) { showAlert('editorAlert','error','Title and content are required.'); return; }

  if (editingPostId) {
    const post = DB.posts.find(p => p.id === editingPostId);
    if (post) { post.title = title; post.content = content; post.tags = tags; }
    save(); openPost(editingPostId); editingPostId = null;
  } else {
    const post = { id: uid(), authorId: currentUser.id, title, tags, content, likes: [], createdAt: new Date().toISOString() };
    DB.posts.push(post); save(); openPost(post.id);
  }
}

function deletePost(postId) {
  if (!confirm('Delete this post permanently?')) return;
  DB.posts = DB.posts.filter(p => p.id !== postId);
  DB.comments = DB.comments.filter(c => c.postId !== postId);
  save(); showPage('feed');
}

// ── Profile ───────────────────────────────────────────────────────────────────
function renderProfile() {
  if (!currentUser) return;
  const myPosts    = DB.posts.filter(p => p.authorId === currentUser.id);
  const totalLikes = myPosts.reduce((s, p) => s + p.likes.length, 0);
  const myComments = DB.comments.filter(c => c.authorId === currentUser.id).length;

  document.getElementById('profileContent').innerHTML = `
    <div class="card">
      <div class="row" style="margin-bottom:1rem">
        <div class="avatar lg">${currentUser.username.slice(0,2).toUpperCase()}</div>
        <div><div style="font-size:16px;font-weight:700">${esc(currentUser.username)}</div>
          <div class="muted">${esc(currentUser.email)}</div></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Posts written</div><div class="stat-value">${myPosts.length}</div></div>
        <div class="stat-card"><div class="stat-label">Likes received</div><div class="stat-value">${totalLikes}</div></div>
        <div class="stat-card"><div class="stat-label">Comments made</div><div class="stat-value">${myComments}</div></div>
        <div class="stat-card"><div class="stat-label">Member since</div>
          <div class="stat-value" style="font-size:15px">${new Date(currentUser.joined).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>
        </div>
      </div>
    </div>
    <h3 class="section">My posts</h3>
    ${myPosts.length ? myPosts.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(p => `
      <div class="card clickable" onclick="openPost('${p.id}')">
        <div class="post-title">${esc(p.title)}</div>
        <div class="muted">${timeAgo(p.createdAt)} · ❤️ ${p.likes.length} · 💬 ${DB.comments.filter(c=>c.postId===p.id).length}</div>
      </div>
    `).join('') : '<p class="muted">No posts yet.</p>'}
  `;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showAlert(containerId, type, msg) {
  document.getElementById(containerId).innerHTML = `<div class="alert ${type}">${msg}</div>`;
}

// ── Boot ──────────────────────────────────────────────────────────────────────
showPage('auth');
