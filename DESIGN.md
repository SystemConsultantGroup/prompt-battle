# Halloween — visual system

Implements the seasonal brief in `PRODUCT.md`. Applies **only** when `/themes/halloween.css` is loaded. This is not a replacement specification for the immutable cartoon theme.

## Direction
Paper-cut haunted arcade: ink-black pine forest, pumpkin-orange controls, bone lettering, crooked silhouettes, tombstone arches and stitched panels. Playful, recognisable Halloween; no gore, flashing lights, floating particles or unreadable novelty fonts.

## Palette
Source: bespoke seasonal palette extending the existing component tokens, not an imported design-system/CSV palette.

| Role / token | Exact value |
| --- | --- |
| Stage / `--bg` | `#101714` |
| Stage light / `--bg-2` | `#24362b` |
| Surface / `--surface` | `#1c2823` |
| Inset / `--surface-2` | `#111b16` |
| Raised / `--elevated` | `#304238` |
| Ink / `--ink` | `#080e0a` |
| Text / `--text` | `#f3eddd` |
| Secondary / `--muted` | `#b7c6b7` |
| Placeholder / `--faint` | `#97ac9f` |
| Pumpkin / `--pink`, `--accent` | `#ffa447` |
| Pumpkin hover / `--pink-hot` | `#ffbd72` |
| Frame / `--purple` | `#92a67b` |
| Focus, own-card marker / `--cyan` | `#a8cec0` |
| Success / `--lime`, `--ok` | `#c5e886` |
| Warning, bone gold / `--yellow`, `--gold` | `#ffe6b0` |
| Bronze / `--orange`, `--bronze` | `#d6a170` |
| Destructive / `--no` | `#ffa19b` |
| Silver / `--silver` | `#d3ded0` |
| Text on pumpkin / `--on-accent` | `#201408` |
| Surface border / `--h-border` | `#566950` |
| Stitch / `--h-stitch` | `#829372` |
| Pumpkin edge / `--h-pumpkin-edge` | `#b96028` |

SVG internals use these colours plus `#0b130e`, `#17251b`, `#273c31` for scene silhouettes, `#e6dbb4`/`#c6c49c` for the moon, `#e57a28`/`#803d1d` for pumpkin shading and `#718b51` for its stem. These are illustration shading, not new UI roles.

## Typography
Source: existing system-font stack, preserving Korean coverage without external requests. Body: 16px / 1.5, 500–600. Display: system sans, 900, `clamp(28px, 4.5vw, 42px)` / 1.12, tracking .025em. Headings 900. Timer: tabular digits, existing 34–54px scale. Existing 12–15px labels/code retained for dense game screens; monospace code inputs retained. Lettering is carved/shadowed, not dripping text.

## Shape grammar
- Authentication: tombstone arch, `180px 180px 12px 12px / 112px 112px 12px 12px`, top padding 132px for a non-interactive pumpkin/bat crest.
- Lobby and admin: alternating 36px/8px corners, inset 1px dashed stitched border, static corner cobweb.
- Host participant cards: tombstone arch `48% 48% 6px 6px / 28px 28px 6px 6px`.
- Result cards: deeper tombstone arch `70px 70px 8px 8px / 36px 36px 8px 8px`; pumpkin-shaped rank seals, stitched inset frames. Winner outlined in pumpkin, own-card marker in frost.
- Buttons: six-sided coffin/ticket silhouette made by two clipped **pseudo-elements**, not by clipping the interactive element. Its focus outline and hit area must remain intact.
- Inputs/textarea/select: stitched bottom edge, alternating 3px/12px corners; prompt area subtly ruled like a notebook.
- Room code: carved ticket, angular corners, dashed inner line; keep large tabular letters.
- Timer: arched plaque with a static hourglass cut-out, red border/background for danger. No perpetual pulse.
- UI iframes: rectangular with small 4px corners and inset frame. Never mask or tint the rendered content.

## Layout and spacing
Keep existing structure and 720px/900px responsive breakpoints. Base spacing 4px; 8/12/16/24/32px increments. Authentication max-width 500px; margin `clamp(24px, 7vh, 64px) auto`, max-width calc viewport minus 32px. Lobby max-width 980px, admin 1100px. Decorative insets never overlap form content or consume pointer events.

## Elevation and motion
Replace cartoon hard-offset blocks in Halloween only with a 0/8/0 ink base plus 0/20/48 translucent-ink depth, and a 1px inner highlight. Entrance: 280ms ease-out, opacity + translateY(8px). Button hover: 160ms ease-out, translateY(-2px); press: 100ms, translateY(1px). No ambient/infinite animations. Reduced motion disables entrance/hover/press displacement and all animation on themed elements; state changes remain immediate. Keep existing toast lifecycle animations so removal events still fire.

## Assets and accessibility
Repo-native SVGs under `public/themes/halloween/`: night scenery, pumpkin/bat crest, web corner and hourglass. Decorative CSS backgrounds only: no added DOM, accessible names, text, runtime scripts or hit targets. No third-party asset/font calls. Backgrounds remain behind the application; component pseudo-elements use `pointer-events: none`. Focus ring: visible 3px frost outline + 4px offset on buttons; existing 4px frost focus shadow on inputs. Buttons minimum 44px tall. Body/placeholder/control text target WCAG AA; semantic error/warning/success colours remain distinct. Mobile decorations simplify and the game uses its existing stacked layout. Forced-colors removes decoration and restores native control outlines/backgrounds.
