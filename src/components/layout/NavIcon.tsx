/**
 * Bottom-nav icons, exported from Figma (section 3966:1415) as the exact design
 * shapes — the free Hugeicons pack is stroke-only and has no filled variants.
 *
 * Every tab is the same color; only the glyph changes between states, so each
 * icon below is written as two variants and picked by `active`. Color always
 * comes from `currentColor`, except the details that knock out of a filled
 * glyph — those are painted in the white surface color of the nav.
 *
 * `home` is a solid shape drawn with `fill`; `order` and `track` are drawn with
 * strokes and switch state by filling their silhouette. That difference comes
 * from the design, not from us.
 */
type NavIconName = "home" | "order" | "track";

/**
 * One stroke weight for the whole bar. `home` is a solid shape whose outline is
 * baked at 2.5px, so the two stroked icons match it rather than the other way
 * round — Figma exported the empty basket at 3 and the order icon at 2, which
 * read as three different weights sitting next to each other.
 */
const STROKE = 2.5;

/** Figma centres the basket art in a box 1px smaller than the 28px frame. */
const BASKET_OFFSET = 0.5;

function HomeGlyph({ active }: { active: boolean }) {
  return (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      d={
        active
          ? "M12.186 2.53C12.7078 2.13388 13.3449 1.91944 14 1.91944C14.6551 1.91944 15.2922 2.13388 15.814 2.53L17.134 3.532C21.0117 6.47785 24.3336 10.091 26.944 14.202L27.368 14.868C27.56 15.1704 27.6672 15.5188 27.6786 15.8768C27.6899 16.2348 27.6049 16.5892 27.4324 16.9031C27.2599 17.217 27.0063 17.4789 26.698 17.6613C26.3898 17.8437 26.0382 17.9399 25.68 17.94H24.298C24.378 19.78 24.278 21.622 23.998 23.444C23.8632 24.321 23.4187 25.1207 22.7451 25.6981C22.0715 26.2756 21.2133 26.5927 20.326 26.592H16.5V20C16.5 19.337 16.2366 18.7011 15.7678 18.2322C15.2989 17.7634 14.663 17.5 14 17.5C13.337 17.5 12.7011 17.7634 12.2322 18.2322C11.7634 18.7011 11.5 19.337 11.5 20V26.592H7.674C6.78752 26.5906 5.93067 26.2727 5.2578 25.6956C4.58494 25.1184 4.14031 24.3199 4.004 23.444C3.724 21.622 3.624 19.778 3.704 17.94H2.32C1.96182 17.9399 1.61024 17.8437 1.30198 17.6613C0.993726 17.4789 0.740105 17.217 0.567619 16.9031C0.395133 16.5892 0.310111 16.2348 0.321436 15.8768C0.332761 15.5188 0.440018 15.1704 0.632 14.868L1.054 14.2C3.66517 10.0895 6.98775 6.47708 10.866 3.532L12.186 2.53Z"
          : "M12.0803 2.586C12.6481 2.20381 13.3169 1.99966 14.0013 1.99966C14.6858 1.99966 15.3546 2.20381 15.9223 2.586L17.2503 3.494C21.1167 6.11964 24.4823 9.41551 27.1883 13.226L27.6143 13.83C28.1343 14.57 28.0983 15.458 27.6903 16.124C27.4851 16.4547 27.1979 16.7268 26.8566 16.9139C26.5154 17.101 26.1315 17.1968 25.7423 17.192H24.6083C24.6683 19.048 24.5623 21.276 24.2883 22.878C23.9663 24.768 22.2203 26 20.3603 26H7.64035C5.78035 26 4.03435 24.768 3.71235 22.88C3.43835 21.276 3.33235 19.048 3.39235 17.192H2.25635C1.43435 17.192 0.706348 16.774 0.308348 16.124C0.0938696 15.7764 -0.0129775 15.3731 0.00125798 14.9649C0.0154935 14.5567 0.150175 14.1618 0.388348 13.83L0.812348 13.226C3.51898 9.41534 6.88531 6.11945 10.7523 3.494L12.0803 2.586ZM14.5103 4.65C14.3584 4.55184 14.1813 4.49962 14.0003 4.49962C13.8194 4.49962 13.6423 4.55184 13.4903 4.65L12.1623 5.558C8.54343 8.01729 5.3921 11.1022 2.85635 14.668L2.83835 14.692H4.71835C4.89186 14.6921 5.06344 14.7284 5.22218 14.7985C5.38091 14.8685 5.52332 14.9709 5.64034 15.099C5.75735 15.2271 5.84641 15.3782 5.90185 15.5426C5.95729 15.707 5.97789 15.8812 5.96235 16.054C5.79635 17.876 5.87035 20.674 6.17635 22.458C6.26235 22.964 6.80635 23.5 7.64035 23.5H10.1643V18.67C10.1527 18.159 10.2432 17.6508 10.4307 17.1753C10.6182 16.6999 10.8988 16.2666 11.2561 15.9011C11.6134 15.5356 12.0401 15.2451 12.5112 15.0469C12.9823 14.8486 13.4882 14.7464 13.9993 14.7464C14.5105 14.7464 15.0164 14.8486 15.4875 15.0469C15.9586 15.2451 16.3853 15.5356 16.7426 15.9011C17.0999 16.2666 17.3805 16.6999 17.568 17.1753C17.7555 17.6508 17.846 18.159 17.8343 18.67V23.5H20.3603C21.1943 23.5 21.7383 22.964 21.8243 22.458C22.1303 20.674 22.2043 17.878 22.0383 16.054C22.0228 15.8812 22.0434 15.707 22.0988 15.5426C22.1543 15.3782 22.2433 15.2271 22.3604 15.099C22.4774 14.9709 22.6198 14.8685 22.7785 14.7985C22.9373 14.7284 23.1088 14.6921 23.2823 14.692H25.1623L25.1443 14.668C22.6092 11.1024 19.4585 8.01747 15.8403 5.558L14.5103 4.65Z"
      }
    />
  );
}

function OrderGlyph({ active }: { active: boolean }) {
  return (
    <g strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M2.91667 14.0001C2.91667 8.77533 2.91667 6.16296 4.53978 4.53985C6.1629 2.91673 8.77527 2.91673 14 2.91673C19.2247 2.91673 21.8371 2.91673 23.4603 4.53985C25.0833 6.16296 25.0833 8.77533 25.0833 14.0001C25.0833 19.2248 25.0833 21.8372 23.4603 23.4603C21.8371 25.0835 19.2247 25.0835 14 25.0835C8.77527 25.0835 6.1629 25.0835 4.53978 23.4603C2.91667 21.8372 2.91667 19.2248 2.91667 14.0001Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
      />
      <path
        d="M14 9.33339V18.6668M18.6667 14.0001H9.33333"
        stroke={active ? "var(--color-white)" : "currentColor"}
      />
    </g>
  );
}

/**
 * The basket. Both states are the exact same geometry — Figma exported them at
 * different stroke weights, which shifted every coordinate by a quarter pixel,
 * but once both are drawn at 2.5 they land on top of each other. So there is one
 * set of paths here, and `active` only decides what gets filled.
 */
function TrackGlyph({ active }: { active: boolean }) {
  return (
    <g
      transform={`translate(${BASKET_OFFSET} ${BASKET_OFFSET})`}
      strokeWidth={STROKE}
      stroke="currentColor"
      fill="none"
    >
      {/* the basket body — filled only when the tab is active */}
      <path
        d="M2.45679 19.5637L2.45605 19.5608C1.28871 14.8914 0.705293 12.5577 1.9314 10.9873C3.15776 9.41661 5.56556 9.41661 10.3798 9.41661H16.6818C21.4974 9.41661 23.9038 9.41661 25.1302 10.9873C26.3565 12.5581 25.7726 14.8937 24.6048 19.5637C23.8606 22.539 23.4899 24.0212 22.3835 24.8857C21.2755 25.75 19.7443 25.75 16.6818 25.75H10.3798C7.31731 25.75 5.78606 25.75 4.67812 24.8857C3.57017 24.02 3.19859 22.535 2.45679 19.5637Z"
        fill={active ? "currentColor" : "none"}
      />
      {/* the two straps running up to the handle */}
      <path d="M23.7387 10.0972L22.7724 6.55149C22.3994 5.18356 22.2129 4.50028 21.8305 3.98442C21.4491 3.47191 20.9312 3.07711 20.336 2.84517C19.7371 2.61106 19.0293 2.61106 17.6137 2.61106M3.32208 10.0972L4.28846 6.55149C4.66141 5.18356 4.84788 4.50028 5.23035 3.98442C5.61171 3.47191 6.12962 3.07711 6.72485 2.84517C7.32374 2.61106 8.03152 2.61106 9.44708 2.61106" />
      {/* the handle */}
      <path d="M9.44708 2.61112C9.44708 2.25013 9.59048 1.90392 9.84574 1.64866C10.101 1.3934 10.4472 1.25 10.8082 1.25H16.2526C16.6136 1.25 16.9598 1.3934 17.2151 1.64866C17.4703 1.90392 17.6137 2.25013 17.6137 2.61112C17.6137 2.97211 17.4703 3.31831 17.2151 3.57357C16.9598 3.82883 16.6136 3.97223 16.2526 3.97223H10.8082C10.4472 3.97223 10.101 3.82883 9.84574 3.57357C9.59048 3.31831 9.44708 2.97211 9.44708 2.61112Z" />
      {/* the three ribs — they knock out of the filled basket */}
      <path
        d="M8.08641 14.8611V20.3055M18.9753 14.8611V20.3055M13.5309 14.8611V20.3055"
        stroke={active ? "var(--color-white)" : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const GLYPHS = {
  home: HomeGlyph,
  order: OrderGlyph,
  track: TrackGlyph,
} as const;

export function NavIcon({
  name,
  active = false,
  size = 28,
}: {
  name: NavIconName;
  active?: boolean;
  size?: number;
}) {
  const Glyph = GLYPHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <Glyph active={active} />
    </svg>
  );
}
