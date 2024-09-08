const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const url = "https://www.instagram.com/";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const main = async () => {
  let browser;
  console.log(process.env.USERNAME);
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    // Login code
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', process.env.USERNAME1);
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', process.env.PASSWORD);
    await wait(2000);
    await page.click('button[type="submit"]');

    // Wait for navigation after clicking submit
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Wait for OTP input field (assuming Instagram shows an OTP input if 2FA is enabled)
    try {
        await page.waitForSelector('input[name="verificationCode"]', { timeout: 30000 }); // Adjust the selector as per actual OTP input
        console.log("Please enter the OTP sent to your mobile device in the browser window.");
        
        // Pause to allow the user to enter the OTP
        await page.waitForFunction(
            () => !document.querySelector('input[name="verificationCode"]'),  // This condition ensures the OTP field disappears after submission
            { timeout: 120000 } // Allow up to 2 minutes for the user to input the OTP
        );
        console.log("OTP entered successfully, continuing...");

    } catch (error) {
        console.log("OTP input field not detected or timed out.");
    }

    // Continue with the existing functionality after the OTP is verified
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Now proceed with the rest of the code, like handling pop-ups and screenshots.


    
    try {
      await page.waitForSelector('div[role="button"][tabindex="0"]', { timeout: 5000 });
      await page.click('div[role="button"][tabindex="0"]');
    } catch (error) {
      console.log("pop 1 degara mingindhi...");
    }

    
    try {
      await page.waitForSelector('button._a9--', { timeout: 5000 });
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button._a9--');
        for (const button of buttons) {
          if (button.textContent.includes("Not Now")) {
            button.click();
            break;
          }
        }
      });
    } catch (error) {
      console.log("'Turn on Notifications pop up degara mingindhi...");
    }
    await wait(2000);
    await page.screenshot({ path: '1stpage.png', fullPage: true });
    await wait(2000);
    await page.goto(`https://www.instagram.com/${process.env.USERNAME1}/`, { waitUntil: "networkidle2" });
    await page.waitForSelector('header section');

    // profile screenshot code 

    await page.screenshot({ path: 'profilepage.png', fullPage: true });
    console.log("Screenshot saved as instagram_profile.png");


    // chat link leda click chat option   

    await page.goto("https://www.instagram.com/direct/inbox/", { waitUntil: "networkidle2" });
    console.log("Navigated to the chat section");
    await wait(1000);
    await page.waitForSelector('div[role="listitem"]', { timeout: 30000 });

    // username extract code
    const recentChats = await page.evaluate(() => {
      const chatItems = document.querySelectorAll('div[role="listitem"]');
      return Array.from(chatItems).slice(0, 5).map(item => {                        // change here no of recent usernames
        const usernameElement = item.querySelector('span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv.xuxw1ft');
        return usernameElement ? usernameElement.textContent.trim() : 'Unknown';
      });
    });


    console.log("Top recent chat huka's usernames:");
    recentChats.forEach((username, index) => {
      console.log(`${index + 1}. ${username}`);
    });
    const chatWithAnuragClicked = await page.evaluate(() => {
      const chatItems = document.querySelectorAll('div[role="listitem"]');
      for (const item of chatItems) {
        const usernameElement = item.querySelector('span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv.xuxw1ft');
        if (usernameElement && usernameElement.textContent.trim() === "Anurag") {   // change here username
          item.click();
          return true;
        }
      }
      return false;
    });
    await wait(1000);
    if (chatWithAnuragClicked) {
      console.log("Successfully clicked on the chat with Anurag");
      await page.waitForSelector('div[role="row"]', { timeout: 30000 });
      console.log("Chat with Anurag is now open");

      // Function to scroll the chat and load more messages
      const scrollChat = async () => {
        await page.evaluate(async () => {
          const chatBox = document.querySelector('div[role="grid"]');
          chatBox.scrollTo(0, chatBox.scrollHeight);
        });
        await wait(2000); // Wait for 2 seconds to allow content to load
      };

      let previousHeight;
      let newHeight = await page.evaluate(() => document.querySelector('div[role="grid"]').scrollHeight);

      // Loop to keep scrolling until no more new messages are loaded
      do {
        previousHeight = newHeight;
        await scrollChat();
        newHeight = await page.evaluate(() => document.querySelector('div[role="grid"]').scrollHeight);
      } while (newHeight > previousHeight); // Stop when no new content is loaded

      // Now extract all chat messages and media content
      const messages = await page.evaluate(() => {
        const messageRows = document.querySelectorAll('div[role="row"]');
        return Array.from(messageRows).map(row => {
          // Identify the type of message
          const senderElement = row.querySelector('h5 span.xzpqnlu, h4 span.xzpqnlu');
          const textContentElement = row.querySelector('div[dir="auto"]');
          const mediaContentElement = row.querySelector('video, img');  // Media elements like reels or images
          let sender = 'Anurag';
          let content = '';

          // Determine if it's a text message
          if (textContentElement) {
            content = `Text: ${textContentElement.textContent.trim()}`;
          }

          // Determine if it's a reel (video) or image
          if (mediaContentElement) {
            if (mediaContentElement.tagName.toLowerCase() === 'video') {
              content = 'Reel: [Video Content]'; // Can expand to extract video URL if needed
            } else if (mediaContentElement.tagName.toLowerCase() === 'img') {
              content = 'Image: [Image Content]'; // Can expand to extract image URL if needed
            }
          }

          // Extract sender information
          if (senderElement) {
            sender = senderElement.textContent.trim();
          } else if (row.querySelector('h5 span:not(.xzpqnlu)')) {
            sender = 'Target';
          }

          return { sender, content };
        }).filter(message => message.content !== '' && !message.content.includes('Enter'));
      });

      console.log(`Number of messages found: ${messages.length}`);
      console.log("Chat messages:");
      messages.forEach((message, index) => {
        console.log(`${index + 1}. ${message.sender}: ${message.content}`);
      });
    } else {
      console.log("Couldn't find a chat with Anurag");
    }

  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log("Script completed. Exiting now.");
    process.exit(0);
  }
};

main();