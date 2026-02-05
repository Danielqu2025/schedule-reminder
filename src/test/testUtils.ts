/**
 * Testing Utility Functions
 */

import { vi } from 'vitest';

/**
 * Mocks window.matchMedia for responsive testing
 */
export const mockMatchMedia = (matches: boolean = true) => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

/**
 * Waits for a specified time (useful for async testing)
 */
export const waitForTime = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Creates a mock file for testing file uploads
 */
export const createMockFile = (name: string, type: string, content: string) => {
  return new File([content], name, { type });
};

/**
 * Mocks the clipboard API
 */
export const mockClipboard = {
  writeText: vi.fn(),
  readText: vi.fn(),
};

export const setupClipboardMock = () => {
  Object.assign(navigator, {
    clipboard: mockClipboard,
  });
};
