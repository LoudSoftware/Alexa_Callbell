/**
 * This Amazon Alexa skill is used with the Callbell skill. This skill is controlled by a C.H.I.P or Raspberry Pi and is triggered by 
 * pre-recorded wav file that is played to the Alexa Skill Service. The response is then used to played over the floor or hospital loudspeaker
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest, etc.) 
// The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
         
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.****************") {
         context.fail("Invalid Application ID");
        }
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

 // Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

 //Called when the user launches the skill without specifying what they want.
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);
}

 //Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("codecallintent" === intentName) {
        codecallintent(intent, session, callback);
    } else if ("assistanceintent" === intentName) {
        assistanceintent(intent, session, callback);   
    } else if ("bathroomintent" === intentName) {
        bathroomintent(intent, session, callback);
    } else if ("bedintent" === intentName) {
        bedintent(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Not being used in this skill
}

// --------------- Functions that control the skill's behavior -----------------------
function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Intent that is triggered by C.H.I.P or Rapsberry Pi that plays Code overhead.
 */
function codecallintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var codecall = intent.slots.codecall.value;
    var validcodecall = [ "code blue", "rapid response", "code gray", "stroke alert"];
    var message = {};
    
    //This checks to see if the code that was said matches to what is in the intent slots.
    if (validcodecall.indexOf(codecall) == -1) {
        repromptText = "ERROR" ;
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    } 
    else { 
        speechOutput = codecall + ", room 124B," + codecall + ", room 124B," + codecall + ", room 124B"; //played overhead
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
    }  
}

//Intent that is triggered by C.H.I.P or Rapsberry Pi that plays that medical assistance is needed overhead.
function assistanceintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    
    speechOutput = "Medical assistance is needed in room 124B."; //played overhead
    callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
}

//Intent that is triggered by C.H.I.P or Rapsberry Pi that plays that patient is out of bed overhead.
function bedintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    
    speechOutput = "Bed Alarm Room 124B. Bed Alarm Room 124B"; //played overhead
    callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
}

//Intent that is triggered by C.H.I.P or Rapsberry Pi that plays that bathroom assistance is needed overhead.
function bathroomintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
   
    speechOutput = "Bathroom assistance is needed in room 124B."; //played overhead
    callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));   
}

// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
