---
title: Local Actor workflow part 2 - Receiver side
date: "2018-01-30T01:31:08.000+0900"
---

## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/local-minimal).

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/LbuLAtN20HA" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

This is continued from the previous article, [Local Actor workflow part 1 - Sender side](../local-minimal-sender). I would recommend you to read that article too.

Also, later I am going to write the remote versions of articles to illustrate the message-sending/receiving behavior of Akka Actor when sending across different JVMs.

## Workflow 

As in bottom of the previous [Local Actor workflow part 1 - Sender side](../local-minimal-sender) article, the below  [registerForExecution](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Dispatcher.scala#L115) method will let Java's [`ExecutorService`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html) process [`Mailbox`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Mailbox.scala#L56L57) , which is defined as `ForkJoinTask`, to be executed on a different thread.

```scala
def registerForExecution(mbox: Mailbox, ...): Boolean = {
  ...
  executorService execute mbox
  ...
}
```

```scala
abstract class Mailbox(val messageQueue: MessageQueue)
  extends ForkJoinTask[Unit] 
  with SystemMessageQueue 
  with Runnable {
    ...
}
```

When `ExecutorService` executes the `Mailbox` as `ForkJoinTask`, then the following [`run` method of `ForkJoinWorkerThread`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/java/akka/dispatch/forkjoin/ForkJoinWorkerThread.java#L103) is called:

```java
public void run() {...} 
```

(Somehow a copy of ForkJoinWorkerThread from Java's standard library is in akka's source code ... not sure why)

The `run` method above runs the [following method of `Mailbox`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Mailbox.scala#L250)

```scala
@tailrec private final def processMailbox(
  ...
  // def dequeue(): Envelope = messageQueue.dequeue()
  val next = dequeue() 
  ...
  actor invoke next
  ...
  processMailbox(...)
}
```

By `dequeue`-ing an `Envelope`, `Mailbox` calls the [`invoke` method of `ActorCell`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/actor/ActorCell.scala#L488), 

![processmailbox](/images/local-minimal-receiver/processmailbox.jpg)

```scala
final def invoke(messageHandle: Envelope): Unit = {
  ...
  receiveMessage(msg)
  ...
}
```

which unpacks the message from `Envelope` then calls [`receiveMessage` of `ActorCell`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/actor/ActorCell.scala#L527),

```scala
// def actor: Actor = ... in ActorCell
final def receiveMessage(msg: Any): Unit =
  actor.aroundReceive(behaviorStack.head, msg)
```

![receivemessage](/images/local-minimal-receiver/receivemessage.jpg)

Here, `Actor` has an important method called `aroundReceive`, 

```scala
def aroundReceive(receive: Actor.Receive, msg: Any): Unit = {
  if (
    receive.applyOrElse(msg, Actor.notHandledFun)
      .asInstanceOf[AnyRef] eq Actor.NotHandled
  ) {
    unhandled(msg)
  }
}
```

which, as the name suggests, wraps around `Actor`'s `receive` method. 

```scala
class MessageReceiver extends Actor {
  def receive = {
    case s: String =>
      EchoActor: received message = $s")
  }
}
```
![receive](/images/local-minimal-receiver/receive.jpg)

In `aroundReceive` you can see `receive.applyOrElse` is called, and if there is no match in `receive`'s patter-match, it will call `unhandled` of `Actor`.

Up to here, we have pretty much covered the receiver side of the behavior in actor's message passing. Next up, I will go through how this changes when sending to a remote JVM.

## Instruction to run the example
```plaintext
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd local-minimal
> sbt
> runMain example.Main
```

## Output 

Some `println` calls are inserted in the [complete example at GitHub](https://github.com/richardimaoka/resources/tree/master/local-minimal) to illustrate the behavior.

Thread names are shown as [exampleSystem-akka.actor.default-dispatcher-3] and [...-4].

```plaintext
[info] Running example.Main
provider = local
[exampleSystem-akka.actor.default-dispatcher-5] sending message Hello World to Actor[akka://exampleSystem/user/receiver#-846959521]
[exampleSystem-akka.actor.default-dispatcher-5] sending message Hello Universe to Actor[akka://exampleSystem/user/receiver#-846959521]
[exampleSystem-akka.actor.default-dispatcher-2] EchoActor: received message = Hello World
[exampleSystem-akka.actor.default-dispatcher-5] sending message Hello Galaxy to Actor[akka://exampleSystem/user/receiver#-846959521]
[exampleSystem-akka.actor.default-dispatcher-2] EchoActor: received message = Hello Universe
[exampleSystem-akka.actor.default-dispatcher-2] EchoActor: received message = Hello Galaxy
[success] Total time: 7 s, completed Jan 30, 2018 6:16:46 AM
```

## References 

- Official documentation of Akka Actor at https://doc.akka.io/docs/akka/2.5/actors.html
- Official documentation of Akka Dispatcher at https://doc.akka.io/docs/akka/2.5/dispatchers.html
- Official documentation of Akka lifecycle at https://doc.akka.io/docs/akka/current/actors.html$actor-lifecycle
- Official documentation of Akka Mailbox at https://doc.akka.io/docs/akka/2.5/mailboxes.html?language=scala#mailboxes)
- Official documentation of Akka location transparency at https://doc.akka.io/docs/akka/current/general/remoting.html#location-transparency
- Oracle's documentation about Fork/Join at https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html
- ExecutorService Javadoc at https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html