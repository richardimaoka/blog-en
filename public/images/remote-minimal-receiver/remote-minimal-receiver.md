---
title: Akka remoting minimal example part 3 - receiver side
date: "2018-02-10T01:31:00.000+0900"
published: false
---

## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/remote-minimal).

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/YAuamfYBb1o" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>


This is the last of three articles about akka's remote message passing. The previous articles are here:

- [Akka remoting minimal example part 1 - setup](../remote-minimal-setup)
- [Akka remoting minimal example part 2 - sender side](../remote-minimal-sender)

### TcpHandlers

As in the previous article, Netty takes care of the message transport in the network layer.

![netty](/images/remote-minimal-receiver/netty.jpg)


Onc the receiver side, `TcpHandler` has the `onMessage` method, which is called when a message payload (serialized byte array) arrives on the receiver side. 

![tcphandler](/images/remote-minimal-receiver/tcphandler.jpg)


```scala
trait TcpHandlers extends ... {

  override def onMessage(...): Unit = {
    ...
    notifyListener(
      ..., 
      InboundPayload(ByteString(bytes))
    )
  }
```

The above `notifyListener`  method is as follows:

```scala
  def notifyListener(channel: Channel, msg: HandleEvent): Unit = 
    get(channel) foreach { _ notify msg }
```

and `notify` performs usual local message passing via the familiar `!` method, `actor ! ev`.

```
  final case class ActorHandleEventListener(actor: ActorRef) 
    extends HandleEventListener {
    
    override def notify(ev: HandleEvent): Unit =
      actor ! ev
  }
```

### EndPointReader and de-serialization

![deserialize](/images/remote-minimal-receiver/deserialize.jpg)

There are some intermediate actor(s) passes through the payload after the `notify` method described above (in the case of this example, `AkkaProtocolManager`).

Afterwards, an important `EndpointReader` actor receives the payload. It has the following `receive` method.

```scala
class EndpointReader(
  ...
  override def receive: Receive = {
    case InboundPayload(p) if p.size <= transport.maximumPayloadBytes ⇒
      ...     
      msgDispatch.dispatch(
        msg.recipient,
        msg.recipientAddress,
        // msg.serializedMessage.message: ByteString 
        msg.serializedMessage,
        msg.senderOption
      )
  ...
}        
```

When `EndPointReader` receives the payload, it is de-serialized from a serialized byte array (represented as `ByteString`) to a Scala object, with the following call in `DefaultMessageDispatcher`.

```
class DefaultMessageDispatcher(
    ...
    lazy val payload: AnyRef =
      MessageSerializer.deserialize(
        system, 
        serializedMessage
      )
    ...
}
```

`msgDispatch.dispatch` in `EndPointReader` finally passes the deserialized message to the `MessageReceiver` actor via local message passing.


![receiver](/images/remote-minimal-receiver/receiver.jpg)


## Instruction to run the example, and output

As this example uses [Akka remoting](https://doc.akka.io/docs/akka/2.5/remoting.html) to send a message,
you need to run two JVMs for the receiver and sender of the application respectively.

Firstly, run the receiver side with the `receiver` argument supplied to `Main`.

```
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd remote-minimal
> sbt
> runMain example.Main receiver
```

You'll get output like below, then it waits until the message is sent from the sender.

```
> runMain example.Main receiver
[info] Running example.Main receiver
Program args:
receiver
running startMessageReceiver()
[INFO] [02/03/2018 13:36:58.281] [run-main-0] [akka.remote.Remoting] Starting remoting
[INFO] [02/03/2018 13:36:58.462] [run-main-0] [akka.remote.Remoting] Remoting started; listening on addresses :[akka.tcp://receiverSystem@127.0.0.1:2551]
[INFO] [02/03/2018 13:36:58.464] [run-main-0] [akka.remote.Remoting] Remoting now listens on addresses: [akka.tcp://receiverSystem@127.0.0.1:2551]
provider = remote
listening at port = 2551
started a receiver actor = Actor[akka://receiverSystem/user/receiver#-603875191]
```

Then in the same directory, run the same `Main` with `sender` as the argument

```
> sbt
> runMain example.Main sender
```

this is the sender side output:

```
[info] Running example.Main sender
Program args:
sender
running startMessageSender()
[INFO] [02/03/2018 13:37:16.215] [run-main-0] [akka.remote.Remoting] Starting remoting
[INFO] [02/03/2018 13:37:16.427] [run-main-0] [akka.remote.Remoting] Remoting started; listening on addresses :[akka.tcp://senderSystem@127.0.0.1:2552]
[INFO] [02/03/2018 13:37:16.432] [run-main-0] [akka.remote.Remoting] Remoting now listens on addresses: [akka.tcp://senderSystem@127.0.0.1:2552]
provider = remote
listening at port = 2552
sending a message to akka.tcp://receiverSystem@127.0.0.1:2551/user/receiver
[INFO] [02/03/2018 13:37:19.533] [senderSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://senderSystem@127.0.0.1:2552/system/remoting-terminator] Shutting down remote daemon.
[INFO] [02/03/2018 13:37:19.537] [senderSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://senderSystem@127.0.0.1:2552/system/remoting-terminator] Remote daemon shut down; proceeding with flushing remote transports.
[INFO] [02/03/2018 13:37:19.577] [senderSystem-akka.actor.default-dispatcher-4] [akka.remote.Remoting] Remoting shut down
[INFO] [02/03/2018 13:37:19.577] [senderSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://senderSystem@127.0.0.1:2552/system/remoting-terminator] Remoting shut down.
[success] Total time: 5 s, completed Feb 3, 2018 1:37:19 PM
```

then you see the receiver output as follows:

```
EchoActor: received message = Hello!!
```

and immediately after that, the receiver side shows this error, which can be ignored.

```
[ERROR] [02/03/2018 13:37:19.572] [receiverSystem-akka.remote.default-remote-dispatcher-15] [akka.tcp://receiverSystem@127.0.0.1:2551/system/endpointManager/reliableEndpointWriter-akka.tcp%3A%2F%2FsenderSystem%40127.0.0.1%3A2552-0/endpointWriter] AssociationError [akka.tcp://receiverSystem@127.0.0.1:2551] <- [akka.tcp://senderSystem@127.0.0.1:2552]: Error [Shut down address: akka.tcp://senderSystem@127.0.0.1:2552] [
akka.remote.ShutDownAssociation: Shut down address: akka.tcp://senderSystem@127.0.0.1:2552
Caused by: akka.remote.transport.Transport$InvalidAssociationException: The remote system terminated the association because it is shutting down.
]
```

As explained in [this thrad in akka-user](https://groups.google.com/forum/#!topic/akka-user/eerWNwRQ7o0) mailing list, the error happens specifically when you launch a process like this example from sbt, but when you compile your application and run it witout sbt, then the error disappears.

Once everything is done, press the enter key on the receiver side's console and you get this:

```
[INFO] [02/03/2018 13:38:05.942] [receiverSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Shutting down remote daemon.
[INFO] [02/03/2018 13:38:05.944] [receiverSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Remote daemon shut down; proceeding with flushing remote transports.
[INFO] [02/03/2018 13:38:05.960] [receiverSystem-akka.actor.default-dispatcher-3] [akka.remote.Remoting] Remoting shut down
[INFO] [02/03/2018 13:38:05.960] [receiverSystem-akka.remote.default-remote-dispatcher-6] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Remoting shut down.
````

## References 

- Official documentation of Akka remoting at https://doc.akka.io/docs/akka/2.5/remoting.html
- Official documentation of Akka serialization at https://doc.akka.io/docs/akka/2.5/serialization.html
- Netty documentation at https://netty.io/