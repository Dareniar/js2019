const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const jsdom = require('jsdom');
const admin = require("firebase-admin");i

const { JSDOM } = jsdom;

const token = '850976535:AAHlda5zro82_Gnqz8KBS70I5yBBc-FGoAQ';

const bot = new TelegramBot(token, {polling: true});

const serviceAccount = require("./js2019-b705e-firebase-adminsdk-sh4au-1ba1da47b7.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://js2019-b705e.firebaseio.com"
  });

const db = admin.firestore();

bot.onText(/\/start/, function (msg, match) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! For informations about usage, creator, etc., please use the command /help!');
});

bot.onText(/\/help/, function (msg, match) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Usage:\n /imageof <your_word> sends you an random image.\nExample:\n/imageof dog - You\'ll get a random image of a dog.\n\nAll images are taken from https://unsplash.com.\n\n/history - You\'ll get history of your photos.');
});

bot.onText(/\/imageof (.+)/, function (msg, match) {
    const word = match[1];
    const chatId = msg.chat.id;
    request(`https://unsplash.com/search/photos/${match[1]}`, function (error, response) { 
        const html = new JSDOM(response.body);
        const images = Array.from(html.window.document.getElementsByTagName("img"))
        let sources = [];
        images.forEach(img => {
            if (img.src.includes('photo')) {
                sources.push(img.src);
            }
        });
        const photoURL = sources[Math.floor(Math.random() * sources.length)];
        bot.sendPhoto(chatId, photoURL);
        let addDoc = db.collection('photos').add({
            url: photoURL
            }).then(ref => {
            console.log('Added document with ID: ', ref.id);
            });
    });
});

bot.onText(/\/history/, function (msg, match) {
    const chatId = msg.chat.id;
    let photosRef = db.collection('photos').get().then(snapshot => {
        snapshot.forEach(doc => {
            bot.sendPhoto(chatId, doc.data().url)
            console.log(doc.id, '=>', doc.data());
        });
      })
});

const sendPhoto = (msg, url) => msg.reply.photo(url);