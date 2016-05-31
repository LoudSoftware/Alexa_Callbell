#!/usr/bin/python
import ssl
import paho.mqtt.client as mqtt


host = "A2WIU6V6IRFICI.iot.us-east-1.amazonaws.com"
topic = "$aws/things/chipcallbell/shadow/update"
root_cert = "root-CA.crt"
cert_file = "801655afc0-certificate.pem.crt"
key_file = "801655afc0-private.pem.key"


#logger = logging.getLogger('CHIP')


#def do_command(data):  #   {"name":"CommandIntent","slots":{"Task":{"name":"Task","value":"launch"}}}
#
#    task = str(data["slots"]["Task"]["value"])
#    logger.info("TASK = " + task)
#    global globalmessage
#
#    if task == "launch":
#        globalmessage = "executing command launch"
#        print globalmessage
#        arm_and_takeoff()
#    elif task in ["r. t. l.", "return to launch", "abort"]:
#        interrupt = True
#        globalmessage = "executing command RTL"
#        print globalmessage
#        vehicle.mode = VehicleMode("RTL")
#        vehicle.flush()
#    elif task == "land":
#        globalmessage = "executing command land"
#        print globalmessage
#        vehicle.mode = VehicleMode("LAND")
#        vehicle.flush()




# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, rc):
#    print("Connected with result code " + str(rc))
    print("connected with result code " + str(rc))
    # Subscribing in on_connect() means that if we lose the connection and      # reconnect then subscriptions will be renewed.    #    client.subscribe("$SYS/#")
    client.subscribe(topic)

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print("msg received, payload = " + str(msg.payload))
    data = json.loads(str(msg.payload))
  #  if None == data["name"]:
   #     return
    #elif data["name"] == "CommandIntent":
     #   do_command(data)




print('setting up mqtt client')
client = mqtt.Client(client_id="CHIP")
print('completed setting up mqtt client')
client.on_connect = on_connect
client.on_message = on_message
client.tls_set(root_cert,
               certfile = cert_file,
               keyfile = key_file,
               tls_version=ssl.PROTOCOL_TLSv1_2,
               ciphers=None)

client.connect(host, 8883, 60)
print('entering loop')
client.loop_forever()
