require('dotenv').config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const url = "https://www.facebook.com/";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  let browser; // Log Facebook username
  try {
    // Launch Puppeteer with the full Puppeteer package (no need to specify executablePath)
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    // Login code
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.FB_USERNAME);
    await page.waitForSelector('input[name="pass"]');
    await page.type('input[name="pass"]', process.env.FB_PASSWORD);
    await wait(2000);
    await page.click('button[name="login"]');

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Handle any potential popups
    try {
      await page.waitForSelector('div[role="button"][tabindex="0"]', { timeout: 5000 });
      await page.click('div[role="button"][tabindex="0"]');
    } catch (error) {
      console.log("No pop-up to handle at login...");
    }

    // Screenshot of the home page
    await wait(2000);
    await page.screenshot({ path: 'fb_homepage.png', fullPage: true });

    // Navigate to Profile Page
    await page.goto(`https://www.facebook.com/${process.env.FB_USERNAME}/`, { waitUntil: "networkidle2" });
    await page.waitForSelector('div[data-pagelet="ProfileTimeline"]');

    // Screenshot of Profile Page
    await page.screenshot({ path: 'fb_profilepage.png', fullPage: true });
    console.log("Screenshot saved as fb_profilepage.png");

    // Navigate to Messenger
    await page.goto("https://www.facebook.com/messages/t/", { waitUntil: "networkidle2" });
    console.log("Navigated to the messenger section");
    await wait(1000);
    await page.waitForSelector('div[aria-label="Conversation list"]', { timeout: 30000 });

    // Extract recent chats
    const recentChats = await page.evaluate(() => {
      const chatItems = document.querySelectorAll('div[aria-label="Conversation list"] div[role="row"]');
      return Array.from(chatItems).slice(0, 5).map(item => {
        const usernameElement = item.querySelector('span[dir="auto"]');
        return usernameElement ? usernameElement.textContent.trim() : 'Unknown';
      });
    });

    console.log("Top recent chat users:");
    recentChats.forEach((username, index) => {
      console.log(`${index + 1}. ${username}`);
    });

    // Interact with a specific chat
    const chatWithSpecificUserClicked = await page.evaluate(() => {
      const chatItems = document.querySelectorAll('div[aria-label="Conversation list"] div[role="row"]');
      for (const item of chatItems) {
        const usernameElement = item.querySelector('span[dir="auto"]');
        if (usernameElement && usernameElement.textContent.trim() === "Specific User") { // Change "Specific User" to target username
          item.click();
          return true;
        }
      }
      return false;
    });

    await wait(1000);
    if (chatWithSpecificUserClicked) {
      console.log("Successfully clicked on the chat with Specific User");
      await page.waitForSelector('div[aria-label="Message"]', { timeout: 30000 });
      console.log("Chat with Specific User is now open");

      const messages = await page.evaluate(() => {
        const messageRows = document.querySelectorAll('div[aria-label="Message"]');
        return Array.from(messageRows).map(row => {
          const senderElement = row.querySelector('h5 span');
          const contentElement = row.querySelector('div[dir="auto"]');
          let sender = 'User';
          let content = '';
          if (senderElement) {
            sender = senderElement.textContent.trim();
          }

          if (contentElement) {
            content = contentElement.textContent.trim();
          }

          return { sender, content };
        }).filter(message => message.content !== '');
      });

      console.log(`Number of messages found: ${messages.length}`);
      console.log("Chat messages:");
      messages.forEach((message, index) => {
        console.log(`${index + 1}. ${message.sender}: ${message.content}`);
      });
    } else {
      console.log("Couldn't find a chat with Specific User");
    }

    await new Promise(resolve => {});

  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

main();
