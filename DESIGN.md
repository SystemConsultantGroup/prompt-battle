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
Source: existing system-font stack, preserving Korean coverage without external requests. Body: 16px / 1.5, 500–600. Display: system sans, 900, `clamp(28px, 4.5vw, 42px)` / 1.12, tracking .025em. Headings 900. Timer: tabular digits, existing 34–54px scale. Existing 12–15px labels/code retained for dense game screens; monospace code inputs retained. The common gameplay stylesheet enlarges the player prompt to 18px; Halloween uses a 30px line-height with matching notebook rules. Placeholder instructions use the muted text colour at full opacity. Lettering is carved/shadowed, not dripping text.

## Shape grammar
- Authentication: tombstone arch, `180px 180px 12px 12px / 112px 112px 12px 12px`, top padding 132px for a non-interactive pumpkin/bat crest flanked by two bone-white ghosts. The 168×112px crest stays centred in a maximum 280×112px decoration strip; ghosts are 48×60px and 40×50px. No extra layout space.
- Lobby and admin: alternating 36px/8px corners, inset 1px dashed stitched border, static corner cobweb. Wide lobby panels include a small ghost nestled in the web.
- Host participant cards: tombstone arch `48% 48% 6px 6px / 28px 28px 6px 6px`.
- Result cards: deeper tombstone arch `70px 70px 8px 8px / 36px 36px 8px 8px`; pumpkin-shaped rank seals, stitched inset frames. Winner outlined in pumpkin, own-card marker in frost.
- Buttons: subtly pumpkin-shaped bodies made by two rounded **pseudo-elements**, `28px 28px 24px 24px / 20px 20px 24px 24px` radii. Fixed radii prevent full-width actions from looking like flat ovals. Outer body starts 5px below the button top; inner fill starts at 7px and leaves a 4px bottom edge. Two translucent-ink radial gradients suggest ribs. A 7×9px sage stem is painted at the top centre of the button background. Hover changes only the fill colour, preserving ribs and stem. Ghost/selected buttons retain their semantic colours with the same shape. Never clip the interactive element: focus outline and rectangular hit area remain intact. Forced-colors replaces the stem/background with native button colours.
- Inputs/textarea/select: stitched bottom edge, alternating 3px/12px corners; prompt area subtly ruled like a notebook.
- Room code: carved ticket, angular corners, dashed inner line; keep large tabular letters.
- Host timer: arched plaque with a static hourglass cut-out. Player timer: pumpkin-ribbed inset plaque, 48px/24px corners, orange border and digits, a pair of jack-o'-lanterns on the left and a friendly ghost on the right. At ≤30 seconds use bone-yellow digits/border; at ≤10 seconds use red digits/border and a quiet warm inset fill. Only the ghost moves briefly on entering danger (two 800ms alternating motions); the number never moves or flashes. Responsive side padding reserves space for the icons. No perpetual pulse.
- UI iframes: rectangular with small 4px corners and inset frame. Never mask or tint the rendered content.

## Layout and spacing
Keep existing structure and 720px/900px responsive breakpoints. Base spacing 4px; 8/12/16/24/32px increments. Authentication max-width 500px; margin `clamp(24px, 7vh, 64px) auto`, max-width calc viewport minus 32px. Lobby max-width 980px, admin 1100px. Decorative insets never overlap form content or consume pointer events. Desktop windows ≤760px tall use 24px client-lobby card margins and a 132px decorative stage to avoid unnecessary page scrolling; other desktop lobbies use a 156px stage, mobile 176px.

## Elevation and motion
Replace cartoon hard-offset blocks in Halloween only with a 0/8/0 ink base plus 0/20/48 translucent-ink depth, and a 1px inner highlight. Entrance: 280ms ease-out, opacity + translateY(8px). Button hover: 160ms ease-out, translateY(-2px); press: 100ms, translateY(1px). No ambient/infinite animations outside the client's waiting-room scene. That scene contains two floating ghosts (5/6s alternating drift), two swooping bats (7s alternating), and a gently rocking pumpkin pair (4s alternating). A 44px-minimum pause toggle stops all five objects and preserves the choice across lobby updates; it disappears under reduced motion, which makes the scene static. All object motion animates only transform; decorative spans are aria-hidden and pointer-inert. The scene is hidden in the cartoon theme and never appears on the host board or in the editor. The three-second start guide uses a 280ms fade-up entrance and two 1200ms alternating ghost motions (120ms stagger on the right ghost), bounded to the announcement. Reduced motion disables entrance/hover/press displacement and all animation on themed elements; state changes remain immediate. Keep existing toast lifecycle animations so removal events still fire.

## Round-start guide
Shared player/host behaviour: show only on `GAME_START`, remove after 3000ms or immediately when leaving play. Keep the overlay outside `#app` so ticks and prompt mirrors do not recreate it. It never steals focus, intercepts input, delays the server timer or replays on reconnect. The common stylesheet uses existing theme tokens, a responsive 26–48px main instruction and an 18–26px start label. Halloween adds the night SVG background, stitched 64px/12px panel corners, and the existing pumpkin/bat crest flanked by two gently animated ghosts. All decorative icons are hidden from assistive technology; the announcement is a polite live status. Forced colours removes illustrations and restores system colours.

## Assets and accessibility
Repo-native SVGs under `public/themes/halloween/`: night scenery, pumpkin/bat crest, web corner, hourglass, friendly ghost, paired jack-o'-lanterns and a friendly flying bat. The new illustrations reuse the documented UI palette and SVG shading colours. A static, fixed `body::after` layer places two ghosts in the desktop side gutters and pumpkin pairs at the bottom corners, behind the application with no hit testing. At ≤720px only one 112×78px pumpkin pair remains in that layer; entrance ghosts remain visible. Game editor/dashboard scenery opacity drops to .3. Forced-colors hides this additional layer too. Decorations are local CSS backgrounds. The client lobby adds five aria-hidden background spans plus an accessible animation pause button; the start guide adds its live-status text. No remote assets or decorative hit targets. No third-party asset/font calls. Backgrounds remain behind the application; component pseudo-elements use `pointer-events: none`. Focus ring: visible 3px frost outline + 4px offset on buttons; existing 4px frost focus shadow on inputs. Buttons minimum 48px tall (above the 44px touch-target minimum). Body/placeholder/control text target WCAG AA; semantic error/warning/success colours remain distinct. Mobile decorations simplify and the game uses its existing stacked layout. Forced-colors removes decoration and restores native control outlines/backgrounds.
