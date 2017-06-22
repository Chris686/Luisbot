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
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('None', (session, args) => {
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
	// textAnalytics.sentiment()
    // .then((response) => {
        // session.send("Sentiment: " + JSON.stringify(response));
		// console.log('Got response', response);
    // })
    // .catch((err) => {
        // console.error('Encountered error making request:', err);
    // });
		
		request.post({
			headers: {
				'Ocp-Apim-Subscription-Key': '74f79220e9af438ca623d96758a4c36c',
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
			body: "" documents ": [
					 {
						 " language ": " en ",
						 " id ": " 1 ",
						 " text ": " Hey Dude "
			}]"
		},
			function (error, response, body) {
			session.send(JSON.stringify(body));
			console.log(body);
		});
    
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

