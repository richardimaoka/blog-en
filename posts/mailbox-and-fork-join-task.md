---
title: Mailbox and ForkJoinTask
date: "2018-02-25T01:31:08.000+0900"
---


## Update to the article and the video

Thanks to Victor who immediately noticed I had wrong assumption about `ForkJoinTask` behavior in akka, now this article and videos were corrected.

<blockquote class="twitter-tweet" data-lang="ja"><p lang="en" dir="ltr">Only one FJT should be created.</p>&mdash; ⎷ (@viktorklang) <a href="https://twitter.com/viktorklang/status/967066161899819008?ref_src=twsrc%5Etfw">2018年2月23日</a></blockquote>


<blockquote class="twitter-tweet" data-lang="ja"><p lang="en" dir="ltr">No worries! Actually, many years ago it did create many FJT (..or rather, Runnables).</p>&mdash; ⎷ (@viktorklang) <a href="https://twitter.com/viktorklang/status/967082002804609024?ref_src=twsrc%5Etfw">2018年2月23日</a></blockquote>

## Overview

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/dnu6JqtzNJI" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

The previous [Dispatcher behavior](../dispatcher-behavior/) article explained how `Dispatcher` and threads are related to each other. In this article, we will go one step further in this regard.

The code example is at [GitHub](https://github.com/richardimaoka/resources/tree/master/local-minimal), which is the same example as 
what's discussed in [the local actor article(s)](http://localhost:8000/local-minimal-sender/).

## Thread-processing details in Akka

Following the instruction at the bottom of this article, you will get output as follows [(also in GoogleSpreadsheet)](https://drive.google.com/open?id=194-t1rYNQU2mprybSC9RibJ7HopCAdPqJX94XlIKxXk) . 

**SO MANY things in the table!! but no worries!** We will go through each important piece, one after another.

![whole-threads](/images/mailbox-and-fork-join-task/whole-threads.png)

## Caveats

You might notice that I am skipping some parts (some rows in the above table) in the article, but that is just to avoid confusion. Even with this simple example, Akka's internal processing is very complicated. So I am only covering pieces to help you understand important stuff.

## Thread[2]- sender side

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/mPmApp5B8s4" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

Firstly, let's look at "Thread[2]" from the output table. As far as what's explained this article, Thread[2] is pretty the sender side. 

The sender `Actor`'s `Mailbox` was `run()`, 

![thread2-a](/images/mailbox-and-fork-join-task/thread2-a.png)

triggerring [`MessageSender`](https://github.com/richardimaoka/resources/blob/master/local-minimal/src/main/scala/example/Main.scala#L15L20)'s `preStart()` method:

```scala
class MessageSender(messageReceiver: ActorRef) ... {
  override def preStart(): Unit = {
    val messages = List(
      "Hello World",
      "Hello Universe",
      "Hello Galaxy"
    )
    for(msg <- messages) {
      println(s"[${Thread.currentThread().getName}]|sending message $msg to $messageReceiver")
      messageReceiver ! msg
    }
  }
  ...
}
```

The very first message, `"Hello World"` was `dispatch`-ed (sent) as follows:

![thread2-b](/images/mailbox-and-fork-join-task/thread2-b.png)

and as in the [previous article](../dispatcher-behavior) the [`dispatch`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Dispatcher.scala#L52L56) method is implemented as below, which puts the message to the message queue of the mailbox, and ...

```scala
def dispatch(
  receiver: ActorCell,
  invocation: Envelope
): Unit = {
  val mbox = receiver.mailbox
  mbox.enqueue(receiver.self, invocation)
  registerForExecution(mbox, true, false)
}
```

... then `registerForExecution` scheduled `mbox` (= an instance of [`Mailbox`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Mailbox.scala#L56L57) which extends [`ForkJoinTask`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinTask.html)) to be executed on a different thread. 

```scala
abstract class Mailbox(val messageQueue: MessageQueue)
  extends ForkJoinTask[Unit]
  with SystemMessageQueue 
  with Runnable {
    ...
}
```

Same as the first message, the second ard thrid messages, `"Hellow Universe"` and `"Hello Galaxy"` were `dispatch`-ed as well. 

![thread2-c](/images/mailbox-and-fork-join-task/thread2-c.png)

Since the [`registerForExecution(mbox, ...)`](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Dispatcher.scala#L115) is called for the same `Mailbox` instance, `mbox`, the underlying `executorService` scheduled the same `Mailbox` (`ForkJoinTask`).

```scala
def registerForExecution(mbox: Mailbox, ...): Boolean = {
  ...
  executorService execute mbox
  ...
}
```

About the general behavior when you `execute` the same `ForkJoinTask` instance in `ForkJoinPool`, see my below tweet (not every single `ForkJoinTask` is really run):

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Ah I see this is how ForkJoinPool&#39;s execute method behaves differently when different Runnable instances are executed, and when the same Runnable instance is executed multiple times. <a href="https://t.co/OhuHMUyszU">pic.twitter.com/OhuHMUyszU</a></p>&mdash; Richard Imaoka (@richardimaoka) <a href="https://twitter.com/richardimaoka/status/967260911785226245?ref_src=twsrc%5Etfw">2018/2/23</a></blockquote>


## Thread[4]- receiver side

<p align="center"><iframe width="640" height="360" src="https://www.youtube.com/embed/91naDxLuveY" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

Let's move onto the "Thread[4]", the receiver side behavior. The point here (and for the whole article) is that `processMailbox()` is a **recursive method**.

The scheduled `ForkJoinTask` triggered the `run` method. Remenber `Mailbox extends ForkJoinTask`, so `Mailbox` overrides the `run` method.

![thread4-a](/images/mailbox-and-fork-join-task/thread4-a.png)

It's also discussed in the [previous article](../dispatcher-behavior), but `processMailbox` method executs the [`receive` method]((https://github.com/richardimaoka/resources/blob/master/local-minimal/src/main/scala/example/Main.scala#L8L11)
) of the `Actor`

![thread4-b](/images/mailbox-and-fork-join-task/thread4-b.png)

```scala
class MessageReceiver extends Actor {
  def receive = {
    case s: String =>
      println(s"${Thread.currentThread()} [${self.path}]|EchoActor: received message = $s")
  }
}
```

Next, you see `processMailbox()` was called multiple times before you see `Mailbox run() finished`.
![thread4-c](/images/mailbox-and-fork-join-task/thread4-c.png)

because [`processMailbox` method](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/scala/akka/dispatch/Mailbox.scala#L250) is actually recursive:

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

so it processed all the three messages, `"Hello World"`, `"Hello Universe"` and `"Hello Galaxy"` in the single call of `ForkJoinTask`'s `run`.

![thread4-d](/images/mailbox-and-fork-join-task/thread4-d.png)

How many messages can be processed by a single `ForkJoinTask` is controlled by the `throughput` setting in [config](https://github.com/akka/akka/blob/v2.5.9/akka-actor/src/main/resources/reference.conf#L513).

```plaintext
# Throughput defines the number of messages that are processed in a batch
# before the thread is returned to the pool. Set to 1 for as fair as possible.
throughput = 5
```

## Instruction to run the example, and output

We can use [the same example code](https://github.com/richardimaoka/resources/tree/master/local-minimal) as the "[Local Actor workflow part 1 - Sender side](../local-minimal-sender)" article.code, however, because you need a bit of tweaking which I am going to explain below.

Clone the akka repository,

```plaintext
> git clone https://github.com/akka/akka.git
> cd akka
```

and insert `println` calls [like this](https://github.com/richardimaoka/akka/commit/6b19cabf3d9895fd8cc925b760f6b9ec21a1eaef)) in akka to see the `Mailbox` and `Dispatcher` behavior. Then execute `publishLocal`,

```plaintext
> sbt
> project akka-actor
> publishLocal
```

now you will see `akka-actor_2.12;2.5-SNAPSHOT` is built and stored under your `.ivy` directory.

```
[info] :: delivering :: com.typesafe.akka#akka-actor_2.12;2.5-SNAPSHOT :: 2.5-SNAPSHOT :: integration :: Thu Feb 22 07:22:33 JST 2018
[info] delivering ivy file to Users/username/akka/akka-actor/target/ivy-2.5-SNAPSHOT.xml
[info]  published akka-actor_2.12 to Users/username/.ivy2/local/com.typesafe.akka/akka-actor_2.12/2.5-SNAPSHOT/poms/akka-actor_2.12.pom
[info]  published akka-actor_2.12 to Users/username/.ivy2/local/com.typesafe.akka/akka-actor_2.12/2.5-SNAPSHOT/jars/akka-actor_2.12.jar
[info]  published akka-actor_2.12 to Users/username/.ivy2/local/com.typesafe.akka/akka-actor_2.12/2.5-SNAPSHOT/srcs/akka-actor_2.12-sources.jar
[info]  published akka-actor_2.12 to Users/username/.ivy2/local/com.typesafe.akka/akka-actor_2.12/2.5-SNAPSHOT/docs/akka-actor_2.12-javadoc.jar
[info]  published ivy to Users/username/.ivy2/local/com.typesafe.akka/akka-actor_2.12/2.5-SNAPSHOT/ivys/ivy.xml
```

From here you move to the [local actor example code](https://github.com/richardimaoka/resources/tree/master/local-minimal). 


```plaintext
> cd ~
// or `cd` to whatever directory you like

> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd local-minimal
```

Make [this change](https://github.com/richardimaoka/resources/commit/15e140cb110e8ca37934eb150da94fea49e3431c) to the local example code, to use the 2.5-SNAPSHOT version of `akka-actor` jar built by the above step.

```scala
//build.sbt
 libraryDependencies ++= Seq(
-  "com.typesafe.akka" %% "akka-actor" % "2.5.9",
+  "com.typesafe.akka" %% "akka-actor" % "2.5-SNAPSHOT",
   scalaTest % Test
 )
```

From inside the `local-minimal` directory, you can do:

```plaintext
> sbt
> runMain example.Main
```

and you will output like the following (order of messages could be little differnt due to concurrency). 

After I did some clean-up, I posted the result [here in Google Spreadsheet](https://drive.google.com/open?id=194-t1rYNQU2mprybSC9RibJ7HopCAdPqJX94XlIKxXk). (Shortened the thread name, exclude [user guardian](https://doc.akka.io/docs/akka/2.5/general/supervision.html#user-the-guardian-actor) from logs, shortened the actor path, etc)

```plaintext
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() next=null
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|sending message Hello World to Actor[akka://exampleSystem/user/receiver#1486562265]
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello World,Actor[akka://exampleSystem/user/sender#-1400752577])) started
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello World,Actor[akka://exampleSystem/user/sender#-1400752577])) finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() called, shouldProcessMessage=true
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|sending message Hello Universe to Actor[akka://exampleSystem/user/receiver#1486562265]
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() next=Envelope(Hello World,Actor[akka://exampleSystem/user/sender#-1400752577])
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello Universe,Actor[akka://exampleSystem/user/sender#-1400752577])) started
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|EchoActor: received message = Hello World
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello Universe,Actor[akka://exampleSystem/user/sender#-1400752577])) finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() called, shouldProcessMessage=true
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|sending message Hello Galaxy to Actor[akka://exampleSystem/user/receiver#1486562265]
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() next=Envelope(Hello Universe,Actor[akka://exampleSystem/user/sender#-1400752577])
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello Galaxy,Actor[akka://exampleSystem/user/sender#-1400752577])) started
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|EchoActor: received message = Hello Universe
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Dispatcher dispatch(Envelope(Hello Galaxy,Actor[akka://exampleSystem/user/sender#-1400752577])) finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() called, shouldProcessMessage=true
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox processMailbox() called, shouldProcessMessage=true
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() next=Envelope(Hello Galaxy,Actor[akka://exampleSystem/user/sender#-1400752577])
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox processMailbox() next=null
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|EchoActor: received message = Hello Galaxy
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() called, shouldProcessMessage=true
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() next=null
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() called, shouldProcessMessage=false
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox processMailbox() called, shouldProcessMessage=false
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user/sender]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() called, shouldProcessMessage=false
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox processMailbox() finished
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox run() called
Thread[exampleSystem-akka.actor.default-dispatcher-4,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-2,5,run-main-group-8]|[akka://exampleSystem/user/receiver]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox run() finished
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() called, shouldProcessMessage=false
Thread[exampleSystem-akka.actor.default-dispatcher-3,5,run-main-group-8]|[akka://exampleSystem/user]|Mailbox processMailbox() finished
```

## References

- Official documentation of Akka Mailbox at https://doc.akka.io/docs/akka/current/mailboxes.html
- Official documentation of Akka Dispatcher at https://doc.akka.io/docs/akka/2.5/dispatchers.html
Oracle's official fork-join tutorial - https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html
Oracle's official fork-join article - http://www.oracle.com/technetwork/articles/java/fork-join-422606.html
ForkJoinTask javadoc - https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinTask.html
ForkJoinPool javadoc - https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html