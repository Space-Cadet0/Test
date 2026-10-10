# One Launcher

A unified, high-performance universal PC game launcher and library manager integrating **Steam**, **GOG**, **Epic Games Store**, and **Xbox** into a single cohesive experience.

---

## Features

- **Multi-Storefront Synchronization**:
  - Connect and synchronize your games and accounts across Steam, GOG, Epic Games Store, and Xbox.
  - Automatic entitlement merging: games owned across multiple storefronts are unified into a single canonical entry with multi-store badges.

- **Steam Storefront & Metadata Enrichment**:
  - High-resolution hero capsules, background art, and video trailers.
  - Critical acclaim summaries featuring official Steam reviews, OpenCritic score percentiles, and HowLongToBeat completion statistics.
  - Technical specifications, controller compatibility matrices (DualSense, DualShock, Xbox), accessibility features, and system requirements.

- **Entitlement-Aware Normalization**:
  - Smart metadata projection: games owned exclusively on non-Steam storefronts (e.g. Epic, GOG) automatically rebrand cross-store features (*Achievements*, *Cloud Saves*) and suppress store-exclusive services (*Steam Workshop*, *Family Sharing*, *Remote Play Together*).
  - Automatically restores all Steam-exclusive capabilities when a game is subsequently purchased on Steam.

- **Unified Achievement Tracking**:
  - Live progress and unlocked counts across Steam, GOG Galaxy, and Epic Games Store.
  - Real-time achievement metrics and completionist indicators.

- **Organization & Library Filtering**:
  - Custom game collections with instant management drawers.
  - Rich multi-parameter filtering by storefront, installed status, genres, tags, features, and OpenCritic tiers.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Desktop Runtime**: Electron 44, Node.js
- **Data & APIs**: Steam Store API, GOG Galaxy OAuth/Profile API, Epic Games Store API, HowLongToBeat, OpenCritic

---

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone git@github.com:Space-Cadet0/Test.git
cd Test

# Install dependencies
npm install
```

### Development

```bash
# Start Vite development server
npm run dev

# Launch Electron desktop application
npm run electron
```

### Production Build

```bash
# Compile TypeScript and build production bundle
npm run build

# Package macOS Desktop Application
npm run build:mac
```

---

## License

MIT
