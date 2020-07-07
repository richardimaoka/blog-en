---
title: Akka HTTP mashalling basics
date: "2018-08-13T12:31:08.000+0900"
---

![](/images/akka-http-marshalling-basics/akka-http-marshalling.gif)

As said in the [previous article](../akka-http-request-response-model), I'll explain Akka HTTP [Marshalling]() here. Before looking into marshalling, it is important to have a rough understanding on how `HttpRequest`, `HttpResponse` and `HttpEntity` (entity = body of HTTP request/response) are related to each other. If you are still unfamiliar with them, please go back to the [previous article](../akka-http-request-response-model) and come back.

## What is Marshalling?

![](/images/akka-http-marshalling-basics/akka-http-marshalling-wire-format.gif)

According to the [official documentation](https://doc.akka.io/docs/akka-http/current/common/marshalling.html), marshalling is defined as follows:

> Marshalling is the process of converting a higher-level (object) structure into some kind of lower-level representation, often a wire format. Other popular names for marshalling are “serialization” or “pickling”.

To transfer data over the network, we need to convert the data into a "wire-format" because the network is not aware of our application layer's data format, but it can only handle the data in a dedicated format. For HTTP, the wire format is HTTP requests and responses, defined in [RFC7230](https://tools.ietf.org/html/rfc7230). We can also choose a wire format for the HTTP entity (body) too.

In Akka HTTP, the marshalling process consists of multiple steps which we will discuss in more detail in the next section.

![](/images/akka-http-marshalling-basics/akka-http-marshalling-multi-steps-dependency.png)

 For now, we can assume that there are two important steps. One is marshalling our application-layer data to an "entity" (i.e. HTTP request/response body).
 On the server side, we marshal the data in `T` to `ResponseEntity`. The other important step is to construct HTTP request or response from the entity. These steps makes the entire "marshalling from Scala object instance to HTTP request/response" process as a whole.

Here's a quote from the [official documentation](https://doc.akka.io/docs/akka-http/current/common/marshalling.html) again.

> In Akka HTTP, marshalling means the conversion of an object of type T into a lower-level target type, e.g. a MessageEntity (which forms the “entity body” of an HTTP request or response) or a full HttpRequest or HttpResponse.

## Marshalling in multiple steps

![](/images/akka-http-marshalling-basics/akka-http-marshalling-multi-steps.gif)

Akka HTTP's marshalling doesn't happen in a single step, but that is split into multiple steps. One important step is marshalling into entities.

For the entity (body) of HTTP requests and responses, we can choose the wire format as specified in the `Content-Type` HTTP header. Typical `Content-Type` examples are:

```plaintext
Content-Type: text/plain; charset=utf-8
Content-Type: application/x-www-form-urlencoded
Content-Type: application/octet-stream
Content-Type: application/json
```

In Akka HTTP, there are already pre-defined marshallers, so that we can easily marshal an instance of such Scala data types into the HTTP entity:

- from `String`, `Array[Char]` to an entity of `Content-Type: text/plain`
- from `ByteString`, `Array[Byte]` to an entity of `Content-Type: application/octet-stream`
- from `FormData` to an entity of `Content-Type: application/x-www-form-urlencoded`
- from `String`, `Array[Char]` to an entity of `Content-Type: text/html`

Marshalling to JSON (`application/json`) is a bit special, and complicated, so purposefully Akka HTTP does not provide "everything" as pre-defined marshallers for JSON,
but it requires customization by developers. We will discuss this in the next section.

## Marshalling to JSON as the HTTP request/response body

As said earlier, marshalling into JSON is different from other HTTP body content types. One main reason, I believe, is there are already a lot of JSON conversion libraries including spray-json, play-json, argonaut, circe, and more. So, instead of forcing us use its default implementatoin, Akka HTTP lets us choose our favorite JSON conversion library and plug it in.

Take spray-json as an example and see how that works. As seen in the [official documentation](https://doc.akka.io/docs/akka-http/current/common/json-support.html#spray-json-support) and in my [earlier article - Akka HTTP quickstart](../akka-http-quickstart), we can do like below to create an instance of `RootJsonFormat` from our case class, `User`.

```scala
import spray.json.DefaultJsonProtocol._ //put `jsonFormat2` in scope
import spray.json.RootJsonFormat

case class User(name: String, age: Int)

object User {
  implicit val userJsonFormat: RootJsonFormat[User] =
    jsonFormat2(User.apply)
}
```

![](/images/akka-http-marshalling-basics/akka-http-marshalling-rootjsonformat.png)

We will see how this works in the code in the next article, but in a nutshell, this `RootJsonFormat` has ability to write the case class into JSON string, thus the data can be put into the HTTP entity.

As long as we can put the data into the entity, like we saw in the prevoius section, Akka HTTP can construct the HTTP request or response from the entity, and it can be sent over the network.

## What's happening under the hood, for the next article

The whole behavior of this marshalling is achieved with `implicit` resolution of type classes, and that looks overwhelming if you are new to type classes and Akka HTTP.

To be honest, I tried to understand it looking at the Akka HTTP source code but gave it up several times. Having the source code level understanding of Akka HTTP marshalling is much more difficult than just using it leveraging JSON conversion libraries like spray-json.

In the next article, I'll try to explain how this `implicit` resolution happens, step by step. If you are interested in internals of marshalling, but had difficulty reading through the official [marshalling guide](https://doc.akka.io/docs/akka-http/current/common/marshalling.html), my next article could be a help for you.