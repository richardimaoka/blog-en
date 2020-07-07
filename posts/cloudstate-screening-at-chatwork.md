---
title: Local small screening for CloudState, to exchange thoughts about the project
date: "2019-10-15T01:31:00.000+0900"
---

On Friday, October 4th, 2019, I organized a small screening for CloudState which was held at Chatwork's office in Tokyo. The event was very interesting and informative for me to exchange thoughts on CloudState with other engineers. So I wanted to post this quick blog article to share my excitement about the technology!

![](/images/cloudstate-screening-at-chatwork/theater.jpg)

[Chatwork](https://go.chatwork.com/) is a company providing group chat services, domiciled in Japan but expanding the service at a global scale, and their backend technology stack is based on Akka. As I wanted to discuss the CloudState project, I asked them if it was possible to have the quick screening of Jonas Boner's recorded session at [KubeCon + CloudNativeCon Europe 2019](https://events19.linuxfoundation.org/events/kubecon-cloudnativecon-europe-2019/). They kindly accepted and provided a nice theater room at their office.

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/J3PyYmdTsnQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></p>

I am not going to introduce the CloudState project by myself since Jonas's 35-minute session available at YouTube is already a pretty concise introduction. I don't think I can do a better job explaining the project's background and motivation, so please go ahead and watch Jonas's session.

I came to know the CloudState project when I received an email from Lightbend through my newsletter subscription. Quickly after I went through the [project site](https://cloudstate.io/) and [GitHub README](https://github.com/cloudstateio/cloudstate/blob/master/README.md), I felt enthusiastic about it and wanted to see what other engineers feel about the technology. The first person came to my mind was Chatwork's tech lead, [Junichi Kato](https://github.com/j5ik2o) who is best known as an Akka and Domain Driven Design expert in the tech community in Japan. 

Junichi, other Chatwork engineers, guest participants and I discussed what's good, intimidating, and what to explore more on CloudState. Overall, the participants had positive views on the technology and opportunities enabled by stateful serverless. On the other hand, there were some questions about the promised cost efficiency. The learning curve felt steep because the technology is based on other technologies including Kubernetes, Knative, gRPC, Akka and so on. Each of them is a big topic which is worth several months or probably years to become an expert. Also, the operational burden felt significant if we have to manage the whole infrastructure by ourselves.

What I want to explore from here are easier ways to use CloudState. Probably we don't need to know every single aspect of the underlying technologies. Probably we can leverage managed services to reduce the operational burden on managing the infra. Anyway, it still feels interesting to me and I keep my eyes on how the project evolves. Or I even want to contribute to it!

