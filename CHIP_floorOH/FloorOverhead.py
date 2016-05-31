import paho.mqtt.client as mqtt
import ssl
import time
import alsaaudio
import wave
import os
import random
from creds import *
import requests
import json
import re
from memcache import Client

#Setup of device
audio = ""
servers = ["127.0.0.1:11211"]
mc = Client(servers, debug=1)

def on_connect(client, userdata, flags, rc): #Connect and subscribe to Amazon IOT
    print("Connected")
    client.subscribe("$aws/things/chipcallbell/shadow/update") #Place your IOT topic here
    print("Subscribed")

def on_message(client, userdata, msg): #Runs when shadow changes from the lambda publish script
        print("Message Received")
        msgpayload = str(msg.payload) #Will check the message and run a function based on what the message is.
        print(msgpayload)
        if 'code blue' in msgpayload:
            codeblue()
        elif 'code gray' in msgpayload:
            codegray()
        elif 'rrt' in msgpayload:
            rrt() 
        elif 'rapid response' in msgpayload:
            rrt()   
        elif 'stroke alert' in msgpayload:
            stroke() 
        elif 'code stroke' in msgpayload:
            stroke()    
        elif 'bathroom' in msgpayload:
            bathroom() 
        elif 'assistance' in msgpayload:
            assistance()  
        elif 'bed' in msgpayload:
            bedalarm()                      

def gettoken(): #this is used for Amazon Alexa Voice Service
    token = mc.get("access_token")
    refresh = refresh_token
    if token:
        return token
    elif refresh:
        payload = {"client_id" : Client_ID, "client_secret" : Client_Secret, "refresh_token" : refresh, "grant_type" : "refresh_token", }
        url = "https://api.amazon.com/auth/o2/token"
        r = requests.post(url, data = payload)
        resp = json.loads(r.text)
        mc.set("access_token", resp['access_token'], 3570)
        return resp['access_token']
    else:
        return False        

def bathroom(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Bathroom Assistance Needed!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('bathroom.wav') as inf: #pre-recorded WAV File
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')

def bedalarm(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Bed Alarm!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('bedalarm.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')    

def codeblue(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Code Blue Being Called!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('blue.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')  

def codegray(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Code Gray Being Called!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('gray.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')  

def rrt(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Rapid Response Being Called!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('rrt.wav') as inf: #Pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')  

def stroke(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Stroke Alert Being Called!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('stroke.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')  

def bathroom(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Bathroom Assistance Needed!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('bathroom.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')

def assistance(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("Medical Assistance Needed!")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('assistance.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg321 -q 1sec.mp3 response.mp3')        

token = gettoken()        
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
#Ensure Cert and Private key files from AWS IOT are in the same directory. The root-CA.crt is genaric and you can use mine
client.tls_set(ca_certs='root-CA.crt', certfile='a737819605-certificate.pem.crt', keyfile='a737819605-private.pem.key', tls_version=ssl.PROTOCOL_SSLv23)
client.tls_insecure_set(True)
client.connect("A*************I.iot.us-east-1.amazonaws.com", 8883, 60) #place your IOT endpoint here
client.loop_forever()
