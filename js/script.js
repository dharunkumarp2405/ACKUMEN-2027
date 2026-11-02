// Mobile navigation
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(opened));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
}

// Populate event options based on selected category.
const categorySelect = document.getElementById('category');
const eventSelect = document.getElementById('event_name');
const eventOptions = {
  'Technical': ['Paper Presentation', 'Project Presentation', 'Technical Quiz', 'Coding Challenge', 'Debugging', 'Web Design Challenge'],
  'Non-Technical': ['Connections', 'Treasure Hunt', 'Photography', 'Meme Creation', 'Cinema Quiz', 'Fun Games']
};
if (categorySelect && eventSelect) {
  categorySelect.addEventListener('change', () => {
    eventSelect.innerHTML = '<option value="">Choose an event</option>';
    (eventOptions[categorySelect.value] || []).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      eventSelect.appendChild(option);
    });
  });
}

// Subtle reveal effect
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealItems.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealItems.forEach(item => observer.observe(item));
}
