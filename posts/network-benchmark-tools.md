---
title: Flent, ping, iperf and netperf - tools for network benchmarking
date: "2019-05-03T01:31:08.000+0900"
---

I am going to introduce Flent, ping, iperf, netperf as network benchmarking tools. I have recently been interested in the field of performance analysis, and found that it's worth writing a brief summary of low-level network performance analysis tools, since there doesn't seem to be a lot of structured information about the tools. 

## Importance of low-level network benchmarking

It might be tempting to think that performance benchmarking should be done in a realistic, production-grade environment, and the benchmarking environment should resemble the production environment as close as possible. 

Yes, it is important to perform high-level performance benchmarking in such a production-grade system, but you will then need to identify bottlenecks of your system, where you need to know the performance characteristics of more granular, low-level components.

![benchmark-tools](/images/network-benchmark-tools/benchmark-tools.png)

Network I/O is one of such low-level components you want to measure the performance. Same for CPU, RAM, disk I/O, ... etc, or web server process, backend process, database. Many components from many aspects matter in performance, but I only cover Network I/O in this article.

It's worth noting that performing low-level network benchmarking **by yourself** benefits you, if you are serious about performance analysis. As you can see in a book, [Enterprise Network Testing](https://www.amazon.com/Enterprise-Network-Testing-Availability-Performance-ebook/dp/B004X7N4Z4/ref=sr_1_1?keywords=Enterprise+Network+Testing&qid=1556982312&s=gateway&sr=8-1), network engineers in on-premise environments have done that by themselves. Even in cloud, it's worth doing because cloud vendors like AWS, GCP and Azure do not provide very detailed and up-to-date network benchmarking results.

## Two important measures, latency and throughput

Latency and throughput are two important measures in network performance. Latency can only be measured in two separate network locations, while throughput can only be measured at a network single location.

![benchmark-tools2](/images/network-benchmark-tools/benchmark-tools2.png)

![benchmark-tools3](/images/network-benchmark-tools/benchmark-tools3.png)

In other words, it doesn't make sense to masure network latency measured a single location, nor does throughput measured between two locations.

Below, I discuss ping as the latency benchmarking tool, iperf and netperf as throughput benchmarking tools. Lastly, I introduce Flent which is a more organized networking benchmarking tool, which has ability to avoid so-called Bufferbloat problems.

## Ping is surprisingly a good latency benchmark tool

I have been looking around to find tools to run network latency benchmarking. I could not find a widely used network latency tool, but as the search went on, ping appeared as an attractive option.

Of course, the main use of ping is to test if another network location can be reachable. However, ping also measures the latency of the network, and its wide adoption - it runs on nearly every network-aware computer, and everyone knows ping - and its robustness are a strong appeal as a benchmarking tool. 

```plaintext
> ping 172.217.26.14

PING 172.217.26.14 (172.217.26.14) 56(84) bytes of data.
64 bytes from 172.217.26.14: icmp_seq=1 ttl=57 time=16.1 ms
64 bytes from 172.217.26.14: icmp_seq=2 ttl=57 time=11.9 ms
64 bytes from 172.217.26.14: icmp_seq=3 ttl=57 time=9.83 ms
64 bytes from 172.217.26.14: icmp_seq=4 ttl=57 time=14.5 ms

4 packets transmitted, 4 received, 0% packet loss, time 3003ms
rtt min/avg/max/mdev = 9.834/13.112/16.111/2.403 ms
```

Indeed, Flent, an organized benchmarking toolset, which I'll introduce later in the article, uses ping as an underlying latency benchmarking tool.

In an upcoming article, I'll show results of my AWS network benchmarking with ping, and explain how I set up the benchmarking infrastructure.

## iperf and netperf for throughput benchmarking

iperf and netperf are tools to measure the throughput of network. 

As described in [this GitHub issue](https://github.com/esnet/iperf/issues/547), iperf is not tailored to measure latency, but more suited for throughput benchmarking. 
> iperf3 is primarily a bandwidth tester, not a latency tester. There are other utilities that can do this, such as ping or owamp.

iperf has an interesting history. In late 2000s, once the development of iperf2 stalled and there was iperf3 started. However, the development of iperf2 resumed afterwards and now both iperf2 and 3 are maintained and ended up having similar but different feature sets. 

```plaintext
> iperf -c node2
------------------------------------------------------------
Client connecting to node1, TCP port 5001
TCP window size: 59.9 KByte (default)
------------------------------------------------------------
[  3] local <IP Addr node1> port 2357 connected with <IP Addr node2> port 5001
[ ID] Interval       Transfer     Bandwidth
[  3]  0.0-10.0 sec   6.5 MBytes   5.2 Mbits/sec
```

netperf works similarly to iperf, as far as I checked. I could not tell which one is better over the other, but anyway, netperf also has a long history and is still actively used. Flent also uses netperf as an underlying tool, instead of iperf, which I will discuss later in the article.

I think you can choose one from iperf2, iperf3 and netperf to measure your network's throughput. And if you find the chosen tool does not satisfy your need, start looking into the others. It's always good to know about more tools, and they don't differ too much.

For me, I will explore both iperf2 and 3 and perform AWS network throughput benchmarking. I will summarize the results and how to set up the infra in a separate article.

Netperf is used in Flent, so I will cover it too in a yet another article about Flent.

## Flent

Flent is an organized toolset to run network benchmarking leveraging lower level tools such as ping and netperf. The below is a screenshot of Flent from the [Flent official website](https://flent.org/), and the charts seem to be obtained from desktop, but the tool runs on Linux too, which is good for automation.

![flent-screenshot](/images/network-benchmark-tools/flent-screenshot.png)

It is based on and used for academic reseaches done by Toke Høiland-Jørgensen, so presumably reliable on the theoretical side and also battle tested against lots of issues recorded on its [GitHub issues](https://github.com/tohojo/flent/issues).

The benefit of using Flent over raw ping and netperf is that Flent can run the test continuously for a long duration (see the above screenshot) and collect results more easily, and the test can be run under generated network loads to avoid the "Bufferbloat" effect. 

Bufferbloat is explained [here](https://www.bufferbloat.net/projects/bloat/wiki/Introduction/). 

> Bufferbloat is the undesirable latency that comes from a router or other network equipment buffering too much data ... The bad news is that bufferbloat is everywhere, ... The good news is, ... after 4 years of research ... relatively easy to fix.

So Flent is a nice organized tool and can avoid undesired Bufferbloat effects too. I will also give it a try and summarize the results in a different article.

## Conclusion

I have introduced a few tools for network benchmarking in this article, and their usage in depth will be covered in separate articles. 

It's important to measure network performance by yourself. AWS, GCP, Azure, and other cloud vendors do not seem to publish raw network benchmarking results. At least they do not continuously publish the network benchmarking results, even though they can be continuously changing and improving their network infrastructure and devices. So it's only you who can keep updating the latest benchmark results of your cloud environment. 

Low-level benchmark results give you a basis for higher-level system-wide performance analysis. To identify the performance bottleneck, it's not enough to only know about system-wide performance figures. You should compare the system-wide figures with more granular performance figures, and network is one such granular component.

Hope this article served as a good introduction to serious performance analysts.

## References

- [iperf](https://iperf.fr/)
- [iperf3 FAQ about the iperf2 and iperf3 history](https://software.es.net/iperf/faq.html)
- [GitHub: iperf issue 547, iperf is primarily a bandwidth tester](https://github.com/esnet/iperf/issues/547)
- [netperf](https://hewlettpackard.github.io/netperf/)
- [StackExchange: How to properly benchmark latency over LAN?](https://superuser.com/questions/1181985/how-to-properly-benchmark-latency-over-lan)
- [Enterprise Network Testing: Testing Throughout the Network Lifecycle to Maximize Availability and Performance (Networking Technology)](https://www.amazon.com/Enterprise-Network-Testing-Availability-Performance-ebook/dp/B004X7N4Z4/ref=sr_1_1?keywords=Enterprise+Network+Testing&qid=1556982312&s=gateway&sr=8-1)
- [Flent: The FLExible Network Tester](https://flent.org/)
- [Bufferbloat effect introduction](https://www.bufferbloat.net/projects/bloat/wiki/Introduction/)