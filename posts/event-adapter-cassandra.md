---
title: Event Adapter with akka-persistence-cassandra
date: "2018-01-17T01:31:00.000+0900"
---


## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/event-adapter-tagging-cassandra).

<iframe width="640" height="360" src="https://www.youtube.com/embed/cIau92KiNiE" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

![cqlsh](/images/event-adapter-cassandra/cqlsh.png)

You firstly need [configuration](https://github.com/richardimaoka/resources/blob/master/event-adapter-tagging-cassandra/src/main/resources/application.conf#L26L33) to tie up `MyEventAdapter` under the `example` package, and `Event` under the same `example` package.

```plaintext
cassandra-journal {
  event-adapters {
    tagging-adapter = "example.MyEventAdapter"
  }
  event-adapter-bindings {
    "example.Event" = tagging-adapter
  }
}
```


In [MyPersistentAcdtor](https://github.com/richardimaoka/resources/blob/master/event-adapter-tagging-cassandra/src/main/scala/example/Main.scala#L28L38), when `persist` method is called, an `Event` is sent to [CassandraJournal](https://github.com/akka/akka-persistence-cassandra/blob/bf6bcbfa5d5616a285872ff605430c5b18ea289c/core/src/main/scala/akka/persistence/cassandra/journal/CassandraJournal.scala#L42).

```scala
override def receiveCommand: Receive = {
  case Command(i) ⇒
    persist(Event(i)) { 
      ...
    }
}
```

Then [CassandraJournal](https://github.com/akka/akka-persistence-cassandra/blob/bf6bcbfa5d5616a285872ff605430c5b18ea289c/core/src/main/scala/akka/persistence/cassandra/journal/CassandraJournal.scala#L42) invokes the `toJournal` method of [MyEventAdapter.scala](https://github.com/richardimaoka/resources/blob/master/event-adapter-tagging-cassandra/src/main/scala/example/MyEventAdapter.scala#L9).

```scala
override def toJournal(event: Any): Any = {
    val tags = Set("mytag1", "mytag2")
    Tagged(event, tags)
  }  
}
```

After that, `Tagged(event, tags)` is serialized to `Array[Byte]` 

In more detail, [CassandraJournal](https://github.com/akka/akka-persistence-cassandra/blob/bf6bcbfa5d5616a285872ff605430c5b18ea289c/core/src/main/scala/akka/persistence/cassandra/journal/CassandraJournal.scala#L42)'s [`def serializeEvent()`](https://github.com/akka/akka-persistence-cassandra/blob/bf6bcbfa5d5616a285872ff605430c5b18ea289c/core/src/main/scala/akka/persistence/cassandra/journal/CassandraJournal.scala#L464) method serializes `payload` (in this example, `Tagged(event, tags)`) to  `Array[Byte]` with [Akka serializer](https://doc.akka.io/docs/akka/2.5/serialization.html). After that, `CassandraJournal` prepares a CQL statement to set all necessary columns in Cassandra, including the `event` column to hold the binary of `Tagged(event, tags)`.

## Instruction to run the example
```plaintext
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd event-adapter-tagging-cassandra
> sbt
> runMain example.Main
```

## Output 
```plaintext
> runMain example.Main
[info] Running example.Main
receiveCommand  : Received Command(1)
EventAdapter    : toJournal called for event = Event(1), tags = Set(mytag1, mytag2)
[WARN] [SECURITY][01/17/2018 05:59:44.106] [exampleSystem-cassandra-plugin-default-dispatcher-8] [akka.serialization.Serialization(akka://exampleSystem)] Using the default Java serializer for class [example.Event] which is not recommended because of performance implications. Use another serializer or disable this warning using the setting 'akka.actor.warn-about-java-serializer-usage'
persist callback: Event = Event(1) persisted
persist callback: current state = 1
receiveCommand  : Received Command(2)
EventAdapter    : toJournal called for event = Event(2), tags = Set(mytag1, mytag2)
persist callback: Event = Event(2) persisted
persist callback: current state = 3
receiveCommand  : Received Command(3)
EventAdapter    : toJournal called for event = Event(3), tags = Set(mytag1, mytag2)
persist callback: Event = Event(3) persisted
persist callback: current state = 6
[ERROR] [01/17/2018 05:59:45.538] [exampleSystem-akka.actor.default-dispatcher-12] [akka://exampleSystem/user/p1] exploded!
java.lang.Exception: exploded!
        at example.MyPersistentActor$$anonfun$receiveCommand$1.applyOrElse(Main.scala:37)
        at akka.actor.Actor.aroundReceive(Actor.scala:517)
        at akka.actor.Actor.aroundReceive$(Actor.scala:515)
        at example.MyPersistentActor.akka$persistence$Eventsourced$$super$aroundReceive(Main.scala:11)
        at akka.persistence.Eventsourced$$anon$1.stateReceive(Eventsourced.scala:680)
        at akka.persistence.Eventsourced.aroundReceive(Eventsourced.scala:192)
        at akka.persistence.Eventsourced.aroundReceive$(Eventsourced.scala:191)
        at example.MyPersistentActor.aroundReceive(Main.scala:11)
        at akka.actor.ActorCell.receiveMessage(ActorCell.scala:527)
        at akka.actor.ActorCell.invoke(ActorCell.scala:496)
        at akka.dispatch.Mailbox.processMailbox(Mailbox.scala:257)
        at akka.dispatch.Mailbox.run(Mailbox.scala:224)
        at akka.dispatch.Mailbox.exec(Mailbox.scala:234)
        at akka.dispatch.forkjoin.ForkJoinTask.doExec(ForkJoinTask.java:260)
        at akka.dispatch.forkjoin.ForkJoinPool$WorkQueue.runTask(ForkJoinPool.java:1339)
        at akka.dispatch.forkjoin.ForkJoinPool.runWorker(ForkJoinPool.java:1979)
        at akka.dispatch.forkjoin.ForkJoinWorkerThread.run(ForkJoinWorkerThread.java:107)

EventAdapter    : fromJournal called for event = Event(1) and manifest =
EventAdapter    : fromJournal called for event = Event(2) and manifest =
EventAdapter    : fromJournal called for event = Event(3) and manifest =
receiveRecover  : Recovering an event = Event(1)
receiveRecover  : current state = 1
receiveRecover  : Recovering an event = Event(2)
receiveRecover  : current state = 3
receiveRecover  : Recovering an event = Event(3)
receiveRecover  : current state = 6
receiveCommand  : Received Command(4)
EventAdapter    : toJournal called for event = Event(4), tags = Set(mytag1, mytag2)
persist callback: Event = Event(4) persisted
persist callback: current state = 10
receiveCommand  : Received Command(5)
EventAdapter    : toJournal called for event = Event(5), tags = Set(mytag1, mytag2)
persist callback: Event = Event(5) persisted
persist callback: current state = 15
[success] Total time: 12 s, completed Jan 17, 2018 5:59:52 AM
```

## References 

- Official persistence documentation at https://doc.akka.io/docs/akka/2.5/persistence.html
- Official event adapter documentation for tagging at https://doc.akka.io/docs/akka/2.5/persistence.html#event-adapters
-  Official Akka serialization documentation at https://doc.akka.io/docs/akka/2.5/serialization.html
- akka-persistence-cassandra at https://github.com/akka/akka-persistence-cassandra
- Apache Cassandra downloading page at http://cassandra.apache.org/download/
- Datastax provides a great deal of documentation about Cassandra, including a free course avaialble as of the time of this blog post https://academy.datastax.com/courses