# Release Checklist

## Code

- [ ] All tests passing
- [ ] No console logs or debug leftovers
- [ ] Version bumped (`npm run release`)

## Features

- [ ] CLI tested
- [ ] Plugins tested (Mongo, Redis, OTel)
- [ ] Metrics endpoint verified

## Docs

- [ ] README updated
- [ ] New features documented
- [ ] Examples added

## Package

- [ ] `npm pack` checked
- [ ] Only required files included

## Release

- [ ] Git tag created
- [ ] Pushed with tags
- [ ] GitHub Actions passed
- [ ] Package published on npm

## Post-release

- [ ] Verify npm page
- [ ] Test install in fresh project
- [ ] Announce (LinkedIn or Dev.to)