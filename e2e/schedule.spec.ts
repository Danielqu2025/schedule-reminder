import { test, expect } from '@playwright/test';

test.describe('PersonalSchedule Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login simulation
    await page.goto('http://127.0.0.1:5173');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto('http://127.0.0.1:5173/schedule');
  });

  test('should display the schedule page', async ({ page }) => {
    // Wait for the schedule page to load
    await expect(page.locator('h1')).toContainText('日程管理');

    // Check if schedule items are displayed
    await expect(page.locator('text=日程')).toBeVisible();
  });

  test('should display existing schedules', async ({ page }) => {
    // Wait for schedule list to load
    await page.waitForSelector('text=日程列表', { timeout: 10000 });

    // Check for schedule items
    const scheduleItems = page.locator('[class*="schedule-card"]');
    const count = await scheduleItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should create a new schedule', async ({ page }) => {
    // Click the "New Schedule" button
    await page.click('button:has-text("新建日程")');

    // Wait for the form to appear
    await page.waitForSelector('text=新建日程', { timeout: 5000 });

    // Fill in the schedule form
    await page.fill('input[name="title"]', 'Test Schedule');
    await page.fill('input[name="start_date"]', '2026-02-20');
    await page.fill('textarea[name="description"]', 'This is a test schedule');

    // Click the submit button
    await page.click('button:has-text("保存")');

    // Wait for success message
    await page.waitForSelector('text=保存成功', { timeout: 5000 });

    // Check if the schedule was created
    await expect(page.locator('text=Test Schedule')).toBeVisible();
  });

  test('should update schedule status', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForSelector('text=日程', { timeout: 10000 });

    // Find and click the first schedule status button
    const statusButtons = page.locator('button:has-text("待办")').first();
    if (await statusButtons.isVisible()) {
      await statusButtons.click();

      // Wait for success message
      await page.waitForSelector('text=更新成功', { timeout: 5000 });
    }
  });

  test('should show error message on invalid form', async ({ page }) => {
    // Click the "New Schedule" button
    await page.click('button:has-text("新建日程")');

    // Submit without filling the required fields
    await page.click('button:has-text("保存")');

    // Wait for error message
    await expect(page.locator('text=请填写.*标题')).toBeVisible({ timeout: 5000 });
  });

  test('should handle schedule deletion', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForSelector('text=日程', { timeout: 10000 });

    // Find and click the delete button on the first schedule
    const deleteButtons = page.locator('button:has-text("删除")').first();
    if (await deleteButtons.isVisible()) {
      await deleteButtons.click();

      // Confirm deletion
      await page.click('button:has-text("确定")');

      // Wait for success message
      await page.waitForSelector('text=删除成功', { timeout: 5000 });

      // Check if the schedule was deleted
      await expect(page.locator('text=Test Schedule')).not.toBeVisible();
    }
  });
});

test.describe('Schedule Update Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to schedule page
    await page.goto('http://127.0.0.1:5173');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto('http://127.0.0.1:5173/schedule');
  });

  test('should display schedule updates', async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('text=日程', { timeout: 10000 });

    // Check if updates section is visible
    await expect(page.locator('text=更新记录')).toBeVisible();
  });

  test('should create schedule update', async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('text=日程', { timeout: 10000 });

    // Click the "Update" button
    const updateButton = page.locator('button:has-text("更新")').first();
    if (await updateButton.isVisible()) {
      await updateButton.click();

      // Fill in the update form
      await page.fill('textarea[name="content"]', 'Progress update');
      await page.click('button:has-text("保存")');

      // Wait for success message
      await page.waitForSelector('text=保存成功', { timeout: 5000 });

      // Check if the update was created
      await expect(page.locator('text=Progress update')).toBeVisible();
    }
  });

  test('should update schedule status to in_progress', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForSelector('text=日程', { timeout: 10000 });

    // Find and click the "pending" status button
    const pendingButton = page.locator('button:has-text("待办")').first();
    if (await pendingButton.isVisible()) {
      await pendingButton.click();

      // Wait for status change
      await page.waitForSelector('text=进行中', { timeout: 5000 });
    }
  });
});
