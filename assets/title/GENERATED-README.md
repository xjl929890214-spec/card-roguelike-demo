# Title screen — AI-generated batch (prototype)

Generated for layered title screen assembly. **Transparent PNGs** (user-provided batch) use filenames without spaces.

Intrinsic sizes used in HTML/CSS:
- `title_skyline.png` 1536×429
- `title_neon_casino.png` 998×812
- `title_neon_spade.png` 1144×993
- `title_card_center.png` 760×986
- `title_btn_play.png` 1435×527
- `title_btn_options.png` 1368×455
- `title_btn_continue.png` 1407×426

| File | Use |
|------|-----|
| `title_master.png` | Full-screen reference / fallback background |
| `title_bg_sky.png` | Night sky + grid layer |
| `title_skyline.png` | City silhouette (align bottom) |
| `title_neon_casino.png` | Left CASINO neon |
| `title_neon_spade.png` | Right spade neon building |
| `title_card_center.png` | Central joker card (title lockup) |
| `title_card_corner_1.png` | Corner floater (duplicate ×4 in CSS or generate 3 more) |
| `title_btn_play.png` | PLAY button sprite |
| `title_btn_options.png` | OPTIONS button sprite |
| `title_btn_continue.png` | CONTINUE button (injected when save exists) |

**Not generated yet:** `title_skyline_glow.png`, corner cards 2–4, title wordmarks (JOKER/STATE), tagline strip.

**Next:** Agent mode — wire `index.html` + animations (float, glow).
