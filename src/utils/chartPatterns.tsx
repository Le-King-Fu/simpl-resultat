import React from "react";

// Pattern generators: each returns the SVG content for a <pattern> element.
// The pattern uses the category color as the base fill and adds a white overlay texture.
const patternGenerators: ((color: string) => React.ReactNode)[] = [
  // 0: Solid — no overlay
  () => null,
  // 1: Diagonal lines (45°)
  () => (
    <line x1="0" y1="0" x2="8" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
  ),
  // 2: Dots
  () => (
    <>
      <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.55)" />
    </>
  ),
  // 3: Crosshatch
  () => (
    <>
      <line x1="0" y1="0" x2="8" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <line x1="8" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
    </>
  ),
  // 4: Horizontal lines
  () => (
    <line x1="0" y1="4" x2="8" y2="4" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
  ),
  // 5: Vertical lines
  () => (
    <line x1="4" y1="0" x2="4" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
  ),
  // 6: Reverse diagonal (135°)
  () => (
    <line x1="8" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
  ),
  // 7: Dense dots
  () => (
    <>
      <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.55)" />
      <circle cx="5" cy="1" r="1" fill="rgba(255,255,255,0.55)" />
      <circle cx="3" cy="5" r="1" fill="rgba(255,255,255,0.55)" />
      <circle cx="7" cy="5" r="1" fill="rgba(255,255,255,0.55)" />
    </>
  ),
];

/**
 * Generates a unique pattern ID from a chart-scoped prefix and index.
 */
function patternId(prefix: string, index: number): string {
  return `${prefix}-pattern-${index}`;
}

/**
 * Returns the fill value for a category at the given index.
 * Index 0 gets solid color; others get a pattern reference.
 */
export function getPatternFill(
  prefix: string,
  index: number,
  color: string
): string {
  const pIdx = index % patternGenerators.length;
  if (pIdx === 0) return color;
  return `url(#${patternId(prefix, index)})`;
}

interface ChartPatternDefsProps {
  /** Unique prefix to avoid ID collisions when multiple charts are on screen */
  prefix: string;
  /** Array of { color, index } for each category that needs a pattern */
  categories: { color: string; index: number }[];
}

/**
 * Renders SVG <defs> with <pattern> elements for chart categories.
 * Must be placed inside an SVG context (e.g. inside a Recharts customized component).
 */
export function ChartPatternDefs({ prefix, categories }: ChartPatternDefsProps) {
  return (
    <defs>
      {categories.map(({ color, index }) => {
        const pIdx = index % patternGenerators.length;
        if (pIdx === 0) return null; // solid, no pattern needed
        return (
          <pattern
            key={patternId(prefix, index)}
            id={patternId(prefix, index)}
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
          >
            <rect width="8" height="8" fill={color} />
            {patternGenerators[pIdx](color)}
          </pattern>
        );
      })}
    </defs>
  );
}

/**
 * Renders a small SVG swatch for use in legends, showing the pattern+color.
 */
export function PatternSwatch({
  index,
  color,
  prefix,
  size = 12,
}: {
  index: number;
  color: string;
  prefix: string;
  size?: number;
}) {
  const pIdx = index % patternGenerators.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className="inline-block flex-shrink-0"
      style={{ borderRadius: "50%" }}
    >
      {pIdx !== 0 && (
        <defs>
          <pattern
            id={`swatch-${patternId(prefix, index)}`}
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
          >
            <rect width="8" height="8" fill={color} />
            {patternGenerators[pIdx](color)}
          </pattern>
        </defs>
      )}
      <circle
        cx="6"
        cy="6"
        r="6"
        fill={pIdx === 0 ? color : `url(#swatch-${patternId(prefix, index)})`}
      />
    </svg>
  );
}
