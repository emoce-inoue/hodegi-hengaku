(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  const switchViewport = () => {
    const value = window.outerWidth > 360 ? 'width=device-width,initial-scale=1' : 'width=360';
    if (viewport.getAttribute('content') !== value) {
      viewport.setAttribute('content', value);
    }
  };
  window.addEventListener('resize', switchViewport);
  switchViewport();
})();

document.addEventListener('DOMContentLoaded', () => {
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
      }
    });
  };
  const defaultObserverOptions = {
    threshold: 0.1,
  };
  const defaultObserver = new IntersectionObserver(observerCallback, defaultObserverOptions);
  const targetElements = document.querySelectorAll('.js-fade, .js-fadeup, .js-fadein');
  targetElements.forEach((target) => {
    defaultObserver.observe(target);
  });

  const anchorLink = document.querySelector('.js-anchor-link');
  if (anchorLink) {
    const anchorLinkHeight = anchorLink.offsetHeight;
    const links = document.querySelectorAll('.js-scroll-link');
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        if (targetId === '') {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
          return;
        }
        const targetElement = document.getElementById(targetId);
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - anchorLinkHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      });
    });
  }
});
