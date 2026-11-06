---
name: 길빛 (Gilbit)
colors:
  surface: '#f3fbf6'
  surface-dim: '#d3dcd7'
  surface-bright: '#f3fbf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf6f1'
  surface-container: '#e7f0eb'
  surface-container-high: '#e2eae5'
  surface-container-highest: '#dce4e0'
  on-surface: '#151d1a'
  on-surface-variant: '#404945'
  inverse-surface: '#2a322f'
  inverse-on-surface: '#eaf3ee'
  outline: '#707975'
  outline-variant: '#c0c8c4'
  surface-tint: '#386759'
  primary: '#073d31'
  on-primary: '#ffffff'
  primary-container: '#245447'
  on-primary-container: '#95c7b6'
  inverse-primary: '#9fd1c0'
  secondary: '#00696d'
  on-secondary: '#ffffff'
  secondary-container: '#95f2f6'
  on-secondary-container: '#007073'
  tertiary: '#4c2f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#674513'
  on-tertiary-container: '#e4b478'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#baeddc'
  primary-fixed-dim: '#9fd1c0'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#1e4f42'
  secondary-fixed: '#95f2f6'
  secondary-fixed-dim: '#79d5d9'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f52'
  tertiary-fixed: '#ffddb6'
  tertiary-fixed-dim: '#efbe81'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#61400e'
  background: '#f3fbf6'
  on-background: '#151d1a'
  surface-variant: '#dce4e0'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 46px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  stat-metric:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the contemplative, grounded grace of Korean Hanok architecture transposed into contemporary pedestrian transit. Rather than treating walking merely as functional navigation, it reframes everyday footpaths through the concept of *산책과 여정* (mindful strolling and quiet discovery). The interface communicates unhurried reliability, visual silence, and natural warmth.

The target audience spans urban walkers, cultural explorers, and commuters seeking refuge from sensory fatigue and hectic navigation maps filled with neon indicators. The emotional response is centered on quiet contemplation (차분함), clarity, and effortless orientation under natural sunlight.

The design movement synthesizes **Minimalism with Tactile Hanok Organicism**:
- Textures mimic handcrafted mulberry paper (*한지, Hanji*) through quiet, parchment-tinted surfaces without noisy grain.
- Negative space mirrors *여백의 미* (the beauty of empty space), giving room for map geometry and walking metrics to breathe.
- Architectural lines draw from *처마선* (the subtle, upward-curving eaves of Hanok roofs) and *창호 격자* (geometric wooden paper lattice).
- Avoid glassy or neon-modern tropes; UI layers feel tactile, grounded, and paper-soft under direct sunlight.

## Colors

The palette draws strictly from organic Korean architectural elements—pine needles (*솔잎*), aged paper (*한지*), deep traditional ink (*먹*), and earthen clay (*황토*).

### Functional Roles
- **Primary (`#245447`, Pine Green):** Rooted, solid anchor tone reserved for high-priority user actions, main route buttons, and key interactive highlights.
- **Secondary (`#087F83`, Path Teal):** Active pedestrian trajectory, step-by-step navigational beacons, turn markers, and active route lines on vector tiles. Distinguishable against warm earth tones without electric artificiality.
- **Tertiary (`#B58A52`, Earthen Ochre):** Cultural landmarks, subtle lattice (*창호*) line treatments, curated walking path tags, and commemorative transit stamps.
- **Neutral Primary (`#252D2A`, Deep Ink):** High-legibility text, primary numerical statistics (distance, remaining minutes).
- **Neutral Secondary (`#65706B`, Muted Ink):** Secondary descriptions, landmark subtext, road classification labels.
- **Canvas / Surfaces:**
  - Base Screen Surface: `#F7F3EA` (Warm Hanji ivory).
  - Floating Sheet / Container: `#FFFDF9` (Clean paper surface).
  - Borders & Hairlines: `#E9E2D2` (Subtle mulberry fibre tone).

Pure white (`#FFFFFF`) is avoided except for text inside Primary Pine Green buttons. Cold mint tints, stark grays, and saturated digital blues are strictly excluded.

## Typography

The typographic hierarchy implements an intentional bilingual harmony between literary poise and mechanical clarity:

- **Serif / Myeongjo (`Noto Serif` / Nanum Myeongjo):** Reserved for brand moments, welcoming prompts (*"어디로 걸어갈까요?"*), serene waypoint headers, and historical destination narratives. Provides humanistic warmth and dignified cadence.
- **Sans-serif / Gothic (`Noto Sans` / Pretendard):** Governs operational interaction. Search bars, button labels, meters remaining, ETA durations, turn arrows, and navigational warnings require immediate legibility in outdoor glare.
- **Numerical Metrics (`stat-metric`):** Rendered in Gothic bold to allow quick split-second glanceability while walking.

## Layout & Spacing

The layout model is mobile-first, prioritizing one-handed thumb interaction for pedestrians in transit. 

### Structure
- **Mobile (`< 768px`):** Single-column layout. The map canvas occupies the full viewport, while controls and sheets anchor to the bottom thumb zone with `margin: 1.25rem` outer padding.
- **Tablet & Desktop (`>= 768px`):** Fixed floating left dock (width: 420px) overlaying the expansive map viewport, keeping navigation controls aligned without occluding route visibility.

### Rhythmic Principles
- Spacing strictly follows an 8pt base grid with an allowable 4pt sub-increment (`space-xs: 0.25rem`).
- Bottom navigation and active direction cards prioritize generous internal padding (`space-lg`) to prevent mis-taps while walking.

## Elevation & Depth

Depth is expressed through physical sheet stacking rather than intense digital dropshadows, evocative of smooth sheets of Hanji pressed together.

- **Stacking Surfaces:**
  - **Surface 0 (Base Map):** Custom styled cartography tinted with warm ivory land masses (`#F7F3EA`) and muted stone roads.
  - **Surface 1 (Containers & Cards):** Solid `#FFFDF9` with a subtle 1px perimeter border of `#E9E2D2`.
  - **Surface 2 (Floating Action Trays / Turn Banners):** Raised using ambient diffused shadows tinted in deep ink pine (`rgba(37, 45, 42, 0.06)`) with a blur of 16px and y-offset of 6px, accompanied by the structural `#E9E2D2` hairline border.
- **Tactile Hanok Patterns:**
  - Background panels in search or empty states may carry an ultra-subtle SVG stroke pattern of *창호 격자* (wooden window paper grid) using `#E9E2D2` at 40% opacity.
  - No blurred acrylic glassmorphism is permitted; panels remain opaque or semi-opaque warm parchment.

## Shapes

The geometric form language reflects the soft curvature of natural timber and *처마* (the subtle curve of Hanok eaves). 

- Standard components (cards, dialogs, bottom sheets) feature `roundedness: 2` (0.5rem / 8px).
- Large elevated sheets and floating navigation modules utilize `rounded-xl` (1.5rem / 24px) on their top edge contours to convey soft, tactile weight.
- Interactive interactive pills (search bars, status badges) use fully rounded geometries to contrast against the architectural square grids of map tiles.

## Components

### Buttons
- **Primary Action (CTA):** Background `#245447` (Pine Green), text `#FFFFFF` (Gothic bold), corner radius `0.75rem`. Focus ring `#087F83`.
- **Secondary Action:** Background `#FFFDF9`, text `#245447`, border `1px solid #E9E2D2`.
- **Path Selection Highlight:** Outline tinted with `#087F83` and background `#087F83` at 8% opacity.

### Navigation Direction Card (Turn-by-Turn)
- Floating top banner with `#FFFDF9` surface, 1px `#E9E2D2` outline, and soft ink shadow.
- Directional arrow icon in vibrant `#087F83`. Distance remaining in `stat-metric` (`#252D2A`). Next street name in `headline-md` (`Noto Serif`).

### Search Bar
- Pill-shaped field on surface `#FFFDF9`. Inset left icon of Hanok gate or curved path in `#65706B`.
- Placeholder text in `#65706B`: *"목적지 또는 고즈넉한 길 검색"* (Search destination or peaceful paths).

### Chips & Filter Tags
- Height: 36px, fully rounded. Unselected: `#FFFDF9` surface with `#E9E2D2` border and `#65706B` text. Selected: `#245447` solid background with `#FFFDF9` text.
- Cultural tags (e.g., *한옥마을 코스*, *돌담길*): Tagged with small `#B58A52` ochre lattice icon.

### Form Inputs & Checkboxes
- **Inputs:** Crisp bottom or inset border in `#E9E2D2`. Focus transitions to `#245447` without default browser halos.
- **Checkboxes & Radios:** Curved square box with `#245447` active fill and warm paper checkmark.

### Route Overview Bottom Sheet
- Anchored to bottom safe area with top radius of `1.5rem`.
- Contains total step count, elevation slope, and green foliage indicator (*그늘진 길* / Shaded path).
- Visual divider using horizontal 처마 (eave) curve glyph to separate itinerary stops.