import { test } from "node:test";
import assert from "node:assert/strict";
import { firefox } from "playwright-core";
import { mkdir } from "node:fs/promises";
test(
  "desktop and mobile workspace load with working navigation",
  { timeout: 90000 },
  async () => {
    const browser = await firefox.launch({
      headless: true,
      executablePath:
        process.env.OFC2_FIREFOX ||
        "/home/maymona/Documents/ofc/OFC_Next/.cache/playwright/firefox-1555/firefox/firefox",
    });
    try {
      const page = await browser.newPage({
          viewport: { width: 1440, height: 1050 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.OFC2_URL || "http://127.0.0.1:3004");
      await page.getByText("Your investment pipeline").waitFor();
      await mkdir("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/home-desktop.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "+ New opportunity" }).click();
      await page.getByLabel("Opportunity name").fill("Browser test unsaved");
      await page.getByRole("button", { name: "Close dialog" }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: "test-results/home-mobile.png",
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
