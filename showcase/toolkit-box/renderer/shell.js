const nav = document.getElementById('nav');
const frame = document.getElementById('tool-frame');

nav.addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  nav.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b === btn));
  const tool = btn.dataset.tool;
  frame.src = `tools/${tool}/tool.html`;
});
