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
   // var forecast = new Forecast({
   		// service: 'darksky',
   		// key: '48b5aa78fb42669745ca06ae428c56cc',
   		// units: 'celcius',
   		// cache: true, // Cache API requests
   		// ttl: { // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
   			// minutes: 27,
   			// seconds: 45
   		// }
   	// });

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
.matches('weather', [
		getCoordinates, getWeather
])
.matches('Greeting', [
		checkLanguage, checkSentiment, getUserName, setUserName
	])
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
	//next();
]);

function addPizza(session, args, next){
	session.dialogData.entities = args.entities;
	builder.Prompts.text(session, 'Add Pizza' + JSON.stringify(args.entities));
	next();
}

function checkLanguage(session, args, next) {
	var jsonBody = '{"documents": [{"id": "1","text": "' + session.message.text + '"}]}'
		request.post({
			headers: {
				'Ocp-Apim-Subscription-Key': '74f79220e9af438ca623d96758a4c36c',
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/languages',
			body: jsonBody
		},
			function (error, response, body) {
			var answer = JSON.parse(body);
			var langu = answer.documents[0].detectedLanguages[0].iso6391Name;
			session.send("So you are Speaking " + answer.documents[0].detectedLanguages[0].name);
			next({ response: langu});
		});
}

function checkSentiment(session, args, next) {
	//session.send(args.response);
	var langua = args.response;
	var supLang = ["da", "de", "el", "en", "es", "fi", "fr", "ja", "it", "nl", "no", "pl", "pt", "ru", "sv", "tr"];
	if (supLang.indexOf(langua) == -1) {
		session.send("The requested Language is not supported we will try it in english");
		langua = "en";
	}
	var jsonBody = '{"documents": [{"language": "' + langua + '","id": "1","text": "' + session.message.text + '"}]}'
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
			//console.log(body);
			var answer = JSON.parse(body);
			session.send(JSON.stringify(answer.documents[0]));
			if (answer.documents[0].score >= 0.5) {
				next();
			} else {
				session.endDialog("Hi, so you are not in the mood maybe we talk later");
			}
		});
}

function getWeather(session, args, next){
	session.send('you asked for weather' + JSON.stringify(args));
	// Initialize
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

	// Retrieve weather information from coordinates (Sydney, Australia)
	forecast.get([-33.8683, 151.2086], function (err, weather) {
		if (err)
			return console.dir(err);
		session.send(JSON.stringify(weather));
	});
}

function thankYou(sessions, args, next){
	session.send("Thank you");
}

function getUserName(session, args, next){
	session.dialogData.entities = args.entities;
	var username = builder.EntityRecognizer.findEntity(args.entities, 'username');
	if(username){
		session.send("Hi " + username + ", How are you1");
		next({response: username.entity });
	}
	else if( session.dialogData.username){
		session.send("Hi " + session.dialogData.username + ", How are you2");
		next({ response: session.dialogData.username });
	}
	else{
		builder.Prompts.text(session, "What is your username?");
	}
}

function setUserName(session, args, next){
	var userName = args.response;
	if(!userName){
		session.endDialog("Hi, so you do not want to tell me your name");
		//next();
	}else{
		session.dialogData.username = userName;
		session.endDialog("Hi " + session.dialogData.username + ", How are you?");
		//next();
	}
}

function getCoordinates(session, args, next) {
	session.send(JSON.stringify(args));
	var options = {
		url: 'http://dev.virtualearth.net/REST/v1/Locations/Washington?key=Ahyluw9NpnIGK3I460J6z4Jpb0OpBPjK0RuV6gisXx_qozOX10O91kf2GhLah6mV',
		method: 'GET'
	}
	request(options, function (error, response, body) {
		if (error) {
			session.send(error);
		}
		var jsonBody = JSON.parse(body);
		var choices = "";
		var map = new Object();
		for (var i in jsonBody.resourceSets[0].resources) {
			map[jsonBody.resourceSets[0].resources[i].name] = "{Latitude:" + jsonBody.resourceSets[0].resources[0].point.coordinates[0] + ",Longitude:" + jsonBody.resourceSets[0].resources[0].point.coordinates[0] + "}";
		}
		if (Object.keys(map).length > 1) {
			builder.Prompts.choice(session, 'Which Loaction do you mean', map);
		} else {
			next({ response: map});
		}
		//session.send(map + "___" + JSON.stringify(map));
		//session.send(jsonBody.resourceSets[0].resources[0].name + "____" + jsonBody.resourceSets[0].resources[0].point.coordinates[1]);
		//next();
	});
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
