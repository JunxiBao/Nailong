(() => {
  'use strict';

  const cards = [...document.querySelectorAll('[data-game]')];
  const guide = document.getElementById('play-guide');
  const status = document.getElementById('selection-status');
  const shuffleButton = document.getElementById('shuffle-game');
  const recentLink = document.getElementById('recent-game');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const recentKey = 'nailong_playground_recent_v1';
  let toastTimeout;
  let shuffleTimeout;
  let guideTrigger;
  let previousChoice = -1;

  function showRecent() {
    try {
      const lastGame = localStorage.getItem(recentKey);
      const card = cards.find((item) => item.dataset.game === lastGame);
      recentLink.hidden = !card;
      if (card) {
        recentLink.href = card.href;
        recentLink.querySelector('span').textContent = `上次的快乐：${card.dataset.name}，再玩一会儿`;
      }
    } catch {
      recentLink.hidden = true;
    }
  }

  for (const card of cards) {
    card.addEventListener('click', () => {
      try { localStorage.setItem(recentKey, card.dataset.game); } catch { /* Navigation works without storage. */ }
    });
  }
  showRecent();
  window.addEventListener('pageshow', showRecent);
  window.addEventListener('storage', (event) => { if (event.key === recentKey) showRecent(); });

  shuffleButton.addEventListener('click', () => {
    if (shuffleButton.disabled) return;
    clearTimeout(shuffleTimeout);
    clearTimeout(toastTimeout);
    shuffleButton.disabled = true;
    shuffleButton.classList.add('is-shuffling');
    shuffleButton.querySelector('span').textContent = '奶龙想一想…';
    cards.forEach((card) => card.classList.remove('is-recommended'));

    shuffleTimeout = setTimeout(() => {
      const choices = cards.map((_, index) => index).filter((index) => index !== previousChoice);
      const selectedIndex = choices[Math.floor(Math.random() * choices.length)];
      const selected = cards[selectedIndex];
      previousChoice = selectedIndex;
      selected.classList.add('is-recommended');
      selected.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
      selected.focus({ preventScroll: true });
      status.textContent = `今天就玩「${selected.dataset.name}」吧，点卡片就能出发！`;
      status.classList.add('is-visible');
      shuffleButton.disabled = false;
      shuffleButton.classList.remove('is-shuffling');
      shuffleButton.querySelector('span').textContent = '再帮我选一次';
      toastTimeout = setTimeout(() => status.classList.remove('is-visible'), 5000);
    }, reducedMotion.matches ? 0 : 480);
  });

  function closeGuide() { guide.close(); }
  document.querySelectorAll('[data-open-guide]').forEach((button) => {
    button.addEventListener('click', () => {
      guideTrigger = button;
      guide.showModal();
      document.documentElement.classList.add('has-dialog');
    });
  });
  document.getElementById('close-guide').addEventListener('click', closeGuide);
  document.getElementById('guide-ready').addEventListener('click', () => {
    closeGuide();
    document.getElementById('games').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  guide.addEventListener('click', (event) => {
    if (event.target !== guide) return;
    const bounds = guide.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeGuide();
  });
  guide.addEventListener('close', () => {
    document.documentElement.classList.remove('has-dialog');
    guideTrigger?.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || guide.open) return;
    if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
    const card = cards[Number(event.key) - 1];
    if (/^[123]$/.test(event.key) && card) {
      event.preventDefault();
      card.click();
    }
  });
})();
