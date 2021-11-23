import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  updatedAt: string | null;
  title: string;
  expect: string;
  author: string;
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(postsPagination.results),
    setNextPage(postsPagination.next_page)
  }, [])

  async function handleLoadPosts() {
    const getPosts = await (await fetch(nextPage)).json()

    const postsPagination = getPosts.results.map(post => (
      {
        slug: post.uid,
        title: post.data.title,
        author: post.data.author,
        expect:
          post.data.content[0].body.find(content => content.type === 'paragraph')
            .text ?? '',
        updatedAt: format(new Date(post.last_publication_date), "dd MMM yyyy", { locale: ptBR, }),
      }));


    setPosts([...posts, ...postsPagination])
    setNextPage(getPosts.next_page || '');

  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.slug} href={`/post/${post.slug}`}>
              <a>
                <strong className={styles.title}>{post.title}</strong>
                <p className={styles.expect}>{post.expect}</p>
                <div className={styles.details}>
                  <div className={styles.updatedAt}>
                    <FiCalendar size="20" />
                    <time>{post.updatedAt}</time>
                  </div>
                  <div className={styles.author}>
                    <FiUser size="20" />
                    <span>{post.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
          {nextPage !== '' && (
            <p className={styles.nextpage} onClick={() => handleLoadPosts()}>Carregar mais posts</p>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'ignews')],
    {
      fetch: ['IgNews.title', 'IgNews.content'],
      pageSize: 1,
    }
  );

  const postsPagination = postsResponse.results.map(post => (
    {
      slug: post.uid,
      title: post.data.title,
      author: post.data.author,
      expect:
        post.data.content[0].body.find(content => content.type === 'paragraph')
          .text ?? '',
      updatedAt: format(new Date(post.last_publication_date), "dd MMM yyyy", { locale: ptBR, }),
    }
  )
  );

  return {
    props: { postsPagination: { results: postsPagination, next_page: postsResponse.next_page || '' } }
  }
};
