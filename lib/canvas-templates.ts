import type {
  BackgroundLayer,
  CanvasTemplate,
  ImageLayer,
  LogoLayer,
  ShapeLayer,
  TextLayer
} from "@/lib/types";

export const EDITOR_FORMAT_DIMENSIONS = {
  feed: { width: 1080, height: 1080, label: "Feed 1:1" },
  story: { width: 1080, height: 1920, label: "Story 9:16" },
  carousel_cover: { width: 1080, height: 1080, label: "Carrossel 1:1" }
} as const;

const DEFAULT_CREATED_AT = "2026-05-15T00:00:00.000Z";

function buildPlaceholderThumbnail(name: string, ratio: "square" | "story") {
  const width = 300;
  const height = ratio === "story" ? 533 : 300;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#171717" />
          <stop offset="100%" stop-color="#050505" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="28" fill="url(#bg)" />
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="24" fill="none" stroke="rgba(255,255,255,0.12)" />
      <circle cx="${width - 44}" cy="50" r="18" fill="rgba(255,255,255,0.08)" />
      <text x="24" y="${height - 58}" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.48)">Editor</text>
      <text x="24" y="${height - 28}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${name}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createTemplateFallbackThumbnail(
  name: string,
  format: CanvasTemplate["format"]
) {
  return buildPlaceholderThumbnail(name, format === "story" ? "story" : "square");
}

function background(
  id: string,
  fill: BackgroundLayer["fill"],
  width: number,
  height: number,
  gradient?: BackgroundLayer["gradient"]
): BackgroundLayer {
  return {
    id,
    type: "background",
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    zIndex: 0,
    fill,
    gradient
  };
}

function shape(input: Omit<ShapeLayer, "type"> & { type?: never }): ShapeLayer {
  return {
    ...input,
    type: "shape"
  };
}

function text(input: Omit<TextLayer, "type"> & { type?: never }): TextLayer {
  return {
    ...input,
    type: "text"
  };
}

function logo(input: Omit<LogoLayer, "type"> & { type?: never }): LogoLayer {
  return {
    ...input,
    type: "logo"
  };
}

function image(input: Omit<ImageLayer, "type"> & { type?: never }): ImageLayer {
  return {
    ...input,
    type: "image"
  };
}

function createTemplate(
  template: Omit<CanvasTemplate, "created_at" | "is_default" | "thumbnail">
) {
  return {
    ...template,
    created_at: DEFAULT_CREATED_AT,
    is_default: true,
    thumbnail: createTemplateFallbackThumbnail(template.name, template.format)
  } satisfies CanvasTemplate;
}

export const DEFAULT_EDITOR_TEMPLATES: CanvasTemplate[] = [
  createTemplate({
    id: "default-feed-hero-split",
    name: "Hero Split",
    format: "feed",
    category: "institucional",
    canvasWidth: 1080,
    canvasHeight: 1080,
    layers: [
      background("bg", "primary", 1080, 1080, {
        angle: 35,
        from: "primary",
        to: "secondary"
      }),
      shape({
        id: "shape-band",
        x: 0,
        y: 760,
        width: 1080,
        height: 320,
        rotation: 0,
        opacity: 0.94,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "accent",
        borderRadius: 0
      }),
      shape({
        id: "shape-orb",
        x: 760,
        y: -90,
        width: 420,
        height: 420,
        rotation: 0,
        opacity: 0.18,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "circle",
        fill: "white",
        borderRadius: 0
      }),
      text({
        id: "headline",
        x: 80,
        y: 780,
        width: 720,
        height: 120,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: 72,
        fontWeight: 800,
        color: "white",
        textAlign: "left",
        lineHeight: 1.02,
        letterSpacing: 1,
        uppercase: true
      }),
      text({
        id: "subheadline",
        x: 84,
        y: 908,
        width: 760,
        height: 120,
        rotation: 0,
        opacity: 0.84,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{value_proposition}}",
        fontFamily: "DM Sans",
        fontSize: 32,
        fontWeight: 400,
        color: "white",
        textAlign: "left",
        lineHeight: 1.28,
        letterSpacing: 0,
        uppercase: false
      }),
      logo({
        id: "logo",
        x: 84,
        y: 70,
        width: 220,
        height: 84,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        fit: "contain"
      })
    ]
  }),
  createTemplate({
    id: "default-feed-product-spotlight",
    name: "Product Spotlight",
    format: "feed",
    category: "produto",
    canvasWidth: 1080,
    canvasHeight: 1080,
    layers: [
      background("bg", "black", 1080, 1080),
      shape({
        id: "panel",
        x: 70,
        y: 86,
        width: 940,
        height: 900,
        rotation: 0,
        opacity: 0.14,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "secondary",
        borderRadius: 72
      }),
      shape({
        id: "triangle",
        x: 820,
        y: 90,
        width: 190,
        height: 170,
        rotation: 14,
        opacity: 0.7,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "triangle",
        fill: "accent",
        borderRadius: 0
      }),
      image({
        id: "hero-image",
        x: 100,
        y: 170,
        width: 880,
        height: 470,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        src: "",
        fit: "cover"
      }),
      text({
        id: "headline",
        x: 100,
        y: 690,
        width: 730,
        height: 88,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: 64,
        fontWeight: 800,
        color: "white",
        textAlign: "left",
        lineHeight: 1.02,
        letterSpacing: 0.8,
        uppercase: false
      }),
      text({
        id: "support",
        x: 102,
        y: 792,
        width: 740,
        height: 120,
        rotation: 0,
        opacity: 0.84,
        locked: false,
        visible: true,
        zIndex: 4,
        content: "{{personality}}",
        fontFamily: "DM Sans",
        fontSize: 28,
        fontWeight: 600,
        color: "accent",
        textAlign: "left",
        lineHeight: 1.2,
        letterSpacing: 0.6,
        uppercase: true
      }),
      logo({
        id: "logo",
        x: 102,
        y: 102,
        width: 190,
        height: 72,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 5,
        fit: "contain"
      })
    ]
  }),
  createTemplate({
    id: "default-story-editorial-frame",
    name: "Editorial Frame",
    format: "story",
    category: "institucional",
    canvasWidth: 1080,
    canvasHeight: 1920,
    layers: [
      background("bg", "secondary", 1080, 1920, {
        angle: 180,
        from: "secondary",
        to: "primary"
      }),
      shape({
        id: "card",
        x: 70,
        y: 920,
        width: 940,
        height: 760,
        rotation: 0,
        opacity: 0.42,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "black",
        borderRadius: 96
      }),
      shape({
        id: "orb",
        x: 710,
        y: 120,
        width: 420,
        height: 420,
        rotation: 0,
        opacity: 0.16,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "circle",
        fill: "accent",
        borderRadius: 0
      }),
      text({
        id: "headline",
        x: 90,
        y: 1080,
        width: 780,
        height: 190,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: 86,
        fontWeight: 800,
        color: "white",
        textAlign: "left",
        lineHeight: 1.02,
        letterSpacing: 1,
        uppercase: true
      }),
      text({
        id: "copy",
        x: 92,
        y: 1290,
        width: 800,
        height: 240,
        rotation: 0,
        opacity: 0.88,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{value_proposition}}",
        fontFamily: "DM Sans",
        fontSize: 38,
        fontWeight: 400,
        color: "white",
        textAlign: "left",
        lineHeight: 1.3,
        letterSpacing: 0,
        uppercase: false
      }),
      text({
        id: "signoff",
        x: 92,
        y: 1560,
        width: 700,
        height: 54,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{post_sign_off}}",
        fontFamily: "DM Sans",
        fontSize: 28,
        fontWeight: 600,
        color: "accent",
        textAlign: "left",
        lineHeight: 1.2,
        letterSpacing: 0.4,
        uppercase: false
      }),
      logo({
        id: "logo",
        x: 92,
        y: 88,
        width: 240,
        height: 82,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        fit: "contain"
      })
    ]
  }),
  createTemplate({
    id: "default-story-promo-burst",
    name: "Promo Burst",
    format: "story",
    category: "promocional",
    canvasWidth: 1080,
    canvasHeight: 1920,
    layers: [
      background("bg", "accent", 1080, 1920, {
        angle: 38,
        from: "accent",
        to: "primary"
      }),
      shape({
        id: "frame",
        x: 82,
        y: 280,
        width: 916,
        height: 1200,
        rotation: 0,
        opacity: 0.34,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "black",
        borderRadius: 120
      }),
      shape({
        id: "accent-line",
        x: 842,
        y: 1268,
        width: 148,
        height: 94,
        rotation: -8,
        opacity: 0.28,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "triangle",
        fill: "white",
        borderRadius: 0
      }),
      text({
        id: "headline",
        x: 136,
        y: 500,
        width: 808,
        height: 140,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: 94,
        fontWeight: 800,
        color: "white",
        textAlign: "center",
        lineHeight: 1,
        letterSpacing: 1.2,
        uppercase: true
      }),
      text({
        id: "copy",
        x: 170,
        y: 680,
        width: 740,
        height: 220,
        rotation: 0,
        opacity: 0.92,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{value_proposition}}",
        fontFamily: "DM Sans",
        fontSize: 42,
        fontWeight: 600,
        color: "white",
        textAlign: "center",
        lineHeight: 1.28,
        letterSpacing: 0,
        uppercase: false
      }),
      logo({
        id: "logo",
        x: 390,
        y: 116,
        width: 300,
        height: 84,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        fit: "contain"
      })
    ]
  }),
  createTemplate({
    id: "default-carousel-content-cover",
    name: "Content Cover",
    format: "carousel_cover",
    category: "conteudo",
    canvasWidth: 1080,
    canvasHeight: 1080,
    layers: [
      background("bg", "black", 1080, 1080),
      shape({
        id: "frame",
        x: 82,
        y: 82,
        width: 916,
        height: 916,
        rotation: 0,
        opacity: 0.12,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "primary",
        borderRadius: 110
      }),
      shape({
        id: "orb",
        x: -80,
        y: 640,
        width: 330,
        height: 330,
        rotation: 0,
        opacity: 0.28,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "circle",
        fill: "accent",
        borderRadius: 0
      }),
      text({
        id: "headline",
        x: 118,
        y: 206,
        width: 720,
        height: 160,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{brand_name}}",
        fontFamily: "Syne",
        fontSize: 70,
        fontWeight: 700,
        color: "white",
        textAlign: "left",
        lineHeight: 1.04,
        letterSpacing: 1,
        uppercase: true
      }),
      text({
        id: "support",
        x: 120,
        y: 362,
        width: 630,
        height: 90,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{personality}}",
        fontFamily: "DM Sans",
        fontSize: 32,
        fontWeight: 600,
        color: "accent",
        textAlign: "left",
        lineHeight: 1.18,
        letterSpacing: 0.5,
        uppercase: false
      }),
      text({
        id: "signoff",
        x: 122,
        y: 898,
        width: 700,
        height: 44,
        rotation: 0,
        opacity: 0.72,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{post_sign_off}}",
        fontFamily: "DM Sans",
        fontSize: 28,
        fontWeight: 400,
        color: "white",
        textAlign: "left",
        lineHeight: 1.2,
        letterSpacing: 0,
        uppercase: false
      }),
      logo({
        id: "logo",
        x: 120,
        y: 80,
        width: 196,
        height: 68,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        fit: "contain"
      })
    ]
  }),
  createTemplate({
    id: "default-carousel-testimonial-grid",
    name: "Testimonial Grid",
    format: "carousel_cover",
    category: "depoimento",
    canvasWidth: 1080,
    canvasHeight: 1080,
    layers: [
      background("bg", "secondary", 1080, 1080),
      shape({
        id: "card",
        x: 94,
        y: 120,
        width: 892,
        height: 820,
        rotation: 0,
        opacity: 0.12,
        locked: false,
        visible: true,
        zIndex: 1,
        shape: "rect",
        fill: "white",
        borderRadius: 108
      }),
      shape({
        id: "orb",
        x: 770,
        y: 760,
        width: 260,
        height: 260,
        rotation: 0,
        opacity: 0.24,
        locked: false,
        visible: true,
        zIndex: 2,
        shape: "circle",
        fill: "accent",
        borderRadius: 0
      }),
      text({
        id: "headline",
        x: 138,
        y: 310,
        width: 680,
        height: 230,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{value_proposition}}",
        fontFamily: "Syne",
        fontSize: 60,
        fontWeight: 700,
        color: "white",
        textAlign: "left",
        lineHeight: 1.14,
        letterSpacing: 0.2,
        uppercase: false
      }),
      text({
        id: "brand",
        x: 140,
        y: 690,
        width: 500,
        height: 48,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 3,
        content: "{{brand_name}}",
        fontFamily: "DM Sans",
        fontSize: 32,
        fontWeight: 800,
        color: "accent",
        textAlign: "left",
        lineHeight: 1.2,
        letterSpacing: 0.6,
        uppercase: true
      }),
      logo({
        id: "logo",
        x: 140,
        y: 138,
        width: 210,
        height: 70,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        zIndex: 4,
        fit: "contain"
      })
    ]
  })
];
