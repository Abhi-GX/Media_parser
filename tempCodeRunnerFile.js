    // await page.waitForSelector('div[role="listbox"]', { timeout: 30000 });

    // // Extract usernames of the top 3 recent chats
    // const recentChats = await page.evaluate(() => {
    //   const chatItems = document.querySelectorAll('div[role="listbox"] > div');
    //   return Array.from(chatItems).slice(0, 3).map(item => {
    //     const usernameElement = item.querySelector('div[dir="auto"]');
    //     return usernameElement ? usernameElement.textContent.trim() : 'Unknown';
    //   });
    // });

    // console.log("Top 3 recent chat usernames:");
    // recentChats.forEach((username, index) => {
    //   console.log(`${index + 1}. ${username}`);
    // });