import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect, CSSProperties } from "react";

// Note: label-tokens.scss is imported via the global styles in preview.scss
// which imports @humansignal/ui styles that include the label tokens.

/**
 * Token definitions with light and dark mode values
 */
interface TokenDefinition {
  name: string;
  cssVar: string;
  lightValue: string;
  darkValue: string;
  description?: string;
}

const PRIMARY_TOKENS: TokenDefinition[] = [
  {
    name: "Primary",
    cssVar: "--label-primary",
    lightValue: "#1890ff",
    darkValue: "#177ddc",
    description: "Primary action color",
  },
  {
    name: "Primary Hover",
    cssVar: "--label-primary-hover",
    lightValue: "#40a9ff",
    darkValue: "#3c9ae8",
    description: "Primary hover state",
  },
  {
    name: "Primary Active",
    cssVar: "--label-primary-active",
    lightValue: "#096dd9",
    darkValue: "#1765ad",
    description: "Primary active/pressed state",
  },
  {
    name: "Primary Background",
    cssVar: "--label-primary-bg",
    lightValue: "#e6f7ff",
    darkValue: "#111d2c",
    description: "Primary subtle background",
  },
  {
    name: "Primary Border",
    cssVar: "--label-primary-border",
    lightValue: "#91d5ff",
    darkValue: "#15395b",
    description: "Primary border color",
  },
];

const NEUTRAL_TOKENS: TokenDefinition[] = [
  {
    name: "Background Base",
    cssVar: "--label-bg-base",
    lightValue: "#fff",
    darkValue: "#1f1f1f",
    description: "Base background color",
  },
  {
    name: "Background Content",
    cssVar: "--label-bg-content",
    lightValue: "#f0f4f8",
    darkValue: "#141414",
    description: "Content area background",
  },
  {
    name: "Background Hover",
    cssVar: "--label-bg-hover",
    lightValue: "#f5f5f5",
    darkValue: "#2a2a2a",
    description: "Hover state background",
  },
  {
    name: "Border Base",
    cssVar: "--label-border-base",
    lightValue: "#e8e8e8",
    darkValue: "#434343",
    description: "Default border color",
  },
  {
    name: "Border Light",
    cssVar: "--label-border-light",
    lightValue: "#d9d9d9",
    darkValue: "#303030",
    description: "Lighter border variant",
  },
  {
    name: "Text Primary",
    cssVar: "--label-text-primary",
    lightValue: "#333",
    darkValue: "#f0f0f0",
    description: "Primary text color",
  },
  {
    name: "Text Secondary",
    cssVar: "--label-text-secondary",
    lightValue: "#666",
    darkValue: "#a6a6a6",
    description: "Secondary text color",
  },
  {
    name: "Text Muted",
    cssVar: "--label-text-muted",
    lightValue: "#999",
    darkValue: "#6b6b6b",
    description: "Muted/disabled text color",
  },
];

const MODULE_TOKENS: TokenDefinition[] = [
  {
    name: "Competency Background",
    cssVar: "--label-competency-bg",
    lightValue: "#e8f4fc",
    darkValue: "#112a45",
    description: "Competency module background",
  },
  {
    name: "Competency Border",
    cssVar: "--label-competency-border",
    lightValue: "#b3d4ea",
    darkValue: "#1c3a5f",
    description: "Competency module border",
  },
  {
    name: "Training Background",
    cssVar: "--label-training-bg",
    lightValue: "#f0f7ed",
    darkValue: "#162312",
    description: "Training module background",
  },
  {
    name: "Training Border",
    cssVar: "--label-training-border",
    lightValue: "#c5ddb8",
    darkValue: "#274916",
    description: "Training module border",
  },
  {
    name: "Threat Background",
    cssVar: "--label-threat-bg",
    lightValue: "#fef6f0",
    darkValue: "#2b1d11",
    description: "Threat module background",
  },
  {
    name: "Threat Border",
    cssVar: "--label-threat-border",
    lightValue: "#e8cfc0",
    darkValue: "#4a3220",
    description: "Threat module border",
  },
  {
    name: "Error Background",
    cssVar: "--label-error-bg",
    lightValue: "#fef4f3",
    darkValue: "#2a1215",
    description: "Error module background",
  },
  {
    name: "Error Border",
    cssVar: "--label-error-border",
    lightValue: "#e8c8c5",
    darkValue: "#48181c",
    description: "Error module border",
  },
  {
    name: "UAS Background",
    cssVar: "--label-uas-bg",
    lightValue: "#f7f3fc",
    darkValue: "#1a1325",
    description: "UAS (Undesired Aircraft State) background",
  },
  {
    name: "UAS Border",
    cssVar: "--label-uas-border",
    lightValue: "#d4c8e8",
    darkValue: "#301c4d",
    description: "UAS module border",
  },
  {
    name: "Result Background",
    cssVar: "--label-result-bg",
    lightValue: "#f0f7fa",
    darkValue: "#111b26",
    description: "Result module background",
  },
  {
    name: "Result Border",
    cssVar: "--label-result-border",
    lightValue: "#b8d8e8",
    darkValue: "#164c7e",
    description: "Result module border",
  },
  {
    name: "Labeling Background",
    cssVar: "--label-labeling-bg",
    lightValue: "#f5f8fc",
    darkValue: "#141620",
    description: "Labeling module background",
  },
  {
    name: "Labeling Border",
    cssVar: "--label-labeling-border",
    lightValue: "#ccd9e8",
    darkValue: "#1d2436",
    description: "Labeling module border",
  },
];

/**
 * ColorSwatch component displays a single color token with its visual representation
 * and metadata about light/dark mode values.
 */
interface ColorSwatchProps {
  token: TokenDefinition;
  showValues?: boolean;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ token, showValues = true }) => {
  const swatchStyle: CSSProperties = {
    width: "100%",
    height: "60px",
    backgroundColor: `var(${token.cssVar})`,
    borderRadius: "8px 8px 0 0",
    border: `1px solid var(--label-border-base)`,
    borderBottom: "none",
  };

  const infoStyle: CSSProperties = {
    padding: "12px",
    backgroundColor: "var(--label-bg-base)",
    border: `1px solid var(--label-border-base)`,
    borderRadius: "0 0 8px 8px",
  };

  const nameStyle: CSSProperties = {
    fontWeight: 600,
    fontSize: "14px",
    color: "var(--label-text-primary)",
    marginBottom: "4px",
  };

  const varStyle: CSSProperties = {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "var(--label-text-secondary)",
    marginBottom: "8px",
    wordBreak: "break-all",
  };

  const valueContainerStyle: CSSProperties = {
    display: "flex",
    gap: "16px",
    fontSize: "11px",
  };

  const valueStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--label-text-muted)",
  };

  const colorDotStyle = (color: string): CSSProperties => ({
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: color,
    border: "1px solid var(--label-border-light)",
    flexShrink: 0,
  });

  const descriptionStyle: CSSProperties = {
    fontSize: "11px",
    color: "var(--label-text-muted)",
    marginTop: "6px",
    fontStyle: "italic",
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={swatchStyle} />
      <div style={infoStyle}>
        <div style={nameStyle}>{token.name}</div>
        <div style={varStyle}>{token.cssVar}</div>
        {showValues && (
          <div style={valueContainerStyle}>
            <div style={valueStyle}>
              <div style={colorDotStyle(token.lightValue)} />
              <span>Light: {token.lightValue}</span>
            </div>
            <div style={valueStyle}>
              <div style={colorDotStyle(token.darkValue)} />
              <span>Dark: {token.darkValue}</span>
            </div>
          </div>
        )}
        {token.description && <div style={descriptionStyle}>{token.description}</div>}
      </div>
    </div>
  );
};

/**
 * Section component for grouping tokens
 */
interface TokenSectionProps {
  title: string;
  description?: string;
  tokens: TokenDefinition[];
  columns?: number;
}

const TokenSection: React.FC<TokenSectionProps> = ({ title, description, tokens, columns = 3 }) => {
  const sectionStyle: CSSProperties = {
    marginBottom: "32px",
  };

  const titleStyle: CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--label-text-primary)",
    marginBottom: "8px",
    borderBottom: "2px solid var(--label-primary)",
    paddingBottom: "8px",
  };

  const descriptionStyle: CSSProperties = {
    fontSize: "14px",
    color: "var(--label-text-secondary)",
    marginBottom: "16px",
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "16px",
  };

  return (
    <div style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      {description && <p style={descriptionStyle}>{description}</p>}
      <div style={gridStyle}>
        {tokens.map((token) => (
          <ColorSwatch key={token.cssVar} token={token} />
        ))}
      </div>
    </div>
  );
};

/**
 * Theme Toggle component for the story
 */
const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme from document
    const currentScheme = document.documentElement.getAttribute("data-color-scheme");
    setIsDark(currentScheme === "dark");

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-color-scheme") {
          const newScheme = document.documentElement.getAttribute("data-color-scheme");
          setIsDark(newScheme === "dark");
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-color-scheme", newTheme);
    setIsDark(!isDark);
  };

  const buttonStyle: CSSProperties = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid var(--label-primary-border)",
    backgroundColor: "var(--label-primary-bg)",
    color: "var(--label-primary)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <button style={buttonStyle} onClick={toggleTheme}>
      {isDark ? "Light Mode" : "Dark Mode"}
      <span style={{ fontSize: "16px" }}>{isDark ? "\u2600" : "\u263E"}</span>
    </button>
  );
};

/**
 * Container component for token stories
 */
interface TokenContainerProps {
  children: React.ReactNode;
  showThemeToggle?: boolean;
}

const TokenContainer: React.FC<TokenContainerProps> = ({ children, showThemeToggle = true }) => {
  const containerStyle: CSSProperties = {
    padding: "24px",
    backgroundColor: "var(--label-bg-content)",
    minHeight: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--label-border-base)",
  };

  const titleStyle: CSSProperties = {
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--label-text-primary)",
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Label Component Tokens</h1>
        {showThemeToggle && <ThemeToggle />}
      </div>
      {children}
    </div>
  );
};

/**
 * Main component for displaying all tokens
 */
const AllTokensDisplay: React.FC = () => {
  return (
    <TokenContainer>
      <TokenSection
        title="Primary Colors"
        description="Primary action colors based on Ant Design blue (#1890ff). Used for buttons, links, and interactive elements."
        tokens={PRIMARY_TOKENS}
        columns={5}
      />
      <TokenSection
        title="Neutral Colors"
        description="Background, border, and text colors for general UI elements."
        tokens={NEUTRAL_TOKENS}
        columns={4}
      />
      <TokenSection
        title="Module Colors"
        description="Semantic colors for different modules in the Label component. Each module has a background and border color."
        tokens={MODULE_TOKENS}
        columns={4}
      />
    </TokenContainer>
  );
};

/**
 * Component for displaying primary colors only
 */
const PrimaryColorsDisplay: React.FC = () => {
  return (
    <TokenContainer>
      <TokenSection
        title="Primary Colors"
        description="Primary action colors based on Ant Design blue (#1890ff). Used for buttons, links, and interactive elements."
        tokens={PRIMARY_TOKENS}
        columns={5}
      />
    </TokenContainer>
  );
};

/**
 * Component for displaying neutral colors only
 */
const NeutralColorsDisplay: React.FC = () => {
  return (
    <TokenContainer>
      <TokenSection
        title="Neutral Colors"
        description="Background, border, and text colors for general UI elements."
        tokens={NEUTRAL_TOKENS}
        columns={4}
      />
    </TokenContainer>
  );
};

/**
 * Component for displaying module colors only
 */
const ModuleColorsDisplay: React.FC = () => {
  return (
    <TokenContainer>
      <TokenSection
        title="Module Colors"
        description="Semantic colors for different modules in the Label component. Each module has a background and border color."
        tokens={MODULE_TOKENS}
        columns={4}
      />
    </TokenContainer>
  );
};

// Storybook Meta configuration
const meta: Meta = {
  title: "Design Tokens/Label Tokens",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## Label Component Color Tokens

This story showcases all 27 CSS custom properties (tokens) for the Label component.
These tokens enable theme consistency with LabelStudio and support dark mode.

### Token Categories

- **Primary Colors (5 tokens)**: Based on Ant Design blue for actions and interactive elements
- **Neutral Colors (8 tokens)**: Backgrounds, borders, and text colors
- **Module Colors (14 tokens)**: Semantic colors for different aviation safety modules

### Usage

Import the tokens in your SCSS or CSS:

\`\`\`scss
@import '@humansignal/ui/tokens/label-tokens';

.my-component {
  background-color: var(--label-bg-base);
  color: var(--label-text-primary);
  border: 1px solid var(--label-border-base);
}
\`\`\`

### Dark Mode

Dark mode is automatically applied when the \`data-color-scheme="dark"\` attribute
is set on the document root. Use the theme toggle in the Storybook toolbar or
click the button within each story to preview dark mode.
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

/**
 * All 27 label tokens organized by category
 */
export const AllTokens: Story = {
  render: () => <AllTokensDisplay />,
};

/**
 * Primary colors based on Ant Design blue
 */
export const PrimaryColors: Story = {
  render: () => <PrimaryColorsDisplay />,
};

/**
 * Neutral colors for backgrounds, borders, and text
 */
export const NeutralColors: Story = {
  render: () => <NeutralColorsDisplay />,
};

/**
 * Module-specific colors for aviation safety categories
 */
export const ModuleColors: Story = {
  render: () => <ModuleColorsDisplay />,
};
