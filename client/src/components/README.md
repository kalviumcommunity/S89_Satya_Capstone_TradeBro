# TradeBro Components Organization

This directory contains all the React components for the TradeBro application, organized in a structured way to improve maintainability and readability.

## Directory Structure

```
components/
├── animations/       # Animation components
│   ├── AnimatedText.jsx
│   ├── FloatingElement.jsx
│   └── ...
│
├── common/           # Common UI components
│   ├── Button.jsx
│   ├── Input.jsx
│   └── ...
│
├── layout/           # Layout components
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── ...
│
├── specific/         # App-specific components
│   ├── StockChart.jsx
│   ├── TradingAssistant.jsx
│   └── ...
│
└── README.md         # This file
```

## Component Categories

### Animation Components

These components provide animation functionality to other components:

- `AnimatedText.jsx`: Animates text with various effects
- `FloatingElement.jsx`: Creates floating elements
- `HoverElement.jsx`: Adds hover effects to elements
- `ParallaxSection.jsx`: Creates parallax scrolling effects
- `ScrollReveal.jsx`: Reveals elements as they scroll into view
- `StaggerContainer.jsx`: Staggers animations of child elements

### Common Components

These are reusable UI components that can be used across the application:

- `Button.jsx`: Button component with various styles
- `Input.jsx`: Input component with validation
- `Card.jsx`: Card component for displaying content
- `Modal.jsx`: Modal component for displaying dialogs
- `Tooltip.jsx`: Tooltip component for displaying additional information

### Layout Components

These components define the layout of the application:

- `Sidebar.jsx`: Sidebar navigation
- `Header.jsx`: Header with navigation and user info
- `PageLayout.jsx`: Main page layout
- `Footer.jsx`: Footer with links and information

### Specific Components

These components are specific to the TradeBro application:

- `StockChart.jsx`: Displays stock charts
- `StockDetail.jsx`: Displays detailed stock information
- `TradingAssistant.jsx`: Provides trading assistance
- `WatchlistSearch.jsx`: Allows searching for stocks to add to watchlist

## Usage

Import components as needed in your pages or other components:

```jsx
import Button from '../components/common/Button';
import StockChart from '../components/specific/StockChart';
import { AnimatedText } from '../components/animations';
```

## Creating New Components

When creating a new component:

1. Determine which category it belongs to
2. Create a new file in the appropriate directory
3. Use the following template:

```jsx
import React from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

4. Create a corresponding CSS file in the `styles/components/` directory if needed

## Component Best Practices

- Keep components small and focused on a single responsibility
- Use PropTypes for type checking
- Provide default props when appropriate
- Use functional components with hooks instead of class components
- Extract complex logic into custom hooks
- Use meaningful component and prop names
- Document complex components with comments
