# ChatGPT Search Query

A browser extension that extracts and displays the hidden search queries ChatGPT uses internally when researching topics.

## Installation

### Chrome
1. Run `npm install && npm run build:chrome`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist_chrome` folder

### Firefox
1. Run `npm install && npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in the `dist_firefox` folder

## Development

```bash
npm install
npm run dev          # Chrome
npm run dev:firefox  # Firefox
```

## License

MIT

## Author

Ahmet Yigit Budak
