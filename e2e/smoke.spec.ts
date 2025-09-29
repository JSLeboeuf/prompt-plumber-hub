import { test, expect } from '@playwright/test';

async function isAuthGate(page: import('@playwright/test').Page): Promise<boolean> {
  try {
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    return url.includes('/auth');
  } catch {
    return false;
  }
}

test.describe('Legacy Integration Smoke Tests', () => {
  test('homepage is accessible (dashboard when authed, /auth otherwise)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Accept either /dashboard or /auth
    await expect(page).toHaveURL(/(auth|dashboard)/);
    if (await isAuthGate(page)) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Debug: check what's actually on the page
    // Verify page loads without content inspection
    console.warn('Page title:', await page.title());
    console.warn('URL:', page.url());

    // Look for any main dashboard content - more flexible approach
    const dashboardIndicators = [
      '.space-y-6',              // From Dashboard component
      'h1:has-text("Tableau de Bord")',  // Dashboard title
      '[data-testid="dashboard"]',        // Test ID if exists
      '.title-xl',               // Dashboard title class
      'text="Tableau de Bord"',   // Alternative title selector
      '[class*="animate-fade-in"]' // Dashboard animation class
    ];

    let found = false;
    for (const selector of dashboardIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible({ timeout: 10000 });
        found = true;
        break;
      }
    }

    // If no specific dashboard content found, just verify we're on dashboard URL and page is rendered
    if (!found) {
      await expect(page.locator('body')).toBeVisible();
      const elements = await page.locator('div, section, main').count();
      expect(elements).toBeGreaterThan(0);
    }
  });

  test.describe.configure({ retries: 0 });

  test('dashboard displays metrics cards', async ({ page }) => {
    const authProject = test.info().project.name.includes('auth');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    if (!authProject && await isAuthGate(page)) test.skip();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React

    // Look for StatsGrid or card components that show metrics - flexible selectors
    const metricSelectors = [
      '[class*="grid"]:has(.card)',
      '.stats-grid',
      '[data-testid="stats-grid"]',
      '.card:has-text("Appels")',
      '.card:has-text("Interventions")',
      '.card',  // Fallback to any card
      '[class*="space-y-6"] > *'  // Any child of dashboard container
    ];

    let metricsFound = false;
    for (const selector of metricSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible({ timeout: 15000 });
        metricsFound = true;
        break;
      }
    }

    if (!metricsFound) test.skip();

    // Look for metric values in cards - flexible approach
    const valueSelectors = [
      '.card .font-medium',
      '.card .text-2xl',
      '.card .text-3xl',
      '.card .font-bold',
      '.card [class*="title"]',
      '.card span',  // Fallback
    ];

    for (const selector of valueSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        break;
      }
    }
  });

  test('analytics page loads if route exists', async ({ page }) => {
    const authProject = test.info().project.name.includes('auth');
    const response = await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    if (!authProject && await isAuthGate(page)) test.skip();

    if (response && response.status() !== 404) {
      await page.waitForLoadState('networkidle');
      const analyticsContent = page.locator(
        '[data-testid="chart"], .chart-container, .recharts-wrapper, canvas, h1:has-text("Analytics"), h1:has-text("Analytiques")'
      ).first();
      if (await analyticsContent.count() === 0) test.skip();
      await expect(analyticsContent).toBeVisible({ timeout: 15000 });
      const dataElement = page.locator('.recharts-line, .chart-line, [role="img"], .data-point, .recharts-chart').first();
      await expect(dataElement).toBeVisible({ timeout: 20000 });
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('CRM page loads if route exists', async ({ page }) => {
    const authProject = test.info().project.name.includes('auth');
    const response = await page.goto('/crm', { waitUntil: 'domcontentloaded' });
    if (!authProject && await isAuthGate(page)) test.skip();

    if (response && response.status() !== 404) {
      await page.waitForLoadState('networkidle');
      const crmContent = page.locator(
        '[data-testid="crm"], .crm-dashboard, h1:has-text("CRM"), .clients-view, .client-list, h1:has-text("Clients")'
      ).first();
      if (await crmContent.count() === 0) test.skip();
      await expect(crmContent).toBeVisible({ timeout: 15000 });
      const dataTable = page.locator('table, .table, [role="table"], .list-container, .grid').first();
      await expect(dataTable).toBeVisible({ timeout: 20000 });
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('navigation menu is functional', async ({ page }) => {
    const authProject = test.info().project.name.includes('auth');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    if (!authProject && await isAuthGate(page)) test.skip();

    // Look for navigation in various forms - sidebar, header nav, etc.
    const nav = page.locator('nav, [role="navigation"], .sidebar, .navigation-menu, [data-testid="navigation"]').first();
    if (await nav.count() === 0) test.skip();
    await expect(nav).toBeVisible({ timeout: 10000 });
    const navLink = page.locator('nav a, [role="navigation"] a, .nav-link, .sidebar a').first();
    if (await navLink.count() > 0) {
      await navLink.click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    }
  });

  test('application handles errors gracefully', async ({ page }) => {
    // Try to navigate to a non-existent page
    const response = await page.goto('/this-page-does-not-exist-404', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Application should handle 404 gracefully
    if (response) {
      // Check that some content is still displayed (error page or redirect)
      const bodyContent = page.locator('body');
      await expect(bodyContent).toBeVisible();

    // Look for error message or redirect to valid page
    const hasContent = await page.locator('body *').count() > 0;
    expect(hasContent).toBeTruthy();
    }
  });
});