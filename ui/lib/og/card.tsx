/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og"
import { OG_SIZE } from "./data"

const BG = "#0e0e12"
const ACCENT = "#a78bfa"
const TEXT = "#ffffff"
const MUTED = "#9ca3af"

export type MediaCardProps = {
  /** Small uppercase label above the title, e.g. "MOVIE" or "SERIES". */
  kind: string
  title: string
  /** Line under the title: year, genre, etc. */
  subtitle?: string
  /** Chips along the bottom of the text column. */
  facts?: string[]
  /** Optional third line, e.g. director or plot snippet. */
  detail?: string
  posterUrl?: string | null
  /** Circular image in the poster slot, for user avatars. */
  avatarUrl?: string | null
  /** Overrides the poster block with a text or emoji badge. */
  badge?: { primary: string; secondary?: string }
}

/**
 * Shared 1200x630 card: the artwork fills the canvas as a darkened backdrop
 * with the sharp poster inset on the left.
 *
 * Satori (the engine behind next/og) supports only a subset of CSS. The
 * backdrop is blurred with `filter`, and every layer keeps an explicit
 * `display: flex` because Satori requires it on any element with children.
 */
export function mediaCard({
  kind,
  title,
  subtitle,
  facts = [],
  detail,
  posterUrl,
  avatarUrl,
  badge,
}: MediaCardProps) {
  const hasArt = !!posterUrl
  // Long titles need to step down or they overflow the text column.
  const titleSize = title.length > 40 ? 54 : title.length > 26 ? 64 : 76

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: BG,
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {hasArt && (
          <img
            src={posterUrl as string}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: -120,
              left: -120,
              width: 1440,
              height: 870,
              objectFit: "cover",
              filter: "blur(48px)",
              opacity: 0.85,
            }}
          />
        )}

        {/* Darkening wash so white text always clears contrast. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "rgba(10, 10, 14, 0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(100deg, rgba(10,10,14,0.88) 12%, rgba(10,10,14,0.3) 62%, rgba(10,10,14,0.62) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 64,
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: "#1c1c26",
                border: "2px solid #2e2e3e",
                fontSize: 28,
              }}
            >
              🎬
            </div>
            <div
              style={{
                display: "flex",
                padding: "6px 18px",
                borderRadius: 9999,
                backgroundColor: "rgba(30, 30, 44, 0.85)",
                border: "1px solid #323246",
                color: ACCENT,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {kind.toUpperCase()}
            </div>
          </div>

          {/* Poster + copy */}
          <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
            {badge ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 240,
                  height: 240,
                  flexShrink: 0,
                  borderRadius: 24,
                  backgroundColor: "rgba(139, 92, 246, 0.16)",
                  border: "2px solid rgba(167, 139, 250, 0.4)",
                }}
              >
                <div style={{ fontSize: 84, fontWeight: 900, color: TEXT }}>{badge.primary}</div>
                {badge.secondary && (
                  <div style={{ fontSize: 22, color: ACCENT, marginTop: 6 }}>{badge.secondary}</div>
                )}
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={240}
                height={240}
                style={{
                  width: 240,
                  height: 240,
                  flexShrink: 0,
                  objectFit: "cover",
                  borderRadius: 9999,
                  border: "4px solid rgba(167, 139, 250, 0.5)",
                }}
              />
            ) : hasArt ? (
              <img
                src={posterUrl as string}
                alt=""
                width={260}
                height={385}
                style={{
                  width: 260,
                  height: 385,
                  flexShrink: 0,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "2px solid rgba(255,255,255,0.14)",
                }}
              />
            ) : null}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 14,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: titleSize,
                  fontWeight: 900,
                  color: TEXT,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div style={{ fontSize: 28, color: MUTED, lineHeight: 1.3 }}>{subtitle}</div>
              )}
              {facts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                  {facts.map((fact) => (
                    <div
                      key={fact}
                      style={{
                        display: "flex",
                        padding: "8px 18px",
                        borderRadius: 9999,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#e5e7eb",
                        fontSize: 24,
                        fontWeight: 600,
                      }}
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              )}
              {detail && (
                <div style={{ fontSize: 24, color: "#6b7280", lineHeight: 1.35, marginTop: 2 }}>
                  {detail}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "2px solid rgba(255,255,255,0.12)",
              paddingTop: 24,
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#e5e7eb" }}>
              mv.siv19.dev
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#6b7280" }}>
              Track · Compete · Time title cards
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
