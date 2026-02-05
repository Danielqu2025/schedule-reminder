import { test, expect } from '@playwright/test';

test.describe('Task Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login simulation
    await page.goto('http://127.0.0.1:5173');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto('http://127.0.0.1:5173/tasks');
  });

  test('should display the task management page', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('任务管理');

    // Check if task items are displayed
    await expect(page.locator('text=任务列表')).toBeVisible();
  });

  test('should display existing tasks', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Check for task items
    const taskItems = page.locator('[class*="task-card"]');
    const count = await taskItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter tasks by team', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Click on team filter dropdown
    const teamFilter = page.locator('select[name="teamFilter"]').first();
    if (await teamFilter.isVisible()) {
      await teamFilter.selectOption('all');

      // Wait for filtered results
      await page.waitForSelector('text=所有团队', { timeout: 5000 });
    }
  });

  test('should filter tasks by status', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Click on status filter dropdown
    const statusFilter = page.locator('select[name="statusFilter"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('all');

      // Wait for filtered results
      await page.waitForSelector('text=所有状态', { timeout: 5000 });
    }
  });

  test('should create a new task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Click the "Create Task" button
    await page.click('button:has-text("创建任务")');

    // Wait for the create task form to appear
    await page.waitForSelector('text=创建任务', { timeout: 5000 });

    // Fill in the task form
    await page.selectOption('select[name="team_id"]', '1');
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task');
    await page.selectOption('select[name="status"]', 'pending');
    await page.selectOption('select[name="priority"]', 'medium');

    // Click the submit button
    await page.click('button:has-text("保存")');

    // Wait for success message
    await page.waitForSelector('text=创建成功', { timeout: 5000 });

    // Check if the task was created
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Find and click the "pending" status button on the first task
    const pendingButton = page.locator('button:has-text("待办")').first();
    if (await pendingButton.isVisible()) {
      await pendingButton.click();

      // Wait for status change
      await page.waitForSelector('text=进行中', { timeout: 5000 });
    }
  });

  test('should handle task deletion', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Find and click the delete button on the first task
    const deleteButton = page.locator('button:has-text("删除")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion
      await page.click('button:has-text("确定")');

      // Wait for success message
      await page.waitForSelector('text=删除成功', { timeout: 5000 });

      // Check if the task was deleted
      await expect(page.locator('text=Test Task')).not.toBeVisible();
    }
  });

  test('should show error message on invalid form', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务列表', { timeout: 10000 });

    // Click the "Create Task" button
    await page.click('button:has-text("创建任务")');

    // Submit without filling required fields
    await page.click('button:has-text("保存")');

    // Wait for error message
    await expect(page.locator('text=请填写.*标题')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Task Management - Team Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to tasks page
    await page.goto('http://127.0.0.1:5173');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto('http://127.0.0.1:5173/tasks');
  });

  test('should display team filter dropdown', async ({ page }) => {
    // Wait for tasks page to load
    await page.waitForSelector('text=任务管理', { timeout: 5000 });

    // Check if team filter dropdown exists
    const teamFilter = page.locator('select[name="teamFilter"]');
    await expect(teamFilter).toBeVisible();
  });

  test('should display status filter dropdown', async ({ page }) => {
    // Wait for tasks page to load
    await page.waitForSelector('text=任务管理', { timeout: 5000 });

    // Check if status filter dropdown exists
    const statusFilter = page.locator('select[name="statusFilter"]');
    await expect(statusFilter).toBeVisible();
  });

  test('should filter tasks by team filter', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务管理', { timeout: 5000 });

    // Select specific team
    const teamFilter = page.locator('select[name="teamFilter"]').first();
    if (await teamFilter.isVisible()) {
      await teamFilter.selectOption('1');

      // Wait for filtered results
      await page.waitForSelector('text=团队成员列表', { timeout: 5000 });
    }
  });

  test('should filter tasks by status filter', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=任务管理', { timeout: 5000 });

    // Select specific status
    const statusFilter = page.locator('select[name="statusFilter"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pending');

      // Wait for filtered results
      await page.waitForSelector('text=待办任务', { timeout: 5000 });
    }
  });
});
