---
title: Serializer minimal example
date: "2018-01-23T01:31:00.000+0900"
---

## Overview

You can find the code and instruction to run the example at [GitHub](https://github.com/richardimaoka/resources/tree/master/serialize-minimal).

### Akka Serialization

<p align="center"><iframe width="640" height="360"" src="https://www.youtube.com/embed/paclLCSv6NA" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></p>

Akka doc's [serialization section](https://doc.akka.io/docs/akka/2.5/serialization.html) says:

> However, messages that have to escape the JVM to reach an actor running on a different host have to undergo some form of serialization (i.e. the objects have to be converted to and from byte arrays).

This example shows a simplified version, but still the core of what Akka serialization does - 
(i.e.) how `Serialization` Akka extention class, `Serializer`,
and the message you want to serialize/deserialize work together.

### Serializer configuration

First, you need to define your serializer class, extending `Serializer`.

```scala
import akka.serialization.Serializer

case class MyMessage(str1: String, str2: String)

class MySerializer extends Serializer {
  ...
}
```

Then you need configuration which binds your `MySerializer` to the `MyMessage` type.
Note the common `mymessage` key which defines the binding.

```scala
//application.conf
akka {
  actor {
    serializers {
      mymessage = "example.MySerializer"
    }                                     
    serialization-bindings {              
      "example.MyMessage" = mymessage     
    }
  }
}
```

Next, you should define `toBinary` and `fromBinary` inside `MySerializer` to handle
serialization and deserialization of `MyMessage` instances.

```scala
  def toBinary(obj: AnyRef): Array[Byte] = {
    obj match {
      case msg: MyMessage => 
        (msg.str1 + "|" + msg.str2).getBytes(StandardCharsets.UTF_8)
    }
  }
```

```scala
  def fromBinary(bytes: Array[Byte], clazz: Option[Class[_]]): AnyRef = {
    val repString = new String(bytes, StandardCharsets.UTF_8)
    // '|' is enclosed in single quotes = Char, not 
    val arr: Array[String] = repString.split('|') String
    new MyMessage(arr(0), arr(1))
  }
```

The below piece of code is the simplied version of what Akka does, when serializing a message.

```scala
val system = akka.actor.ActorSystem("example", ConfigFactory.load())
val original = MyMessage("aaa", "bbb")
val serialization = SerializationExtension(system)

//serialization by toBinary
val bytes = serializer.toBinary(original)

//de-serialization by fromBinary
val restored = serializer.fromBinary(bytes, manifest = None)
```

When you are (e.g.) sending a message to a remote JVM, this is done under the ground
and you don't explicitly call `SerializationExtension(system)`, `toBinary` and `fromBinary` yourself, but this example is to show what's done by Akka in the simple form.


## Instruction to run the example
```plaintext
> git clone https://github.com/richardimaoka/resources.git
> cd resources
> cd serialize-minimal
> sbt
> runMain example.Main
```

## Output 

Some `println` calls are inserted in the [complete example at GitHub](https://github.com/richardimaoka/resources/tree/master/serialize-minimal) to illustrate the behavior

```plaintext
[info] Running example.Main
Serializer for class example.MyMessage = example.MySerializer@254b2a65
MySerializer: toBinary(MyMessage(aaa,bbb)) is called
MySerializer: fromBinary(979797124989898) is called
original = MyMessage(aaa,bbb), class = class example.MyMessage
restored = MyMessage(aaa,bbb), class = class example.MyMessage
[success] Total time: 1 s, completed Jan 23, 2018 9:48:55 PM
```

## References 

- Official documentation of Akka serialization at https://doc.akka.io/docs/akka/2.5/serialization.html
