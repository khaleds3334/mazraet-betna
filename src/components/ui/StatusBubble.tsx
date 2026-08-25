import { cn } from "@/lib/utils";

/**
 * The tone marker beside a message — good news, a warning, or something that
 * went wrong (C-15, Figma 4129:4435).
 *
 * **It is a speech balloon, not a disc.** Each of the three is its own blob with
 * its own tail, drawn at its own size — the warning is 42px where the other two
 * are 38 — so there is no circle-plus-icon that could stand in for them (Khaled,
 * 2026-08-25). The paths below are the exported vectors, copied out of the SVGs
 * rather than approximated.
 *
 * Inlined rather than shipped as three files in `/public`: the notifications
 * screen draws one per row, and a list that fetches an image per line flickers
 * its way down the page the first time it is opened. Inline they also take
 * their colours from tokens instead of the hex baked into the export — the two
 * fills per bubble are `Surface/*` behind `Icons/*`, the same pairs the toast
 * uses (see `Toast`).
 *
 * **Mirrored, because the export is** (`-scale-x-100`). Figma hands out these
 * three assets flipped from what it draws on the canvas — measured against the
 * rendered masters rather than guessed: the success tail sits at x≈11 on the
 * canvas and x≈26 in the file it exports, and the tick's long arm rises to the
 * right on the canvas and to the left in the export. One flip on the `<svg>`
 * puts the tail back under the text it belongs to and the tick back the way a
 * tick goes.
 */
const TONE = {
  success: {
    size: 38,
    bubble: "M18.9994 0C9.76541 0.000179356 2.27979 7.48576 2.27964 16.7197C2.27964 25.9538 9.76532 33.4403 18.9994 33.4404C19.1104 33.4404 19.2211 33.4392 19.3316 33.4369C20.0744 33.4214 20.8176 33.5522 21.481 33.8866L25.6265 35.9766C27.4672 36.9046 29.64 35.5667 29.64 33.5053V29.6494C29.64 29.6446 29.6353 29.6413 29.6307 29.6428C29.6233 29.6453 29.618 29.6357 29.624 29.6307C33.3463 26.5641 35.7201 21.9191 35.7201 16.7197C35.7199 7.48565 28.2335 0 18.9994 0Z",
    glyph: "M11.4916 8.99431C10.7784 9.54108 10.6423 10.5618 11.1873 11.2764L19.2739 21.8791C19.5591 22.2529 19.9912 22.4852 20.4596 22.5164C20.928 22.5476 21.387 22.3746 21.7189 22.0418L26.8516 16.8956C27.4863 16.2592 27.4863 15.2291 26.8516 14.5927C26.2144 13.9539 25.1797 13.9539 24.5426 14.5927L20.7312 18.4141L13.7794 9.29936C13.2325 8.58228 12.2072 8.44558 11.4916 8.99431Z",
    bubbleFill: "fill-success-surface",
    glyphFill: "fill-success-soft",
    evenOdd: true,
  },
  warning: {
    size: 42,
    bubble: "M20.9993 0C10.7933 0.000170089 2.51984 8.27435 2.51984 18.4805C2.5201 28.6864 10.7934 36.9598 20.9993 36.96C21.2844 36.96 21.5683 36.9522 21.8502 36.9393C21.8584 36.9389 21.861 36.9501 21.8536 36.9535C21.8479 36.956 21.8478 36.9641 21.8534 36.9668L28.8251 40.3322C31.2293 41.4928 34.0198 39.7411 34.0198 37.0715V33.2568C34.0198 32.1911 34.4612 31.1828 35.1473 30.3673C37.8503 27.1542 39.4797 23.008 39.4798 18.4805C39.4798 8.27425 31.2056 0 20.9993 0Z",
    glyph: "M21.0061 22.8174C22.1138 22.8174 23.0117 23.7148 23.0119 24.8223C23.0119 25.9299 22.1139 26.8281 21.0061 26.8281C19.8982 26.8281 19.0002 25.9299 19.0002 24.8223C19.0004 23.7148 19.8983 22.8174 21.0061 22.8174ZM21.0061 9C22.1139 9.00002 23.0118 9.89805 23.0119 11.0059V19.4736C23.0118 20.5814 22.1138 21.4795 21.0061 21.4795C19.8983 21.4795 19.0004 20.5814 19.0002 19.4736V11.0059C19.0003 9.89804 19.8982 9 21.0061 9Z",
    bubbleFill: "fill-warning-surface",
    glyphFill: "fill-warning",
    evenOdd: false,
  },
  error: {
    size: 38,
    bubble: "M18.9993 0C9.76537 0.000169177 2.27976 7.48576 2.27961 16.7197C2.27961 24.177 7.16194 30.4935 13.9043 32.6484C14.2753 32.767 14.6342 32.9234 14.9631 33.1322L21.1179 37.0388C22.6385 38.004 24.661 37.2666 25.2034 35.5491L26.4064 31.7403C26.4079 31.7356 26.4041 31.7308 26.3992 31.7311C26.3914 31.7316 26.3886 31.7211 26.3956 31.7176C31.9197 28.9883 35.72 23.2983 35.72 16.7197C35.7199 7.48565 28.2334 0 18.9993 0Z",
    glyph: "M25.4273 11.9019C26.0176 11.3116 26.0176 10.3546 25.4273 9.76438L25.1056 9.44269C24.5154 8.85244 23.5584 8.85244 22.9681 9.44269L18.435 13.9758L13.9019 9.4427C13.3116 8.85244 12.3546 8.85244 11.7644 9.44269L11.4427 9.76438C10.8524 10.3546 10.8524 11.3116 11.4427 11.9019L15.9758 16.435L11.4427 20.9681C10.8524 21.5584 10.8524 22.5154 11.4427 23.1056L11.7644 23.4273C12.3546 24.0176 13.3116 24.0176 13.9019 23.4273L18.435 18.8942L22.9681 23.4273C23.5584 24.0176 24.5154 24.0176 25.1056 23.4273L25.4273 23.1056C26.0176 22.5154 26.0176 21.5584 25.4273 20.9681L20.8942 16.435L25.4273 11.9019Z",
    bubbleFill: "fill-error-surface",
    glyphFill: "fill-error-soft",
    evenOdd: false,
  },
} as const;

export type StatusTone = keyof typeof TONE;

export function StatusBubble({
  tone,
  className,
}: {
  tone: StatusTone;
  className?: string;
}) {
  const look = TONE[tone];

  return (
    <svg
      aria-hidden
      width={look.size}
      height={look.size}
      viewBox={`0 0 ${look.size} ${look.size}`}
      fill="none"
      className={cn("shrink-0 -scale-x-100", className)}
    >
      <path d={look.bubble} className={look.bubbleFill} />
      <path
        d={look.glyph}
        className={look.glyphFill}
        fillRule={look.evenOdd ? "evenodd" : undefined}
        clipRule={look.evenOdd ? "evenodd" : undefined}
      />
    </svg>
  );
}
