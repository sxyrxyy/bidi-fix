# BiDi Fix-it 🡐

A lightweight, client-side tool to fix bidirectional text rendering issues. Fix mixed right-to-left (RTL) and left-to-right (LTR) text with a single click.

## Features

- 🔒 **Privacy First**: All processing happens in your browser - no data is sent to servers
- 🚀 **Lightning Fast**: Processes text instantly with no network calls
- 📱 **Responsive**: Works on both desktop and mobile browsers
- 🌓 **Dark Mode**: Automatically adapts to your system theme
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 📋 **Two Formats**: Get both HTML and plain text outputs
- 🎯 **Simple**: One paste, one click, done

## Usage

1. Open [BiDi Fix-it](https://[your-username].github.io/bidi-fix/)
2. Paste your mixed-direction text
3. Click "Fix it" (or press Ctrl+Enter)
4. Choose between HTML or plain text output
5. Click "Copy" to get the fixed text

## Development

```bash
# Clone the repository
git clone https://github.com/[your-username]/bidi-fix.git

# Run locally (requires Node.js)
npx serve .

# Or simply open index.html in your browser
```

## Security

- No external dependencies required
- No data collection or tracking
- No network calls
- Client-side processing only
- Input sanitization for HTML output

## License

MIT License - feel free to use, modify, and distribute.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- Uses [tiny-bidi.js](https://github.com/iamolegga/tiny-bidi) (optional) for Unicode BiDi algorithm
- Built with vanilla JavaScript (ES2020)
- No frameworks or build steps required 