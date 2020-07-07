---
title: Akka remoting minimal example part 2 - sender side
date: "2018-02-04T01:31:00.000+0900"
---

## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/remote-minimal).

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/TJJUcaJqUeY" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

This is continued from [the previous article](../remote-minimal-setup), and now we are going deep into the implementation and behavior of akka remoting on the sender side.

### Workflow

As in the `Main` of this example, the sender side sends a message `"Hello"` to the receiver side, but in this example, as it uses remoting, the receiver side is referenced by `ActorSelection` instead of local `ActorRef` unlike the [local sender example](../local-minimal-sender).

```scala
val selection: ActorSelection =
  context.actorSelection(path)

selection ! "Hello!!"
```

`ActorSelection` has `path` inside, which is a URL of the target actor. The components of the `path` URL is shown as follows: 

```scala
 val path = "akka.tcp://receiverSystem@127.0.0.1:2551/user/receiver"
```

![path](/images/remote-minimal-sender/path.jpg)

You can find more detail about akka's path [in the official documentation](https://doc.akka.io/docs/akka/current/general/addressing.html?language=scala#actor-references-paths-and-addresses), and [components of the path](https://doc.akka.io/docs/akka/current/remoting.html#looking-up-remote-actors).

Now let's look into the [`!` method](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/actor/ActorSelection.scala#L265) of `ActorSelection`,

```scala
trait ScalaActorSelection {
  this: ActorSelection ⇒

  def !(msg: Any)
       (implicit sender: ActorRef = Actor.noSender) = 
    tell(msg, sender)
}
```

and the below [`tell` method](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/actor/ActorSelection.scala#L44L47) called from the above. You can see that the original message `"Hello"` is wrapped into `ActorSelectionMessage`.

```scala
def tell(
  msg: Any,
  sender: ActorRef
): Unit =
  ActorSelection.deliverSelection(
    ...,
    ActorSelectionMessage(msg, ...)
  )
``` 

![actorselectionmessage](/images/remote-minimal-sender/actorselectionmessage.jpg)

Through the `deliverSelection` method, `ActorSelection` calls [the following method of `RemoteActorRef`](https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/RemoteActorRefProvider.scala#L94).

```scala
override def !(message: Any)(...): Unit = {
  ...
  //remote: RemoteTransport
  remote.send(message, Option(sender), this) 
  ...
}
```

`remote` is an instance of `RemoteTransport` which has the following [`send` method](
https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/Remoting.scala#L222L225)

```scala
override def send(message: Any, ... ): Unit = 
  ...
  case Some(manager) 
    ⇒ manager.tell(Send(message, ... ), ... )
  ...  
}  
```

`manager` is ActorRef pointing to an `EndPointManager`. (More precisely, there is actually one more actor in-between, but the message is anyway delivered to `EndPointManager`).

![endpointmanager](/images/remote-minimal-sender/endpointmanager.jpg)

`EndpointManager` manager [has a buffer inside](https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/Endpoint.scala#L567), 

```scala
val buffer = new java.util.LinkedList[AnyRef]
```  

and upon flushing the buffer, [the `sendBufferedMessages` method](
https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/Endpoint.scala#L673L735) is called to efficiently send buffered messages via network. 


```scala
def sendBufferedMessages(): Unit = {
  ...
  val ok = writePrioLoop() && writeLoop(SendBufferBatchSize)
  ...
}
```

The reason for this buffering behavior is, if my understanding is correct, because there is throughput gap between local message-passing (up to `EndPointWriter`) and the remote message-passing (after `EndPointWriter`), so this buffering behavior will fill in the gap and keep the overall throughput of whole message-passing high.

There is a following method in [`EndpointWriter`](https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/Endpoint.scala#L777L823),

```scala
//class EndpointWriter in akka.remote.Endpoint.scala
  def writeSend(s: Send): Boolean = try {
    ...
      
      val pdu: ByteString = codec.constructMessage(
        ..., 
        serializeMessage(s.message), 
        ...)

      ...
      val ok = h.write(pdu)
    ...
  }
```

which performs message serialization, so that the message is converted to a payload which can be passed via network. As akka doc's [serialization section](https://doc.akka.io/docs/akka/2.5/serialization.html) says:

> However, messages that have to escape the JVM to reach an actor running on a different host have to undergo some form of serialization (i.e. the objects have to be converted to and from byte arrays).

![serialize](/images/remote-minimal-sender/serialize.jpg)

serialization converts a JVM object into `Array[Byte]`. The above `writeSend` converts `Array[Byte]` further into `ByteString` by [its `apply` method](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/util/ByteString.scala#L25). `ByteString` is extensively used in Akka when payload needs to be send via network.

```scala
object ByteString {

  /**
   * Creates a new ByteString by copying a byte array.
   */
  def apply(bytes: Array[Byte]): ByteString = CompactByteString(bytes)
```

Now it comes down to the point between the application (akka) layer and the network layer. The [`write` method](https://github.com/akka/akka/blob/v2.5.9/akka-remote/src/main/scala/akka/remote/transport/netty/TcpSupport.scala#L86L103) of `TcpAssociationHandle` has `Channel` class instance where the `Channel` class is defined in the `Netty` library.

```scala
//Channel is a class in netty, so from here the work is passed to netty
private[remote] class TcpAssociationHandle(
  val localAddress:    Address,
  val remoteAddress:   Address,
  val transport:       NettyTransport,
  private val channel: Channel)
  extends AssociationHandle {
  import transport.executionContext

  override val readHandlerPromise: Promise[HandleEventListener] = Promise()

  override def write(payload: ByteString): Boolean =
    if (channel.isWritable && channel.isOpen) {
      channel.write(ChannelBuffers.wrappedBuffer(payload.asByteBuffer))
      true
    } else false

```

![netty](/images/remote-minimal-sender/netty.jpg)

So this lets netty take care of payload transfer to a remote JVM.

## Instruction to run the example, and output

As this example uses [Akka remoting](https://doc.akka.io/docs/akka/2.5/remoting.html) to send a message,
you need to run two JVMs for the receiver and sender of the application respectively.

Firstly, run the receiver side with the `receiver` argument supplied to `Main`.

```plaintext
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd remote-minimal
> sbt
> runMain example.Main receiver
```

You'll get output like below, then it waits until the message is sent from the sender.

```plaintext
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

```plaintext
> sbt
> runMain example.Main sender
```

this is the sender side output:

```plaintext
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

```plaintext
EchoActor: received message = Hello!!
```

and immediately after that, the receiver side shows this error, which can be ignored.

```plaintext
[ERROR] [02/03/2018 13:37:19.572] [receiverSystem-akka.remote.default-remote-dispatcher-15] [akka.tcp://receiverSystem@127.0.0.1:2551/system/endpointManager/reliableEndpointWriter-akka.tcp%3A%2F%2FsenderSystem%40127.0.0.1%3A2552-0/endpointWriter] AssociationError [akka.tcp://receiverSystem@127.0.0.1:2551] <- [akka.tcp://senderSystem@127.0.0.1:2552]: Error [Shut down address: akka.tcp://senderSystem@127.0.0.1:2552] [
akka.remote.ShutDownAssociation: Shut down address: akka.tcp://senderSystem@127.0.0.1:2552
Caused by: akka.remote.transport.Transport$InvalidAssociationException: The remote system terminated the association because it is shutting down.
]
```

As explained in [this thrad in akka-user](https://groups.google.com/forum/#!topic/akka-user/eerWNwRQ7o0) mailing list, the error happens specifically when you launch a process like this example from sbt, but when you compile your application and run it witout sbt, then the error disappears.

Once everything is done, press the enter key on the receiver side's console and you get this:

```plaintext
[INFO] [02/03/2018 13:38:05.942] [receiverSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Shutting down remote daemon.
[INFO] [02/03/2018 13:38:05.944] [receiverSystem-akka.remote.default-remote-dispatcher-5] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Remote daemon shut down; proceeding with flushing remote transports.
[INFO] [02/03/2018 13:38:05.960] [receiverSystem-akka.actor.default-dispatcher-3] [akka.remote.Remoting] Remoting shut down
[INFO] [02/03/2018 13:38:05.960] [receiverSystem-akka.remote.default-remote-dispatcher-6] [akka.tcp://receiverSystem@127.0.0.1:2551/system/remoting-terminator] Remoting shut down.
````

## References 

- Official documentation of Akka remoting at https://doc.akka.io/docs/akka/2.5/remoting.html
- Official documentation of Akka serialization at https://doc.akka.io/docs/akka/2.5/serialization.html
- Netty documentation at https://netty.io/