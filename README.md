# 🧠 Synapse Extension

> AI-powered web page summarization and knowledge extraction Chrome extension

**Google Chrome Built-in AI Challenge 2025**

Synapse is a modern Chrome extension that leverages Google's Built-in AI (Gemini Nano) to intelligently extract, summarize, and organize web page content. Built with React, TypeScript, and Tailwind CSS, it features a beautiful glassmorphism design and seamless AI integration.

## ✨ Features

- 🤖 **AI-Powered Summarization**: Uses Chrome's built-in Gemini Nano to generate intelligent summaries
- 📊 **Structured Data Extraction**: Automatically extracts key-value pairs from web pages
- 💬 **Interactive Chat**: Refine summaries and data through natural conversation with AI
- 💾 **Local Storage**: Save your summaries to a local database (IndexedDB via Dexie)
- 🎨 **Modern UI**: Beautiful glassmorphism design with smooth animations
- ⚡ **Fast & Lightweight**: Built with Vite for optimal performance

## 🎨 Screenshots

The extension features a modern glassmorphism design with:
- Purple-to-pink gradient color scheme
- Smooth animations and transitions
- Intuitive chat-based interface
- Responsive layout optimized for Chrome's side panel

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 5
- **Database**: Dexie (IndexedDB wrapper)
- **AI**: Chrome Built-in AI (Gemini Nano)
- **Icons**: Heroicons (SVG)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Chrome** (v121 or higher)
- **Chrome Built-in AI enabled** (see instructions below)

### Enabling Chrome Built-in AI

To use Gemini Nano in Chrome:

1. Open Chrome and navigate to `chrome://flags`
2. Search for "Optimization Guide On Device Model"
3. Enable the flag and set it to "Enabled BypassPerfRequirement"
4. Search for "Prompt API for Gemini Nano"
5. Enable this flag as well
6. Relaunch Chrome
7. Open DevTools Console and verify by typing:
   ```javascript
   await ai.canCreateTextSession()
   ```
   It should return `"readily"` if properly configured.

## 🚀 Getting Started

### Installation for Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/tsaichen1o/synapse-extension.git
   cd synapse-extension
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start development server** (optional, for testing)
   ```bash
   yarn dev
   ```
   Visit `http://localhost:5173/sidepanel.html` to preview the UI

4. **Build the extension**
   ```bash
   yarn build
   ```
   This creates a `dist/` folder with the compiled extension

### Loading the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to the `dist/` folder in your project directory
   - Select the folder and click "Open"

4. **Verify Installation**
   - You should see the Synapse extension card appear
   - The extension icon should appear in your Chrome toolbar
   - Click the icon to open the side panel

### Using the Extension

1. **Navigate to any web page** you want to summarize
2. **Click the Synapse icon** in Chrome's toolbar
3. **Click "擷取此頁面"** (Capture Page) button
4. **Wait for AI to analyze** the page content
5. **Chat with AI** to refine the summary
6. **Save to database** for future reference

## 📂 Project Structure

```
synapse-extension/
├── src/
│   ├── background/         # Service worker
│   │   └── background.ts
│   ├── content/           # Content scripts
│   │   └── content.ts
│   ├── lib/               # Core libraries
│   │   ├── ai.ts         # AI integration
│   │   └── db.ts         # Database (Dexie)
│   └── sidepanel/         # Main UI
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── public/
│   ├── manifest.json      # Extension manifest
│   └── icons/            # Extension icons
├── dist/                  # Built extension (generated)
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build extension for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build` to rebuild
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Synapse extension card
5. Test your changes

### Hot Reload

For faster development, you can use the dev server to preview UI changes:

```bash
npm run dev
```

Then open `http://localhost:5173/sidepanel.html` in your browser. Note that Chrome extension APIs won't work in this mode, but you can test UI and styling changes.

## 🔧 Configuration

### Manifest V3

The extension uses Manifest V3 with the following key features:
- Side panel UI
- Service worker background script
- Scripting API for content injection
- Storage API for local data

### Tailwind CSS

Custom theme configuration includes:
- Purple-to-pink gradient colors
- Glassmorphism utilities
- Custom animations
- Responsive breakpoints

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 Google Chrome Built-in AI Challenge 2025

This project is submitted for the Google Chrome Built-in AI Challenge 2025. It demonstrates the capabilities of Chrome's built-in AI APIs (Gemini Nano) for creating intelligent browser extensions.

### Challenge Goals

- ✅ Utilize Chrome's Built-in AI (Gemini Nano)
- ✅ Create a practical and useful application
- ✅ Demonstrate modern web development practices
- ✅ Provide excellent user experience

## 🙏 Acknowledgments

- Google Chrome team for the Built-in AI APIs
- Tailwind CSS for the styling framework
- Heroicons for the beautiful icons
- The open-source community

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ for the Chrome Built-in AI Challenge 2025**


