---
title: Akka HTTP mashalling, souce-code level details
date: "2018-08-15T12:31:08.000+0900"
---

This is continued from [the previous article](../akka-http-marshalling-basics), which explained the basics about Akka HTTP marshalling. Now we will look into how `implicit` type class resolution is done, to achieve the marshalling outcome.

## The `complete` directive in Routing DSL

The `complete` directive (method) is what we almost always use in Akka HTTP’s [Routing DSL](https://doc.akka.io/docs/akka-http/current/routing-dsl/index.html), When we want to send an HTTP response to the client.

(In Java's Akka HTTP API, there aremany variants of the `complete` directive like `completeWithFutureString`. However in Scala, `complete` can handle a variety of different types.)

Like below, we can send a `String` as the HTTP body of the response:

```scala
lazy val routes: Route = get {
    complete("Hello World")
}
```

The client would see a response such as:

```plaintext
HTTP/1.1 200 OK
Server: akka-http/10.1.3
Date: Fri, 10 Aug 2018 23:33:14 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 11

Hello World
```

Also, we can send a status code:

```scala
import akka.http.scaladsl.model.StatuCodes._

complete(StatusCodes.OK)
```

or a byte array as the HTTP body:

```scala
val data: Array[Byte] = ...
complete(data)
```

So far the `complete` directive worked nicely with the three different types, `String`, `StatusCode` and `Array[Byte]`, so are there a lot of overridden `complete` directive to have this flexibility for the parameter?

Actually, no. There is only [one definition of the directive](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/server/directives/RouteDirectives.scala#L46), which is this:

```plaintext
def complete(m => ToResponseMarshallable)
```

What the hell is this `ToResponseMarshallable` ? 

I will explain this in much more detail for the rest of the article, but in short, there is some `implicit` magic going on, and this single definition can convert the parameter of all these different types to `: => ToResponseMarshallable`, then marshall it to `HttpResponse` or `HttpRequeast` in the end. 

The goal of this article is to understand what’s happening under the hood of this `complete` directive, especially how `implicit`  resolution of type classes works, and explain why this single definition is flexible enough to accept `String`, `StatusCode`, and `Array[Byte]`.  Furthermore, if you have `import`-ed or defined necessary `implicit` instances for an arbitrary `[T]`, Akka HTTP can marshall `[T]` or even `Source[T, _]` to `HttpResponse` or `HttpRequest`.


```plaintext
// if you have necessary implicit instances in scope...
import ...
implicit val ...
implicit val ...

val result: T = ...
// ...this just works, or even result: Source[T, _] works
complete(result) 
```


## The concepts: difference among Marshaller, Marshalling and Marshallble

Before diving into the code, please bear with me while I’m introducing some conceptual aspects.

[The marshalling guide of the official documentation](https://doc.akka.io/docs/akka-http/current/common/marshalling.html) is worth reading, but it is probably overwhelming for those who are not very familiar with internals of Akka HTTP or how type classes work in general. I'll try to explain this with the least and smallest possible leap in the context so that people can follow.

To start with, conceptually there are three participant types in the Akka HTTP marshalling process, **Marshallable**, **Marshaller** and **Marshalling**. Don’t worry too much abut the naming, although they look very similar and feel confusing for the first time. 

Marshall**able** represents our own type `[T]` used by our application, and as the name suggests, it is something that can be marshalled to the wire format. Typically the wire format is `HttpRequest` or `HttpResponse`. Otherwise, once `[T]` is marshalled to `HttpEntity` (= HTTP body) as the intermediate step, then marshalling from `[T]` to `HttpRequest` or `HttpResponse` is also enabled due to implicit type-class resolution. We'll see more in this implicit stuff later.

Marshall**er** probably feels easiest to understand among the three, as it provides the marshalling logic to convert an instance of type `A` to `B`. However, as in the [official documentation](https://doc.akka.io/docs/akka-http/current/common/marshalling.html), it is not simply `A => B`:


> Contrary to what you might initially expect, [**Marshaller[A, B]**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/marshalling/Marshaller.html) is not a plain function `A => B` but rather essentially a function `A => Future[List[Marshalling[B]]]`. Let’s dissect this rather complicated looking signature piece by piece to understand why marshallers are designed this way. Given an instance of type `A` a [**Marshaller[A, B]**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/marshalling/Marshaller.html) produces:

 `Marshaller` ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/Marshaller.scala#L16)) is defined somewhat like below, although it is not the exact but simplified definition:

```scala
// Marshalling from type A to B, simplified definition
sealed abstract class Marshaller[A, B] {
  def apply(value: A)(implicit ec: ExecutionContext
  ): Future[List[Marshalling[B]]]
}  
```

So the `apply` method is of type `A => Future[List[Marshalling[B]]]` as described in the quote from the official documentation:


> 1. A `Future`: This is probably quite clear. Marshallers are not required to synchronously produce a result, so instead they return a future, which allows for asynchronicity in the marshalling process.
> 2. of `List`: Rather than only a single target representation for `A` marshallers can offer several ones. Which one will be rendered onto the wire in the end is decided by content negotiation. For example, the [**Marshaller[OrderConfirmation, MessageEntity]**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/marshalling/Marshaller.html) might offer a JSON as well as an XML representation. The client can decide through the addition of an [**Accept**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/headers/Accept.html) request header which one is preferred. If the client doesn’t express a preference the first representation is picked.
> 3. of `Marshalling[B]`: Rather than returning an instance of `B` directly marshallers first produce a `Marshalling[B]`. This allows for querying the [**MediaType**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/MediaType.html) and potentially the [**HttpCharset**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/HttpCharset.html) that the marshaller will produce before the actual marshalling is triggered. Apart from enabling content negotiation this design allows for delaying the actual construction of the marshalling target instance to the very last moment when it is really needed.

Finally as in the above 3., Marshall**ing** represents “lazy” evaluation of the marshalling result. 

As we have covered the conceptual side of the type classes up to this point, let's move onto the code and see how these work together.

## ToResponseMarshallable

Now we can come back to the `complete` directive ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/server/directives/RouteDirectives.scala#L46)): 

```scala
def complete(m: ⇒ ToResponseMarshallable): Route = ...
```

As explained earlier, `ToResponseMarshallable` ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/server/directives/RouteDirectives.scala#L46)) is a marshall**able,** representing our own application’s type `[T]`, and it can be marshalled to (typically), `HttpRequest`, `HttpResponse` or `HttpEntity`. 

It is a `trait` below ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/ToResponseMarshallable.scala#L11)):

```scala
// simplified definition
trait ToResponseMarshallable {
  type T
  implicit def marshaller: ToResponseMarshaller[T]
}
```

Coming back to the definition of the `complete` directive, it is actually defined by `import`-ing `ToResponseMarshallable` at the beginning of the `.scala` file. 

```scala
import akka.http.scaladsl.marshalling.ToResponseMarshallable
...
def complete(m: ⇒ ToResponseMarshallable): Route = ...
```

By this `import`, the companion object of `ToResponseMarshallable` ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/ToResponseMarshallable.scala#L20)) is also brought into the scope of the `complete` directive: 

```scala
// simplified definition
object ToResponseMarshallable {
    implicit def apply[T](_value:T)(implicit _marshaller: ToResponseMarshaller[T]
    ): ToResponseMarshallable = ...
}
```

The above `apply` method means that a `ToResponseMarshallable`, ("marshall**able**", something that can be marshalled) the return type of `apply`, becomes available in scope, as long as there is an `implicit ToResponseMarshaller[T]` ("marshall**er**", the marshalling process) instance also available in scope.

`ToResponseMarshaller` [is defined](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/package.scala#L16) as follows:

```scala
type ToResponseMarshaller[T] = Marshaller[T, HttpResponse]
```

One thing to note is we don’t need to `import ToResponseMarshallable` from the caller of the `complete` directive. To see this in action, we can look at the below simple but complete example of an Akka HTTP server application.

```scala
// no need to import ToResponseMarshallable
import akka.actor.ActorSystem
import akka.http.scaladsl.Http
// importing akka...Directives._ makes `get` and `complete` avaialable in scope
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.stream.ActorMaterializer

object MainHelloWorld {
    def main(args: Array[String]): Unit = {
    // remember to make them implicit!!
    implicit val system = ActorSystem("MainHelloWorld") // for Akka Actor
    implicit val materializer = ActorMaterializer()     // for Akka Stream

    lazy val routes: Route = get { // `get` for HTTP GET method
      //"Hello World": String is converted to ToResponseMarshallable
      complete("Hello World")
    }

    Http().bindAndHandle(routes, "localhost", 8080)
}
```

The above code, (i.e) the caller of the `complete` directive does not import `ToResponseMarshallable`, however at the place we call `complete("Hello World``"``)`, `"Hello World": String` is converted to `ToResponseMarshallable`.

## `Marshaller` comes into play

Once the parameter to the `complete` directive is converted to `ToResponseMarshallable`, then the marshaller will come into play. 

As seen before, the existence of `ToResponseMarshallable` means the existence of `implicit ToResponseMarshaller[T]`, due to the companion `object ToResponseMarshallabe` and its `apply` (pasted again):

```scala
// simplified definition
object ToResponseMarshallable {
  implicit def apply[T](_value:T)(implicit _marshaller: ToResponseMarshaller[T]
  ): ToResponseMarshallable = ...
}
```

If you are careful enough and familiar with type classes with `implicit`, you might have noticed that we didn’t define `ToResponseMarshaller[String]` ourselves. That’s correct, but it still works because Akka HTTP has **pre-defined** `ToResponseMarshaller[String]` instance.

That’s actually achieved in two steps - firstly, there is a **pre-defined**`implicit ToResponseMarshaller[T]` defined ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/PredefinedToResponseMarshallers.scala#L19)) :

```scala
// simplified definition
implicit def liftMarshaller[T](implicit m: ToEntityMarshaller[T]
): ToResponseMarshaller[T] 
```

as you can see, this takes the `implicit ToEntityMarshaller[T]` parameter, where `ToEntityMarshaller` is defined as:

```scala
type ToEntityMarshaller[T]   = Marshaller[T, MessageEntity]
  // MessageEntity represents the entity of either HTTP request or response
```

so as long as there is an `implicit ToEntityMarshaller[T]` for the **entity** (i.e. HTTP body) in scope, `implicit ToResponseMarshaller[T]` is also available. The pre-defined marshaller for `String` to the entity is as follows:

```scala
implicit val StringMarshaller: ToEntityMarshaller[String] = ...
```

where the trait defines `ToEntityMarshaller` ([source code](https://github.com/akka/akka-http/blob/v10.1.3/akka-http/src/main/scala/akka/http/scaladsl/marshalling/PredefinedToEntityMarshallers.scala#L14)) for other basic types too:

```scala
package akka.http.scaladsl.marshalling

trait PredefinedToEntityMarshallers extends MultipartMarshallers {
  implicit val StringMarshaller: ToEntityMarshaller[String] = ...
  implicit val ByteArrayMarshaller: ToEntityMarshaller[Array[Byte]] = ...
  implicit val ByteStringMarshaller: ToEntityMarshaller[ByteString] = ...
  implicit val CharArrayMarshaller: ToEntityMarshaller[Array[Char]] = ...
  def charArrayMarshaller(mediaType: MediaType.WithOpenCharset): ToEntityMarshaller[Array[Char]] =...
  ...
  def stringMarshaller(mediaType: MediaType.WithFixedCharset): ToEntityMarshaller[String] = ...
  implicit val FormDataMarshaller: ToEntityMarshaller[FormData] = ...
  implicit val MessageEntityMarshaller: ToEntityMarshaller[MessageEntity] = ...
}
```

Thus we got `ToEntityMarshaller[String]`, and `ToResponseEntity[String]`, then finally got `ToResponseMarshallabe` with `type T = String` in scope too, where all of these make it possible to `complete("Hello World": String)` to be marshalled to the HTTP response.

The last thing I want to touch is about the packaging in Akka HTTP, which enables us to avoid unnecessary `import` from the call site. 

If you remember, the example `Main` we saw earlier didn’t need to `import ToResponseMarshallable` nor `import` pre-defined marshallers. That’s because the pre-defined marshallers are made available to `ToResponseMarshaller` as they are all in the same package, `package akka.http.scaladsl.marshalling`. So for the types with pre-defined marshallers, we don’t need to define their `implicit` marshller instances nor `import` anything.

## spray-json

For a type `T` without pre-defined marshallers, you need to define or `import` necessary `implicit` marshaller instances for `T`. More specifically, `ToEntityMarshaller` is needed, then `ToEntityMarshaller[T]` to `ToResponseMarshaller[T]` is done by the pre-defined `implicit` as discussed in the previous section.

Specifically for spray-json, since it already defines the `ToEntityMarshaller`:

```scala
implicit def sprayJsonMarshaller[T](
  implicit writer:  RootJsonWriter[T],
           printer: JsonPrinter = CompactPrinter
): ToEntityMarshaller[T]
```

instead of defining `ToEntityMarshaller` directly, we can just define `RootJsonWriter[T]`, where convenience methods like `jsonFormat2` are provided.

```scala
import spray.json.DefaultJsonProtocol._
import spray.json.RootJsonFormat

case class User(name: String, age: Int)

object User {
  implicit val userJsonFormat: RootJsonFormat[User] = jsonFormat2(User.apply)
}
```    
## One thing extra, the headers

Talking about marshalling to the HTTP response, you might have been wondering what’s going on with the headers. The headers are indeed set by marshallers, and the default is defined as follows:

```scala
def fromToEntityMarshaller[T](
  status:  StatusCode                = StatusCodes.OK,
  headers: immutable.Seq[HttpHeader] = Nil
)(implicit m: ToEntityMarshaller[T]
): ToResponseMarshaller[T] =
  fromStatusCodeAndHeadersAndValue compose (t ⇒ (status, headers, t))
```

which is called from the earlier `**implicit def**` `liftMarshaller[T]`. Thus, by default `headers: immutable.Seq[HttpHeader] =` `*Nil*` so there’s only minimal headers are stamped like below:

```plaintext
HTTP/1.1 200 OK
Server: akka-http/10.1.3
Date: Sat, 11 Aug 2018 00:17:41 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 11
```

## Summary

Here, I have gone through how the `implicit` resolution of marshalling-related type classes happens step by step. I hope this gave you a better understanding of marshalling. Thanks for being patient with this long article with lots of text and code, without any visualization unlike my other blog posts.
