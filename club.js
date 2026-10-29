(() => {
  'use strict';

  const find = selector => document.querySelector(selector);
  const cards = [...document.querySelectorAll('[data-game]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const player = find('#player');
  const frame = find('#game-frame');
  const status = find('#player-status');
  const languageButton = find('#language');
  let activeFilter = 'all';
  let activeCard = null;
  let lastTrigger = null;
  let language = navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';

  try {
    const saved = localStorage.getItem('mcc-hub-language');
    if (saved === 'zh' || saved === 'en') language = saved;
  } catch {
    // The catalogue remains usable when browser storage is unavailable.
  }

  function updateCount() {
    const count = cards.filter(card => !card.hidden).length;
    find('#collection-count').textContent = language === 'en'
      ? `${count} GAMES TO EXPLORE`
      : `${count} 款小游戏`;
  }

  function renderLanguage() {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-en][data-zh]').forEach(element => {
      element.textContent = element.dataset[language];
    });
    languageButton.textContent = language === 'en' ? '中文' : 'EN';
    languageButton.setAttribute('aria-label', language === 'en' ? 'Switch to Simplified Chinese' : '切换到英语');
    find('#collection-filters').setAttribute('aria-label', language === 'en' ? 'Filter the game collection' : '筛选游戏');
    find('#close-player').setAttribute('aria-label', language === 'en' ? 'Back to collection' : '返回游戏合集');
    if (activeCard) {
      const title = activeCard.dataset[language === 'en' ? 'titleEn' : 'titleZh'];
      find('#player-name').textContent = title;
      frame.title = title;
    }
    updateCount();
  }

  function applyFilter(value) {
    if (!['all', 'original', 'new'].includes(value)) return;
    activeFilter = value;
    cards.forEach(card => {
      card.hidden = activeFilter !== 'all' && card.dataset.batch !== activeFilter;
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    updateCount();
  }

  languageButton.addEventListener('click', () => {
    language = language === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('mcc-hub-language', language); } catch {}
    renderLanguage();
  });
  filters.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));

  find('#grid').addEventListener('click', event => {
    const card = event.target.closest('[data-game]');
    // A real href keeps keyboard activation, modified clicks and no-JS navigation intact.
    if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof player.showModal !== 'function') return;
    const title = card.dataset[language === 'en' ? 'titleEn' : 'titleZh'];
    find('#player-name').textContent = title;
    find('#standalone').href = card.href;
    frame.title = title;
    status.hidden = false;
    try { player.showModal(); } catch { return; }
    event.preventDefault();
    activeCard = card;
    lastTrigger = card;
    const url = new URL(card.href);
    if (card.dataset.embed === '1') url.searchParams.set('embed', '1');
    frame.src = url.href;
    document.body.classList.add('playing');
    find('#close-player').focus();
  });

  frame.addEventListener('load', () => {
    if (activeCard) status.hidden = true;
  });
  find('#close-player').addEventListener('click', () => player.close());
  player.addEventListener('close', () => {
    activeCard = null;
    frame.removeAttribute('src');
    status.hidden = false;
    document.body.classList.remove('playing');
    if (lastTrigger?.isConnected && !lastTrigger.hidden) lastTrigger.focus({preventScroll: true});
  });

  if (typeof player.showModal === 'function') cards.forEach(card => card.setAttribute('aria-haspopup', 'dialog'));
  languageButton.hidden = false;
  find('#collection-filters').hidden = false;
  applyFilter('all');
  renderLanguage();
})();
