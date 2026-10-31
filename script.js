const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#primary-navigation');
const header = document.querySelector('.site-header');

if (menuButton && navigation && header) {
  const desktop = window.matchMedia('(min-width: 761px)');
  const menuLabel = menuButton.querySelector('.menu-label');

  function setMenu(open) {
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Close' : 'Menu';
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
    setMenu(false);
    menuButton.focus();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });
}
