/**
 * E2E Test Utilities
 * Common utilities for Playwright tests
 */

import { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Login to the application
 */
export async function login(page: Page, email: string = 'test@example.com', password: string = 'password123') {
  await page.goto('http://127.0.0.1:5173');

  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForNavigation();
}

/**
 * Create a test schedule
 */
export async function createTestSchedule(page: Page, options: {
  title: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  status?: string;
} = {
  title: 'Test Schedule',
  status: 'pending',
}) {
  // Navigate to schedule page
  await page.goto('http://127.0.0.1:5173/schedule');

  // Wait for page to load
  await page.waitForSelector('text=日程管理', { timeout: 10000 });

  // Click "New Schedule" button
  await page.click('button:has-text("新建日程")');

  // Wait for form to appear
  await page.waitForSelector('text=新建日程', { timeout: 5000 });

  // Fill in form
  await page.fill('input[name="title"]', options.title);
  await page.fill('input[name="start_date"]', options.start_date || '2026-02-20');
  if (options.end_date) {
    await page.fill('input[name="end_date"]', options.end_date);
  }
  if (options.description) {
    await page.fill('textarea[name="description"]', options.description);
  }
  if (options.status) {
    await page.selectOption('select[name="status"]', options.status);
  }

  // Submit form
  await page.click('button:has-text("保存")');

  // Wait for success message
  await page.waitForSelector('text=保存成功', { timeout: 5000 });

  // Verify schedule was created
  await expect(page.locator(`text=${options.title}`)).toBeVisible({ timeout: 5000 });
}

/**
 * Create a test task
 */
export async function createTestTask(page: Page, options: {
  team_id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
} = {
  title: 'Test Task',
  status: 'pending',
  priority: 'medium',
}) {
  // Navigate to tasks page
  await page.goto('http://127.0.0.1:5173/tasks');

  // Wait for page to load
  await page.waitForSelector('text=任务管理', { timeout: 10000 });

  // Click "Create Task" button
  await page.click('button:has-text("创建任务")');

  // Wait for form to appear
  await page.waitForSelector('text=创建任务', { timeout: 5000 });

  // Fill in form
  if (options.team_id) {
    await page.selectOption('select[name="team_id"]', options.team_id);
  }
  await page.fill('input[name="title"]', options.title);
  if (options.description) {
    await page.fill('textarea[name="description"]', options.description);
  }
  if (options.status) {
    await page.selectOption('select[name="status"]', options.status);
  }
  if (options.priority) {
    await page.selectOption('select[name="priority"]', options.priority);
  }

  // Submit form
  await page.click('button:has-text("保存")');

  // Wait for success message
  await page.waitForSelector('text=创建成功', { timeout: 5000 });

  // Verify task was created
  await expect(page.locator(`text=${options.title}`)).toBeVisible({ timeout: 5000 });
}

/**
 * Delete a test schedule
 */
export async function deleteTestSchedule(page: Page, title: string) {
  // Navigate to schedule page
  await page.goto('http://127.0.0.1:5173/schedule');

  // Wait for page to load
  await page.waitForSelector('text=日程管理', { timeout: 10000 });

  // Find and click delete button
  const deleteButton = page.locator(`button:has-text("删除")`).first();
  if (await deleteButton.isVisible()) {
    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("确定")');

    // Wait for success message
    await page.waitForSelector('text=删除成功', { timeout: 5000 });

    // Verify schedule was deleted
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Delete a test task
 */
export async function deleteTestTask(page: Page, title: string) {
  // Navigate to tasks page
  await page.goto('http://127.0.0.1:5173/tasks');

  // Wait for page to load
  await page.waitForSelector('text=任务管理', { timeout: 10000 });

  // Find and click delete button
  const deleteButton = page.locator(`button:has-text("删除")`).first();
  if (await deleteButton.isVisible()) {
    await deleteButton.click();

    // Confirm deletion
    await page.click('button:has-text("确定")');

    // Wait for success message
    await page.waitForSelector('text=删除成功', { timeout: 5000 });

    // Verify task was deleted
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Update schedule status
 */
export async function updateScheduleStatus(page: Page, newStatus: string) {
  // Navigate to schedule page
  await page.goto('http://127.0.0.1:5173/schedule');

  // Wait for page to load
  await page.waitForSelector('text=日程管理', { timeout: 10000 });

  // Find and click status button
  const statusButton = page.locator(`button:has-text("${newStatus}")`).first();
  if (await statusButton.isVisible()) {
    await statusButton.click();

    // Wait for success message
    await page.waitForSelector('text=更新成功', { timeout: 5000 });
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(page: Page, newStatus: string) {
  // Navigate to tasks page
  await page.goto('http://127.0.0.1:5173/tasks');

  // Wait for page to load
  await page.waitForSelector('text=任务管理', { timeout: 10000 });

  // Find and click status button
  const statusButton = page.locator(`button:has-text("${newStatus}")`).first();
  if (await statusButton.isVisible()) {
    await statusButton.click();

    // Wait for success message
    await page.waitForSelector('text=更新成功', { timeout: 5000 });
  }
}

/**
 * Wait for page to be loaded
 */
export async function waitForPageLoad(page: Page, timeout: number = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a screenshot of the page
 */
export async function takeScreenshot(page: Page, fileName: string) {
  await page.screenshot({ path: `e2e/screenshots/${fileName}.png`, fullPage: true });
}

/**
 * Wait for element to be visible
 */
export async function waitForVisible(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Wait for element to disappear
 */
export async function waitForHidden(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(`${selector}:not(:visible)`, { timeout });
}

/**
 * Click element if visible
 */
export async function clickIfVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  if (await element.isVisible()) {
    await element.click();
  }
}

/**
 * Fill form field if visible
 */
export async function fillFieldIfVisible(page: Page, selector: string, value: string) {
  const element = page.locator(selector);
  if (await element.isVisible()) {
    await element.fill(value);
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}
