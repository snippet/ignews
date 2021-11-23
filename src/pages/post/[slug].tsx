import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client'

import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  updatedAt: string | null;
  title: string;
  time: number;
  banner: {
    url: string;
  };
  author: string;
  content: {
    heading: string;
    body: {
      text: string;
    }[];
  }[];
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <div>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className={styles.banner}>
        {post.banner.url && (
          <img
            src={post.banner.url}
            alt="banner"
            width={1440}
            height={400}
          />
        )}
      </div>
      <div className={styles.main}>
        <div className={styles.title}>{post.title}</div>
        <div className={styles.posthead}>
          <FiCalendar size="20" />
          <time>{post.updatedAt}</time>
          <FiUser size="20" />
          <span>{post.author}</span>
          <FiClock size="20" />
          <span>{post.time} min</span>
        </div>
        <div className={styles.postbody}>
          {post.content.map(content => (
            <article key={content.heading} className={styles.postText}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'ignews'), { pageSize: 1 }
  );

  const paths = []
  posts.results.map(p => {
    paths.push({ params: { slug: p.uid } })
  })

  return { paths, fallback: true }
};

export const getStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('ignews', params.slug, {});


  const fullText = response.data.content.reduce((prev, curr) => {
    return prev += `${curr.heading} ${curr.body.map(b => b.text)}`;
  }, '')
  const time = Math.ceil(fullText.split(' ').length / 200);

  return {
    props: {
      post: {
        slug: response.uid,
        title: response.data.title,
        author: response.data.author,
        content: response.data.content,
        banner: response.data.banner,
        updatedAt: format(new Date(response.last_publication_date), "dd MMM yyyy", { locale: ptBR, }),
        time
      }
    }
  }
};
