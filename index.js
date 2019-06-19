
const http = require('http');
const firebase = require('firebase-admin');
const serviceAcoount = require('./ServiceAccount.json')
const request = require('request');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const webHookUrl = 'https://dareniarphotobot3.danilshchegol.now.sh';
const BOT_TOKEN = '872565896:AAFps1T52KNMofzN_ULNbLgXz9s02nunRrI';

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAcoount),
  databaseURL: "https://js2019-b705e.firebaseio.com/"
});

const db = firebase.database();
const ref = db.ref('photos'); 

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
        console.log(error);
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
          const reply = 'Usage:\n /imageof <your_word> sends you a random image.\nExample:\n/imageof dog - You\'ll get a random image of a dog.\n\nAll images are taken from https://unsplash.com.\n\n/history - You\'ll get history of your photos.'
          sendMessage(chat_id, reply, res)
        } else if (text.includes('/imageof')) {
          const word = text.toString().replace('/imageof', '');
          request(`https://unsplash.com/search/photos/${word}`, function (error, response) { 
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
              sendMessage(chat_id, word + '\n' + photoURL, res)
              ref.push().set({url: photoURL})
          });
        } else if (text === '/history') {
          let urls = 'Last requests:\n\n';
          ref.limitToLast(5).once("value", function(snap) {
            snap.forEach(function(data) {
              if (data.val().url !== 'undefined') {
                urls += data.val().url + '\n\n';
              }
            });
            sendMessage(chat_id, urls, res);
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
