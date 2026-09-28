// Vector version of the PERP mark (traced from the original logo), so it stays
// sharp at any size. Uses currentColor; symmetric around the centre so it can spin.
const LogoMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" className={className}>
    <polygon points="50,2 62.4,14.3 50,26.6 37.6,14.3" />
    <polygon points="50,73.4 62.4,85.7 50,98 37.6,85.7" />
    <polygon points="5.6,23.3 23.3,20.1 26,37.8 8.8,40.5" />
    <polygon points="94.4,23.3 76.7,20.1 74,37.8 91.2,40.5" />
    <polygon points="5.6,76.7 23.3,79.9 26,62.2 8.8,59.5" />
    <polygon points="94.4,76.7 76.7,79.9 74,62.2 91.2,59.5" />
  </svg>
);

export default LogoMark;
