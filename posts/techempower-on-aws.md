---
title: Running TechEmpower Web Framework Benchmarks on AWS on my own
date: "2019-01-30T01:31:00.000+0900"
---

**TL;DR)**

- I ran [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks/) on AWS by myself 
- By doing that, I got equipped with good tools and skills about benchmarking and performance analysis

## Overview

[TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks/) are a collection of simple benchmarking results with [wrk](https://github.com/wg/wrk), and the code base to run the benchmark results. The benchmarking scenarios are simple, but they cover a comprehensive set of web frameworks and libraries. 

![](/images/techempower-on-aws/techempower-screenshot.png)

> This is a performance comparison of many web application frameworks executing fundamental tasks such as JSON serialization, database access, and server-side template composition. 

Since its launch in 2013, a large audience in the web industry showed their interest to the effort, so that TechEmpower already published 17 rounds of benchmarking results, and they got [over 3,800 GitHub stars](https://github.com/TechEmpower/FrameworkBenchmarks) as of Jan 2019.

For me, what is more interesting than the results themselves is the code base they made open on GitHub, with decent [documentation](https://frameworkbenchmarks.readthedocs.io/en/latest/) as well as [the official website](https://www.techempower.com/benchmarks/). Given the information available there, they made it very **practical for any of us to run the same benchmark**, so why not I do it myself!

## What did I do?

Running the TechEmpower benchmarks for all the web frameworks takes few days to finish. So I chose h2o as a reference web framework, and ran the benchmark with [TechEmpower's code in GitHub](https://github.com/TechEmpower/FrameworkBenchmarks), on AWS. 

![](/images/techempower-on-aws/three-containers.gif)

As you can see in [Environment Details](https://frameworkbenchmarks.readthedocs.io/en/latest/Project-Information/Environment/#environment-details) in the documentation, the official benchmark runs are on 3-machine setup:

> All 3 machines: tfb-server, tfb-database, tfb-client

 Therefore, I also set up my benchmark environment as 3-EC2 instance setup, one for the [wrk](https://github.com/wg/wrk) container (HTTP request generator), another for the web server (h2o in my case) container, and the last for the database container.

Here's the AWS results I got, compared with the official results by TechEmpower:

![](/images/techempower-on-aws/results-comparison-1.png)

- Physical Hardware (official result): Self-hosted hardware called [Citrine](https://frameworkbenchmarks.readthedocs.io/en/latest/Project-Information/Environment/#environment-details)
- Azure  (official result): D3v2 instances
- AWS: m5.xlarge instances

Somehow I got weird results for Multi-query and Data-update tests, so I only listed up JSON serialization, Single query, Fortunes, and Plaintext.

![](/images/techempower-on-aws/results-comparison-2.png)


The AWS results were noticeably different from Azure, but I didn't investigate the reason, because the specific results did not matter so much for me at this point.

What's more important for me was that, **later**, I could run benchmarks myself **again and again**, for a different set of environments, frameworks, or even custom benchmark scenarios, to get a better understanding of performance analysis.

## Environment setup in more detail

(*I added more detailed steps [in the next article](../techempower-on-aws-detailed-steps)*)

As I said containers, yes, everything is docker-ized already by the TechEmpower engineers. That's cool.

The wrk container was on one EC2 instance, the web server on another EC2, and the database on the other. However, there was actually one more t2.micro EC2 instance I used to `docker run` all the three containers **remotely**. So the actually EC2 setup was like below:

![](/images/techempower-on-aws/techempower-detail.png)

![](/images/techempower-on-aws/aws-ec2-list.png)

In terms of the cloud computing instances, [the official environment setup description](https://www.techempower.com/benchmarks/#section=environment) says [Azure D3v2](https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/#d-series) was used.

![](/images/techempower-on-aws/azure-d3v2.png)

Looking at [AWS EC2 instance types](https://aws.amazon.com/ec2/instance-types/), I think the closest match was m5.xlarge, with the same 4 vCPUs.

![](/images/techempower-on-aws/aws-m5xlarge.png)

If you are familiar with AWS, before launching EC2, you should configure your VPC up to this point - Subnet, Security Groups, Route Table, etc. If you are not familiar with EC2 or VPC, please look at introductory materials. You can Google them up and there are a lot of them avaiable.

One thing to note for VPC is that the TechEmpower infrastructure expects the port 2375 is open so that docker containers can be launched **remotely** by `docker run`.

I also leveraged [EC2 user data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html) which is a quick and convenient way to start up docker on the EC2 instances and tweak the docker settings to open the port 2375.

Once everything is done, it is as simple as executing the following command within the `git clone`-ed directory of the [TechEmpower GitHub repository](https://github.com/TechEmpower/FrameworkBenchmarks) on the "controller" EC2 instance.

```plaintext
./tfb  --test h2o \
  --network-mode host \
  --server-host 10.0.0.207 \
  --database-host 10.0.0.149 \
  --client-host 10.0.0.216
```

Replace the IP addresses above with the EC2 private IPs you get on the AWS web console.

![](/images/techempower-on-aws/private-ip.png)

(*Again, more detailed instructions [in the next article](../techempower-on-aws-detailed-steps)*)

## Caveats and Conclusion

Thanks to the great effort done by TechEmpower, I could run the same benchmark as theirs in a reasonable amount of time. I was pretty much an AWS beginner but could still execute it on my own.

However, I think there are few more possible improvements to make the the TechEmpower benchmark infra even better.

1. Use Kubernets to run the containers in a declarative way, rather than procedural [python scripts](https://github.com/TechEmpower/FrameworkBenchmarks/tree/master/toolset), for better maintenance
2. Kubernetes can also get us avoid exposing the port 2375, to remotely execute `docker run`. Better security.
3. The last point is that `-v /var/run/docker.sock:/var/run/docker.sock` should be avoided in `docker run` due to its vulnerability. This is done to run `docker build` inside `docker run`, but if we push built Docker images to a registry, that's not needed. See below for more information. 
https://www.lvh.io/posts/dont-expose-the-docker-socket-not-even-to-a-container.html

To end the article, let me warn you that benchmarking is always an artificial activity, so pay attention to difference from the production environment, and if you do it wrong, it could  even give opposite implications about the performance. Don't jump to conclusions, but keep improving on your performance anlaysis. Benchmarks are just good tools on that path, not the golden evidence you blindly rely on.
