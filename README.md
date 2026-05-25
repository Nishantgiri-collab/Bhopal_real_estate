# 🏢 Bhopal Estates - Premium Real Estate & AI-Matching Platform

Bhopal Estates is a cutting-edge, premium web application designed to revolutionize the real estate experience in Bhopal. With a stunning glassmorphic dark mode UI, smooth micro-animations, and dynamic AI-powered matchmaking, it connects buyers, owners, and brokers seamlessly.

---

## 🚀 Getting Started

Follow these simple steps to run the application locally on your machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### Installation & Execution Commands

1. **Clone or Open the Repository Directory:**
   ```bash
   cd bhopal_real_estate
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Backend API:**
   ```bash
   npm run dev:server
   ```
   The API will run at [http://localhost:5000/](http://localhost:5000/).

4. **Start the Frontend Development Server:**
   Open a second terminal and run:
   ```bash
   npm run dev
   ```
   *The server will start, and the app will be accessible at: [http://localhost:5173/](http://localhost:5173/)*

   If PowerShell blocks `npm` with `npm.ps1 cannot be loaded`, use:
   ```bash
   npm.cmd run dev
   npm.cmd run dev:server
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

6. **Linting:**
   ```bash
   npm run lint
   ```

---

## ✨ Key Features

- **🏠 Home / Portal Landing:** Modern search bar with glassmorphic style filters (Location, Property Type, Budget) and a beautiful featured properties showcase.
- **🔍 Advanced Property Search:** Detailed property search with interactive filters, price sliders, and configuration toggles.
- **🤖 Lifestyle-Based AI Match:** A multi-step lifestyle recommendation wizard matching users to properties based on peacefulness, family size, and amenities.
- **💼 Broker Lead Dashboard:** Specialized portal with live lead marketplace, unlockable buyer details, and credit wallets.
- **💰 Premium Pricing Tiers:** Beautiful subscription models (Basic, Professional, Enterprise) for active brokers.
- **➕ List Your Property:** Interactive multi-step listing wizard for owners and agents.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 19 (Functional Components & Hooks)
- **Tooling & Bundler:** Vite (for ultra-fast Hot Module Replacement)
- **Styling:** Premium Vanilla CSS featuring glassmorphism, responsive grids, custom scrollbars, and sophisticated gradient backdrops.
- **Routing:** React Router DOM (v7)
- **Icons:** Lucide React
- **Animations:** Framer Motion (for smooth micro-interactions and transitions)

---

## 📂 Project Structure

```text
bhopal_real_estate/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Brand logos and images
│   ├── components/         # Reusable UI elements (Navbar, Button, PropertyCard)
│   ├── context/            # Global state managers / Context APIs
│   ├── pages/              # Platform Pages (Home, AIMatch, AddProperty, etc.)
│   ├── App.jsx             # Main routing and layout configuration
│   ├── index.css           # Global CSS variables, custom scrollbars, & theme settings
│   └── main.jsx            # Application entry point
├── package.json            # Scripts & dependencies configuration
├── vite.config.js          # Vite custom configuration
└── README.md               # Project documentation
```
