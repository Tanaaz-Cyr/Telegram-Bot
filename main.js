import TelegramBot from 'node-telegram-bot-api';

const token = ''; //Get a token from botfather from telegram search for botfather and create a new bot and get the token
const bot = new TelegramBot(token, { polling: true });
let userData = [];


//Check if the user is an admin
async function checkAdmin(msg) {
  //Check person who sent the message is an admin
  try {
    if (msg.text.toString().toLowerCase().includes('/warn')) {
      let isUserAdmin = await bot.getChatMember(msg.chat.id, msg.from.id);
      console.log("isUserAdmin: " + isUserAdmin.status);
      if (isUserAdmin.status === "creator" || isUserAdmin.status === "administrator" && isUserAdmin.can_restrict_members === true) {
        //ignore
      }
      else {
        bot.sendMessage(msg.chat.id, "You are do not have the permission to warn users. Only admins with right to kick can warn users.");
        return;
      }
    }
  }
  catch {
    //ignore
  }
}

//Check if the user is in the group
async function getUserID(msg) {
  console.log("Warn command");
  //get the user id of the person to be warned
  let userId;
  try {
    console.log("Warn command try");
    userId = msg.reply_to_message.from.id;
    console.log("Warn command try userId: " + userId);
    return userId;
  }
  catch {
    //get the second part after the command to get the user id to be warned (The ID is in integer format)
    console.log("Warn command catch");
    userId = msg.text.split(' ')[1];
    return userId;
  }
}

//Check if rules was typed
async function checkRules(msg) {
  if (msg.text === undefined) {
    return false;
  }
  if (msg.text.toString().toLowerCase().includes('#rules')) {
    bot.sendMessage(msg.chat.id, "1. No spamming \r\n 2. No hate speech \r\n 3. No adult content \r\n 4. No sharing of personal information \r\n 5. No sharing of fake news \r\n 6. No sharing of inappropriate content \r\n 7. No sharing of copyrighted content");
    return true;
  }
  return false;
}

//Check if the user is in the group
async function checkInGroup(msg, userId) {
  let isUserInGroup = await bot.getChatMember(msg.chat.id, userId);
  console.log("isUserInGroup: " + isUserInGroup.status);
  return isUserInGroup;
}

//Check if the user is an admin
async function isWarnedAdmin(msg, userId) {
  let isUserAdmin = await bot.getChatMember(msg.chat.id, userId);
  console.log("isUserAdmin (being warned): " + isUserAdmin.status);
  if (isUserAdmin.status === "creator" || isUserAdmin.status === "administrator" && isUserAdmin.can_restrict_members === true) {
    return true;
  }
  return false;
}

async function checkWarnedUser(msg, userId, userName) {
  //send a message to the group
  let warning;
  if (userData[userId] === undefined) {
    userData[userId] = { Warns: 1 };
  }
  else {
    userData[userId].Warns++;
  }

  if (userData[userId].Warns === 1) {
    warning = "first";
  }

  console.log("Warns:" + userData[userId].Warns);

  if (userData[userId].Warns === 2) {
    warning = "second";
  }
  else if (userData[userId].Warns === 3) {
    warning = "third";
  }
  bot.sendMessage(msg.chat.id, userName.first_name + " have been warned for violating the rules for the " + warning + " time. Please follow the rules to avoid being kicked from the group. \r\n Type #rules to see the rules.");
  //if the user has been warned 3 times, kick the user
  if (userData[userId].Warns === 3) {
    //This will only kick the user out of the group
    await bot.banChatMember(msg.chat.id, userId);
    await bot.unbanChatMember(msg.chat.id, userId);
    userData[userId] = { Warns: 0 };
    bot.sendMessage(msg.chat.id, "User " + userName.first_name + " has been kicked for violating the rules");
  }
}

bot.on('message', async (msg) => {

  if (await checkRules(msg)) {
    return;
  }

  await checkAdmin(msg);

  try {
    if (msg.text.toString().toLowerCase().includes('/warn')) {
      const userId = await getUserID(msg);
      const isUserInGroup = await checkInGroup(msg, userId);
      if (isUserInGroup === undefined || isUserInGroup === null || isUserInGroup === "" || isUserInGroup === "left" || isUserInGroup === "kicked" || isUserInGroup === "member") {
        bot.sendMessage(msg.chat.id, "User is not in the group");
        return;
      }

      if (await isWarnedAdmin(msg, userId)) {
        bot.sendMessage(msg.chat.id, "You cannot warn an admin");
        return;
      }

      //get the user name of the person to be warned
      let userName = await bot.getChat(userId);
      await checkWarnedUser(msg, userId, userName);
    }
  }
  catch {
    //ignore the messages that aren't typed by the user
  }
});
