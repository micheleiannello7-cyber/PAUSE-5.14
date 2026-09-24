# Iteration 12 — final quality-control and verification

- Frontend gesture tests from iteration_12 passed; no further frontend edits afterwards.
- Provider error confirmed in batch log: **Budget has been exceeded**. The `ChatError` is not a separate application bug.
  One-concurrency run stopped with17 paid generations; no subsequent AI requests or automatic retries.
- Final published count differs from the initial testing snapshot:16 new covers, not17.
  The saying-no portrait had a rectangle obscuring the eyes/forehead and was rejected rather than published broken.
  Its paid original remains archived under `memory/cover_batches/rejected/`; no generated source remains in `covers/`.
- Four newly generated images received no-AI local cleanups: native portrait crops for wildlife/posture/chess,
  and fabricated title/shadow removal for archaeology. No old covers modified. Originals archived.
- Final batch report: `memory/cover_batches/56ba5742cf674cb7a8acbbc14cf85680.json`;
  generated=16, rejected=1, published=16, historical ok=17, status=stopped, stop_reason=budget_or_quota.
- Catalog:412/437 covered,25 missing (24 never completed +1 rejected). Baseline396 preserved.
- Re-ran existing suites after publication, without AI: **11/11 PASS** in `pytest/iter31_final.xml`.
  Checks include all32 media endpoints of the16 newly published covers, real portrait WebP, maximum sizes,
  persisted references, discover batching, category media, backend health and disabled TTS/Stripe.
- Visual checks: `/tmp/pause-cover-cleanups-final.jpg` and iteration_12 held-gesture screenshot inspected.
- Remaining blocker: credit availability for25 covers. Do not automatically restart generation.