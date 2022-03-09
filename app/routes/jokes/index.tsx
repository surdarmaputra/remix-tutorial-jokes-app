import type { Joke } from "@prisma/client";
import type { LoaderFunction } from "remix";
import { json, useLoaderData, Link } from 'remix'

import { db } from "~/utils/db.server";

interface LoaderData {
  randomJoke: Joke;
}

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });
  const data: LoaderData = { randomJoke };
  return json(data);
}

export default function JokesIndexRoute() {
  const { randomJoke } = useLoaderData<LoaderData>()

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>
        {randomJoke.content}
      </p>
      <Link to={randomJoke.id}>
        "{randomJoke.name}" Permalink
      </Link>
    </div>
  );
}