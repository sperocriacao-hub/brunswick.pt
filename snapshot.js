const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
      console.log("Navigating...");
      await page.goto('https://brunswick-pt.vercel.app/tv/live/33eb0e4d-9562-4b53-9bf1-b29f07eb62cf', { waitUntil: 'networkidle', timeout: 15000 });
      
      console.log("Waiting for 10 seconds for initial JS loads...");
      await page.waitForTimeout(10000);
      
      const html = await page.content();
      if (html.includes("NO-CACHE BUILD")) {
          console.log("WATERMARK FOUND IN HTML!");
      } else {
          console.log("WATERMARK NOT FOUND!");
      }
      
      if (html.includes("SISTEMA INICIALIZANDO")) console.log("STUCK ON LOADING SCREEN!");
      
      console.log("Capturing screenshot...");
      await page.screenshot({ path: 'live_tv.png', fullPage: true });
      console.log("Done.");
  } catch (e) {
      console.error(e);
  } finally {
      await browser.close();
  }
})();
