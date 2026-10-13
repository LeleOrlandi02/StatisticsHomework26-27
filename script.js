/**
 * Statistics Homework Portfolio 2026/2027
 * Interactive script: Theme toggle, live search, and category filters.
 * Author: Emanuele Orlandi (ID: 2021953)
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initFiltersAndSearch();
  updateProgressStats();
});

/**
 * Handles Dark / Light theme toggle with localStorage persistence
 */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

/**
 * Handles Category Filtering (All, Completed, Upcoming) and Live Search
 */
function initFiltersAndSearch() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchHw');
  const cards = document.querySelectorAll('.hw-card');
  const emptyState = document.getElementById('emptyState');

  let activeFilter = 'all';
  let searchTerm = '';

  function applyFilters() {
    let visibleCount = 0;

    cards.forEach(card => {
      const isCompleted = card.classList.contains('completed');
      const cardStatus = isCompleted ? 'completed' : 'upcoming';
      
      const title = card.querySelector('.hw-card-title')?.textContent.toLowerCase() || '';
      const subtitle = card.querySelector('.hw-card-subtitle')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.hw-card-desc')?.textContent.toLowerCase() || '';
      const tags = Array.from(card.querySelectorAll('.hw-tag')).map(t => t.textContent.toLowerCase()).join(' ');

      const matchesFilter = (activeFilter === 'all') || (activeFilter === cardStatus);
      const matchesSearch = !searchTerm || 
        title.includes(searchTerm) || 
        subtitle.includes(searchTerm) || 
        desc.includes(searchTerm) || 
        tags.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.add('visible');
      } else {
        emptyState.classList.remove('visible');
      }
    }
  }

  // Filter tab buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  // Search input with debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }
}

/**
 * Dynamically counts homeworks and updates progress metrics
 */
function updateProgressStats() {
  const totalCards = document.querySelectorAll('.hw-card').length;
  const completedCards = document.querySelectorAll('.hw-card.completed').length;
  const pendingCards = totalCards - completedCards;
  const percentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // Update DOM elements if present
  const statCompleted = document.getElementById('statCompleted');
  const statPending = document.getElementById('statPending');
  const statTotal = document.getElementById('statTotal');
  const statPercent = document.getElementById('statPercent');
  const progressFill = document.getElementById('progressFill');

  if (statCompleted) statCompleted.textContent = completedCards;
  if (statPending) statPending.textContent = pendingCards;
  if (statTotal) statTotal.textContent = totalCards;
  if (statPercent) statPercent.textContent = `${percentage}%`;
  if (progressFill) progressFill.style.width = `${percentage}%`;

  // Update filter pill counts
  const countAll = document.getElementById('countAll');
  const countCompleted = document.getElementById('countCompleted');
  const countUpcoming = document.getElementById('countUpcoming');

  if (countAll) countAll.textContent = totalCards;
  if (countCompleted) countCompleted.textContent = completedCards;
  if (countUpcoming) countUpcoming.textContent = pendingCards;
}
