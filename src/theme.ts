// Design tokens — lifted verbatim from the Direction D prototype (pm-app.jsx).
// Dark, minimalist, one cool accent. `--acc*` vars are set on :root in index.css.
export const T = {
  bg: '#0c0c0e',
  surf: '#15151a',
  surf2: '#1c1c22',
  line: 'rgba(255,255,255,.08)',
  lineSoft: 'rgba(255,255,255,.055)',
  ink: '#f4f4f5',
  mut: 'rgba(244,244,245,.52)',
  faint: 'rgba(244,244,245,.3)',
  acc: 'var(--acc)',
  accDim: 'var(--acc-dim)',
  accInk: 'var(--acc-ink)',
  prio: '#f5544b',
  prioDim: 'rgba(245,84,75,.14)',
  font: '"Space Grotesk", system-ui, sans-serif',
} as const;
