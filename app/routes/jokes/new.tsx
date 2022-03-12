import { ActionFunction, Form, Link, LoaderFunction, useCatch } from "remix";
import { redirect, useActionData, useTransition, json } from 'remix'
import { JokeDisplay } from "~/components/JokeDisplay";

import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

interface FieldErrors {
  name: string | undefined;
  content: string | undefined;
}

interface Values {
  name: string;
  content: string;
}

interface ActionData {
  fieldErrors?: FieldErrors;
  values?: Values;
}

function validateContent(content: FormDataEntryValue | null) {
  if (typeof content !== 'string') {
    return 'You must provide a joke content'
  }
  if (content.length < 10) {
    return 'That joke is too short'
  }
}

function validateName(name: FormDataEntryValue | null) {
  if (typeof name !== 'string') {
    return 'You must provide a name'
  }
  if (name.length < 10) {
    return 'That joke\'s name is too short'
  }
}

function generateBadRequest(data: ActionData) {
  return json(data, { status: 400 })
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request)
  const form = await request.formData()
  const name = form.get('name')
  const content = form.get('content')

  if (
    typeof name !== 'string' ||
    typeof content !== 'string'
  ) {
    return generateBadRequest({
      fieldErrors: {
        name: validateName(name),
        content: validateName(content),
      },
    })
  }

  const fieldErrors: FieldErrors = {
    name: validateName(name),
    content: validateContent(content),
  }

  const values: Values = {
    name,
    content,
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return generateBadRequest({
      fieldErrors,
      values,
    })
  }

  const joke = await db.joke.create({
    data: {
      ...values,
      jokesterId: userId,
    }
  })

  return redirect(`/jokes/${joke.id}`)
}

export const loader: LoaderFunction = async ({
  request,
}) => {
  const userId = await getUserId(request);
  console.log('loader', {userId})
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json({});
};

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}

export default function NewJokeRoute() {
  const { fieldErrors, values } = useActionData<ActionData>() || {}
  const transition = useTransition()

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    const content = transition.submission.formData.get("content");
    if (
      typeof name === "string" &&
      typeof content === "string" &&
      !validateContent(content) &&
      !validateName(name)
    ) {
      return (
        <JokeDisplay
          joke={{ name, content }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name: {' '}
            <input 
              type="text"
              name="name"
              defaultValue={values?.name}
              aria-invalid={
                Boolean(fieldErrors?.name) ||
                undefined
              }
              aria-errormessage={
                fieldErrors?.name
                  ? 'name-error'
                  : undefined
              }
            />
          </label>
          {fieldErrors?.name ? (
            <p
              className="form-validation-error"
              role="alert"
              id="name-error"
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content: {' '}
            <textarea
              name="content" 
              defaultValue={values?.content}
              aria-invalid={
                Boolean(fieldErrors?.content) ||
                undefined
              }
              aria-errormessage={
                fieldErrors?.content
                  ? 'content-error'
                  : undefined
              }
            />
          </label>
          {fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="name-error"
            >
              {fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}