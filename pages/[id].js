import Head from 'next/head'
import Layout from '../components/layout'
import Date from '../components/date'
import { getAllPostIds, getPostData } from '../lib/posts'
import utilStyles from '../styles/utils.module.css'
import unified from 'unified'
import parse from 'remark-parse'
import remark2rehype from 'remark-rehype'
import highlight from 'rehype-highlight'
import rehype2react from 'rehype-react'

export default function Post({ postData }) {
  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={postData.date} />
        </div>
        <div>
          {
            unified()
              .use(parse)
              .use(remark2rehype)
              .use(highlight)
              // since highlight works on text, not AST, the step following highlight should be
              // rehpye-react (text -> React), not remark-react (AST -> React)
              .use(rehype2react) 
              .processSync(postData.markdown).result
          }
        </div>
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