# content-ops

AI-assisted content operations for solo social media managers.

Managing content alone means juggling an idea bank, a posting calendar, captions for five platforms and a folder of half-finished drafts. content-ops puts that workflow in one page: type a topic, get a seven-day posting plan with hooks, captions, hashtags, CTAs and per-platform posting times, then track every post from idea to published.

## What it does

- **Planner** — turn one topic into a 7-day plan. Each day gets a platform, hook, caption skeleton, hashtag set, CTA and a suggested posting time based on per-platform presets.
- **Content board** — a four-stage pipeline (Idea, Drafting, Ready to post, Posted) so nothing sits forgotten.
- **Week calendar** — the generated plan laid out Monday to Sunday.
- **Repurposer** — paste a long article or script and get three short-video scripts (hook, beats, CTA) plus a five-slide carousel outline.
- **Exports** — download the whole week as a Markdown content calendar, or back everything up as JSON.
- **Optional AI polish** — add your own OpenAI-compatible API key and one click rewrites any caption in the plan. The key is stored only in your browser and calls go directly from your browser to the provider. Without a key, everything still works: the built-in generator runs offline.

## How it is built

Vanilla HTML, CSS and JavaScript. No build step, no framework, no server. Data persists in your browser with localStorage; nothing leaves your machine unless you turn on the optional AI feature with your own key.

## Run it

Open `index.html` in a browser, or visit the GitHub Pages deployment. The first visit loads three sample cards on the board so you can see the workflow; "Clear all data" in Export & AI removes them.

## Roadmap

- Multi-week planning and an at-a-glance month view
- CSV export for scheduling tools
- Template packs per niche
- Performance log: what you posted vs. what performed

## License

MIT
