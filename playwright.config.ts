/* eslint-disable filenames/match-exported, filenames/match-regex */
import { defineConfig, devices } from "@playwright/test";

/**
 * Service Worker は開発用の起動では無効にしてあるため、本番の作りで確かめる。
 * 1つの作りを何度も見るので、ビルドは1回だけにする。
 */
const port = 3311;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  // Service Worker の用意が重なると取り合いになる。1本ずつ流す
  fullyParallel: false,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    url: baseURL,
  },
  workers: 1,
});
