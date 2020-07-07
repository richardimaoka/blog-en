---
title: Using ping to test AWS VPC network latency across availability zones in each single region
date: "2019-06-16T01:31:08.000+0900"
---

## Overview

The code for this experiment can be found [here](https://github.com/richardimaoka/aws-ping).

Earlier I wrote an [article](/images/network-latency-analysis-with-ping-aws-single-region/network-latency-analysis-with-ping-aws) to test the AWS VPC network latency with ping. That article only covered the test in my default region, ap-northeast-1. So in this article, I am extending it, to run the same inter-availability-zone latency test, but for each of the regions where I have access.

![](/images/network-latency-analysis-with-ping-aws-single-region/test-structure2.png)

## Results

<table class="table table-bordered table-hover table-condensed">
<thead><tr><th title="Field #1">source availability zone</th>
<th title="Field #2">target availability zone</th>
<th title="Field #3">avg(ms)</th>
<th title="Field #4">min(ms)</th>
<th title="Field #5">max(ms)</th>
</tr></thead>
<tbody><tr>
<td>ap-northeast-1a</td>
<td>ap-northeast-1c</td>
<td align="right">2.786</td>
<td align="right">2.613</td>
<td align="right">5.116</td>
</tr>
<tr>
<td>ap-northeast-1a</td>
<td>ap-northeast-1d</td>
<td align="right">2.014</td>
<td align="right">1.818</td>
<td align="right">4.743</td>
</tr>
<tr>
<td>ap-northeast-1c</td>
<td>ap-northeast-1d</td>
<td align="right">1.065</td>
<td align="right">0.977</td>
<td align="right">1.163</td>
</tr>
<tr>
<td>ap-northeast-2a</td>
<td>ap-northeast-2c</td>
<td align="right">1.334</td>
<td align="right">1.178</td>
<td align="right">1.454</td>
</tr>
<tr>
<td>ap-south-1a</td>
<td>ap-south-1b</td>
<td align="right">1.353</td>
<td align="right">0.834</td>
<td align="right">12.508</td>
</tr>
<tr>
<td>ap-southeast-1a</td>
<td>ap-southeast-1b</td>
<td align="right">1.2</td>
<td align="right">1.081</td>
<td align="right">2.404</td>
</tr>
<tr>
<td>ap-southeast-1a</td>
<td>ap-southeast-1c</td>
<td align="right">0.729</td>
<td align="right">0.628</td>
<td align="right">1.324</td>
</tr>
<tr>
<td>ap-southeast-1b</td>
<td>ap-southeast-1c</td>
<td align="right">1.406</td>
<td align="right">1.314</td>
<td align="right">2.048</td>
</tr>
<tr>
<td>ap-southeast-2a</td>
<td>ap-southeast-2b</td>
<td align="right">1.34</td>
<td align="right">1.237</td>
<td align="right">1.757</td>
</tr>
<tr>
<td>ap-southeast-2a</td>
<td>ap-southeast-2c</td>
<td align="right">1.144</td>
<td align="right">1.037</td>
<td align="right">2.228</td>
</tr>
<tr>
<td>ap-southeast-2b</td>
<td>ap-southeast-2c</td>
<td align="right">1.599</td>
<td align="right">1.401</td>
<td align="right">4.699</td>
</tr>
<tr>
<td>ca-central-1a</td>
<td>ca-central-1b</td>
<td align="right">0.665</td>
<td align="right">0.581</td>
<td align="right">0.942</td>
</tr>
<tr>
<td>eu-central-1a</td>
<td>eu-central-1b</td>
<td align="right">0.954</td>
<td align="right">0.884</td>
<td align="right">1.089</td>
</tr>
<tr>
<td>eu-central-1a</td>
<td>eu-central-1c</td>
<td align="right">1.128</td>
<td align="right">0.922</td>
<td align="right">3.781</td>
</tr>
<tr>
<td>eu-central-1b</td>
<td>eu-central-1c</td>
<td align="right">0.731</td>
<td align="right">0.628</td>
<td align="right">1.14</td>
</tr>
<tr>
<td>eu-west-1a</td>
<td>eu-west-1b</td>
<td align="right">0.765</td>
<td align="right">0.684</td>
<td align="right">0.951</td>
</tr>
<tr>
<td>eu-west-1a</td>
<td>eu-west-1c</td>
<td align="right">0.945</td>
<td align="right">0.839</td>
<td align="right">1.456</td>
</tr>
<tr>
<td>eu-west-1b</td>
<td>eu-west-1c</td>
<td align="right">0.766</td>
<td align="right">0.613</td>
<td align="right">1.987</td>
</tr>
<tr>
<td>eu-west-2a</td>
<td>eu-west-2b</td>
<td align="right">1.119</td>
<td align="right">1.033</td>
<td align="right">1.678</td>
</tr>
<tr>
<td>eu-west-2a</td>
<td>eu-west-2c</td>
<td align="right">0.774</td>
<td align="right">0.651</td>
<td align="right">2.182</td>
</tr>
<tr>
<td>eu-west-2b</td>
<td>eu-west-2c</td>
<td align="right">1.26</td>
<td align="right">1.198</td>
<td align="right">1.545</td>
</tr>
<tr>
<td>eu-west-3a</td>
<td>eu-west-3b</td>
<td align="right">1.015</td>
<td align="right">0.87</td>
<td align="right">1.679</td>
</tr>
<tr>
<td>eu-west-3a</td>
<td>eu-west-3c</td>
<td align="right">1.118</td>
<td align="right">1.045</td>
<td align="right">1.193</td>
</tr>
<tr>
<td>eu-west-3b</td>
<td>eu-west-3c</td>
<td align="right">1.08</td>
<td align="right">0.987</td>
<td align="right">2.114</td>
</tr>
<tr>
<td>sa-east-1a</td>
<td>sa-east-1c</td>
<td align="right">1.257</td>
<td align="right">1.133</td>
<td align="right">2.643</td>
</tr>
<tr>
<td>us-east-1a</td>
<td>us-east-1b</td>
<td align="right">0.807</td>
<td align="right">0.733</td>
<td align="right">0.9</td>
</tr>
<tr>
<td>us-east-1a</td>
<td>us-east-1c</td>
<td align="right">0.962</td>
<td align="right">0.912</td>
<td align="right">1.037</td>
</tr>
<tr>
<td>us-east-1a</td>
<td>us-east-1d</td>
<td align="right">1.259</td>
<td align="right">1.021</td>
<td align="right">4.742</td>
</tr>
<tr>
<td>us-east-1a</td>
<td>us-east-1e</td>
<td align="right">0.876</td>
<td align="right">0.604</td>
<td align="right">6.27</td>
</tr>
<tr>
<td>us-east-1a</td>
<td>us-east-1f</td>
<td align="right">1.143</td>
<td align="right">1.006</td>
<td align="right">2.409</td>
</tr>
<tr>
<td>us-east-1b</td>
<td>us-east-1c</td>
<td align="right">0.79</td>
<td align="right">0.729</td>
<td align="right">0.903</td>
</tr>
<tr>
<td>us-east-1b</td>
<td>us-east-1d</td>
<td align="right">0.835</td>
<td align="right">0.748</td>
<td align="right">1.204</td>
</tr>
<tr>
<td>us-east-1b</td>
<td>us-east-1e</td>
<td align="right">0.952</td>
<td align="right">0.805</td>
<td align="right">2.747</td>
</tr>
<tr>
<td>us-east-1b</td>
<td>us-east-1f</td>
<td align="right">1.022</td>
<td align="right">0.936</td>
<td align="right">2.073</td>
</tr>
<tr>
<td>us-east-1c</td>
<td>us-east-1d</td>
<td align="right">0.657</td>
<td align="right">0.59</td>
<td align="right">0.749</td>
</tr>
<tr>
<td>us-east-1c</td>
<td>us-east-1e</td>
<td align="right">0.972</td>
<td align="right">0.91</td>
<td align="right">1.065</td>
</tr>
<tr>
<td>us-east-1c</td>
<td>us-east-1f</td>
<td align="right">0.863</td>
<td align="right">0.7</td>
<td align="right">1.575</td>
</tr>
<tr>
<td>us-east-1d</td>
<td>us-east-1e</td>
<td align="right">1.196</td>
<td align="right">0.984</td>
<td align="right">4.261</td>
</tr>
<tr>
<td>us-east-1d</td>
<td>us-east-1f</td>
<td align="right">0.969</td>
<td align="right">0.875</td>
<td align="right">1.52</td>
</tr>
<tr>
<td>us-east-1e</td>
<td>us-east-1f</td>
<td align="right">0.971</td>
<td align="right">0.808</td>
<td align="right">2.316</td>
</tr>
<tr>
<td>us-east-2a</td>
<td>us-east-2b</td>
<td align="right">1.006</td>
<td align="right">0.934</td>
<td align="right">1.116</td>
</tr>
<tr>
<td>us-east-2a</td>
<td>us-east-2c</td>
<td align="right">1.287</td>
<td align="right">1.209</td>
<td align="right">1.682</td>
</tr>
<tr>
<td>us-east-2b</td>
<td>us-east-2c</td>
<td align="right">0.642</td>
<td align="right">0.496</td>
<td align="right">1.699</td>
</tr>
<tr>
<td>us-west-1a</td>
<td>us-west-1c</td>
<td align="right">1.364</td>
<td align="right">1.276</td>
<td align="right">1.91</td>
</tr>
<tr>
<td>us-west-2a</td>
<td>us-west-2b</td>
<td align="right">0.895</td>
<td align="right">0.83</td>
<td align="right">1.144</td>
</tr>
<tr>
<td>us-west-2a</td>
<td>us-west-2c</td>
<td align="right">0.939</td>
<td align="right">0.542</td>
<td align="right">6.021</td>
</tr>
<tr>
<td>us-west-2b</td>
<td>us-west-2c</td>
<td align="right">1.34</td>
<td align="right">1.165</td>
<td align="right">2.62</td>
</tr>
</tbody></table>


Please be noted that I didn't test latency between two subnets in the same availability zone. 

![](/images/network-latency-analysis-with-ping-aws-single-region/test-structure1.png)

The previous article showed that the following two cases didn't produce any noticeable latency difference:

- ping from one subnet to another, within the same availability zone
- ping within the same subnet, within the same availability zone

So I am assuming these two cases are the same in terms of latency.

