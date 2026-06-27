/* ═══════════════════════════════════════════════════════════════════════════════
   feed.js — Main feed page logic
   ═══════════════════════════════════════════════════════════════════════════════ */

if (!requireAuth()) { /* redirects to / */ }

let currentTab     = 'feed';
let currentUser    = getUser();
let activePostId   = null;   // for comments modal
let searchTimeout  = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Refresh user from server
  try {
    currentUser = await apiFetch('/users/me');
    setAuth(getToken(), currentUser);
  } catch { handleLogout(); return; }

  renderSidebarUser();
  await loadPosts();
  await loadSuggestions();
});

// ─── Sidebar User ─────────────────────────────────────────────────────────────
function renderSidebarUser() {
  const avEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-username');
  const handleEl = document.getElementById('sidebar-handle');
  if (!currentUser) return;
  makeAvatar(avEl, currentUser.username, currentUser.avatar_color);
  nameEl.textContent = currentUser.username;
  handleEl.textContent = `@${currentUser.username}`;

  const composeAv = document.getElementById('compose-avatar');
  if (composeAv) makeAvatar(composeAv, currentUser.username, currentUser.avatar_color);
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function setTab(tab) {
  currentTab = tab;
  document.getElementById('nav-feed').classList.toggle('active', tab === 'feed');
  document.getElementById('nav-explore').classList.toggle('active', tab === 'explore');
  document.getElementById('tab-feed').classList.toggle('active', tab === 'feed');
  document.getElementById('tab-explore').classList.toggle('active', tab === 'explore');
  document.getElementById('feed-title').textContent = tab === 'feed' ? 'Home' : 'Explore';
  document.getElementById('compose-section').style.display = tab === 'feed' ? '' : 'none';
  loadPosts();
}

// ─── Load Posts ───────────────────────────────────────────────────────────────
async function loadPosts() {
  const container = document.getElementById('posts-container');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const endpoint = currentTab === 'feed' ? '/posts/feed' : '/posts/explore';
    const posts = await apiFetch(endpoint);

    if (!posts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${currentTab === 'feed' ? '📡' : '🌐'}</div>
          <p>${currentTab === 'feed' ? "Your feed is empty!" : "No posts yet."}</p>
          <p class="empty-hint">${currentTab === 'feed' ? "Follow people or switch to Explore." : "Be the first to post something!"}</p>
        </div>`;
      return;
    }

    container.innerHTML = posts.map(renderPostCard).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Failed to load posts.</p></div>`;
    showToast(err.message, 'error');
  }
}

// ─── Render Post Card ─────────────────────────────────────────────────────────
function renderPostCard(post) {
  const isMine = post.author && post.author.id === currentUser.id;
  const likedClass = post.is_liked ? 'liked' : '';
  const heart = post.is_liked ? '❤️' : '🤍';

  return `
    <div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <div class="avatar" style="background:${post.author?.avatar_color || '#7c3aed'}; cursor:pointer;"
             onclick="goToProfile(${post.author?.id})">${(post.author?.username || '?')[0].toUpperCase()}</div>
        <div class="post-author">
          <div class="post-author-name" onclick="goToProfile(${post.author?.id})">@${post.author?.username || 'unknown'}</div>
          <div class="post-time">${timeAgo(post.created_at)}</div>
        </div>
        ${isMine ? `<button class="btn btn-ghost btn-sm" onclick="deletePost(${post.id})" title="Delete post" style="color:var(--text-muted); font-size:0.9rem;">🗑️</button>` : ''}
      </div>

      <div class="post-content">${escapeHtml(post.content)}</div>

      <div class="post-actions">
        <button class="action-btn ${likedClass}" id="like-btn-${post.id}" onclick="toggleLike(${post.id}, ${post.is_liked})">
          <span class="icon">${heart}</span>
          <span id="like-count-${post.id}">${post.likes_count}</span>
        </button>
        <button class="action-btn" onclick="openCommentsModal(${post.id})">
          <span class="icon">💬</span>
          <span id="comment-count-${post.id}">${post.comment_count}</span>
        </button>
        ${!isMine && post.author ? `
        <button class="action-btn" onclick="quickFollow(${post.author.id})" id="qf-${post.author.id}" title="Follow @${post.author.username}">
          <span class="icon">➕</span>
          <span>Follow</span>
        </button>` : ''}
      </div>
    </div>
  `;
}

// ─── Create Post ──────────────────────────────────────────────────────────────
async function createPost() {
  const textarea = document.getElementById('compose-text');
  const btn = document.getElementById('post-btn');
  const content = textarea.value.trim();

  if (!content) { showToast('Write something first!', 'error'); return; }

  btn.disabled = true;
  btn.textContent = 'Posting…';

  try {
    const post = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ content })
    });

    textarea.value = '';
    updateCharCount();
    showToast('Post shared! ⚡', 'success');

    // Prepend new post
    const container = document.getElementById('posts-container');
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) container.innerHTML = '';

    const div = document.createElement('div');
    div.innerHTML = renderPostCard(post);
    container.insertBefore(div.firstElementChild, container.firstChild);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '⚡ Post';
  }
}

// ─── Delete Post ──────────────────────────────────────────────────────────────
async function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
    const el = document.getElementById(`post-${postId}`);
    if (el) { el.style.opacity = '0'; el.style.transform = 'scale(0.95)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }
    showToast('Post deleted.', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Like / Unlike ────────────────────────────────────────────────────────────
async function toggleLike(postId, isLiked) {
  const btn = document.getElementById(`like-btn-${postId}`);
  const countEl = document.getElementById(`like-count-${postId}`);
  if (!btn || !countEl) return;

  // Optimistic UI
  const newLiked = !isLiked;
  btn.classList.toggle('liked', newLiked);
  btn.querySelector('.icon').textContent = newLiked ? '❤️' : '🤍';
  const currentCount = parseInt(countEl.textContent) || 0;
  countEl.textContent = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

  // Update onclick
  btn.setAttribute('onclick', `toggleLike(${postId}, ${newLiked})`);

  try {
    const method = newLiked ? 'POST' : 'DELETE';
    const data = await apiFetch(`/posts/${postId}/like`, { method });
    countEl.textContent = data.likes_count;
  } catch (err) {
    // Revert
    btn.classList.toggle('liked', isLiked);
    btn.querySelector('.icon').textContent = isLiked ? '❤️' : '🤍';
    countEl.textContent = currentCount;
    btn.setAttribute('onclick', `toggleLike(${postId}, ${isLiked})`);
    showToast(err.message, 'error');
  }
}

// ─── Quick Follow ─────────────────────────────────────────────────────────────
async function quickFollow(userId) {
  try {
    await apiFetch(`/users/${userId}/follow`, { method: 'POST' });
    const btn = document.getElementById(`qf-${userId}`);
    if (btn) btn.remove();
    showToast('Followed! ✨', 'success');
  } catch (err) {
    showToast(err.message === 'Already following' ? 'Already following!' : err.message, 'info');
  }
}

// ─── Comments Modal ───────────────────────────────────────────────────────────
async function openCommentsModal(postId) {
  activePostId = postId;
  const modal = document.getElementById('comments-modal');
  const listEl = document.getElementById('modal-comments-list');
  const avEl   = document.getElementById('modal-compose-avatar');

  modal.classList.remove('hidden');
  listEl.innerHTML = '<div class="spinner" style="margin:20px auto; width:28px; height:28px; border-width:2px;"></div>';

  makeAvatar(avEl, currentUser.username, currentUser.avatar_color);

  try {
    const comments = await apiFetch(`/posts/${postId}/comments`);
    renderModalComments(comments, listEl);
  } catch {
    listEl.innerHTML = '<p style="color:var(--text-muted); padding:10px;">Failed to load comments.</p>';
  }
}

function renderModalComments(comments, container) {
  if (!comments.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><p>No comments yet. Be the first!</p></div>';
    return;
  }
  container.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="avatar avatar-sm" style="background:${c.author?.avatar_color || '#7c3aed'}; cursor:pointer;" onclick="goToProfile(${c.author?.id})">
        ${(c.author?.username || '?')[0].toUpperCase()}
      </div>
      <div class="comment-body">
        <div class="comment-author" style="cursor:pointer;" onclick="goToProfile(${c.author?.id})">@${c.author?.username || 'unknown'}</div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
        <div class="comment-time">${timeAgo(c.created_at)}</div>
      </div>
    </div>
  `).join('');
}

async function submitModalComment() {
  const input = document.getElementById('modal-comment-input');
  const content = input.value.trim();
  if (!content || !activePostId) return;

  try {
    const comment = await apiFetch(`/posts/${activePostId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    input.value = '';

    // Add to list
    const listEl = document.getElementById('modal-comments-list');
    const empty = listEl.querySelector('.empty-state');
    if (empty) listEl.innerHTML = '';

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="comment-item">
        <div class="avatar avatar-sm" style="background:${comment.author?.avatar_color || '#7c3aed'};">
          ${(comment.author?.username || '?')[0].toUpperCase()}
        </div>
        <div class="comment-body">
          <div class="comment-author">@${comment.author?.username || 'you'}</div>
          <div class="comment-text">${escapeHtml(comment.content)}</div>
          <div class="comment-time">just now</div>
        </div>
      </div>`;
    listEl.appendChild(div.firstElementChild);

    // Update comment count on feed card
    const countEl = document.getElementById(`comment-count-${activePostId}`);
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;

    showToast('Comment posted! 💬', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeCommentsModal() {
  document.getElementById('comments-modal').classList.add('hidden');
  activePostId = null;
}

// ─── Suggestions ─────────────────────────────────────────────────────────────
async function loadSuggestions() {
  const listEl = document.getElementById('suggestions-list');
  try {
    const users = await apiFetch('/posts/explore');
    // Get unique authors excluding self
    const seen = new Set([currentUser.id]);
    const suggestions = [];
    for (const p of users) {
      if (p.author && !seen.has(p.author.id)) {
        seen.add(p.author.id);
        suggestions.push(p.author);
        if (suggestions.length >= 5) break;
      }
    }

    if (!suggestions.length) {
      listEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No suggestions yet.</p>';
      return;
    }

    listEl.innerHTML = suggestions.map(u => `
      <div class="suggestion-item">
        <div class="suggestion-info">
          <div class="avatar avatar-sm" style="background:${u.avatar_color}; cursor:pointer;" onclick="goToProfile(${u.id})">
            ${u.username[0].toUpperCase()}
          </div>
          <div>
            <div class="suggestion-name" onclick="goToProfile(${u.id})">@${u.username}</div>
          </div>
        </div>
        <button class="btn-follow" id="sug-follow-${u.id}" onclick="sugFollow(${u.id})">Follow</button>
      </div>
    `).join('');
  } catch {
    listEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Could not load suggestions.</p>';
  }
}

async function sugFollow(userId) {
  try {
    await apiFetch(`/users/${userId}/follow`, { method: 'POST' });
    const btn = document.getElementById(`sug-follow-${userId}`);
    if (btn) { btn.textContent = 'Following'; btn.classList.add('following'); btn.onclick = null; }
    showToast('Followed! ✨', 'success');
  } catch (err) {
    showToast(err.message === 'Already following' ? 'Already following!' : err.message, 'info');
  }
}

// ─── User Search ──────────────────────────────────────────────────────────────
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(doSearch, 350);
}

async function doSearch() {
  const q = document.getElementById('user-search').value.trim();
  const resultsEl = document.getElementById('search-results');

  if (!q) { resultsEl.innerHTML = ''; return; }

  try {
    const users = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
    if (!users.length) {
      resultsEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem; padding:6px 0;">No users found.</p>';
      return;
    }
    resultsEl.innerHTML = users.map(u => `
      <div class="suggestion-item">
        <div class="suggestion-info">
          <div class="avatar avatar-sm" style="background:${u.avatar_color}; cursor:pointer;" onclick="goToProfile(${u.id})">
            ${u.username[0].toUpperCase()}
          </div>
          <div>
            <div class="suggestion-name" onclick="goToProfile(${u.id})">@${u.username}</div>
            <div class="suggestion-handle">${u.posts_count} post${u.posts_count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <button class="btn-follow btn-sm" onclick="goToProfile(${u.id})">View</button>
      </div>
    `).join('');
  } catch {
    resultsEl.innerHTML = '';
  }
}

// ─── Char Count ───────────────────────────────────────────────────────────────
function updateCharCount() {
  const textarea = document.getElementById('compose-text');
  const countEl  = document.getElementById('char-count');
  if (!textarea || !countEl) return;
  const remaining = 500 - textarea.value.length;
  countEl.textContent = remaining;
  countEl.className = 'char-count' + (remaining < 50 ? (remaining < 20 ? ' danger' : ' warning') : '');
}

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// Close modal when clicking overlay
document.getElementById('comments-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeCommentsModal();
});
