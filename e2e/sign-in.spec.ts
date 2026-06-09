import { test, expect } from '@playwright/test'

test.describe('Sign-in page', () => {
  test('renders the sign-in page for unauthenticated users', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL(/sign-in/)
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
  })

  test('redirects unauthenticated users from /dashboard to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('redirects unauthenticated users from /applications to sign-in', async ({ page }) => {
    await page.goto('/applications')
    await expect(page).toHaveURL(/sign-in/)
  })
})
