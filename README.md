# Hiker
> File manager in react [ink](https://github.com/vadimdemedes/ink)

![hiker](https://user-images.githubusercontent.com/5688346/89723496-f5d9eb80-d9bc-11ea-9075-db701e218c5c.png)

This is a tiny file manager written as a proof of concept to see how well ink would be suitable to build terminal apps of medium complexity.
It is inspired by [ranger](https://github.com/ranger/ranger). It uses [ink](https://github.com/vadimdemedes/ink) for UI, [redux](https://github.com/reduxjs/redux) and [redux-loop](https://github.com/redux-loop/redux-loop) for state management.

# Install
`npm install -g @heruka_urgyen/hiker`

# Use
Run it as `hiker`.
Use vi keybindings (`h`, `j`, `k`, `l`, `gg`, `shift+g`) or arrows + enter to navigate around.
Pressing `/` toggles search in folder.

# Run locally
1. Clone this repository `https://github.com/heruka-urgyen/hiker.git`
2. Run `npm install`
3. Run `npm run dev` to start a dev loop that watches files for changes, builds the app, runs tests, and lints the code. Restarting the app on build is currently not possible, so it should be run manually by `npm run app` or `node dist/index.js`
4. Run `npm start` to just build and run the app

# TODO
- [ ] add external config
- [ ] display metadata in status bar
- [ ] allow running shell commands
- [ ] add directory sizes
- [ ] add custom previews to support code highlighting
- [ ] write tests for UI
