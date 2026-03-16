import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('Page error:', err.toString()));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('Console error:', msg.text());
    });
    await page.goto('http://localhost:3000/admin');
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
        const els = [...document.querySelectorAll('div, span, button')];
        const bk = els.find(e => e.textContent === 'Bookings');
        if (bk) bk.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
