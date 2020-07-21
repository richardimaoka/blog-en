import React from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import Date from '../components/date'
import { getAllPostIds, getPostData } from '../lib/posts'
import utilStyles from '../styles/utils.module.css'

export default function Post({ postData }) {
  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
        <meta name="og:title" content={postData.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@richardimaoka" />
        <meta name="twitter:creator" content="@richardimaoka" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/agate.min.css"></link>
        { postData.description &&
          <meta name="og:description" content={postData.description} />
        }
        { postData.image &&
          <meta name="og:image" content={"https://blog-jp.richardimaoka.net" + postData.image} />
        }
        <script src="//cdn.iframe.ly/embed.js" charset="utf-8"></script>
        <script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    </Layout>
  )
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id)
  return {
    props: {
      postData
    }
  }
}