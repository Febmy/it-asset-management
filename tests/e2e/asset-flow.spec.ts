import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('IT Asset Management E2E Flow', () => {
  // We'll use environment variables for credentials, with fallback for demo
  const TEST_IDENTIFIER = process.env.TEST_USER_IDENTIFIER || 'admin.it@yodu.id';
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'password'; // Change as needed

  test('should login, view dashboard, and add a new asset', async ({ page }: { page: Page }) => {
    // Step 1: Go to login page
    await page.goto('/auth/login');

    // Step 2: Fill in login credentials
    await page.fill('input[placeholder="admin.it@yodu.id atau EMP-0001"]', TEST_IDENTIFIER);
    await page.fill('input[placeholder="Masukkan password Anda"]', TEST_PASSWORD);

    // Step 3: Submit login form
    await page.click('button:has-text("Masuk ke Sistem")');

    // Step 4: Wait for redirect to dashboard and verify
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    await expect(page.locator('h1:has-text("Dashboard IT Asset")')).toBeVisible();

    // Step 5: Navigate to assets page (click on the Total Hardware card which links to /assets)
    await page.click('text=Total Hardware');
    // Alternatively, we can directly go to /assets
    // await page.goto('/assets');
    await expect(page).toHaveURL('/assets', { timeout: 5000 });
    await expect(page.locator('h1:has-text("Master Inventaris Aset")')).toBeVisible();

    // Step 6: Click on "Registrasi Unit Baru" button to open the modal
    await page.click('button:has-text("Registrasi Unit Baru")');

    // Step 7: Wait for modal to appear and fill in the form
    await expect(page.locator('h3:has-text("Registrasi Unit Aset Baru")')).toBeVisible();

    // Generate unique asset tag and serial number to avoid duplicates
    const timestamp = Date.now();
    const assetTag = `IT-NB-2026-${timestamp}`;
    const serialNumber = `SN-${timestamp}`;

    // Fill in the required fields
    await page.fill('input[placeholder="Contoh: IT-NB-2026-0003"]', assetTag);
    await page.selectOption('select', { label: 'Notebook / Laptop' }); // Assuming first option is Notebook / Laptop
    await page.fill('input[placeholder="Lenovo, Dell, dll"]', 'Lenovo');
    await page.fill('input[placeholder="Latitude 5420"]', 'ThinkPad X1 Carbon');
    await page.fill('input[placeholder="SN-XXXXX"]', serialNumber);

    // Fill in optional specifications
    await page.fill('input[placeholder="CPU (cth: i7-1365U)"]', 'i7-1365U');
    await page.fill('input[placeholder="RAM (cth: 16GB)"]', '16GB');
    await page.fill('input[placeholder="Disk (cth: 512GB SSD)"]', '512GB SSD');

    // Set dates (purchase date and warranty expiry) - we can set to today and one year from today for simplicity
    const today = new Date().toISOString().split('T')[0];
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const warrantyExpiry = oneYearLater.toISOString().split('T')[0];

    await page.fill('input[type="date"]', today); // This fills the first date input (purchase date)
    // We need to fill the second date input (warranty expiry). We can target by position or by label.
    // Let's target by the label above the input.
    await page.fill('label:has-text("Batas Garansi") + input[type="date"]', warrantyExpiry);

    // Step 8: Submit the form
    await page.click('button:has-text("Simpan Aset")');

    // Step 9: Wait for modal to close and verify success (e.g., by checking that the asset appears in the list)
    // Wait for modal to close
    await expect(page.locator('h3:has-text("Registrasi Unit Aset Baru")')).not.toBeVisible();

    // Optionally, we can check for a success toast or notice, but the app may not have one.
    // Instead, we can check that the asset appears in the table.
    // Wait for the table to update (we can wait for a specific row with our asset tag)
    await expect(page.locator(`td:has-text("${assetTag}")`)).toBeVisible({ timeout: 5000 });
    // Also verify the serial number
    await expect(page.locator(`td:has-text("${serialNumber}")`)).toBeVisible();
  });
});
