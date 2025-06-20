export function setupPlyr() {
  const opts = {
    controls: [
      'play-large',
      'restart',
      'rewind',
      'play',
      'fast-forward',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'captions',
      'settings',
      'pip',
      'airplay',
      'download',
      'fullscreen',
    ],
    settings: ['captions', 'quality', 'speed'],
    tooltips: { controls: true, seek: true },
    clickToPlay: true,
    autoplay: false,
    muted: false,
    loop: { active: false },
  };

  document.querySelectorAll('.js-player').forEach((el) => {
    if (!el.plyr) {
      el.plyr = new Plyr(el, opts);
    }
  });
}
