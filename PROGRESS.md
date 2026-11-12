# Progress

Milestones from the build brief. Each one ends with `npm run build`, typecheck, lint and a commit.

- [x] 1. Scaffold, tokens, fonts and the theme toggle with no-flash
- [x] 2. Page sections with real copy (static, no 3D yet), responsive
- [x] 3. Engine class, render loop and the studio environment
- [x] 4. Procedural parts, materials and the assembled Ortiplex
- [x] 5. Scroll cues and camera
- [x] 6. Exploded view, callouts and the blueprint toggle
- [x] 7. Clock, hold to ignite and Web Audio
- [x] 8. Post chain, adaptive quality and the loader
- [x] 9. Reduced-motion and no-WebGL fallbacks
- [ ] 10. Polish pass

Milestones 3 to 9 landed in one commit. The engine, parts, cues, post chain, ignite and the
fallback paths import each other, so they couldn't build or be tested in isolation. Each was still
checked against the build, typecheck, lint and the scripted checks before committing (see DECISIONS.md, D20).
