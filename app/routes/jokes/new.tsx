import type { ActionFunction } from "remix";
import { redirect, useActionData, json } from 'remix'

import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

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

export default function NewJokeRoute() {
  const { fieldErrors, values } = useActionData<ActionData>() || {}

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <form method="post">
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
      </form>
    </div>
  );
}