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
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

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
   session.beginDialog("addPizza");

})
.matches('Greeting', (session, args) => {
	addPizza
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

 bot.dialog('addPizza', [
    // Step 1
    function (session) {
		//session.userData.cart
        builder.Prompts.text(session, 'Add Pizza');
    }
	// ,
    // // Step 2
    // function (session, results) {
        // session.endDialog('Hello %s!', results.response);
    // }
]);

function addPizza(session, args, netxt){
	session.dialogData.entities = args.entities;
	builder.Prompts.text(session, 'Add Pizza' + args.entities);
}



if (useEmulator) {
    
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

// function getName(session) {
   
// }

// function getEmail(session) {
    // var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // email = session.message.text;
    // if (re.test(email)) {
        // session.userData.email = email;
        // session.send("Thank you, " + session.userData.name + ". Please set a new password.");
    // } else {
        // session.send("Please type a valid email address. For example: test@hotmail.com");
    // }
// }
