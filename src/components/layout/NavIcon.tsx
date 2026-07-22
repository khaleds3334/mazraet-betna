/**
 * Bottom-nav icons, exported from Figma (node 3453:4058) as the exact design
 * shapes — the free Hugeicons pack is stroke-only and has no filled variants.
 * Each icon is one silhouette path + one detail path. Active tabs render the
 * silhouette filled with `currentColor` (the detail knocks out in the nav's
 * white surface); inactive tabs render it as an outline. Same color either way —
 * only fill vs outline changes (per the design).
 */
type NavIconName = "home" | "order" | "track";

const PATHS: Record<NavIconName, { main: string; detail: string }> = {
  home: {
    main: "M3.5 13.9879V16.9167C3.5 20.7664 3.5 22.6913 4.69598 23.8874C5.89196 25.0833 7.81686 25.0833 11.6667 25.0833H16.3333C20.1831 25.0833 22.108 25.0833 23.304 23.8874C24.5 22.6913 24.5 20.7664 24.5 16.9167V13.9879C24.5 12.0263 24.5 11.0457 24.0848 10.1967C23.6696 9.34776 22.8955 8.74566 21.3472 7.54146L19.0139 5.72664C16.6053 3.85332 15.401 2.91667 14 2.91667C12.5989 2.91667 11.3947 3.85332 8.98616 5.72664L6.65281 7.54146C5.10455 8.74566 4.33042 9.34776 3.91522 10.1967C3.5 11.0457 3.5 12.0263 3.5 13.9879Z",
    detail:
      "M17.5002 19.8333C16.5675 20.5595 15.3421 21 14.0002 21C12.6582 21 11.433 20.5595 10.5002 19.8333",
  },
  order: {
    main: "M2.91667 14.0001C2.91667 8.77533 2.91667 6.16296 4.53978 4.53985C6.1629 2.91673 8.77527 2.91673 14 2.91673C19.2247 2.91673 21.8371 2.91673 23.4603 4.53985C25.0833 6.16296 25.0833 8.77533 25.0833 14.0001C25.0833 19.2248 25.0833 21.8372 23.4603 23.4603C21.8371 25.0835 19.2247 25.0835 14 25.0835C8.77527 25.0835 6.1629 25.0835 4.53978 23.4603C2.91667 21.8372 2.91667 19.2248 2.91667 14.0001Z",
    detail: "M14 9.33339V18.6668M18.6667 14.0001H9.33333",
  },
  track: {
    main: "M3.87744 15.1798C4.28622 11.6772 4.8835 9.05081 5.4374 7.18493C5.8916 5.65496 6.11869 4.88998 7.04997 4.19498C7.98125 3.5 8.93313 3.5 10.8369 3.5H17.1632C19.0669 3.5 20.0188 3.5 20.9501 4.19498C21.8813 4.88998 22.1084 5.65496 22.5626 7.18493C23.1166 9.05081 23.7138 11.6772 24.1226 15.1798C24.6044 19.308 24.8452 21.3721 23.4531 22.936C22.0611 24.5 19.8051 24.5 15.2931 24.5H12.7069C8.19492 24.5 5.93894 24.5 4.54686 22.936C3.15479 21.3721 3.39568 19.308 3.87744 15.1798Z",
    detail:
      "M10.5 8.16667C10.5 10.0997 12.0669 11.6667 14 11.6667C15.933 11.6667 17.5 10.0997 17.5 8.16667",
  },
};

export function NavIcon({
  name,
  active = false,
  size = 28,
}: {
  name: NavIconName;
  active?: boolean;
  size?: number;
}) {
  const { main, detail } = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path
        d={main}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={detail}
        stroke={active ? "var(--color-white)" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
