const http = require('http');
const firebase = require("firebase-admin");
const serviceAccount = require("./ServiceAccount.json");
const request = require('request');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const webHookUrl = 'https://dareniarbot.danilshchegol.now.sh/';
const BOT_TOKEN = '850976535:AAHlda5zro82_Gnqz8KBS70I5yBBc-FGoAQ';

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://js2019-b705e.firebaseio.com"
});

const db = firebase.firestore();
const photos = db.collection('photos');

const sendMessage = (chat_id, text, res) => {
    const sendMessageUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
    request.post({
        url: sendMessageUrl,
        method: 'post',
        body: {
          chat_id: chat_id,
          text: text
        },
        json: true
      },
      (error, response, body) => {
        //console.log(error);
        console.log(body);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end()
      }
    )
  };
  
  http.createServer(function (req, res) {
    let data = '';
  
    req.on('data', chunk => {
      data += chunk;
    });
  
    req.on('end', () => {
      const parsedUpdate = data != "" ? JSON.parse(data) : {};
      if (typeof parsedUpdate.message !== 'undefined') {
        const text = parsedUpdate.message.text;
        const chat_id = parsedUpdate.message.chat.id;
        if (text === '/help') {
          const reply = 'Usage:\n /imageof <your_word> sends you an random image.\nExample:\n/imageof dog - You\'ll get a random image of a dog.\n\nAll images are taken from https://unsplash.com.\n\n/history - You\'ll get history of your photos.'
          sendMessage(chat_id, reply, res)
        } else if (text === '/history') {
          let photosRef = photos.get().then(snapshot => {
              console.log(`PHOTO: SUCCESS`);
              let urls = ''
              snapshot.forEach(doc => {
                  urls += doc.data().url + '\n'
              });
              console.log(`HISTORY: ${urls}`);
              sendMessage(chat_id, urls, res)
          })
        } else if (text.match(/\/imageof (.+)/) != null) {

          const word = text.match(/\/imageof (.+)/)[1];
          request(`https://unsplash.com/search/photos/${word}`, function (error, response) { 
              console.log(response);
              console.log(error);
              const html = new JSDOM(response.body);
              const images = Array.from(html.window.document.getElementsByTagName("img"));
              let sources = [];
              images.forEach(img => {
                  if (img.src.includes('photo')) {
                      sources.push(img.src);
                  }
              });
              const photoURL = sources[Math.floor(Math.random() * sources.length)];
              sendMessage(chat_id, photoURL, res)
              let addDoc = db.collection('photos').add({
                  url: photoURL
                  }).then(ref => {
                  console.log('Added document with ID: ', ref.id);
                  });
          });
        }
      }
    });
  }).listen(3000);
  
  
  const setWebHook = () => {
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  
    request.post({
      url: setWebhookUrl,
      method: 'post',
      body: {
        url: webHookUrl
      },
      json: true
    },
    (error, response, body) => {
      console.log(body);
    })
  };

  setWebHook()
