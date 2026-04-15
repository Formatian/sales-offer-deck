const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:55021/#/10", { waitUntil: "networkidle" });
  const data = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".reveal .slides > section"))
      .slice(8, 12)
      .map((slide, i) => {
        const img = slide.querySelector("img");
        const rect = slide.getBoundingClientRect();
        const imgRect = img ? img.getBoundingClientRect() : null;
        return {
          slide: i + 9,
          className: slide.className,
          backgroundImage: slide.getAttribute("data-background-image"),
          innerHTML: slide.innerHTML.slice(0, 200),
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          img: img
            ? {
                src: img.getAttribute("src"),
                className: img.className,
                rect: { x: imgRect.x, y: imgRect.y, w: imgRect.width, h: imgRect.height }
              }
            : null
        };
      })
  );
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
