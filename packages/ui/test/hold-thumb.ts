/** A thumb's travel, held by `holdThumb`: its slide (CSS transitions) and its stretch. */
export interface HeldThumb {
  /** The slide across, once it has begun. */
  slide: () => CSSTransition | undefined;
  /** Every stretch begun since it was held. */
  stretches: Animation[];
  /** How long the slide takes outside a test, in ms. */
  duration: number;
  /** Shows the travel as it is `ms` after it began. */
  seek: (ms: number) => void;
  finish: () => void;
}

/**
 * Holds the next travel of `thumb` in its track, to be read step by step. A slow runner may draw no
 * frame for longer than a travel lasts, so nothing here waits for one: the slide is made too long
 * to outlast, and a stretch is paused as it is made.
 */
export function holdThumb(track: HTMLElement, thumb: HTMLElement): HeldThumb {
  const token = "--ow-spring-travel-duration";
  const duration = Number.parseFloat(getComputedStyle(track).getPropertyValue(token));
  track.style.setProperty(token, "1000s");
  const stretches: Animation[] = [];
  const animate = thumb.animate.bind(thumb);
  thumb.animate = (...args) => {
    const stretch = animate(...args);
    stretch.pause();
    stretches.push(stretch);
    return stretch;
  };
  const slides = () =>
    thumb
      .getAnimations()
      .filter(
        (a): a is CSSTransition =>
          a instanceof CSSTransition && ["translate", "transform"].includes(a.transitionProperty),
      );
  return {
    slide: () => slides().find((a) => a.transitionProperty === "translate"),
    stretches,
    duration,
    seek: (ms) => {
      for (const slide of slides()) {
        slide.pause();
        const end = Number(slide.effect?.getComputedTiming().endTime);
        slide.currentTime = end * Math.min(1, ms / duration);
      }
      for (const stretch of stretches) stretch.currentTime = ms;
    },
    finish: () => {
      for (const running of [...slides(), ...stretches]) running.finish();
    },
  };
}
