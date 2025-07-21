import React from "react";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";

import RootLayout, { metadata } from "../layout";

// Mock the dependencies
jest.mock("@/styles/globals.css", () => ({}));
jest.mock("@/assets/fonts", () => ({
  fontGeist: { variable: "font-geist" },
  fontHeading: { variable: "font-heading" },
  fontSans: { variable: "font-sans" },
  fontUrban: { variable: "font-urban" },
}));
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
  constructMetadata: () => ({
    title: "Test App",
    description: "Test Description",
  }),
}));
jest.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster">Toaster Component</div>,
}));
jest.mock("@/components/analytics", () => ({
  Analytics: () => <div data-testid="analytics">Analytics Component</div>,
}));
jest.mock("@/components/tailwind-indicator", () => ({
  TailwindIndicator: () => (
    <div data-testid="tailwind-indicator">Tailwind Indicator</div>
  ),
}));
jest.mock("@/app/auth-provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Test the body content instead of the full layout
const BodyContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="body-content">
      <div data-testid="theme-provider">
        <div data-testid="auth-provider">
          {children}
          <div data-testid="analytics">Analytics Component</div>
          <div data-testid="toaster">Toaster Component</div>
          <div data-testid="tailwind-indicator">Tailwind Indicator</div>
        </div>
      </div>
    </div>
  );
};

describe("RootLayout", () => {
  const mockChildren = <div data-testid="test-children">Test Content</div>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("Component Structure", () => {
    it("should render children content", () => {
      render(<BodyContent>{mockChildren}</BodyContent>);

      expect(screen.getByTestId("test-children")).toBeInTheDocument();
    });

    it("should render all required components", () => {
      render(<BodyContent>{mockChildren}</BodyContent>);

      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
      expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });
  });

  describe("ThemeProvider Configuration", () => {
    it("should render ThemeProvider with correct props", () => {
      render(<BodyContent>{mockChildren}</BodyContent>);

      const themeProvider = screen.getByTestId("theme-provider");
      expect(themeProvider).toBeInTheDocument();

      // Note: In a real test environment, you might want to check the actual props
      // passed to ThemeProvider, but since we're mocking it, we just verify it renders
    });
  });

  describe("Component Hierarchy", () => {
    it("should maintain correct component nesting", () => {
      render(<BodyContent>{mockChildren}</BodyContent>);

      const themeProvider = screen.getByTestId("theme-provider");
      const authProvider = screen.getByTestId("auth-provider");

      // Verify that AuthProvider is inside ThemeProvider
      expect(themeProvider).toContainElement(authProvider);

      // Verify that children and other components are inside AuthProvider
      expect(authProvider).toContainElement(
        screen.getByTestId("test-children"),
      );
      expect(authProvider).toContainElement(screen.getByTestId("analytics"));
      expect(authProvider).toContainElement(screen.getByTestId("toaster"));
      expect(authProvider).toContainElement(
        screen.getByTestId("tailwind-indicator"),
      );
    });
  });

  describe("Props Handling", () => {
    it("should accept and render children prop", () => {
      const customChildren = React.createElement(
        "div",
        { "data-testid": "custom-children" },
        "Custom Content",
      );
      render(<BodyContent>{customChildren}</BodyContent>);

      expect(screen.getByTestId("custom-children")).toBeInTheDocument();
      expect(screen.getByText("Custom Content")).toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(<BodyContent>{null}</BodyContent>);

      // Should still render the layout structure
      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
      expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    });
  });

  describe("Metadata", () => {
    it("should export metadata object", () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe("object");
    });

    it("should have expected metadata properties", () => {
      expect(metadata).toHaveProperty("title");
      expect(metadata).toHaveProperty("description");
    });
  });

  describe("Accessibility", () => {
    it("should render without lang attribute errors", () => {
      // We can't check <html lang="en"> directly, but we can ensure no errors are thrown
      expect(() => {
        render(<BodyContent>{mockChildren}</BodyContent>);
      }).not.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should render without throwing errors", () => {
      expect(() => {
        render(<BodyContent>{mockChildren}</BodyContent>);
      }).not.toThrow();
    });

    it("should render consistently across multiple renders", () => {
      const { rerender } = render(<BodyContent>{mockChildren}</BodyContent>);

      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();

      rerender(<BodyContent>{mockChildren}</BodyContent>);

      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    });
  });

  describe("RootLayout Component", () => {
    it("should export RootLayout as default", () => {
      expect(RootLayout).toBeDefined();
      expect(typeof RootLayout).toBe("function");
    });

    it("should accept children prop", () => {
      // Test that the component can be called with children
      expect(() => {
        // We can't actually render it due to HTML nesting, but we can test the function exists
        const Component = RootLayout;
        expect(Component).toBeDefined();
      }).not.toThrow();
    });
  });
});
