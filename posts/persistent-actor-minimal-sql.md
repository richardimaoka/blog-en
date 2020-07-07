---
title: PersistentActor minimal example with akka-persistence-sql-async
date: "2018-01-18T01:31:00.000+0900"
---

## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/persistent-actor-minimal-sql).
There is also an [official sample](https://github.com/okumin/akka-persistence-sql-async/tree/master/sample/src/main) available.


<iframe width="640" height="360" src="https://www.youtube.com/embed/WcpEMcnx5XU" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

![sql](/images/persistent-actor-minimal-sql/sql.png)

Refer to another post, [Persistence Actor Minimal example](../persistent-actor-minimal) for basics of PersistentActor.

In this example, the target DB is MySQL. Firstly you need to create a database `akka_persistence_sql_async` and execute [`mysql.sql`](https://github.com/richardimaoka/resources/blob/master/persistent-actor-minimal-sql/mysql.sql) so that the database has necessary tables.

In [MyPersistentAcdtor](https://github.com/richardimaoka/resources/blob/master/persistent-actor-minimal-sql/src/main/scala/example/Main.scala#L28L38), when `persist` method is called, an `Event` is sent to [ScalikeJDBCWriteJournal](https://github.com/okumin/akka-persistence-sql-async/blob/8dba8158273dbf206ce4abca0725e28207b1db1b/core/src/main/scala/akka/persistence/journal/sqlasync/ScalikeJDBCWriteJournal.scala).

```scala
override def receiveCommand: Receive = {
  case Command(i) ⇒
    persist(Event(i)) { 
      ...
    }
}
```

Then [ScalikeJDBCWriteJournal](https://github.com/okumin/akka-persistence-sql-async/blob/8dba8158273dbf206ce4abca0725e28207b1db1b/core/src/main/scala/akka/persistence/journal/sqlasync/ScalikeJDBCWriteJournal.scala) serializes `Event` to `Array[Byte]` with [Akka serializer](https://doc.akka.io/docs/akka/2.5/serialization.html). 

After that, `ScalikeJDBCWriteJournal` prepares an SQL statement to persist the data to an SQL database, including the `message` column to hold the binary of `Event`.

## Instruction to run the example
```plaintext
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd persistent-actor-minimal-sql
> sbt
> runMain example.Main
```

## Output 
```plaintext
[info] Running example.Main
receiveCommand  : Received Command Command(1)
persist callback: Event = Event(1) persisted
persist callback: current state = 1
receiveCommand  : Received Command Command(2)
persist callback: Event = Event(2) persisted
persist callback: current state = 3
receiveCommand  : Received Command Command(3)
persist callback: Event = Event(3) persisted
persist callback: current state = 6
[ERROR] [01/13/2018 17:24:19.422] [exampleSystem-akka.actor.default-dispatcher-7] [akka://exampleSystem/user/p1] exploded!
java.lang.Exception: exploded!
        at example.MyPersistentActor$$anonfun$receiveCommand$1.applyOrElse(Main.scala:37)
        at akka.actor.Actor.aroundReceive(Actor.scala:517)
        at akka.actor.Actor.aroundReceive$(Actor.scala:515)
        at example.MyPersistentActor.akka$persistence$Eventsourced$$super$aroundReceive(Main.scala:11)
        at akka.persistence.Eventsourced$$anon$1.stateReceive(Eventsourced.scala:663)
        at akka.persistence.Eventsourced.aroundReceive(Eventsourced.scala:183)
        at akka.persistence.Eventsourced.aroundReceive$(Eventsourced.scala:182)
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

receiveRecover  : Recovering an event = Event(1)
receiveRecover  : current state = 1
receiveRecover  : Recovering an event = Event(2)
receiveRecover  : current state = 3
receiveRecover  : Recovering an event = Event(3)
receiveRecover  : current state = 6
receiveCommand  : Received Command Command(4)
persist callback: Event = Event(4) persisted
persist callback: current state = 10
receiveCommand  : Received Command Command(5)
persist callback: Event = Event(5) persisted
persist callback: current state = 15
[success] Total time: 2 s, completed Jan 13, 2018 5:24:20 PM
```

## References 

- Official persistence documentation at https://doc.akka.io/docs/akka/2.5/persistence.html
- Official Akka serialization documentation at https://doc.akka.io/docs/akka/2.5/serialization.html
- akka-persistence-sql-async plugin at https://github.com/okumin/akka-persistence-sql-async
