/**
 * Test Setup File
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Mock localStorage
  vi.clearAllMocks();
  localStorage.clear();
});
