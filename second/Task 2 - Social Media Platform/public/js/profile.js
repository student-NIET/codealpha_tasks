/* ═══════════════════════════════════════════════════════════════════════════════
   profile.js — Profile page logic
   ═══════════════════════════════════════════════════════════════════════════════ */

if (!requireAuth()) { /* redirects */ }

let currentUser  = getUser();
let profileUser  = null;
let activePostId = null;
let isOwnProfile = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    currentUser = await apiFetch('/users/me');
    setAuth(getToken(), currentUser);
  } catch { handleLogout(); return; }

  renderSidebarUser();

  // Determine which profile to load
  const params  = new URLSearchParams(window.location.search);
  const userId  = params.get('id') ? parseInt(params.get('id')) : currentUser.id;
  isOwnProfile  = (userId === currentUser.id);

  await loadProfile(userId);
  await loadProfilePosts(userId);
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function renderSidebarUser() {
  const avEl     = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-username');
  const handleEl = document.getElementById('sidebar-handle');
  if (!currentUser) return;
  makeAvatar(avEl, currentUser.username, currentUser.avatar_color);
  nameEl.textContent   = currentUser.username;
  handleEl.textContent = `@${currentUser.username}`;
}

// ─── Load Profile ─────────────────────────────────────────────────────────────
async function loadProfile(userId) {
  const loadingEl = document.getElementById('profile-loading');
  const contentEl = document.getElementById('profile-content');

  try {
    profileUser = await apiFetch(`/users/${userId}`);
  } catch {
    loadingEl.innerHTML = `<div class="empty-state"><p>User not found.</p></div>`;
    return;
  }

  loadingEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  // Page title
  document.title = `@${profileUser.username} — Pulse`;
  document.getElementById('profile-page-title').textContent = `@${profileUser.username}`;

  // Banner gradient using avatar color
  document.getElementById('profile-banner').style.background =
    `linear-gradient(135deg, ${profileUser.avatar_color}55, ${profileUser.avatar_color}22)`;

  // Avatar
  const avEl = document.getElementById('profile-avatar');
  makeAvatar(avEl, profileUser.username, profileUser.avatar_color);
  avEl.style.fontSize = '2rem';

  // Username & bio
  document.getElementById('profile-username').textContent = profileUser.username;
  document.getElementById('profile-handle').textContent   = `@${profileUser.username}`;
  const bioEl = document.getElementById('profile-bio');
  bioEl.textContent = profileUser.bio || (isOwnProfile ? 'No bio yet — add one!' : '');
  bioEl.style.color = profileUser.bio ? '' : 'var(--text-muted)';

  // Stats
  document.getElementById('stat-posts').textContent     = profileUser.posts_count;
  document.getElementById('stat-followers').textContent = profileUser.followers_count;
  document.getElementById('stat-following').textContent = profileUser.following_count;

  // Action button
  const actionEl = document.getElementById('profile-action-btn');
  if (isOwnProfile) {
    actionEl.innerHTML = `<button class="btn btn-outline" onclick="openEditModal()">✏️ Edit Profile</button>`;
  } else {
    const isFollowing = profileUser.is_following;
    actionEl.innerHTML = `
      <button class="btn-follow ${isFollowing ? 'following' : ''}" id="follow-btn" onclick="toggleFollow()">
        ${isFollowing ? '✓ Following' : '+ Follow'}
      </button>`;
  }

  // Right panel info
  document.getElementById('profile-right-info').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Member since</div>
        <div style="font-size:0.875rem; font-weight:500;">${new Date(profileUser.created_at).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'})}</div>
      </div>
      <div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Posts</div>
        <div style="font-size:0.875rem; font-weight:500;">${profileUser.posts_count}</div>
      </div>
      <div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Followers</div>
        <div style="font-size:0.875rem; font-weight:500;">${profileUser.followers_count}</div>
      </div>
    </div>
  `;
}

// ─── Load Profile Posts ───────────────────────────────────────────────────────
async function loadProfilePosts(userId) {
  const container = document.getElementById('profile-posts-container');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const posts = await apiFetch(`/posts/user/${userId}`);

    if (!posts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>${isOwnProfile ? "You haven't posted yet." : "No posts yet."}</p>
          ${isOwnProfile ? '<p class="empty-hint">Go to <a href="/feed.html" style="color:var(--accent-1)">your feed</a> to share something!</p>' : ''}
        </div>`;
      return;
    }

    container.innerHTML = posts.map(p => renderProfilePost(p)).join('');
  } catch {
    container.innerHTML = `<div class="empty-state"><p>Failed to load posts.</p></div>`;
  }
}

function renderProfilePost(post) {
  const isMine = post.author?.id === currentUser.id;
  return `
    <div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <div class="avatar" style="background:${post.author?.avatar_color || '#7c3aed'};">
          ${(post.author?.username || '?')[0].toUpperCase()}
        </div>
        <div class="post-author">
          <div class="post-author-name">@${post.author?.username || 'unknown'}</div>
          <div class="post-time">${timeAgo(post.created_at)}</div>
        </div>
        ${isMine ? `<button class="btn btn-ghost btn-sm" onclick="deleteProfilePost(${post.id})" style="color:var(--text-muted);">🗑️</button>` : ''}
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="action-btn ${post.is_liked ? 'liked' : ''}" id="like-btn-${post.id}" onclick="toggleLike(${post.id}, ${post.is_liked})">
          <span class="icon">${post.is_liked ? '❤️' : '🤍'}</span>
          <span id="like-count-${post.id}">${post.likes_count}</span>
        </button>
        <button class="action-btn" onclick="openCommentsModal(${post.id})">
          <span class="icon">💬</span>
          <span id="comment-count-${post.id}">${post.comment_count}</span>
        </button>
      </div>
    </div>
  `;
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────
async function toggleFollow() {
  const btn = document.getElementById('follow-btn');
  const isFollowing = btn.classList.contains('following');

  btn.disabled = true;
  try {
    const method = isFollowing ? 'DELETE' : 'POST';
    await apiFetch(`/users/${profileUser.id}/follow`, { method });

    btn.classList.toggle('following', !isFollowing);
    btn.textContent = !isFollowing ? '✓ Following' : '+ Follow';

    // Update follower count
    const statEl = document.getElementById('stat-followers');
    const count  = parseInt(statEl.textContent) || 0;
    statEl.textContent = !isFollowing ? count + 1 : Math.max(0, count - 1);

    showToast(!isFollowing ? `Following @${profileUser.username} ✨` : `Unfollowed @${profileUser.username}`, !isFollowing ? 'success' : 'info');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ─── Delete Post ──────────────────────────────────────────────────────────────
async function deleteProfilePost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
    const el = document.getElementById(`post-${postId}`);
    if (el) { el.style.opacity = '0'; el.style.transform = 'scale(0.95)'; el.style.transition = '0.3s ease'; setTimeout(() => el.remove(), 300); }

    const statEl = document.getElementById('stat-posts');
    statEl.textContent = Math.max(0, parseInt(statEl.textContent || '0') - 1);
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

  const newLiked = !isLiked;
  btn.classList.toggle('liked', newLiked);
  btn.querySelector('.icon').textContent = newLiked ? '❤️' : '🤍';
  const current = parseInt(countEl.textContent) || 0;
  countEl.textContent = newLiked ? current + 1 : Math.max(0, current - 1);
  btn.setAttribute('onclick', `toggleLike(${postId}, ${newLiked})`);

  try {
    const data = await apiFetch(`/posts/${postId}/like`, { method: newLiked ? 'POST' : 'DELETE' });
    countEl.textContent = data.likes_count;
  } catch {
    btn.classList.toggle('liked', isLiked);
    btn.querySelector('.icon').textContent = isLiked ? '❤️' : '🤍';
    countEl.textContent = current;
    btn.setAttribute('onclick', `toggleLike(${postId}, ${isLiked})`);
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
    container.innerHTML = '<div class="empty-state" style="padding:24px"><p>No comments yet!</p></div>';
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
  const input   = document.getElementById('modal-comment-input');
  const content = input.value.trim();
  if (!content || !activePostId) return;

  try {
    const comment = await apiFetch(`/posts/${activePostId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    input.value = '';

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

    const cntEl = document.getElementById(`comment-count-${activePostId}`);
    if (cntEl) cntEl.textContent = parseInt(cntEl.textContent || '0') + 1;
    showToast('Comment posted! 💬', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeCommentsModal() {
  document.getElementById('comments-modal').classList.add('hidden');
  activePostId = null;
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function openEditModal() {
  document.getElementById('edit-bio').value = profileUser.bio || '';
  document.getElementById('edit-modal').classList.remove('hidden');
}
function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function saveProfile() {
  const bio = document.getElementById('edit-bio').value.trim();
  try {
    const updated = await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ bio })
    });
    profileUser = { ...profileUser, bio: updated.bio };
    setAuth(getToken(), { ...currentUser, bio: updated.bio });

    const bioEl = document.getElementById('profile-bio');
    bioEl.textContent = updated.bio || 'No bio yet — add one!';
    bioEl.style.color = updated.bio ? '' : 'var(--text-muted)';

    closeEditModal();
    showToast('Profile updated! ✨', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Followers / Following Modals ─────────────────────────────────────────────
async function showFollowers() {
  document.getElementById('follow-modal-title').textContent = 'Followers';
  document.getElementById('follow-modal').classList.remove('hidden');
  const listEl = document.getElementById('follow-modal-list');
  listEl.innerHTML = '<div class="spinner" style="margin:20px auto; width:28px; height:28px; border-width:2px;"></div>';
  try {
    const users = await apiFetch(`/users/${profileUser.id}/followers`);
    renderFollowList(users, listEl);
  } catch {
    listEl.innerHTML = '<p style="color:var(--text-muted); padding:10px;">Failed to load.</p>';
  }
}

async function showFollowing() {
  document.getElementById('follow-modal-title').textContent = 'Following';
  document.getElementById('follow-modal').classList.remove('hidden');
  const listEl = document.getElementById('follow-modal-list');
  listEl.innerHTML = '<div class="spinner" style="margin:20px auto; width:28px; height:28px; border-width:2px;"></div>';
  try {
    const users = await apiFetch(`/users/${profileUser.id}/following`);
    renderFollowList(users, listEl);
  } catch {
    listEl.innerHTML = '<p style="color:var(--text-muted); padding:10px;">Failed to load.</p>';
  }
}

function renderFollowList(users, container) {
  if (!users.length) {
    container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Nobody here yet.</p></div>';
    return;
  }
  container.innerHTML = users.map(u => `
    <div class="suggestion-item" style="padding:10px 0; border-bottom:1px solid var(--border);">
      <div class="suggestion-info">
        <div class="avatar avatar-sm" style="background:${u.avatar_color}; cursor:pointer;" onclick="goToProfile(${u.id}); closeFollowModal();">
          ${u.username[0].toUpperCase()}
        </div>
        <div>
          <div class="suggestion-name" style="cursor:pointer;" onclick="goToProfile(${u.id}); closeFollowModal();">@${u.username}</div>
          ${u.bio ? `<div class="suggestion-handle">${u.bio.substring(0, 50)}${u.bio.length > 50 ? '…' : ''}</div>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function closeFollowModal() {
  document.getElementById('follow-modal').classList.add('hidden');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

// Close modals on overlay click
['edit-modal', 'follow-modal', 'comments-modal'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
});
