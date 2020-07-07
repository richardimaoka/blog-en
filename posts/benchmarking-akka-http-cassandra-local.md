---
title: Locally Benchmarking Akka HTTP with akka-persistence-cassandra
date: "2018-03-12T06:31:00.000+0900"
---

## Overview

Although what I tried here does not give realistic or useful results, this is another step forward in my experiment to set up benchmarking environment for Akka and Akka HTTP. I am going to add persistence to Cassandra to the system, to see how the benchmark figures are affected.

The source code is available [here](https://github.com/richardimaoka/resources/tree/master/akka-http-cassandra)

## Results

In the previous article, [Benchmarking Spray and Akka HTTP Hello World servers](../hello-world-http-bench/), the web server just returned the constant response. Here I am comparing three different types of web servers.

1. Akka HTTP server with JSON marshalling/unmarshalling
2. Akka HTTP server with JSON marshalling/unmarshalling, and in-memory persistence
3. Akka HTTP server with JSON marshalling/unmarshalling, and akka-persistence-cassandra

Like explained in the previous article, the 1st attempt in benchmarking could be affected by incomplete JIT compliation. So I only show results from the 2nd and 3rd attempts here.

![result-throughput](/images/benchmarking-akka-http-cassandra-local/result-throughput.png)

| Attempt    | 1. JSON         | 2. In-Memory   | 3. Cassandra   |
|:-----------|----------------:|:--------------:|:--------------:|
|2nd attempt | 52,196 req/sec  | 27,507 req/sec |   992 req/sec  |
|3rd attempt | 48,293 req/sec  | 30,746 req/sec | 1,122 req/sec  |

Comparing the throughput, obviously adding Cassandra and **wait the HTTP response until Cassandra persistence is done** makes the performance order of magnitude going down, and the CPU usage for 3 were around 40% although that of 1 and 2 topped at 100% like the prevoius article. (i.e.) The bottleneck is shifted to database I/O from CPU resource competition between the web client and server.

![task-manager-cassandra](/images/benchmarking-akka-http-cassandra-local/task-manager-cassandra.png)

The below is the comparison of average latency,

![result-avg](/images/benchmarking-akka-http-cassandra-local/result-avg.png)

| Attempt    | 1. JSON         | 2. In-Memory   | 3. Cassandra    |
|:-----------|----------------:|:--------------:|:---------------:|
|2nd attempt |  2.17 millisec  | 2.41 millisec  | 101.55 millisec |
|3rd attempt |  2.16 millisec  | 2.10 millisec  |  88.92 millisec |

and the max latency.

![result-max](/images/benchmarking-akka-http-cassandra-local/result-max.png)

| Attempt    | 1. JSON         | 2. In-Memory   | 3. Cassandra    |
|:-----------|----------------:|:--------------:|:---------------:|
|2nd attempt |  321.87 millisec| 452.84 millisec| 335.73 millisec |
|3rd attempt |  267.60 millisec| 119.31 millisec| 199.44 millisec |

From here, let's see how I set up the servers for 1, 2 and 3.

## 1. JSON marshalling/unmarshalling

I am not going in detail, but JSON marshalling is converting a Scala case class instance to JSON payload, and unmarshalling is the opposite.

![json-marshalling](/images/benchmarking-akka-http-cassandra-local/json-marshalling.jpg)

This HttpServer does simple stuff, to sum up all the `"score"` sent in HTTP responses, and return the current total, average and number of trials (number of HTTP requests) so far.

Let's define case classes to marshall to/unmarshall from JSON:

```scala
//JSON request {"score": 10} can be unmarshalled to this
case class ScoringRequest(
  score: Double
)

//This case class can be marshalled to JSON response {"averageScore": ... }
case class ScoreResponse(
  averageScore: Double,
  totalScore: Double,
  numberOfTrials: Long
)
```

To enable marshlling and unmarshalling, I used `SprayJsonSupport` as follows: 

```scala
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import spray.json.DefaultJsonProtocol

object ScoringJsonSupport extends DefaultJsonProtocol with SprayJsonSupport {
  implicit val scoringRequestFormat = jsonFormat1(ScoringRequest)
  implicit val scoreResponseFormat = jsonFormat3(ScoreResponse)
}
```

And the route becomes like this.

```scala
import ScoringJsonSupport._
...
val routes: Route =
  path("scoring") {
    post {
      entity(as[ScoringRequest]) { request =>
        updateState(request.score)
        complete {
          ScoreResponse(averageScore, totalScore, numberOfTrials)
        }
      }
    }
  }
```

For those who are intersted, [the full HttpServer code](https://github.com/richardimaoka/resources/blob/master/akka-http-cassandra/src/main/scala/example/HttpNoPersistentServer.scala) is as follows:

```scala
import java.io.{PrintWriter, StringWriter}

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.{Directives, Route}
import akka.stream.ActorMaterializer
import akka.util.Timeout

import scala.concurrent.Await
import scala.concurrent.duration._

object HttpNoPersistentServer extends Directives {
  def main(args: Array[String]): Unit = {
    import ScoringJsonSupport._

    implicit val system: ActorSystem = ActorSystem("HttpNoPersistentServer")
    implicit val materializer: ActorMaterializer = ActorMaterializer()

    implicit val timeout: Timeout = 3.seconds

    var averageScore: Double = 0
    var totalScore:   Double = 0
    var numberOfTrials: Long = 0

    def updateState(score: Double): Unit ={
      totalScore = totalScore + score
      numberOfTrials = numberOfTrials + 1
      averageScore = totalScore / numberOfTrials
    }

    try {
      val routes: Route =
        path("scoring") {
          post {
            entity(as[ScoringRequest]) { request =>
              updateState(request.score)
              complete {
                ScoreResponse(averageScore, totalScore, numberOfTrials)
              }
            }
          }
        }

      Http().bindAndHandle(routes, "localhost", 8095)
      println(s"Server online at http://localhost:8095/")
      Await.result(system.whenTerminated, Duration.Inf)
    } catch {
      case t: Throwable =>
        val sw = new StringWriter
        t.printStackTrace(new PrintWriter(sw))
        println(t.getMessage)
        println(sw)
    }
  }
}
```

[To send a JSON request by wrk](https://github.com/wg/wrk/issues/267), you need to write a lua script like this: 

```plaintext
wrk.method = "POST"
wrk.body   = '{"score": 10}'
wrk.headers["Content-Type"] = "application/json"
```

I saved it as `wrk-script.lua`, and ran the following command:

```plaintext
$ wrk -t2 -c100 -d30s  -s wrk-script.lua http://localhost:8095/scoring
```

The results were already pasted at the beginning of this article.

## 2. In-Memory persistence

![in-memory](/images/benchmarking-akka-http-cassandra-local/in-memory.jpg)

Now I'm adding persistence to the system, but before doing it with Cassandra, I'm using in-memory persistence. The persistent actor code is as follows:

```scala
class ScoringActor extends PersistentActor {
  import ScoringActor._

  var averageScore: Double = 0
  var totalScore:   Double = 0
  var numberOfTrials: Long = 0

  def persistenceId = "scoring"

  def updateState(score: Double): Unit ={
    totalScore = totalScore + score
    numberOfTrials = numberOfTrials + 1
    averageScore = totalScore / numberOfTrials
  }

  def receiveCommand = {
    case ScoringCommand(score) =>
      val _sender = sender()
      persist(ScoringEvent(score)) {
        evt => updateState(evt.score)
          _sender ! ScoreResponse(
            averageScore,
            totalScore,
            numberOfTrials
          )
      }
  }

  override def receiveRecover = {
    case evt: ScoringEvent =>
      updateState(evt.score)
  }
}

object ScoringActor {
  case class ScoringCommand(score: Double)
  case class ScoringEvent(score: Double)
}
```

The HttpServer code needs to instantiate the persistent actor (`ScoringActor`) and do `scoringActor ? ScoringCommand(request.score)` to perform persistence.

```scala
import ScoringJsonSupport._

implicit val system: ActorSystem = ActorSystem("HttpPersistentServer")
implicit val materializer: ActorMaterializer = ActorMaterializer()

val scoringActor = system.actorOf(Props[ScoringActor], "scoring")

implicit val timeout: Timeout = 3.seconds

val routes: Route =
  path("scoring") {
    post {
      entity(as[ScoringRequest]) { request =>
        complete {
          (scoringActor ? ScoringCommand(request.score)).mapTo[ScoreResponse]
        }
      }
    }
  }    
```        

here is `application.conf`:

```
akka {
  loggers = ["akka.event.slf4j.Slf4jLogger"]

  persistence {
    journal {
      plugin = "akka.persistence.journal.inmem"
    }
    snapshot-store {
      plugin = "akka.persistence.snapshot-store.local"
    }
  }
}
```

As in the results we saw earlier, it became slower than 1. JSON marshalling/unmarshalling, because there is communication between the server and the persistent actor. However, the persistent **actor** itself is still lightweight, compared to the actual persistence to Cassandra which I'll explain next.

## 3. Persistence to Cassandra

![cassandra](cassandra.jpg)

Finally we do real persistence. application.conf becomes this:

```plaintext
akka {
  loggers = ["akka.event.slf4j.Slf4jLogger"]

  persistence {
    journal {
      plugin = "cassandra-journal"
    }
    snapshot-store {
      plugin = "cassandra-snapshot-store"
    }
  }
}
```

And you would also need this logback.xml otherwise the log is filled up by a lot of DEBUG level messages from the Cassandra library.

```plaintext
&ltconfiguration&gt
    &ltappender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender"&gt
        &lt!-- encoders are assigned the type
             ch.qos.logback.classic.encoder.PatternLayoutEncoder by default --&gt
        &ltencoder&gt
            &ltpattern&gt%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n&lt/pattern&gt
        &lt/encoder&gt
    &lt/appender&gt

    &ltlogger name="com.datastax.driver.core.Connection"  level="WARN" additivity="false" /&gt
    &ltlogger name="com.datastax.driver"                  level="WARN" additivity="false" /&gt

    &ltroot level="INFO"&gt
        &ltappender-ref ref="STDOUT" /&gt
    &lt/root&gt
&lt/configuration&gt
```

No need to change the Scala code.

## Lessons learned

Even before conducting the benchmark, we could have guessed that Cassandra would be the bottleneck of the system, as database I/O is typically the performance bottleneck of a web applicaiton system.

However, **to know how much the difference is**, experiment is necessary. So I went through the process on how to distinguish the performance overhead of a single component from all the other , and you can apply the same technique to analyze any component in your system.

Next step, I want to dockerize this performance experiment environment so that we can run it in the cloud. Also later on I want to Kubernet-ize this and hopefully the deployment and running of the performance test is just a breeze!!

It's getting interesting to me :)

## References

- Marshalling and Unmarshalling in Akka HTTP at - https://doc.akka.io/docs/akka-http/2.5/common/marshalling.html#marshalling
- Persistent actor at - https://doc.akka.io/docs/akka/2.5/persistence.html
- akka-cassandra at https://github.com/akka/akka-persistence-cassandra
