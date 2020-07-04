---
title: Akka behavior in different levels of detail
date: "2018-02-26T12:31:08.000+0900"
---

## Overview

<iframe width="640" height="360" src="https://www.youtube.com/embed/hHNmGxf7Mwc" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

As we went through the Akka internal behavior in previous articles, let's review it from a high/conceptual level to a low/internal level where you see an Akka application as a huge `ForkJoinTask` application (although it doesn't use fork-join mechanism).

Previous articles related to this post are here:

- [Local Actor workflow part 1 - Sender side](../local-minimal-sender/)
- [Local Actor workflow part 2 - Receiver side](../local-minimal-receiver/)
- [Dispatcher behavior](../dispatcher-behavior/)
- [Mailbox and ForkJoinTask](../mailbox-and-fork-join-task/)

## The highest level: Actors pass messages

<iframe width="640" height="360" src="https://www.youtube.com/embed/x5GEmjyJD2U" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

If you ever heard of Akka, or an actor model in general, you might know that actors, which are minimal components consisting of your entire application, communicate to each other by passing messages.

This is usually what people would mention when they try to explain the actor model to those who never heard of it.

## The second level: Actor's ! and receive methods

<iframe width="640" height="360" src="https://www.youtube.com/embed/FNlqhNrKsLQ" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

The next level touches something specific to Akka. If you have experience programming an application using Akka, you would know that Akka provides:

- The `!` method in `ActorRef` to send a message to an `Actor`
- The `receive` method in `Actor` which you need to implement in your concrete `Actor` class, and the `receive` method processes incoming messages

For those who don't need to interact with Akka day to day, knowing what the `!` and `receive` methods are helps them understand Akka-based applications written by someone else.

Or with this level of knowledge, you can still implement your important (so-called domain or business) logic for your application inside the `receive` method. Then Akka takes care of actual execution of the `receive` method in a multi-threaded environment, but you are not yet exposed to how threads are employed by Akka to power your application.

Let’s go to the next level for more serious Akka users. We are going to look at `MessageQueue`

## The third level: MessageQueue

<iframe width="640" height="360" src="https://www.youtube.com/embed/o0UtYvGacWQ" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

A `MessageQueue` in Akka is something sits in-between your sender `Actor` and the receiver `Actor`. 

Akka makes you avoid your sender `Actor` call the receiver `Actor` method directly. There is no direct interaction between `Actor` instances. Instead, like you saw in the previous level, `ActorRef`'s `!` method is used to communicate with other actors, and that method internally puts your messages into `MessageQueue`, before the receiver actor pick them up.  That allows you execute the sender and receiver `Actor`s work concurrently.

[The documentation](https://doc.akka.io/docs/akka/current/mailboxes.html) mentions that `Mailbox`, which has the associated `MessageQueue` implementation, can be configured based on your usage. All available `MessageQueue` implementations used by Akka are chosen so that they can be accessed from different threads concurrently.

When you write a concurrent application, it is generally hard to program your own class safely against access from multiple threads, especially as your class grows to be big and complicated. Instead, a lot of researchers have come up with thread-safe algorithms and implementations of data classes focusing on simple and fundamental ones. Queues are typical examples of such data classes where thread-safe implementations are available.

So, Akka's approach is to put concurrency concerns within `MessageQueue` which Akka takes care of, and provide avaialble `MessageQueue` implementations already. As long as you follow the pattern in the Akka actor model, and use immutable messages, you don't need to worry about concurrency **inside** each `Actor`.

## The second-lowest level: Dispatcher and ForkJoinTask

<iframe width="640" height="360" src="https://www.youtube.com/embed/4n1gCDtUsDI" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Now you know that Akka `Actor`s communicate with each other via `MessageQueue`, but how does it actually use threads to execute the code inside `Actor`? Still, something needs to execute your code inside `Actor` and that's a dedicated thread provided by the undelying `Dispatcher`.

That is illustrated in the above short video, and also discussed in these two other articles.
- [Dispatcher behavior](../dispatcher-behavior/)
- [Mailbox and ForkJoinTask](../mailbox-and-fork-join-task/)

`Dispatcher`'s associated `ExecutorService` schedules a `ForkJointTask` to be run on in a pool of threads, and that `ForkJoinTask` is actually an Akka (internal) `Mailbox` as `Mailbox extends ForkJointTask`.

`Mailbox`'s `run` method eventually invokes the `receive` method of your `Actor`.

## The lowest level: Akka application as huge ForkJoinTask application

<iframe width="640" height="360" src="https://www.youtube.com/embed/572YLMHWeT4" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Taking a step further, looking at this from the `Executor`/`ExecutorService` point of view:

- [Executor/ExecutorService in Java, and ExecutionContext behind Future in Scala](../executor-and-execution-context/)

you can see your Akka application as a huge `ForkJoinTask` application, where you excecute your domain/business logic from `ForkJoinTask`'s `run` method. 

One caveat is that although it is `ForkJoinTask`, Akka does not use fork-join mechanism to execute the `Actor` internal code. (i.e.) Akka doesn't use `fork`, `join` or `invokeAll` methods from `ForkJoinTask` but uses the simple `run` method, in an event style which is described in the middle of `ForkJoinTask`'s [javadoc](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinTask.html).

`ForkJoinPool` is the default `ExecutorService` for the default `Dispatcher`. The reason why `ForkJoinPool` was chosen as default was its performance considering Akka's use cases. More detail about the reason can be found in previous Akka's official blog, LET IT CRASH - [Scalability of Fork Join Pool](http://letitcrash.com/post/17607272336/scalability-of-fork-join-pool).

From here, you can even go deeper, outside of/below Akka, like how Java's `ForkJoinTask` and `ForkJoinPool` work or even how OS schedules tasks on multiple threads. Those are out of scope of this article, but if you are interested, please go ahead! (hopefully I might cover them at some point later).

## References 

- Javadoc of `java.util.concurrent.ForkJoinTask` at -  https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinTask.html
- Official documentation of Akka Mailbox at https://doc.akka.io/docs/akka/current/mailboxes.html
- Official documentation of Akka Dispatcher at https://doc.akka.io/docs/akka/2.5/dispatchers.html
- A LET IT CRASH blog post explaining efficiency of `ForkJoinPool` - [Scalability of Fork Join Pool](http://letitcrash.com/post/17607272336/scalability-of-fork-join-pool)
- A discussion with Doug Lea, linked from the above LET IT CRASH blog article, who lead the design and implementation of Java's `ForkJoinPool` - http://cs.oswego.edu/pipermail/concurrency-interest/2012-January/008987.html