---
title: Akka HTTP unmashalling basics
date: "2018-10-01T12:31:08.000+0900"
---

## Akka HTTP Unmarshalling basics

![](/images/akka-http-unmarshalling-basics/akka-http-unmarshalling.gif)

In previous articles [(1)](../akka-http-marshalling-basics), [(2)](../akka-http-marshalling-details),
I’ve explained how Akka HTTP marshalling works on the server side, which is used to convert a Scala object to the wire-format, typically JSON if we use Akka HTTP for API servers. Now this article introduces how the opposite, unmarshalling works.

## What is Unmarshalling?

Unmarshalling is the opposite of marshalling, which is described as follows in the [official documentation](https://doc.akka.io/docs/akka-http/current/common/unmarshalling.html#unmarshalling):


> “Unmarshalling” is the process of converting some kind of a lower-level representation, often a “wire format”, into a higher-level (object) structure. Other popular names for it are “Deserialization” or “Unpickling”.

Transferring data over the network requires the data to be in a “wire-format”, and the unmarshalling process converts the data from the wire-format to a Scala object representation. For HTTP, the wire format is HTTP requests and responses, defined in [RFC7230](https://tools.ietf.org/html/rfc7230). Note that an HTTP entity (HTTP body) is a part of an HTTP request or response, and Unmarshalling can deal with different HTTP entity types as specified in the `Content-Type` HTTP header.

## How Unmarshalling happens:

As said above, for the entity (body) of HTTP requests and responses, we can choose the wire format as specified in the `Content-Type` [HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) ([RFC7231](https://tools.ietf.org/html/rfc7231#section-3.1.1.5)). Typical `Content-Type` examples are:

```plaintext
Content-Type: text/plain; charset=utf-8
Content-Type: application/x-www-form-urlencoded
Content-Type: application/octet-stream
Content-Type: application/json
```    

In Akka HTTP, there are already pre-defined “from-entity” Unmarshallers, so that we can easily unmarshal HTTP entities into Scala object instances:


- from `HttpEntity` to `String` , `Array[Char]`
- from `HttpEntity` to `ByteString`, `Array[Byte]`
- from `HttpEntity` to `FormData`

Marshalling from a JSON (`application/json`) entity is a bit special and complicated, so Akka HTTP purposefully does not provide everything as pre-defined Unmarshallers for JSON but it allows customization by developers.


## Unmarshalling from a JSON HTTP entity 

When you are dealing with API servers, JSON is one of the most commonly used wire formats for the HTTP entity, and after unmarshalling process, the JSON content is converted to a Scala case class instance in Akka HTTP. 

Let’s assume you have a Scala case class defined as below:

```scala
case class User(name: String, age: Int)
```

This is the most commonly used idiom in routing DSL:

```scala
entity(as[User]){ user =>
  {
    // do some processing here with `user`,
    // which is the case class converted from JSON
  }
}
```

In a nutshell, we use the `entity` and `as` directive(s) on the server side to convert JSON requests into a Scala `User` case class instance.

As said earlier, Akka HTTP doesn’t provide everything when you want to unmarshal from (HTTP request containing the) JSON entity into a Scala object instance. If you use spray-json, which is also introduced in the [official documentation](https://doc.akka.io/docs/akka-http/current/common/json-support.html#spray-json-support), we can do like below to create an `implicit` instance of `RootJsonFormat[User]` to enable unmarshalling from JSON to `User`.

```scala
import spray.json.DefaultJsonProtocol._ //put `jsonFormat2` in scope
import spray.json.RootJsonFormat

case class User(name: String, age: Int)

object User {
  implicit val userJsonFormat: RootJsonFormat[User] =
    jsonFormat2(User.apply)
}
```

Like we did for the case of marshalling, detailed `implicit` resolution will be explained in a separate article with more references to the Akka HTTP source code if you would like to understand how that works.


