/**
 * Holographic foil overlay — web implementation of the pokemon-cards-css
 * technique: layered rainbow linear gradient + radial glare composited with
 * color-dodge, drifting on a slow keyframe loop. Native gets null until the
 * Phase-3 Skia port (plan decision / spec §7.2 tiering).
 */
export function HoloFoil({ intense = false }: { intense?: boolean }) {
  const opacity = intense ? 0.34 : 0.18;
  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
@keyframes sm-foil-drift {
  0% { background-position: 0% 0%, 50% 50%; }
  50% { background-position: 100% 100%, 60% 40%; }
  100% { background-position: 0% 0%, 50% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .sm-foil { animation: none !important; }
}`,
        }}
      />
      <div
        className="sm-foil"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 18,
          pointerEvents: 'none',
          opacity,
          mixBlendMode: 'color-dodge',
          backgroundImage: `
            linear-gradient(115deg,
              transparent 18%,
              rgba(0, 229, 255, 0.55) 32%,
              rgba(255, 45, 212, 0.55) 44%,
              rgba(200, 255, 0, 0.5) 56%,
              rgba(255, 200, 87, 0.5) 66%,
              transparent 82%),
            radial-gradient(circle at 55% 28%, rgba(255,255,255,0.6) 0%, transparent 42%)`,
          backgroundSize: '300% 300%, 160% 160%',
          animation: 'sm-foil-drift 7s ease-in-out infinite',
        }}
      />
    </>
  );
}
