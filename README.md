# TCGPlaytest - Next.js Application

A Next.js conversion of the TCGPlaytest custom card printing application, optimized for performance while maintaining all original UI and functionality.

## Features

- **Custom Card Design**: Upload and customize card fronts and backs
- **Print Preparation**: Adjust trim and bleed settings for professional printing
- **Deck Management**: Import cards from text lists or XML files (MPCFill)
- **Card Finishes**: Support for standard, rainbow foil, piano gloss, and spot silver finishes
- **Preview Grid**: Visual preview of your entire deck
- **Export**: Download fronts, backs, and masks as ZIP files

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles and Tailwind CSS
├── components/
│   ├── Navigation.tsx      # Navigation bar
│   ├── LandingView.tsx      # Landing page
│   ├── HowItWorksView.tsx   # How it works page
│   ├── PricingView.tsx      # Pricing page
│   ├── DesignStepper.tsx    # Main design stepper
│   ├── Sidebar.tsx          # Sidebar with upload and prep controls
│   ├── EditorView.tsx       # Card editor view
│   ├── PreviewGrid.tsx      # Preview grid for step 3
│   ├── InspectorModal.tsx   # Card inspector modal
│   ├── VersionsModal.tsx    # Art versions modal
│   └── ImportModal.tsx      # Import card list modal
├── contexts/
│   └── AppContext.tsx       # Global state management
└── utils/
    ├── imageProcessing.ts   # Image processing utilities
    ├── zipDownload.ts       # ZIP file generation
    ├── deckStats.ts         # Deck statistics calculation
    ├── fileHandling.ts      # File upload handling
    ├── xmlHandling.ts       # XML file parsing
    └── modalHelpers.ts      # Modal helper functions
```

## Key Improvements

1. **Performance Optimizations**:
   - Code splitting with Next.js automatic code splitting
   - Image optimization with Next.js Image component (where applicable)
   - Client-side rendering only where needed
   - Efficient state management with React Context

2. **Modern React Patterns**:
   - TypeScript for type safety
   - React Hooks for state management
   - Component-based architecture
   - Proper separation of concerns

3. **Maintained Functionality**:
   - All original features preserved
   - Same UI/UX as original
   - All animations and interactions intact
   - Dark mode support

## Technologies Used

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **JSZip**: ZIP file generation
- **FileSaver.js**: File downloads

## Notes

- The application uses client-side rendering for most components due to the interactive nature of the card editor
- Image processing happens in the browser using Canvas API
- External API calls to Scryfall are made from the client side
- All state is managed client-side using React Context

## License

Same as the original project.

