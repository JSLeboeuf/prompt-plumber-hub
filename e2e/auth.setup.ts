import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function globalSetup() {
  const email = process.env.E2E_EMAIL || 'contact@autoscaleai.ca';
  const password = process.env.E2E_PASSWORD || 'Test1234!';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('🔐 Setting up E2E authentication...');
  // eslint-disable-next-line no-console
  console.log(`📧 Email: ${email}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);

  // First, ensure the test user exists using service role key
  if (serviceRoleKey) {
    try {
      // Check if user exists
      const checkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        }
      });

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (!data.users || data.users.length === 0) {
          // eslint-disable-next-line no-console
          console.log('📝 Creating test user...');
          // Create user if doesn't exist
          const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                name: 'E2E Test User',
                role: 'test'
              }
            })
          });

          if (createResponse.ok) {
            // eslint-disable-next-line no-console
            console.log('✅ Test user created successfully');
          } else {
            const error = await createResponse.text();
            // eslint-disable-next-line no-console
            console.log('⚠️ Could not create user:', error);
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('✅ Test user already exists');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('⚠️ Could not verify/create user:', error);
    }
  }

  // Launch browser and authenticate
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app auth page
    // eslint-disable-next-line no-console
    console.log('🌐 Navigating to auth page...');
    await page.goto('http://localhost:4173/auth');

    // Wait for auth page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow React to hydrate

    // Updated selectors based on actual AuthNew.tsx structure
    // eslint-disable-next-line no-console
    console.log('🔍 Looking for login form...');

    // The form uses react-hook-form with specific placeholders
    const emailInput = page.locator('input[placeholder="Email"]');
    const passwordInput = page.locator('input[placeholder="Mot de passe"]');

    // Wait for form elements to be visible
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

    // eslint-disable-next-line no-console
    console.log('📝 Filling login form...');
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Find the submit button - it shows "Se connecter" in login mode
    const submitButton = page.locator('button[type="submit"]:has-text("Se connecter")');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });

    // eslint-disable-next-line no-console
    console.log('🚀 Submitting login form...');
    await submitButton.click();

    // Wait for one of several possible post-login states
    // eslint-disable-next-line no-console
    console.log('⏳ Waiting for authentication...');
    try {
      // Wait for navigation to dashboard or any authenticated page
      await page.waitForURL(/\/(dashboard|home|app)/, { timeout: 15000 });
      // eslint-disable-next-line no-console
      console.log('✅ Successfully navigated to authenticated page');
    } catch (navigationError) {
      console.warn('Navigation failed:', navigationError instanceof Error ? navigationError.message : String(navigationError));
      // Check if we're still on auth page with success message
      const successAlert = page.locator('.border-green-500, .text-green-600, :has-text("Connexion réussie")');
      const isSuccess = await successAlert.count() > 0;

      if (isSuccess) {
        // eslint-disable-next-line no-console
        console.log('✅ Login success detected, waiting for redirect...');
        await page.waitForTimeout(3000);

        // Try navigating to dashboard manually if auto-redirect failed
        if (page.url().includes('/auth')) {
          // eslint-disable-next-line no-console
          console.log('🔄 Manually navigating to dashboard...');
          await page.goto('http://localhost:4173/dashboard');
          await page.waitForLoadState('domcontentloaded');
        }
      } else {
        // Check for error messages
        const errorAlert = page.locator('.border-destructive, .text-destructive, :has-text("Erreur")');
        const errorCount = await errorAlert.count();

        if (errorCount > 0) {
          const errorText = await errorAlert.first().textContent();
          // eslint-disable-next-line no-console
          console.log('❌ Login error detected:', errorText);
        } else {
          // eslint-disable-next-line no-console
          console.log('⚠️ Navigation timeout but no clear error - continuing...');
        }
      }
    }

    // Wait for the page to stabilize
    await page.waitForTimeout(2000);

    // Save the authenticated state
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    await context.storageState({ path: path.join(authDir, 'user.json') });
    // eslint-disable-next-line no-console
    console.log('✅ Authentication state saved to e2e/.auth/user.json');

    // Verify we have a valid session by checking for authenticated content
    const currentUrl = page.url();
    // eslint-disable-next-line no-console
    console.log(`📍 Final URL: ${currentUrl}`);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/app')) {
      // eslint-disable-next-line no-console
      console.log('🎉 Authentication setup completed successfully!');
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ Authentication may not be complete - check session manually');
    }

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);

    // Save a screenshot for debugging
    try {
      await page.screenshot({ path: 'e2e-results/auth-setup-error.png', fullPage: true });
      // eslint-disable-next-line no-console
      console.log('📸 Error screenshot saved to e2e-results/auth-setup-error.png');
    } catch (screenshotError) {
      console.warn('Screenshot failed:', screenshotError instanceof Error ? screenshotError.message : String(screenshotError));
      // eslint-disable-next-line no-console
      console.log('⚠️ Could not save error screenshot');
    }

    // Try to save whatever state we have
    try {
      const authDir = path.join(__dirname, '.auth');
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }
      await context.storageState({ path: path.join(authDir, 'user.json') });
      // eslint-disable-next-line no-console
      console.log('⚠️ Partial state saved despite errors');
    } catch (saveError) {
      console.warn('Failed to save auth state:', saveError instanceof Error ? saveError.message : String(saveError));
      // eslint-disable-next-line no-console
      console.log('❌ Could not save authentication state');
    }
  } finally {
    await browser.close();
    // eslint-disable-next-line no-console
    console.log('🔒 Browser closed');
  }
}

export default globalSetup;