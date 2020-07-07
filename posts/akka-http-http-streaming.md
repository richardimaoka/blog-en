---
title: Akka HTTP streaming at the HTTP layer
date: "2018-07-27T12:31:08.000+0900"
---

![http-streaming](/images/akka-http-http-streaming/http-streaming.gif)

The previous article [Akka HTTP and TCP streaming](/images/akka-http-http-streaming/akka-http-tcp-streaming/) introduced how Akka HTTP processes data in a streaming fashion at the TCP layer. Now I am going to explain the streaming behavior at the HTTP request/response level. 

The above animation illustrates streaming in Akka HTTP at the HTTP layer. Each HTTP request is converted to an HTTP response in the end, and this conversion logic is called the `handler` here, which is passed to the `bindAndHandle` method to start up the HTTP server.

```scala
import akka.http.scaladsl.Http
Http().bindAndHandle(handler, "localhost", 8080)
```

The `handler` has the type of `Flow[HttpRequest, HttpResponse, Any]` as you can see from the signature of the `bindAndHandle` method.

```scala
def bindAndHandle(
  handler:   Flow[HttpRequest, HttpResponse, Any],
  interface: String, port: Int = DefaultPortForProtocol,
  connectionContext: ConnectionContext = defaultServerHttpContext,
  settings:          ServerSettings    = ServerSettings(system),
  log:               LoggingAdapter    = system.log)(
  implicit fm: Materializer
): Future[ServerBinding] = ...
```

So the `handler` in Akka HTTP convertes `HttpRequest` into `HttpResponse` and that's where you application-level logic resides.

## High-level and Low-level APIs

The `handler` in type of  `Flow[HttpRequest, HttpResponse, Any]`, can be implemented in two ways in Akka HTTP.

In this article, I'm going to introduce them very briefly, and discuss them in much more detail in separate articles.

The first way is to use the [high-level API](https://doc.akka.io/docs/akka-http/current/introduction.html#routing-dsl-for-http-servers) with [Routing DSL](https://doc.akka.io/docs/akka-http/current/routing-dsl/index.html). Interestingly, the `handler` written in Routing DSL has the type of `Route` not `Flow`, but there is type-class based implicit resolution going on, to convert the `Route` to `Flow[HttpRequest, HttpResponse, Any]` behind the scene.

```scala
val route: Route = path("..." ) {
  get {
    complete(...)
  }
}

// route: Route is resolved to Flow[HttpRequest, HttpResponse, Any]
// by type-class based implicits
Http().bindAndHandle(route /*route as handler*/, "localhost", 8080)
```

Writing the `handler` in Routing DSL in most cases is much easier than writing `Flow[HttpRequest, HttpResponse, Any]` directly. So most of the cases you would go with the high level API. 


However, as the [philosophy](https://doc.akka.io/docs/akka-http/current/introduction.html#philosophy) of Akka HTTP says, in case it is more suitable to directly implement the `HttpRequest` to `HttpResponse` conversoin logic rather than `Route`, Akka HTTP also offers the [low-level API](https://doc.akka.io/docs/akka-http/current/introduction.html#low-level-http-server-apis), and we can directly implement the handler in `HttpRequest => HttpResponse` as follows.

```scala
val handler: HttpRequest => HttpResponse = {
  case HttpRequest(GET, Uri.Path("/"), _, _, _) =>
    HttpResponse(...)
}

Http().bindAndHandleSync(handler, "localhost", 8080)
```

`HttpRequest => HttpResponse` can be passed to `bindAndHandleSync` which is internally converted to `Flow[HttpRequest, HttpResponse, Any]`. Note that we used `bindAndhHandleSync` which is different from `bindAndHandle` wa saw earlier.

```scala
def bindAndHandleAsync(...) = { 
  ...
  ...
  bindAndHandle(
    Flow[HttpRequest].mapAsync(parallelism)(handler),
    interface,
    port,
    connectionContext,
    settings,
    log)
}
```
## HTTP Pipelining

HTTP pipelining means processing the next HTTP request before sending the HTTP response for the current HTTP request. 

![http-pipelining](http-pipelining.gif)

Compare it with the animation we saw earlier, without pipelining.

![http-streaming](/images/akka-http-http-streaming/http-streaming.gif)

Although it is [generally discouraged](https://doc.akka.io/docs/akka-http/current/server-side/low-level-api.html#controlling-server-parallelism), also [disabled by most browsers](https://en.wikipedia.org/w/index.php?title=HTTP_pipelining&oldid=700966692#Implementation_in_web_browsers), HTTP pipelining is still supported in Akka HTTP. It can be achieved by either:

- Changing `akka.http.server.pipelining-limit` config value, or
- Passing the `parallelism` parameter to the `bindAndHandleAsync` method under the `Http` object (default = 1, i.e. pipelining disabled)

```scala
def bindAndHandleAsync(
  handler:   HttpRequest ⇒ Future[HttpResponse],
  interface: String, port: Int = DefaultPortForProtocol,
  connectionContext: ConnectionContext = defaultServerHttpContext,
  settings:          ServerSettings    = ServerSettings(system),
  parallelism:       Int               = 1,
  log:               LoggingAdapter    = system.log)(implicit fm: Materializer
): Future[ServerBinding]
```    

Again, HTTP pipelining is a discouraged practice, so if you need to enable this feature, be warned about unwanted consequences.