import { get } from '@utility/request';
import type { NextApiRequest, NextApiResponse } from 'next';
import {} from 'next-auth/client';
import { getToken } from 'next-auth/jwt';
const secret = process.env.SECRET;

type YoutubeList = {
  nextPageToken?: string;
  items: Array<any>;
};

export type YoutubeModel = {
  id: string;
  title: string;
  description: string;
  resourceId: {
    channelId: string;
    kind: string;
  };
  thumbnails: {
    default: {
      url: string;
    };
    medium: {
      url: string;
    };
    high: {
      url: string;
    };
  };
};

async function fetchYoutubeData(accessToken: string, pageToken = '') {
  const { data } = await get<YoutubeList>(
    `https://youtube.googleapis.com/youtube/v3/subscriptions?mine=true&pageToken=${pageToken}&maxResults=50&part=snippet`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (data?.nextPageToken) {
    return data.items.concat(
      await fetchYoutubeData(accessToken, data.nextPageToken)
    );
  }

  return data.items;
}

function mapYoutubeChannel(data: any[]): YoutubeModel[] {
  return data.map((dt: any) => ({
    id: dt.id,
    title: dt.snippet.title,
    description: dt.snippet.description,
    resourceId: { ...dt.snippet.resourceId },
    thumbnails: { ...dt.snippet.thumbnails },
  }));
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<YoutubeModel[] | { error: string }>
) => {
  if (req.method.toLocaleLowerCase() !== 'post') {
    return res.status(404).json({ error: 'Not found !' });
  }

  const token = (await getToken({
    req,
    secret,
    encryption: true,
  })) as { accessToken: string };

  if (!token) {
    return res.status(400).json({ error: 'Token not found !' });
  }

  try {
    const result = await fetchYoutubeData(token.accessToken);
    res.status(200).json(mapYoutubeChannel(result));
  } catch (e) {
    res.status(e.status).json(e.data);
  }
};
