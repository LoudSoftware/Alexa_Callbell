
/**
 * This Amazon Alexa skill is used with the Callbell skill. This skill is controlled by a C.H.I.P or Raspberry Pi and is triggered by 
 * pre-recorded wav file that is played to the Alexa Skill Service. The response is then used to played over the floor or hospital loudspeaker
 */

// Needed for Amazon SNS and IOT services
var AWS = require('aws-sdk');
// var iotdata = new AWS.IotData({endpoint: 'https://A************I.iot.us-east-1.amazonaws.com'}); //Add your IOT Endpoint here

// Route the incoming request based on type (LaunchRequest, IntentRequest, etc.) 
// The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        if (event.session.application.applicationId !== "amzn1.ask.skill.b681c25c-554d-4ae9-a1d4-2e0c6f03d626") {
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
    getWelcomeResponse(callback); // Dispatch to your skill's launch.
}

//Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("bathroomintent" === intentName) {
        bathroomintent(intent, session, callback);
    } else if ("comfortintent" === intentName) {
        comfortintent(intent, session, callback);
    } else if ("nurseintent" === intentName) {
        nurseintent(intent, session, callback);
    } /*else if ("codeintent" === intentName) {
        codeintent(intent, session, callback);
        
}*/ else if ("painintent" === intentName) {
        painintent(intent, session, callback);    
    } else if ("bedintent" === intentName) {
        bedintent(intent, session, callback);    
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
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
function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Please tell me how your nurse can help you.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me how your nurse can help you. " +
                    "You can ask. Can I have a pillow? or, Can I get pulled up in bed?";
    var shouldEndSession = false;
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "If you require any other assistance please let me know.";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Intent that calls an overhead Code and Text message to all staff.
 */
function codeintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var codes = intent.slots.codes.value;
    var validcodes = [ "code blue", "rrt", "rapid response", "code gray", "stroke alert", "code stroke"];
    var message = {};
    
    //This checks to see if the code that was said matches to what is in the intent slots.
    if (validcodes.indexOf(codes) == -1) {
        speechOutput = "I'm not sure what code you are attempting to call. Please repeat";
        repromptText = "I'm not sure what code you are attempting to call." +
            "Please say a code you are looking to call";
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    } 
        
    //If code is, a SMS and message to IOT is sent.      
    else { 
        codeCMD(codes, function(speechOutput){
            speechOutput = "A, " + codes + " ,is being called. The team should arrive shortly.";   
            callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    }  
}

//Sends message to SNS Topic and Message to the IOT shadow
function codeCMD(codes, callback) {
    console.log("\n\nLoading handler\n\n");
    var sns = new AWS.SNS(); //Needed in order to send message to Amazon SNS
    //Payload for the AWS IOT
    var params = {
        topic: '$aws/things/chipcallbell/shadow/update', //Add your AWS IOT 
        payload: '{"state": {"reported": { "command": "'+ codes + '" }}}',
        qos: 1
    }; 
    
    //Sends message to Amazon SNS
    sns.publish({
        Message: 'A ' + codes + ' is being called in room 124B',
        TopicArn: 'arn:aws:sns:us-east-1:110522202475:nurse' //Add your SNS ARN here
    }, function(err, data) {
        if (err) {
            console.log(err.stack); //an error occured
            callback("Error when sending message");
        }
        console.log('push sent');//message sent
        console.log(data);  
        callback("");
    });//Logs if your SNS message was sent.. 
}

/**
 * Intent that is triggered by the C.H.I.P GIOP of the bed alarm
 * Will send an overhead alert and Text message to all staff.
 */
function bedintent(intent, session, callback) {
    var cardTitle = "Patient out of bed";
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var message = {};
    
    //If intent is called a SMS and message to IOT is sent.
    bedCMD(function(speechOutput){
        speechOutput = "Please do not get out of bed. I am sending someone to assist you, please remain in bed until they arrive.";
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}  

//Sends message to SNS Topic and Message to the IOT shadow
function bedCMD(callback) {
    console.log("\n\nLoading handler\n\n");
    var sns = new AWS.SNS();//Needed in order to send message to Amazon SNS
    //Payload for the AWS IOT
    var params = {
        topic: '$aws/things/chipcallbell/shadow/update', //Add your AWS IOT 
        payload: '{"state": {"reported": { "command": "bed" }}}',
        qos: 1
    };

    //Sends message to Amazon SNS
    sns.publish({
        Message: 'Bed alarm room 124B',
        TopicArn: 'arn:aws:sns:us-east-1:110522202475:nurse' //Add your SNS ARN here
    }, function(err, data) {
        if (err) {
            console.log(err.stack); //an error occured
            callback("Error when sending message");
        }
        console.log('push sent'); //message sent
        console.log(data);
        callback(""); 
    }); //Logs if your SNS message was sent.
}

/**
 * Intent that call an overhead alert for bathroom aid and Text message to Nursing assistants.
 */
function bathroomintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var bathroom = intent.slots.bathroom.value;
    var validbathroom = [ "bedpan", "urinal", "poop", "pee", "bathroom", "commode", "shit", "bowel movement", "crap"];
    
    //This checks to see if the request that was said matches to what is in the intent slots.
    if (validbathroom.indexOf(bathroom) == -1) {
        speechOutput = "I'm not sure what you are asking for. Please something like, I need to use the bathroom or I need a pillow";
        repromptText = "I'm not sure what you are asking for." +
            "Please something like, I need to use the bathroom or I need a pillow";
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        } 
        
    //If request is, a SMS and message to IOT is sent.    
    else { 
            bathroomCMD(bathroom, function(speechOutput){
                speechOutput = "I am sending someone to assist you with using the bathroom, they should arrive shortly, please remain where you are until they arrive to assist you.";
                callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
    }  
}

//Sends message to SNS Topic and Message to the IOT shadow
function bathroomCMD(bathroom, callback) {
    console.log("\n\nLoading handler\n\n");
    var sns = new AWS.SNS();//Needed in order to send message to Amazon SNS
    //Payload for the AWS IOT
    var params = {
        topic: '$aws/things/chipcallbell/shadow/update', //Add your AWS IOT
        payload: '{"state": {"reported": { "command": "bathroom" }}}',
        qos: 1
    };

    //Sends message to Amazon SNS
    sns.publish({
        Message: 'Bathroom Assistance is needed in room 124B',
        TopicArn: 'arn:aws:sns:us-east-1:110522202475:nurse' //Add your SNS ARN here
    }, function(err, data) {
        if (err) {
            console.log(err.stack); //an error occured
            callback("Error when sending message");
        }
        console.log('push sent'); //message sent
        console.log(data);
        callback("");
    }); //Logs if your SNS message was sent.
}

/**
 * Intent that calls an overhead alert and Text message to nurses.
 */
function painintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var pain = intent.slots.pain.value;
    var validpain = [ "pain medication", "medication", "pain medications", "medications"];

    //This checks to see if the request that was said matches to what is in the intent slots.
    if (validpain.indexOf(pain) == -1) {
        speechOutput = "I'm not sure what you are asking for. Please something like, I need pain medication";
        repromptText = "I'm not sure what you are asking for." +
            "Please something like, I am having pain or I need pain medication";
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        } 
    //If request is, a SMS and message to IOT is sent.    
    else { 
        painCMD(pain, function(speechOutput){
            speechOutput = "I am making your nurse aware that you require " + pain + ". Your nurse should arrive shortly to speak with you.";
            callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    }  
}

//Sends message to SNS Topic and Message to the IOT shadow
function painCMD(pain, callback) {
    console.log("\n\nLoading handler\n\n");
    var sns = new AWS.SNS();//Needed in order to send message to Amazon SNS
    //Payload for the AWS IOT
    var params = {
        topic: '$aws/things/chipcallbell/shadow/update', //Add your AWS IOT
        payload: '{"state": {"reported": { "command": "assistance" }}}',
        qos: 1
    };
    
    //Sends message to Amazon SNS
    sns.publish({
        Message: 'Room 124B is requesting ' + pain,
        TopicArn: 'arn:aws:sns:us-east-1:110522202475:nurse' //Add your SNS ARN here
    }, function(err, data) {
        if (err) {
            console.log(err.stack); //an error occured
            callback("Error when sending message");
        }
        console.log('push sent'); //message sent
        console.log(data);
        callback("");  
    }); //Logs if your SNS message was sent.
}

/**
 * Intent that sends a Text message to all staff.
 */
function comfortintent(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var comfort = intent.slots.comfort.value;
    var validcomfort = [ "pillow", "blanket", "sheet", "towel" ];
    
    //This checks to see if the request that was said matches to what is in the intent slots.
    if (validcomfort.indexOf(comfort) == -1) {
        speechOutput = "I'm not sure what you are asking for. Please something like, I need to use the bathroom or I need a pillow";
        repromptText = "I'm not sure what you are asking for." +
            "Please something like, I need to use the bathroom or I need a pillow";
        callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        } 
    //If request is, a SMS message is sent.    
    else { 
        comfortCMD(comfort, function(speechOutput){
            speechOutput = "I am sending someone to bring you a," + comfort + ", they should arrive shortly, please remain where you are until they arrive.";
            callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    }  
}

//Sends message to SNS Topic and Message to the IOT shadow
function comfortCMD(comfort, callback) {
    console.log("\n\nLoading handler\n\n");
    var sns = new AWS.SNS();//Needed in order to send message to Amazon SNS
    
    //Sends message to Amazon SNS
    sns.publish({
        Message: 'Room 124B requires a ' + comfort,
        TopicArn: 'arn:aws:sns:us-east-1:110522202475:nurse' //Add your SNS ARN here
    }, function(err, data) {
        if (err) {
            console.log(err.stack); //an error occured 
            callback("Error when sending message");
        }
        console.log('push sent'); //message sent
        console.log(data);
        callback(""); //Executed
    }); //Logs if your SNS message was sent.
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