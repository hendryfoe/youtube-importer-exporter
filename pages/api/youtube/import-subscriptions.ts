import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { getSession } from 'next-auth/client';
import { getToken } from 'next-auth/jwt';
import { YoutubeModel } from './export-subscriptions';
import { IResponse, post } from '@utility/request';

const secret = process.env.SECRET;

interface YoutubePayload {
  snippet: {
    resourceId: {
      channelId: string;
    };
  };
}

interface YoutubeImportResponse {
  errors: {
    channelId: string;
    title: string;
  }[];
  successes: {
    channelId: string;
    title: string;
  }[];
}

// https://gist.github.com/agmm/da47a027f3d73870020a5102388dd820
// https://muffinman.io/blog/uploading-files-using-fetch-multipart-form-data/
// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

function mapYoutubePayload(data: YoutubeModel[]): YoutubePayload[] {
  return data.map((dt) => ({
    snippet: {
      resourceId: {
        channelId: dt.resourceId.channelId,
      },
    },
  }));
}

async function importYoutubeData(
  accessToken: string,
  payload: YoutubePayload[]
): Promise<PromiseSettledResult<IResponse<unknown>>[]> {
  const promises = payload.map(async (data: YoutubePayload) => {
    return await post(
      `https://youtube.googleapis.com/youtube/v3/subscriptions?part=snippet`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  });

  return Promise.allSettled(promises);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method.toLocaleLowerCase() !== 'post') {
    return res.status(404).json({ error: 'Not Found' });
  }

  const token = (await getToken({
    req,
    secret,
    encryption: true,
  })) as { accessToken: string };

  if (!token) {
    return res.status(400).json({ error: 'Token not found !' });
  }

  // parse form with a Promise wrapper
  const data = (await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  })) as any;

  // console.log('data => ', data);

  if (!data?.files?.file) {
    return res.status(400).json({ error: 'File salah !' });
  }

  // read file from the temporary path
  const contents = await fs.readFile(data?.files?.file?.path, {
    encoding: 'utf8',
  });

  try {
    const result: YoutubeImportResponse = {
      errors: [],
      successes: [],
    };
    let contentsData = JSON.parse(contents);
    const payload = mapYoutubePayload(contentsData);
    // console.log(payload);
    const responses = await importYoutubeData(token.accessToken, payload);

    responses.forEach(
      (response: PromiseSettledResult<IResponse<unknown>>, index: number) => {
        if (response.status === 'fulfilled') {
          result.successes.push({
            channelId: contentsData[index].resourceId.channelId,
            title: contentsData[index].title,
          });
        } else {
          result.errors.push({
            channelId: contentsData[index].resourceId.channelId,
            title: contentsData[index].title,
          });
        }
      }
    );

    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ error: 'Mohon tidak mengubah isi file yang sudah di Export !' });
  }
};
