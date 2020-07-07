---
title: Using ping to test AWS VPC network latency across different regions
date: "2019-06-10T01:31:08.000+0900"
---

The code for this experiment is available [here](https://github.com/richardimaoka/aws-ping).

## Overview

In the [previous article](../network-latency-analysis-with-ping-aws/), I discussed my network latency test within a single AWS VPC region. Here in this article, I am going to extend it and test the network latency across different regions.

The below picture is from [AWS's official page](https://aws.amazon.com/about-aws/global-infrastructure).
![](/images/network-latency-analysis-with-ping-aws-cross-region/aws-global-infrastructure-map.png)

When you application grows to a global scale, you would likely transfer data across different AWS regions. The latency in each pair of AWS regions is important if the data transfer is expected to be in a real-time fashion in your applicaiton.

## Test results

Here is my test results sorted by the average ping latency. The values are in milliseconds.

<table class="table table-bordered table-hover table-condensed">
<thead><tr><th title="Field #1">source_region</th>
<th title="Field #2">target_region</th>
<th title="Field #3">avg_value</th>
<th title="Field #4">min_value</th>
<th title="Field #5">max_value</th>
</tr></thead>
<tbody><tr>
<td>eu-west-3</td>
<td>eu-west-2</td>
<td align="right">9.435</td>
<td align="right">9.264</td>
<td align="right">11.742</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>eu-west-1</td>
<td align="right">11.327</td>
<td align="right">11.101</td>
<td align="right">13.482</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>eu-central-1</td>
<td align="right">11.61</td>
<td align="right">11.512</td>
<td align="right">12.073</td>
</tr>
<tr>
<td>us-east-1</td>
<td>us-east-2</td>
<td align="right">12.319</td>
<td align="right">12.039</td>
<td align="right">13.999</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>eu-central-1</td>
<td align="right">15.277</td>
<td align="right">15.189</td>
<td align="right">15.637</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>us-east-1</td>
<td align="right">16.914</td>
<td align="right">16.801</td>
<td align="right">17.228</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>eu-west-1</td>
<td align="right">18.486</td>
<td align="right">18.336</td>
<td align="right">19.275</td>
</tr>
<tr>
<td>us-west-1</td>
<td>us-west-2</td>
<td align="right">19.829</td>
<td align="right">19.774</td>
<td align="right">19.92</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>eu-central-1</td>
<td align="right">22.49</td>
<td align="right">22.4</td>
<td align="right">22.62</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>eu-central-1</td>
<td align="right">24.893</td>
<td align="right">24.69</td>
<td align="right">27.299</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>us-east-2</td>
<td align="right">26.203</td>
<td align="right">26.086</td>
<td align="right">26.372</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>eu-west-3</td>
<td align="right">29.117</td>
<td align="right">29.034</td>
<td align="right">29.19</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>eu-west-2</td>
<td align="right">33.295</td>
<td align="right">33.201</td>
<td align="right">33.421</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>ap-northeast-1</td>
<td align="right">34.685</td>
<td align="right">34.598</td>
<td align="right">34.831</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>eu-west-1</td>
<td align="right">41.463</td>
<td align="right">41.335</td>
<td align="right">41.632</td>
</tr>
<tr>
<td>us-east-2</td>
<td>us-west-1</td>
<td align="right">51.996</td>
<td align="right">51.922</td>
<td align="right">52.194</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>ap-southeast-1</td>
<td align="right">54.024</td>
<td align="right">53.763</td>
<td align="right">57.17</td>
</tr>
<tr>
<td>us-east-1</td>
<td>us-west-1</td>
<td align="right">62.111</td>
<td align="right">62.029</td>
<td align="right">62.57</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>us-west-2</td>
<td align="right">67.995</td>
<td align="right">67.881</td>
<td align="right">68.437</td>
</tr>
<tr>
<td>us-east-2</td>
<td>us-west-2</td>
<td align="right">68.087</td>
<td align="right">68.038</td>
<td align="right">68.206</td>
</tr>
<tr>
<td>us-east-1</td>
<td>us-west-2</td>
<td align="right">72.115</td>
<td align="right">72.062</td>
<td align="right">72.229</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>ap-southeast-1</td>
<td align="right">72.12</td>
<td align="right">71.978</td>
<td align="right">73.087</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>ca-central-1</td>
<td align="right">74.921</td>
<td align="right">74.746</td>
<td align="right">76.1</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>us-east-1</td>
<td align="right">75.975</td>
<td align="right">75.873</td>
<td align="right">76.196</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>us-east-1</td>
<td align="right">76.702</td>
<td align="right">76.655</td>
<td align="right">76.807</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>us-east-2</td>
<td align="right">77.896</td>
<td align="right">77.82</td>
<td align="right">78.231</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>us-west-1</td>
<td align="right">78.56</td>
<td align="right">78.493</td>
<td align="right">78.863</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>us-east-1</td>
<td align="right">79.748</td>
<td align="right">79.633</td>
<td align="right">80.989</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>us-east-2</td>
<td align="right">86.559</td>
<td align="right">86.12</td>
<td align="right">92.064</td>
</tr>
<tr>
<td>eu-central-1</td>
<td>us-east-1</td>
<td align="right">87.959</td>
<td align="right">87.845</td>
<td align="right">88.928</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>ca-central-1</td>
<td align="right">89.175</td>
<td align="right">89.059</td>
<td align="right">89.974</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>us-east-2</td>
<td align="right">89.567</td>
<td align="right">89.449</td>
<td align="right">90.026</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>ca-central-1</td>
<td align="right">93.43</td>
<td align="right">93.369</td>
<td align="right">93.513</td>
</tr>
<tr>
<td>eu-central-1</td>
<td>us-east-2</td>
<td align="right">96.971</td>
<td align="right">96.878</td>
<td align="right">97.487</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>ap-southeast-1</td>
<td align="right">99.221</td>
<td align="right">99.112</td>
<td align="right">99.344</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>us-west-2</td>
<td align="right">99.467</td>
<td align="right">99.347</td>
<td align="right">99.597</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>eu-central-1</td>
<td align="right">100.571</td>
<td align="right">100.488</td>
<td align="right">100.858</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>ap-southeast-2</td>
<td align="right">106.454</td>
<td align="right">106.388</td>
<td align="right">106.589</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>eu-west-3</td>
<td align="right">106.954</td>
<td align="right">106.752</td>
<td align="right">110.041</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>us-east-1</td>
<td align="right">107.357</td>
<td align="right">107.242</td>
<td align="right">108.174</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>us-west-1</td>
<td align="right">111.731</td>
<td align="right">111.609</td>
<td align="right">111.88</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>eu-central-1</td>
<td align="right">112.079</td>
<td align="right">111.866</td>
<td align="right">115.644</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>eu-west-2</td>
<td align="right">113.049</td>
<td align="right">112.827</td>
<td align="right">115.494</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ca-central-1</td>
<td align="right">113.971</td>
<td align="right">113.88</td>
<td align="right">114.087</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>us-east-2</td>
<td align="right">116.8</td>
<td align="right">116.722</td>
<td align="right">116.862</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>eu-west-1</td>
<td align="right">122.206</td>
<td align="right">122.108</td>
<td align="right">122.618</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>ca-central-1</td>
<td align="right">122.727</td>
<td align="right">122.639</td>
<td align="right">122.962</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>ap-northeast-1</td>
<td align="right">124.042</td>
<td align="right">123.918</td>
<td align="right">124.656</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>us-west-2</td>
<td align="right">127.332</td>
<td align="right">127.145</td>
<td align="right">128.243</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ap-south-1</td>
<td align="right">131.514</td>
<td align="right">131.409</td>
<td align="right">131.718</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>us-west-2</td>
<td align="right">131.737</td>
<td align="right">131.68</td>
<td align="right">131.847</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>ap-southeast-2</td>
<td align="right">134.009</td>
<td align="right">133.899</td>
<td align="right">134.261</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>us-west-1</td>
<td align="right">136.79</td>
<td align="right">136.623</td>
<td align="right">139.716</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>us-west-2</td>
<td align="right">137.377</td>
<td align="right">137.327</td>
<td align="right">137.524</td>
</tr>
<tr>
<td>ap-southeast-2</td>
<td>us-west-2</td>
<td align="right">137.986</td>
<td align="right">137.919</td>
<td align="right">138.092</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>us-west-1</td>
<td align="right">138.496</td>
<td align="right">138.436</td>
<td align="right">138.636</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>us-west-1</td>
<td align="right">139.89</td>
<td align="right">139.563</td>
<td align="right">142.783</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>us-east-1</td>
<td align="right">140.855</td>
<td align="right">140.798</td>
<td align="right">141.002</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>us-west-1</td>
<td align="right">141.553</td>
<td align="right">141.375</td>
<td align="right">143.441</td>
</tr>
<tr>
<td>eu-central-1</td>
<td>us-west-1</td>
<td align="right">146.286</td>
<td align="right">146.191</td>
<td align="right">146.563</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>us-west-2</td>
<td align="right">147.916</td>
<td align="right">147.704</td>
<td align="right">150.489</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>us-east-2</td>
<td align="right">150.637</td>
<td align="right">150.559</td>
<td align="right">150.762</td>
</tr>
<tr>
<td>ap-southeast-2</td>
<td>us-west-1</td>
<td align="right">150.762</td>
<td align="right">150.621</td>
<td align="right">151.54</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>us-east-1</td>
<td align="right">152.693</td>
<td align="right">152.546</td>
<td align="right">152.954</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>ap-northeast-2</td>
<td align="right">153.521</td>
<td align="right">153.074</td>
<td align="right">157.473</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>ca-central-1</td>
<td align="right">156.348</td>
<td align="right">156.258</td>
<td align="right">156.554</td>
</tr>
<tr>
<td>eu-central-1</td>
<td>us-west-2</td>
<td align="right">157.993</td>
<td align="right">157.882</td>
<td align="right">158.226</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>us-east-2</td>
<td align="right">158.274</td>
<td align="right">158.174</td>
<td align="right">158.828</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>us-west-2</td>
<td align="right">163.188</td>
<td align="right">163.128</td>
<td align="right">163.245</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>us-west-2</td>
<td align="right">165.754</td>
<td align="right">165.641</td>
<td align="right">166.06</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>ap-southeast-1</td>
<td align="right">165.951</td>
<td align="right">165.861</td>
<td align="right">166.31</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>ap-southeast-1</td>
<td align="right">166.857</td>
<td align="right">166.69</td>
<td align="right">169.289</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>us-west-1</td>
<td align="right">166.903</td>
<td align="right">166.616</td>
<td align="right">170.379</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>eu-central-1</td>
<td align="right">170.72</td>
<td align="right">170.64</td>
<td align="right">171.291</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>ap-southeast-1</td>
<td align="right">175.214</td>
<td align="right">175.112</td>
<td align="right">175.671</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>us-west-1</td>
<td align="right">175.532</td>
<td align="right">174.633</td>
<td align="right">198.092</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>us-east-1</td>
<td align="right">176.618</td>
<td align="right">176.539</td>
<td align="right">176.772</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>sa-east-1</td>
<td align="right">179.883</td>
<td align="right">179.769</td>
<td align="right">180.6</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>us-east-1</td>
<td align="right">181.932</td>
<td align="right">181.832</td>
<td align="right">182.253</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>us-west-2</td>
<td align="right">184.524</td>
<td align="right">184.442</td>
<td align="right">184.626</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ap-southeast-1</td>
<td align="right">184.94</td>
<td align="right">184.869</td>
<td align="right">185.037</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>us-east-2</td>
<td align="right">185.384</td>
<td align="right">185.269</td>
<td align="right">185.545</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>ca-central-1</td>
<td align="right">185.495</td>
<td align="right">185.337</td>
<td align="right">186.947</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>ap-southeast-2</td>
<td align="right">187.683</td>
<td align="right">187.403</td>
<td align="right">191.223</td>
</tr>
<tr>
<td>ap-southeast-2</td>
<td>us-east-2</td>
<td align="right">194.336</td>
<td align="right">194.106</td>
<td align="right">196.131</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>ca-central-1</td>
<td align="right">194.342</td>
<td align="right">194.256</td>
<td align="right">194.473</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>us-east-2</td>
<td align="right">195.138</td>
<td align="right">195.063</td>
<td align="right">195.263</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>us-west-1</td>
<td align="right">196.044</td>
<td align="right">195.023</td>
<td align="right">196.941</td>
</tr>
<tr>
<td>ap-southeast-2</td>
<td>us-east-1</td>
<td align="right">198.82</td>
<td align="right">198.766</td>
<td align="right">199.157</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>ap-southeast-2</td>
<td align="right">209.585</td>
<td align="right">209.341</td>
<td align="right">211.664</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>us-west-2</td>
<td align="right">211.279</td>
<td align="right">211.199</td>
<td align="right">211.392</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>ap-northeast-1</td>
<td align="right">215.736</td>
<td align="right">215.658</td>
<td align="right">215.869</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>sa-east-1</td>
<td align="right">217.074</td>
<td align="right">216.929</td>
<td align="right">218.18</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>ap-northeast-1</td>
<td align="right">217.856</td>
<td align="right">217.768</td>
<td align="right">218.055</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>sa-east-1</td>
<td align="right">218.02</td>
<td align="right">216.94</td>
<td align="right">227.153</td>
</tr>
<tr>
<td>ca-central-1</td>
<td>ap-southeast-1</td>
<td align="right">220.046</td>
<td align="right">219.949</td>
<td align="right">220.592</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>us-east-2</td>
<td align="right">222.829</td>
<td align="right">222.744</td>
<td align="right">223.209</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>ap-southeast-2</td>
<td align="right">223.823</td>
<td align="right">223.703</td>
<td align="right">224.632</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>ap-northeast-1</td>
<td align="right">225.934</td>
<td align="right">225.815</td>
<td align="right">227.104</td>
</tr>
<tr>
<td>ap-southeast-1</td>
<td>us-east-1</td>
<td align="right">226.586</td>
<td align="right">226.458</td>
<td align="right">227.522</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>us-west-1</td>
<td align="right">227.668</td>
<td align="right">227.593</td>
<td align="right">227.789</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>eu-central-1</td>
<td align="right">228.214</td>
<td align="right">228.142</td>
<td align="right">228.279</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>eu-central-1</td>
<td align="right">231.089</td>
<td align="right">229.141</td>
<td align="right">231.571</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>ap-northeast-2</td>
<td align="right">240.581</td>
<td align="right">240.326</td>
<td align="right">240.731</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>ap-northeast-2</td>
<td align="right">243.391</td>
<td align="right">243.294</td>
<td align="right">244.227</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ap-northeast-1</td>
<td align="right">245.055</td>
<td align="right">244.871</td>
<td align="right">247.834</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>sa-east-1</td>
<td align="right">245.18</td>
<td align="right">245.079</td>
<td align="right">245.736</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>ap-northeast-2</td>
<td align="right">253.109</td>
<td align="right">253.038</td>
<td align="right">253.254</td>
</tr>
<tr>
<td>eu-west-1</td>
<td>ap-southeast-2</td>
<td align="right">259.148</td>
<td align="right">258.969</td>
<td align="right">260.803</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>eu-central-1</td>
<td align="right">264.326</td>
<td align="right">264.126</td>
<td align="right">266.897</td>
</tr>
<tr>
<td>eu-west-2</td>
<td>ap-southeast-2</td>
<td align="right">270.051</td>
<td align="right">268.612</td>
<td align="right">270.192</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ap-northeast-2</td>
<td align="right">270.692</td>
<td align="right">270.594</td>
<td align="right">270.793</td>
</tr>
<tr>
<td>ap-northeast-1</td>
<td>sa-east-1</td>
<td align="right">273.182</td>
<td align="right">273.047</td>
<td align="right">274.608</td>
</tr>
<tr>
<td>eu-west-3</td>
<td>ap-southeast-2</td>
<td align="right">275.802</td>
<td align="right">275.727</td>
<td align="right">276.025</td>
</tr>
<tr>
<td>ap-southeast-2</td>
<td>eu-central-1</td>
<td align="right">283.567</td>
<td align="right">283.419</td>
<td align="right">283.896</td>
</tr>
<tr>
<td>ap-northeast-2</td>
<td>sa-east-1</td>
<td align="right">297.738</td>
<td align="right">297.561</td>
<td align="right">300.804</td>
</tr>
<tr>
<td>eu-north-1</td>
<td>ap-southeast-2</td>
<td align="right">301.866</td>
<td align="right">301.79</td>
<td align="right">301.931</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>ap-southeast-2</td>
<td align="right">315.08</td>
<td align="right">315.025</td>
<td align="right">315.151</td>
</tr>
<tr>
<td>ap-south-1</td>
<td>sa-east-1</td>
<td align="right">321.132</td>
<td align="right">320.986</td>
<td align="right">322.404</td>
</tr>
<tr>
<td>sa-east-1</td>
<td>ap-southeast-1</td>
<td align="right">340.949</td>
<td align="right">340.515</td>
<td align="right">347.95</td>
</tr>
</tbody></table>

## The test structure and VPC peering

Let me briefly explain VPC peering in AWS which I used for this testing.

When your application transfers data across regions, for example, in order to replicate data across regions, you would likely to do it through AWS's internal network instead of sending data over the public internet.

VPC peering in AWS allows the inter-region data transfer within AWS:

https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html
> A VPC peering connection ... enables you to route traffic between them using private IPv4 addresses or IPv6 addresses ... Traffic always stays on the global AWS backbone, and never traverses the public internet

In this test, I measured ping latency across AWS regions using VPC peering.

![](/images/network-latency-analysis-with-ping-aws-cross-region/test-structure2.png)

## Matt Adorjan's AWS Inter-Region Latency

There is another, actually a better source of AWS network latency information.

While writing this article, I found "AWS Inter-Region Latency" at https://www.cloudping.co which covers more comprehensive combinations of regions.

He used DynamoDB endpoints, so it is somewhat different from my test, but anyway his coverage on the region pairs is more comprehensive, so it's worth checking out. Please look at his [GitHub repo](https://github.com/mda590/cloudping.co/) (I already gave a star to it!). 

It was a good learning opportunity to me. Kudos to [Matt](https://twitter.com/mda590).

## References

https://aws.amazon.com/about-aws/global-infrastructure/
https://aws.amazon.com/about-aws/global-infrastructure/regions_az/

 - [AWS Regions and Endpoints](https://docs.aws.amazon.com/general/latest/gr/rande.html)
 - [AWS Regions and Availability Zones](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)- [AWS CLI: ec2 describe-regions](https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-regions.html)
 - [AWS VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
 - [AWS Inter-Region latency](https://www.cloudping.co/)