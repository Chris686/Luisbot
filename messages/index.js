/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
//var Store = require('./store');
//const cognitiveServices = require('cognitive-services'); 
/*const textAnalytics = new cognitiveServices.textAnalytics({
      API_KEY: '74f79220e9af438ca623d96758a4c36c'
  });*/
var request = require('request');
var Forecast = require("forecast");
   var forecast = new Forecast({
   		service: 'darksky',
   		key: '48b5aa78fb42669745ca06ae428c56cc',
   		units: 'celcius',
   		cache: true, // Cache API requests
   		ttl: { // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
   			minutes: 27,
   			seconds: 45
   		}
   	});

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
//var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
/*.matches('None', (session, args) => {
    session.send('Hi, none Intent \'%s\'.', session.message.text);
    
})
.matches('weather', (session, args) => {
    session.send('you asked for weather' + JSON.stringify(args));
   // Initialize

   // Retrieve weather information from coordinates (Sydney, Australia)
   forecast.get([-33.8683, 151.2086], function (err, weather) {
   	if (err)
   		return console.dir(err);
   	session.send(JSON.stringify(weather));
   });

})
.matches('Greeting', (session, args) => {
    session.send('Hi you');
		var jsonBody =  '{"documents": [{"language": "en","id": "1","text": "' + session.message.text + '"}]}'
		 request.post({
			 headers: {
				 'Ocp-Apim-Subscription-Key': '74f79220e9af438ca623d96758a4c36c',
				 'Content-Type': 'application/json',
				 'Accept': 'application/json'
			 },
			 url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
			 body: jsonBody
		 },
			 function (error, response, body) {
			 session.send(JSON.stringify(body));
		 });
    
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    */


bot.recognizer(recognizer);
bot.dialog('dialogGreeting',[
	function (session){
		session.send('Hi you');
	},
	function (session, results){
		session.send('Hi you2');
	}
]).triggerAction({matches: 'Greeting'});

bot.dialog('dialogweather',[
	function (session, args, next) {
		session.send('You asked for weather');
		session.send('You asked for weather3');
		session.send('You asked for weather3');
		 forecast.get([-33.8683, 151.2086], function (err, weather) {
			 if (err)
				 return console.dir(err);
			 session.send(JSON.stringify(weather));
		 });
		  //next({ response: weather });
	},
	function (session, results){
		//var destination = results.response;
		session.send("Hi You 2");
		
	}
]).triggerAction({matches: 'weather'});

bot.dialog('orderPizzaDialog', [
    function (session, args) {
        if (!args.continueOrder) {
            session.userData.cart = [];
            session.send("At anytime you can say 'cancel order', 'view cart', or 'checkout'.")
        }
        builder.Prompts.choice(session, "What would you like to add?", "Pizza|Drinks|Extras");
    },
    function (session, results) {
		builder.Prompts.text(session, 'Hi! What is your name?' + results.response.entity);
		//session.send("Hi You 2");
		//console.log(results.response.entity);
        session.beginDialog('add' + results.response.entity);
    },
    function (session, results) {
        if (results.response) {
            session.userData.cart.push(results.response);
        }
        session.replaceDialog('orderPizzaDialog', { continueOrder: true });
    }
]).triggerAction({ 
        matches: /order.*pizza/i,
        confirmPrompt: "This will cancel the current order. Are you sure?"
  })
  .cancelAction('cancelOrderAction', "Order canceled.", { 
      matches: /(cancel.*order|^cancel)/i,
      confirmPrompt: "Are you sure?"
  })
  .beginDialogAction('viewCartAction', 'viewCartDialog', { matches: /view.*cart/i })
  .beginDialogAction('checkoutAction', 'checkoutDialog', { matches: /checkout/i });

// Dialog for showing the users cart
bot.dialog('viewCartDialog', function (session) {
    var msg;
    var cart = session.userData.cart;
    if (cart.length > 0) {
        msg = "Items in your cart:";
        for (var i = 0; i < cart.length; i++) {
            msg += "\n* " + cart[i];
        }
    } else {
        msg = "Your cart is empty.";
    }
    session.endDialog(msg);
});

// Dialog for checking out
bot.dialog('checkoutDialog', function (session) {
    var msg;
    var cart = session.userData.cart;
    if (cart.length > 0) {
        msg = "Your order is on its way.";
    } else {
        msg = "Your cart is empty.";
    }
    delete session.userData.cart;
    session.endConversation(msg);
});


bot.dialog('addPizza', [
    // Step 1
    function (session) {
        builder.Prompts.text(session, 'Add Pizza');
    },
    // Step 2
    function (session, results) {
        session.endDialog('Hello %s!', results.response);
    }
]);



if (useEmulator) {
    
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

