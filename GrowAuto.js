const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set to true for headless mode
  const page = await browser.newPage();

  // Go to Groww login page
  await page.goto('https://groww.in/login');

  // Wait for the email field and type the Gmail (use id selector 'login_email1')
  await page.waitForSelector('#login_email1');
  await page.type('#login_email1', process.env.GROWW_USER);

  // Click "Continue" button
  await page.waitForSelector('button[type="submit"]');
  await page.click('button[type="submit"]');


  await page.waitForSelector('#login_password1');
  
  
  await page.type('#login_password1', process.env.GROWW_PASSWORD);

  await page.click('button[type="submit"]');

  await page.waitForSelector('.otpinput88');

  const pin = process.env.GROWW_PIN.split('');
  const pinFields = await page.$$('.otpinput88 input');
  for (let i = 0; i < pin.length; i++) {
    await pinFields[i].type(pin[i]);
  }

  await page.waitForNavigation();
  await wait(2000);
  await page.goto("https://groww.in/stocks/user/investments", { waitUntil: "networkidle2" });
    console.log("Navigated to the chat section");
    await wait(2000);
  await page.screenshot({ path: 'investments.png', fullPage: true });

  console.log('Screenshot taken!');

  await browser.close();
})();
