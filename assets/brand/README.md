# Bazaar — brand

The Ping mark, with Bazaar's centre glyph and Bazaar's accent. The ring and the blip are
frozen (PING.md §3.1) — they are what makes the six apps read as a set on a launcher. Only
the glyph and the colour change.

## The glyph

A shopping basket — a wide, low handle over a rim bar over a tapering body — in one
`evenodd` path with no stroke. A bazaar is a market, and the basket is the one object
everyone in it is carrying. Three things about it are load-bearing:

- **The rim bar overhangs the body.** Without it the handle meets the body directly and the
  mark reads as a padlock — the first draft did, and it was a padlock at 16px.
- **The handle is wide and low** (20 units across, 8 high), a half-ellipse rather than a
  half-circle, for the same reason: a tall tight arch is a shackle.
- **Two slits are knocked out of the body.** They are the weave; at 16px they soften to a
  texture and the silhouette still reads as a basket rather than a bucket.

| File | Contents | Use |
| --- | --- | --- |
| `logo.svg` | mark, accent-filled | `import Logo from '@/assets/brand/logo.svg'` |
| `logo-mono.svg` | same paths with `currentColor` | tintable — monochrome icon, inline glyph |
| `splash.svg` | same as `logo.svg` | splash / launch |
| `wordmark.svg` | mark + name, dark text | light backgrounds, README |
| `wordmark-dark.svg` | mark + name, light text | dark backgrounds, README dark mode |
| `google.svg` | Google's G | the OAuth button |

Every PNG under `assets/images/` is generated from `logo.svg` by `npm run icons`. Never
hand-edit them.

One flat colour, no gradients. `#F43E53` — the `--primary` token from `src/theme/colors.ts`.
The backdrop everywhere is `#09090B`.
