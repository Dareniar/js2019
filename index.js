const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const jsdom = require('jsdom');

const { JSDOM } = jsdom;

const token = '850976535:AAHlda5zro82_Gnqz8KBS70I5yBBc-FGoAQ';

const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, function (msg, match) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! For informations about usage, creator, etc., please use the command /help!');
});

bot.onText(/\/help/, function (msg, match) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Usage:\n /imageof <your_word> sends you an random image.\nExample:\n/imageof dog - You\'ll get a random image of a dog.\n\nAll images are taken from https://unsplash.com.');
});

bot.onText(/\/imageof (.+)/, function (msg, match) {
    const word = match[1];
    const chatId = msg.chat.id;
    request(`https://unsplash.com/search/photos/${match[1]}`, function (error, response) { 
        const html = new JSDOM(response.body);
        const images = html.window.document.getElementsByClassName('_2zEKz');
        let sources = [];
        for (var i = 0; i < images.length; i++) {
            if (images[i].src.includes('https')) {
                sources.push(images[i].src);
            }
        }
        if (typeof sources[0] !== "undefined") {
            bot.sendPhoto(chatId, sources[Math.floor(Math.random() * sources.length)]);
        } else {
            sendError(msg, match);
        }
    });
});

const sendPhoto = (msg, url) => msg.reply.photo(url); // Send the photo

const sendError = (msg, match) => msg.reply.text(`⚠️ Sorry, I couldn't find any image for "${match[1]}". ⚠️`);

