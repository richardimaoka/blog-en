---
title: Akka HTTP Quickstart
date: "2018-07-15T12:31:08.000+0900"
---

## Overview

In this article, I am going to show how to:

- Run an Akka HTTP server,
- Convert to JSON from Scala case classes,
- Use Routing DSL.

I will set up a simple HTTP server step by step, which in the end works as follows. As you see below, we get different JSON returned dependent on the path.

<img src="/images/akka-http-quickstart/high-level-api.gif" />

I will go through the steps in a way you can **quickly understand** the outcome from running the source code, and how it works, **WITHOUT downloading and running the source code yourself.**

However, for those who want to go much deeper, the full code is available here, with instruction to run the examples.

[Jump to the Git repository with an intruction to run the code](https://github.com/richardimaoka/resources/tree/master/akka-http-quickstart)

## Setting up a minimal application

In this section, we set up a pretty simple "Hello World" HTTP server. In the end, an Akka HTTP server can be started like below:

```scala
import akka.http.scaladsl.Http
Http().bindAndHandle(routes, "localhost", 8080)
```

![hello-world](/images/akka-http-quickstart/hello-world.gif)

So, the `bindAndHandle` method is the method to fire up everything and start the HTTP server. Let's see what is required to run this `bindAndHandle` method.

Firstly, we should update [`libraryDependencies`](https://www.scala-sbt.org/1.x/docs/Library-Dependencies.html) in [build.sbt](https://github.com/richardimaoka/resources/blob/master/akka-http-quickstart/build.sbt)

```plaintext
libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-http"   % "10.1.3",
  "com.typesafe.akka" %% "akka-stream" % "2.5.12",
)
```

and add a [typical main `object`](https://www.scala-lang.org/documentation/your-first-lines-of-scala.html), as well as its main method.

```scala
object MainHelloWorld {
  def main(args: Array[String]): Unit = {
    // ... application code goes here
  }
}
```

Inside the main method, we should start adding necessary building blocks to run the Akka HTTP server.

```scala
import akka.actor.ActorSystem
import akka.stream.ActorMaterializer

// remember to make them implicit!!
implicit val system = ActorSystem("Main")       // for Akka Actor
implicit val materializer = ActorMaterializer() // for Akka Stream
```

As a preparation, we instantiate `ActorSystem` and `ActorMaterializer`. For people who are not familiar with `ActorSystem` and `ActorMaterializer`, you can think of them as the underlying infrastructure for running Akka HTTP.

Usually there is only one instance for each of them in an entire application. In this context, an "entire application" means an OS (e.g. Linux or Windows) process, or a JVM process.  Also we need to remember making `ActorSystem` and `ActorMaterializer` **implicit**, as other methods take implicit parameters of these types.

---

**NOTE:** The below roughly illustrates the Akka technology stack cosisting of an Akka HTTP application.

<p align="center">
  <img src="/images/akka-http-quickstart/akka-layers.svg" alt="akka-layers" width="300px"/>
</p>

- Akka HTTP is on top of the other two layers
- Akka Stream (`ActorMaterializer`) handles internal processing of Akka HTTP
- Akka Actor (`ActorSystem`) is the base for running Akka Stream

In my upcoming articles, we will see how these layers work with each other, and see why and how Akka HTTP is designed as a ["**streaming-first**" HTTP server](https://doc.akka.io/docs/akka-http/current/implications-of-streaming-http-entity.html).

---

The next thing to introduce is `Route`. `Route` in Akka HTTP defines the endpoint structure (or RESTful resource structure, we might say) of the HTTP server with [Route DSL](https://doc.akka.io/docs/akka-http/current/routing-dsl/index.html). Again, we only touch the surface of it in this article, and go deeper in later articles.

```scala
// importing akka...Directives._ makes `get` and `complete` avaialable in scope
import akka.http.scaladsl.server.Directives._ 
import akka.http.scaladsl.server.Route

lazy val routes: Route = get { // `get` for HTTP GET method
  complete("Hello World")
}
```

`routes` in the above code returns `"Hello World"` for HTTP GET methods to any endpoint in the HTTP server. The `complete` method is what is typically used in Akka HTTP when we want to return an HTTP response to the client.

Finally we can add the following code to bring up the HTTP server, like we saw at the begining of this section.

```scala
import akka.http.scaladsl.Http
Http().bindAndHandle(routes, "localhost", 8080)
```

Then run the server.

```plaintext
> sbt
> runMain com.example.MainHelloWorld

[info] Running com.example.Main
Server online at http://localhost:8080/
```

And like we saw earlier in this section ...

![hello-world](/images/akka-http-quickstart/hello-world.gif)

Boom! We said hello to the world!

## High-level Routing DSL to construct HTTP endpoint structure (RESTful resource structure)

We will go a little deeper in how Route DSL works. It is still at a surface level of it, but hopefully this gives you a better idea about how to construct the endpoint structure with the DSL.

Assuming we want to have the following endpoint structure,

```plaintext
GET /users/person1
GET /users/person2
GET /users/person3
```

we can construct the route as follows:

```scala
// importing akka...Directives._ makes `get`, `complete`, `path` avaialable
import akka.http.scaladsl.server.Directives._ 
import akka.http.scaladsl.server.Route

lazy val routes: Route = 
  pathPrefix("users") {
    path("person1") {
      get {
        complete("Joh Don)
      }
    } ~ //don't forget `~`
    path("person2") {
      get {
        complete("Justin Bieber")
      }
    } ~
    path("person3") {
      get {
        complete("Peyton List")
      }
    } 
  }
```

Now, we get three different responses dependent on the path.

![high-level-step1](/images/akka-http-quickstart/high-level-api-step1.gif)

Since we set up these three endpoints for the HTTP **GET** method only,
doing (e.g.) POST will give us an error. 

```plaintext
$ curl -X POST -d '{"key": "value"}' http://localhost:8080/users/person1

// HTTP/1.1 405 Method Not Allowed
HTTP method not allowed, supported methods: GET
```

Also, accessing a path which is not defined in the route will also result in an error.

```plaintext
$ curl http://localhost:8080/users/nosuchperson

// HTTP/1.1 404 Not Found
The requested resource could not be found.
```

In a separate article, we go over details about the Route DSL, and introduce how to:

* support POST, PATCH, DELETE and even custom HTTP methods
* authenticate the user
* do more complicated stuff like CORS with plugins
* and lot more!

## JSON to/from Scala case class conversion

Just returning plain `String` values to user is nothing interesting.
Akka HTTP is well suited to API servers, and today's API servers most commonly interchanges JSON with clients.

![high-level](/images/akka-http-quickstart/high-level-api.gif)

In Akka HTTP, JSON support comes in a form of plugins, and [spray-json](https://github.com/spray/spray-json)
is one of the easiest JSON plugins to use, and also introduced in the official [doc](https://doc.akka.io/docs/akka-http/current/common/json-support.html).

### Scala case class to JSON - HTTP response

In this article, we cover only one path - Scala case class to JSON conversion. The other way around, from JSON to Scala case classes should be covered in a separate article, to limit the length of this quick-start article.

To use spray-json, we need the following in `libraryDependencies`.

```scala
libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-http"   % "10.1.3",
  "com.typesafe.akka" %% "akka-stream" % "2.5.12",
  "com.typesafe.akka" %% "akka-http-spray-json" % "10.1.3",
  "io.spray" %%  "spray-json" % "1.3.4"
)
```    

And instead of returning a plain `String`,

```scala
get {
  complete("Joh Don")
}
```

we can pass in a Scala case class to the `complete` method,

```scala
get {
  complete(
    // `User` is a Scala case class
    User(
      name = "Joh Don",
      age = 35
    )
  )
}
```

and it's magically turned into JSON within the HTTP response body.

```scala
// <--------------- converted <----------------
// JSON                 | //Scala case class
{                       |  User(
  "name": "Joh Don",    |    name = "Joh Don",
  "age":  35            |    age = 35 
}                       |  )
```

So, what's necessary to make this magic happen? We need some type class-based
implicit resolution done by spray-json in conjunction with Akka HTTP.

---

**Note**: Understanding what's happening **inside** this [JSON to/from Scala case class conversion](https://doc.akka.io/docs/akka-http/current/common/marshalling.html) is really, really a difficult thing. I personally gave it up more than five times in the past, by going through the official documentation, read the source code and ended up just wasting time.

However, to make the JSON to/from Scala case class conversion happen, fortunately Akka HTTP is desined so that we **don't need to** understand what's happening inside. We just need to know what to `import` and what kind of `implicit` to define.

If you are still interested in the internal workings, I'll write other articles to help you. I hope my articles I will write work as supplemental materials to the official doc if you felt that is not very easy to understand, like I did before.

---

From here we see how to make the conversion happen. After updating `libraryDependencies` in `build.sbt`, we should introduce the following case class.

```scala
case class User(
  name: String,
  age:  Int
)
```

This case class models the JSON in the HTTP response body, returned to the client. Then we add `implicit` `RootJsonFormat[User]` which is typically placed in the companion object of the modeling case class.

```scala
//importing DefaultJsonProtocol._ makes `jsonFormat2` available
import spray.json.DefaultJsonProtocol._ 
import spray.json.RootJsonFormat

case class User(name: String, age: Int)

object User {
  // this will fit in the implicit resolution,
  // enabling JSON/case class conversion
  implicit val userJsonFormat: RootJsonFormat[User] =
    jsonFormat2(User.apply)
}
```

`jsonFormat2` is a convenient method which takes the `apply` method of a two-value case class, and return `RootJsonFormat`. By using `jsonFormat2`, we don't need to implement field-by-field assignment manually like below.

```scala
// if we do not use a plugin like spray-json
val json = ....
User(
  // this field-by-field translation
  // is NOT needed if we use `jsonFormat2`
  name = json.getField("name").to[String],
  age = json.getField("age").to[Int]
)

```

Then on the `Route` side of the code, we need the following import and pass in a `User` instance to the `complete` method.

```scala
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
//this bring in implicit RootJsonFormat[User]
import com.example.model.User

get {
  complete(User("Joh Don", 35))
}
```

Importing these two will bring all the necessary pieces of implicit resolution, which works like putting pieces into the puzzle, and `User` can now be converted to JSON.

![implicit resolution](/images/akka-http-quickstart/implicit-resolution.jpg)

We should do the same thing to the three paths we constructed before.

```scala
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._ 
import akka.http.scaladsl.server.Route
import com.example.model.User

lazy val routes: Route = 
  path("users/") {
    path("person1"){
      get {
        complete(User(name = "Joh Don", age = 35))
      }
    } ~
    path("person2"){
      get {
        complete(User(name = "Justin Bieber", age = 24))
      }
    } ~
    path("person3"){
      get {
        complete((name = "Peyton List", age = 20))
      }
    }
  }
```

And we can see this in action as follows.

```plaintext
> sbt
> runMain com.example.main.MainHighLevelAPI
```

![high-level-api-complete](/images/akka-http-quickstart/high-level-api-complete.gif)


### Nested case class support by spray-json

Another convenient feature of spray-json is (although other JSON plugins also have similar fetures) that it supports conversion of nested Scala case classes. Suppose we have the following two case classes defined.

```scala
import spray.json.DefaultJsonProtocol.jsonFormat4
import spray.json.RootJsonFormat

case class Address(
  zip:    Int,
  street: String,
  city:   String,
  state:  String,
)

object Address {
  // this will fit in the implicit resolution,
  // enabling JSON/case class conversion
  implicit val addressJsonFormat: RootJsonFormat[Address] =
    jsonFormat4(Address.apply)
}
```

```scala
import spray.json.DefaultJsonProtocol.jsonFormat3
import spray.json.RootJsonFormat
import Address._ // implicit val addressJsonFormat

case class EnrichedUser(
  name:    String,
  age:     Int,
  address: Address //nested case class
)

object EnrichedUser {
  // this will fit in the implicit resolution,
  // enabling JSON/case class conversion
  implicit val enrichedUserJsonFormat: RootJsonFormat[EnrichedUser] =
    jsonFormat3(User.apply)
}
```

And if we `complete` the route like below, 

```scala
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import com.example.model.User

get {
  complete(
    EnrichedUser(
      "Richard Imaoka",
      150,
      Address(
        zip = 1112222,
        street = "5-6-7 XYZ-street",
        city = "New York",
        state = "New York",
      )
    )
  )
}
```

we will get the following JSON.

```json
{
  "name": "Richard Imaoka",
  "age": 150,
  "address": {
    "zip": 1112222,
    "street" : "5-6-7 XYZ-street",
    "city" : "New York",
    "state" : "New York"     
  }
}
```

This helps us model the JSON data with reusable and **composable** Scala case classes, and will be useful when we are constructing a large JSON response.

## Low-level API, needs understanding of HttpRequest and HttpResponse

Most of the cases we will be implementing our endpoint structure using the Route DSL.
However, for certain cases we would need more fine-grained, lower-level control on how to respond to a given HTTP request. With the low-level API, instead of Route DSL, we implement a request handler in

* `HttpRequest => HttpResponse`, or 
* `HttpRequest => Future[HttpResponse]` 

using pattern matches like below.

```scala
import akka.http.scaladsl.model.{HttpRequest, HttpResponse}

val requestHandler: HttpRequest => HttpResponse = {
  case HttpRequest(_, _, _, _, _) => HttpResponse(...)
}    
```

That's roughly how the low level API looks differently from the high level one, then we get into a bit of more detail about this below. Like the case of high level API, we need to instantiate `ActorSystem` and `ActorMaterializer`.

```scala
import akka.actor.ActorSystem
import akka.stream.ActorMaterializer

implicit val system: ActorSystem = ActorSystem("Main")
implicit val materializer: ActorMaterializer = ActorMaterializer()
```

And the detail of the pattern match is as follows:

```scala
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.marshalling.Marshal
import akka.http.scaladsl.model.HttpMethods.GET
// for HttpRequest, HttpResponse, Uri
import akka.http.scaladsl.model._
import com.example.model.User
import scala.concurrent.{ExecutionContext, Future}

implicit val ec: ExecutionContext = system.dispatcher

val requestHandler: HttpRequest => Future[HttpResponse] = {
  case HttpRequest(
    GET,
    Uri.Path("/"),
    _, // matches any headers
    _, // matches any HTTP entity (HTTP body)
    _  // matches any HTTP protocol
  ) => {
    val m = Marshal(User("Richard Imaoka", 120))
    m.to[HttpResponse]
  }
}
```

Then we can run the HTTP server like before,

```scala
import akka.http.scaladsl.Http

Http().bindAndHandleAsync(requestHandler, "localhost", 8080)
```

and we get this result.

![low-level-api](/images/akka-http-quickstart/low-level-api.png)

## The intention of this article

The content of this article might have felt boring to you, as there have already been many other articles covered the same stuff, and this is just like intro of introduction. 

However, I wrote this with a clear intention - I tried to make this article:

* Easy to see what happens upon running the code, without actually running it by hand
* Illustrate how it feels on writing Akka HTTP code, rather than explaining all the technical details
* but still not leaving readers in a gap, awkward jump in the context
* Have concise text, not talking endlessly about something readers are not interested

