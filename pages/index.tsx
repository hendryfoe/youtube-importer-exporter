import { YoutubeModel } from '@api/youtube/export-subscriptions';
import { useToast } from '@components/toast';
import { Storage } from '@utility/storage';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { Session } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/client';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface HomeProps {
  session: Session;
}

export default function Home({ session }: HomeProps) {
  const [isRefresh, setRefresh] = useState<boolean>(false);
  const [youtubes, setYoutube] = useState<YoutubeModel[]>([]);
  const [file, setFile] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const storage = Storage();

    if (session) {
      const { email: storageKey } = session.user;
      const youtubeData = storage.get(storageKey);

      if (isRefresh) {
        storage.remove(storageKey);
      }

      if (youtubeData == null || isRefresh) {
        const fetchYoutube = async () => {
          const response = await fetch('/api/youtube/export-subscriptions', {
            method: 'POST',
          });
          const data = await response.json();

          if (!response.ok) {
            // throw result;
            return;
          }

          storage.set(storageKey, JSON.stringify(data));
          setYoutube(data);
          setRefresh(false);

          console.log(data);
        };

        fetchYoutube();
      } else {
        setYoutube(JSON.parse(youtubeData));
      }
    }
  }, [session, isRefresh]);

  function onExportData() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(youtubes)], { type: 'application/json' })
    );
    a.download = 'youtube-list.json';
    a.click();
  }

  async function onImportData() {
    await fetch('/api/youtube/import-subscriptions');
    if (!file) {
      console.log('file not found');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/youtube/import-subscriptions', {
      method: 'POST',
      body: formData,
    });
    console.log('response => ', response);
  }

  return (
    <>
      <main className="h-screen lg:w-1/2 md:w-3/4 mx-auto py-4">
        {!session && (
          <div className="flex items-center justify-between bg-gray-200 p-3 rounded">
            <div className="flex-initial">Silahkan login terlebih dahulu</div>
            <div className="flex-initial">
              <button
                className="btn btn-primary"
                onClick={() => signIn('google')}
              >
                Login
              </button>
            </div>
          </div>
        )}
        {session && (
          <>
            <section className="flex items-center justify-between bg-gray-200 p-3 rounded">
              <div className="flex-initial">
                Login sebagai: {session.user.email}
              </div>
              <div className="flex-initial">
                <button className="btn btn-primary" onClick={() => signOut()}>
                  Keluar
                </button>
              </div>
            </section>
            <section className="flex flex-col space-y-2 bg-gray-200 p-3 rounded my-5">
              <div className="flex space-x-4 items-center">
                <span>Total Subscription: {youtubes.length}</span>
                <button
                  className="btn btn-primary"
                  onClick={() => setRefresh(true)}
                >
                  Refresh Data
                </button>
              </div>
              <hr className="border-gray-400" />
              <div className="flex justify-between items-center">
                <div className="flex-initial">
                  <button
                    className="btn btn-primary"
                    onClick={() => onExportData()}
                  >
                    Export
                  </button>
                </div>
                <div className="flex-auto text-center">-</div>
                <div className="flex-initial">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => onImportData()}
                  >
                    Import
                  </button>
                </div>
              </div>
            </section>
            <section className="overflow-auto h-3/4 border rounded border-gray-300">
              {youtubes.map((dt: YoutubeModel) => {
                return (
                  <div
                    className="flex space-x-5 items-center border-b border-gray-300 px-1.5 py-2.5"
                    key={dt.id}
                  >
                    <div className="flex-initial">
                      <Image
                        className="w-full rounded"
                        src={dt.thumbnails.default.url}
                        alt={`image-${dt.id}`}
                        width={88}
                        height={88}
                      />
                    </div>
                    <div className="flex-initial">
                      <a
                        href={`https://www.youtube.com/channel/${dt.resourceId.channelId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline hover:text-blue-600"
                      >
                        {dt.title}
                      </a>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<HomeProps>> {
  return {
    props: {
      session: await getSession(context),
    },
  };
}
