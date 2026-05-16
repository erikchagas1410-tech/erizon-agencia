/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";

import {
  CREATIVE_FORMAT_DIMENSIONS,
  type CreativeFormat,
  type CreativeJson
} from "@/lib/creative/schema";
import {
  TOKENS,
  getSafeArea,
  getHeadlineSize,
  getSubheadlineSize,
  getCtaSize,
  readableTextColor
} from "@/lib/creative/visual";

function getCanvasSize(format: CreativeFormat) {
  return CREATIVE_FORMAT_DIMENSIONS[format];
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const channels = normalized.match(/.{1,2}/g);

  if (!channels) {
    return `rgba(108,99,255,${alpha})`;
  }

  const [r, g, b] = channels.map((value) => Number.parseInt(value, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTemplateTag(template: CreativeJson["template"]) {
  if (template === "pain_point") {
    return "Dor operacional";
  }

  if (template === "offer") {
    return "Oferta ativa";
  }

  return "Beneficio claro";
}

function BrandBadge({ creative }: { creative: CreativeJson }) {
  const size = creative.format === "story" ? 88 : 72;
  const initials = creative.brand.name
    .split(" ")
    .map((word) => word[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: TOKENS.borderRadius * 0.9,
          border: `1px solid ${hexToRgba("#FFFFFF", 0.16)}`,
          backgroundColor: hexToRgba("#FFFFFF", 0.06),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        {creative.brand.logoUrl ? (
          <img
            src={creative.brand.logoUrl}
            alt={creative.brand.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 16
            }}
          />
        ) : (
          <span
            style={{
              color: "#FFFFFF",
              fontSize: size * 0.34,
              fontWeight: 700,
              letterSpacing: 1
            }}
          >
            {initials}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column"
        }}
      >
        <span
          style={{
            color: hexToRgba("#FFFFFF", 0.64),
            fontSize: creative.format === "story" ? 22 : 18,
            textTransform: "uppercase",
            letterSpacing: 1.2
          }}
        >
          {getTemplateTag(creative.template)}
        </span>
        <span
          style={{
            color: "#FFFFFF",
            fontSize: creative.format === "story" ? 30 : 24,
            fontWeight: 700,
            marginTop: 6
          }}
        >
          {creative.brand.name}
        </span>
      </div>
    </div>
  );
}

function GridOverlay({ creative }: { creative: CreativeJson }) {
  const size = creative.format === "story" ? 64 : 56;
  const columns = Math.ceil(CREATIVE_FORMAT_DIMENSIONS[creative.format].width / size);
  const rows = Math.ceil(CREATIVE_FORMAT_DIMENSIONS[creative.format].height / size);
  const lines: ReactNode[] = [];

  for (let index = 1; index < columns; index += 1) {
    lines.push(
      <div
        key={`v-${index}`}
        style={{
          position: "absolute",
          left: index * size,
          top: 0,
          width: 1,
          height: "100%",
          backgroundColor: hexToRgba("#FFFFFF", 0.025)
        }}
      />
    );
  }

  for (let index = 1; index < rows; index += 1) {
    lines.push(
      <div
        key={`h-${index}`}
        style={{
          position: "absolute",
          top: index * size,
          left: 0,
          height: 1,
          width: "100%",
          backgroundColor: hexToRgba("#FFFFFF", 0.025)
        }}
      />
    );
  }

  return <>{lines}</>;
}

function DecorativeShapes({ creative }: { creative: CreativeJson }) {
  const accent = creative.brand.colors.accent || creative.brand.colors.secondary || "#38BDF8";
  const secondary = creative.brand.colors.secondary || creative.brand.colors.primary;
  const density = creative.visual.density;
  const bgStyle = creative.visual.backgroundStyle;
  const isStory = creative.format === "story";

  const nodes: ReactNode[] = [];

  /*
   * Do not use CSS backgroundImage here.
   * Satori can treat unsupported background-image values as external URLs and
   * throw "Invalid URL" during server-side PNG rendering. Every visual below is
   * built with plain positioned divs, which Satori handles deterministically.
   */
  if (bgStyle === "grid") {
    nodes.push(<GridOverlay key="grid" creative={creative} />);
  }

  if (bgStyle === "gradient" || bgStyle === "mesh" || bgStyle === "abstract") {
    nodes.push(
      <div
        key="wash-top"
        style={{
          position: "absolute",
          top: isStory ? -180 : -130,
          left: isStory ? -120 : -90,
          width: isStory ? 620 : 470,
          height: isStory ? 620 : 470,
          borderRadius: 999,
          backgroundColor: hexToRgba(accent, bgStyle === "gradient" ? 0.14 : 0.1)
        }}
      />,
      <div
        key="wash-bottom"
        style={{
          position: "absolute",
          right: isStory ? -210 : -150,
          bottom: isStory ? -170 : -120,
          width: isStory ? 720 : 520,
          height: isStory ? 720 : 520,
          borderRadius: 999,
          backgroundColor: hexToRgba(secondary, bgStyle === "mesh" ? 0.14 : 0.1)
        }}
      />
    );
  }

  nodes.push(
    <div
      key="accent-line"
      style={{
        position: "absolute",
        top: isStory ? 170 : 124,
        left: isStory ? 96 : 72,
        width: isStory ? 180 : 136,
        height: 8,
        borderRadius: 999,
        backgroundColor: accent
      }}
    />,
    <div
      key="orb-right"
      style={{
        position: "absolute",
        top: isStory ? 180 : 120,
        right: isStory ? 60 : 48,
        width: isStory ? 240 : 180,
        height: isStory ? 240 : 180,
        borderRadius: 999,
        backgroundColor: hexToRgba(accent, 0.18)
      }}
    />,
    <div
      key="panel-bottom"
      style={{
        position: "absolute",
        right: isStory ? 86 : 68,
        bottom: isStory ? 150 : 96,
        width: isStory ? 260 : 200,
        height: isStory ? 168 : 132,
        borderRadius: 32,
        border: `1px solid ${hexToRgba("#FFFFFF", 0.14)}`,
        backgroundColor: hexToRgba("#FFFFFF", 0.06)
      }}
    />
  );

  if (density !== "low") {
    nodes.push(
      <div
        key="orb-left"
        style={{
          position: "absolute",
          left: isStory ? -70 : -48,
          bottom: isStory ? 210 : 120,
          width: isStory ? 210 : 160,
          height: isStory ? 210 : 160,
          borderRadius: 999,
          backgroundColor: hexToRgba(secondary, 0.14)
        }}
      />
    );
  }

  if (density === "high") {
    nodes.push(
      <div
        key="accent-box"
        style={{
          position: "absolute",
          top: isStory ? 520 : 360,
          right: isStory ? 130 : 92,
          width: isStory ? 112 : 88,
          height: isStory ? 112 : 88,
          borderRadius: 24,
          backgroundColor: hexToRgba(accent, 0.22)
        }}
      />
    );
  }

  return <>{nodes}</>;
}

function CtaBadge({ creative }: { creative: CreativeJson }) {
  const label = creative.cta || "Saiba mais";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: creative.format === "story" ? "18px 30px" : "14px 24px",
        borderRadius: 999,
        backgroundColor: creative.brand.colors.accent || "#38BDF8",
        color: creative.brand.colors.background || "#0B1220",
        fontSize: getCtaSize(creative.format),
        fontWeight: 800,
        alignSelf: "flex-start"
      }}
    >
      {label}
    </div>
  );
}

function PainPointLayout({
  creative,
  safePadding
}: {
  creative: CreativeJson;
  safePadding: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: safePadding,
        right: safePadding,
        bottom: safePadding,
        left: safePadding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <BrandBadge creative={creative} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: creative.format === "story" ? 820 : 720
        }}
      >
        <div
          style={{
            color: hexToRgba("#FFFFFF", 0.7),
            fontSize: creative.format === "story" ? 24 : 18,
            marginBottom: 18
          }}
        >
          Menos operacao manual. Mais foco em escala.
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: getHeadlineSize(creative.format, creative.headline.length),
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: -1.4
          }}
        >
          {creative.headline}
        </div>
        {creative.subheadline ? (
          <div
            style={{
              color: hexToRgba("#FFFFFF", 0.84),
              fontSize: getSubheadlineSize(creative.format),
              lineHeight: 1.36,
              marginTop: 28,
              maxWidth: creative.format === "story" ? 760 : 620
            }}
          >
            {creative.subheadline}
          </div>
        ) : null}
      </div>

      <CtaBadge creative={creative} />
    </div>
  );
}

function BenefitLayout({
  creative,
  safePadding
}: {
  creative: CreativeJson;
  safePadding: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: safePadding,
        right: safePadding,
        bottom: safePadding,
        left: safePadding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center"
      }}
    >
      <BrandBadge creative={creative} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: creative.format === "story" ? 820 : 760
        }}
      >
        <div
          style={{
            color: hexToRgba("#FFFFFF", 0.68),
            fontSize: creative.format === "story" ? 22 : 18,
            marginBottom: 18,
            textTransform: "uppercase",
            letterSpacing: 1.2
          }}
        >
          Estrutura criativa orientada a conversao
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: getHeadlineSize(creative.format, creative.headline.length),
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: -1.4
          }}
        >
          {creative.headline}
        </div>
        {creative.subheadline ? (
          <div
            style={{
              color: hexToRgba("#FFFFFF", 0.84),
              fontSize: getSubheadlineSize(creative.format),
              lineHeight: 1.38,
              marginTop: 28
            }}
          >
            {creative.subheadline}
          </div>
        ) : null}
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <CtaBadge creative={creative} />
      </div>
    </div>
  );
}

function OfferLayout({
  creative,
  safePadding
}: {
  creative: CreativeJson;
  safePadding: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: safePadding,
        right: safePadding,
        bottom: safePadding,
        left: safePadding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <BrandBadge creative={creative} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: creative.format === "story" ? 820 : 720
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: creative.format === "story" ? "14px 22px" : "12px 18px",
            borderRadius: 999,
            border: `1px solid ${hexToRgba("#FFFFFF", 0.18)}`,
            backgroundColor: hexToRgba("#FFFFFF", 0.08),
            color: "#FFFFFF",
            fontSize: creative.format === "story" ? 22 : 17,
            fontWeight: 700
          }}
        >
          Trial • Demo • Oferta
        </div>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: getHeadlineSize(creative.format, creative.headline.length),
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: -1.4
          }}
        >
          {creative.headline}
        </div>
        {creative.subheadline ? (
          <div
            style={{
              color: hexToRgba("#FFFFFF", 0.84),
              fontSize: getSubheadlineSize(creative.format),
              lineHeight: 1.38,
              maxWidth: creative.format === "story" ? 760 : 620
            }}
          >
            {creative.subheadline}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24
        }}
      >
        <CtaBadge creative={creative} />
        <div
          style={{
            color: hexToRgba("#FFFFFF", 0.62),
            fontSize: creative.format === "story" ? 20 : 16,
            maxWidth: 280,
            textAlign: "right"
          }}
        >
          Criativo estruturado, consistente e pronto para exportar.
        </div>
      </div>
    </div>
  );
}

export function CreativeTemplateView({
  creative,
  scale = 1,
  bordered = false,
  debug = false
}: {
  creative: CreativeJson;
  scale?: number;
  bordered?: boolean;
  debug?: boolean;
}) {
  const dimensions = getCanvasSize(creative.format);
  const safePadding = getSafeArea(creative.format as any);
  const background = creative.brand.colors.background || creative.brand.colors.primary;
  const fontFamily = creative.brand.fontFamily || "Inter, system-ui, sans-serif";

  return (
    <div
      style={{
        width: dimensions.width * scale,
        height: dimensions.height * scale,
        overflow: "hidden",
        borderRadius: bordered ? 24 : 0,
        border: bordered ? "1px solid #E8E6FF" : "none",
        boxShadow: bordered ? "0 2px 12px rgba(108,99,255,.08)" : "none",
        backgroundColor: "#FFFFFF"
      }}
    >
      <div
        style={{
          position: "relative",
          width: dimensions.width,
          height: dimensions.height,
          overflow: "hidden",
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily,
          backgroundColor: background
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: hexToRgba("#020617", 0.14)
          }}
        />

        <DecorativeShapes creative={creative} />

          {debug ? (
            <div
              style={{
                position: "absolute",
                top: safePadding,
                left: safePadding,
                right: safePadding,
                bottom: safePadding,
                border: `1px dashed ${hexToRgba("#FFFFFF", 0.28)}`,
                pointerEvents: "none"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: -26,
                  backgroundColor: hexToRgba("#000000", 0.36),
                  color: "#FFFFFF",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12
                }}
              >
                {creative.template} • {creative.format} • {getHeadlineSize(creative.format, creative.headline.length)}px
              </div>
            </div>
          ) : null}

        {creative.template === "pain_point" ? (
          <PainPointLayout creative={creative} safePadding={safePadding} />
        ) : null}
        {creative.template === "benefit" ? (
          <BenefitLayout creative={creative} safePadding={safePadding} />
        ) : null}
        {creative.template === "offer" ? (
          <OfferLayout creative={creative} safePadding={safePadding} />
        ) : null}
      </div>
    </div>
  );
}
