---
title: Akka HTTP Request and Response models
date: "2018-08-11T12:31:08.000+0900"
---

In this article, I am going to review the HTTP model in Akka HTTP, which is described [here in the official document](https://doc.akka.io/docs/akka-http/current/common/http-model.html) and defined as follows:


> case-class based model of all the major HTTP data structures, like HTTP requests, responses and common headers.

This will be the base for understanding [Marshalling](https://doc.akka.io/docs/akka-http/current/common/marshalling.html)/[Unmarshalling](https://doc.akka.io/docs/akka-http/current/common/unmarshalling.html) infrastructure in Akka HTTP, which I will discuss in upcoming articles.

## HttpRequest

![](/images/akka-http-request-response-model/akka-request.gif)


The case class `HttpRequest` represents, as the name indicates, an HTTP request. When you send an HTTP request, it looks like this:

```plaintext
POST             https://example.com HTTP/1.1
Host:            example.com
Connection:      keep-alive
Accept:          application/json
User-Agent:      Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9,ja;q=0.8

{"field1": "some value", "field2": 100}
```

The above example can be decomposed into different parts as follows:

![](/images/akka-http-request-response-model/http-request.png)

The format of HTTP requests is clearly described in the following paragraph in [RFC7230](https://tools.ietf.org/html/rfc7230#section-2.1). It’s worth reading:

> A client sends an HTTP request to a server in the form of a request message, beginning with a **request-line** that includes a method, URI, and protocol version (Section 3.1.1), followed by **header fields** containing request modifiers, client information, and representation metadata (Section 3.2), **an empty line** to indicate the end of the header section, and finally a **message body** containing the payload body (if any, Section 3.3).
     
In the Akka HTTP source code, the [**HttpRequest**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/HttpRequest.html) case class consists of

```scala
final class HttpRequest(
  val method:   HttpMethod,                //(GET, POST, etc.)
  val uri:      Uri,                       //URI
  val headers:  immutable.Seq[HttpHeader], //HTTP headers
  val entity:   RequestEntity,             //entity (i.e.) body
  val protocol: HttpProtocol)              //HTTP 1.1, 1.0, etc
  extends ... HttpMessage { ... }
```

where you can find:

  - Available HTTP methods (`HttpMethod`) [here](https://doc.akka.io/api/akka-http/current/akka/http/scaladsl/model/HttpMethods$.html)
  - Available headers (`HttpHeader`) [here](https://doc.akka.io/api/akka-http/current/akka/http/scaladsl/model/headers/index.html)
  - Available protocols (`HttpProtocol`) [here](https://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/HttpProtocols$.html)

Also you see that `HttpRequest` extends the `HttpMessage` trait, 

```scala
sealed trait HttpMessage { ..}
```

which is the base trait for both `HttpRequest`, and `HttpResponse` which we will see in the next section.

## HttpResponse

![](/images/akka-http-request-response-model/akka-response.gif)


Similar to HTTP requests, an HTTP response example looks like below:

```plaintext
HTTP/1.1 200 OK
Server: akka-http/10.1.3
Date: Sat, 11 Aug 2018 16:17:11 GMT
Content-Type: application/json
Content-Length: 28

{"name":"Joh Don","age":150}
```

There is slight difference from the request as in [RFC7230](https://tools.ietf.org/html/rfc7230#section-2.1). The main difference is that an HTTP response has a status line, while an HTTP request had a request line.

> A server responds to a client's request by sending one or more HTTP response messages, each beginning with a **status line** that includes the protocol version, a success or error code, and textual reason phrase (Section 3.1.2), possibly followed by **header fields** containing server information, resource metadata, and representation metadata (Section 3.2), an **empty line** to indicate the end of the header section, and finally a **message body** containing the payload body (if any, Section 3.3).

If there is a body in the HTTP request, the headers and the body are separated by a blank line, like below.

![](/images/akka-http-request-response-model/http-response.png)


In Akka HTTP, the [**HttpResponse**](http://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/HttpResponse.html) case class consists of

```scala
final class HttpResponse(
  val status:   StatusCode,                // HTTP Status Code
  val headers:  immutable.Seq[HttpHeader], // HTTP headers
  val entity:   ResponseEntity,            // entity (i.e.) body
  val protocol: HttpProtocol               // HTTP 1.1, 1.0, etc
) extends ... with HttpMessage {...}
```

where you can find:

  - Available HTTP methods (`HttpMethod`) [here](https://doc.akka.io/api/akka-http/current/akka/http/scaladsl/model/HttpMethods$.html)
  - Available headers (`HttpHeader`) [here](https://doc.akka.io/api/akka-http/current/akka/http/scaladsl/model/headers/index.html)
  - Available protocols (`HttpProtocol`) [here](https://doc.akka.io/api/akka-http/10.1.3/akka/http/scaladsl/model/HttpProtocols$.html)
  

Again, like `HttpRequest`, `HttpResponse` extents the `HttpMessage` trait.

## HttpEntity

For those who are used to other HTTP frameworks or libraries, the word "**entity**" might sound unfamiliar, because we cannot find the word in the following family of “Hypertext Transfer Protocol (HTTP/1.1)” RFCs:

- [RFC7230](https://tools.ietf.org/html/rfc7230): Message Syntax and Routing
- [RFC7231](https://tools.ietf.org/html/rfc7231): Semantics and Content
- [RFC7232](https://tools.ietf.org/html/rfc7232): Conditional Requests
- [RFC723](https://tools.ietf.org/html/rfc7233)3: Range Requests
- [RFC7234](https://tools.ietf.org/html/rfc7234): Caching
- [RFC7234](https://tools.ietf.org/html/rfc7235): Authentication

(We see entity-tag but that’s different from entities in Akka HTTP.)

So what is an "**entity**" in Akka HTTP? As briefly touched in [the official documentation](https://doc.akka.io/docs/akka-http/current/common/http-model.html), an entity is the body of an HTTP request or response. 


> an entity (body data)

**That’s just it. An entity is a body, and `HttpEntity` models the entity.**

To be honest, I am not sure why it was named as `HttpEntity` but not HttpBody (in Akka HTTP, there is no such class or trait named HttpBody). I guess there is a valid reason for this. Anyway, when you see the word "**entity**", you can assume that is the body of a request or a response.

In Akka HTTP, `RequestEntity` and `ResponseEntity`, which represent the HTTP request body and the response body, extend `HttpEntity`.

```scala
sealed trait RequestEntity extends HttpEntity ... {...}
```

```scala
sealed trait ResponseEntity extends HttpEntity ... {...}
```

As they are `trait`s, there are concrete classes extending from them. They are described in the `HttpEntity` [section of the official doc](https://doc.akka.io/docs/akka-http/current/common/http-model.html#httpentity), which are:

- `HttpEntity.Strict`
- `HttpEntity.Defuault`
- `HttpEntity.Chunked`
- `HttpEntity.CloseDelimited`
- `HttpEntity.IndefiniteLength`

and they are defined like below. The below case class definition is not very accurate, but simplified for the sake of easy understanding, still holding the essence of the actual definition.

```scala
final case class Strict(
  contentType: ContentType,
  data: ByteString
) extends ... HttpEntity
// simplified, it doesn't directly extend HttpEntity
```

```scala
final case class Default(
  contentType:   ContentType,
  contentLength: Long,
  data:          Source[ByteString, Any]
) extends ... HttpEntity
// simplified, it doesn't directly extend HttpEntity
```

```scala
final case class Chunked(
  contentType: ContentType,
  chunks: Source[ChunkStreamPart, Any]
) extends ... HttpEntity
// simplified, it doesn't directly extend HttpEntity
```

The last two, `CloseDelimited` and `IndefiniteLength` are bit more complicated, and less frequently used in practice, so we are not going to cover them here.

The meaning and behavior of these concrete classes will become clearer when you have better understanding about Marshalling and Unmarshalling, as well as [Streaming Support in Akka HTTP](https://doc.akka.io/docs/akka-http/current/routing-dsl/source-streaming-support.html#source-streaming) which I also explained in a [past article](../akka-http-response-streaming).

## Summary

Up to this point, we have covered how an HTTP request and response can be decomposed into smaller components, and what HTTP "**entity**" means - it is just the HTTP body of a request or a response, and `HttpEntity` has more specialized types like `Strict`, `Default` and `Chuked`.

As said at the beginning, to understand [Marshalling](https://doc.akka.io/docs/akka-http/current/common/marshalling.html) and [Unmarshalling](https://doc.akka.io/docs/akka-http/current/common/unmarshalling.html), which is difficult when you look into the internals, it is crucial to have an idea about how `HttpRequest`, `HttpResponse` and `HttpEntity` are related to each other.

From the next article, I'll start talking about Marshalling and Unmarshalling, which hopefully clarifies points not touched in the official doc.


