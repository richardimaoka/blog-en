import Head from 'next/head'
import getConfig from 'next/config'
import styles from './layout.module.css'
import utilStyles from '../styles/utils.module.css'
import Link from 'next/link'

export const siteTitle = 'Akka, Concurrency, etc.'

export default function Layout({ children, home }) {
  const { publicRuntimeConfig = {} } = getConfig() || {};
  const { basePath } = publicRuntimeConfig;
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href={basePath + "/favicon.ico"} />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className={styles.header}>
        {home ? (
          <>
            <h1 className={utilStyles.heading2Xl}>{siteTitle}</h1>
            <div className={utilStyles.bio}>
              <img
                src={basePath + "/images/profile.jpg"}
                alt={`Richard Imaoka`}
                className={utilStyles.biopic}
              />
              <p className={utilStyles.biodesc}>
                Written by Richard Imaoka, a Scala developer
                . You can find me on <a href="https://twitter.com/richardimaoka">twitter</a>,
                and <a href="https://github.com/richardimaoka">github</a>.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className={utilStyles.headingLg}>
              <Link href={basePath + "/"}>
                <a className={utilStyles.colorInherit}>{siteTitle}</a>
              </Link>
            </h2>
          </>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href={basePath + "/"}>
            <a>← Back to home</a>
          </Link>
        </div>
      )}
    </div>
  )
}
