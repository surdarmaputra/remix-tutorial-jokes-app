import type { Joke } from "@prisma/client";
import type { LoaderFunction  } from "remix";
import { json, useLoaderData } from 'remix'

import { db } from "~/utils/db.server";

interface LoaderData {
  joke: Joke;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { jokeId } = params;
  const joke = await db.joke.findUnique({
    where: { id: jokeId },
  });
  return json({ joke });
}

export default function JokeRoute() {
  const { joke } = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>
        {joke.content}
      </p>
    </div>
  );
}