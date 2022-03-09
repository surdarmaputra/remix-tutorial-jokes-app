import { ActionFunction, LinksFunction, useActionData } from "remix";
import { json, Link, useSearchParams } from "remix";
import { db } from "~/utils/db.server";
import { createUserSession, login, register } from "~/utils/session.server";

import stylesUrl from "../styles/login.css";

interface FieldErrors {
  username?: string | undefined;
  password?: string | undefined;
}

interface Values {
  username?: string;
  password?: string;
  loginType?: string;
}

interface ActionData {
  fieldErrors?: FieldErrors;
  formError?: string;
  values?: Values;
}

function validateUsername(username: FormDataEntryValue | null) {
  if (typeof username !== 'string') {
    return 'You must provide a username'
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters'
  }
}

function validatePassword(password: FormDataEntryValue | null) {
  if (typeof password !== 'string') {
    return 'You must provide a password'
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
}

function generateBadRequest(data: ActionData) {
  return json(data, { status: 400 })
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const loginType = formData.get('loginType')
  const username = formData.get('username')
  const password = formData.get('password')
  const redirectTo = formData.get("redirectTo") || "/jokes";

  if (
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return generateBadRequest({
      fieldErrors: {
        username: validateUsername(username),
        password: validatePassword(password),
      },
    })
  }

  if (
    typeof loginType !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return generateBadRequest({
      formError: 'Form not submitted correctly'
    })
  }

  const fieldErrors: FieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  }

  const values: Values = {
    username,
    password,
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return generateBadRequest({
      fieldErrors,
      values,
    })
  }

  switch (loginType) {
    case 'login': {
      const user = await login({
        username,
        password,
      })

      if (!user) {
        return generateBadRequest({
          values,
          formError: 'Username/password combinatino is incorrect'
        })  
      }

      return createUserSession(user.id, redirectTo)
    }
    case 'register': {
      const existingUser = await db.user.findFirst({
        where: { username }
      })

      if (existingUser) {
        return generateBadRequest({
          values,
          fieldErrors: {
            username: `Username ${username} is already taken`
          }
        })
      }

      const user = await register({
        username,
        password,
      })

      if (!user) {
        return generateBadRequest({
          values,
          formError: 'Something went wrong when creating a new user'
        })
      }
      
      return createUserSession(user.id, redirectTo)
    }
    default: {
      return generateBadRequest({
        values,
        formError: 'Login type invalid'
      })
    }
  }
}

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export default function Login() {
  const { fieldErrors, formError, values } = useActionData<ActionData>() || {}
  const [searchParams] = useSearchParams();

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={
              searchParams.get("redirectTo") ?? undefined
            }
          />
          <fieldset>
            <legend className="sr-only">
              Login or Register?
            </legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !values?.loginType ||
                  values.loginType === 'login'
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={values?.loginType === 'register'}
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={values?.username}
              aria-invalid={
                Boolean(fieldErrors?.username) ||
                undefined
              }
              aria-errormessage={
                fieldErrors?.username
                  ? 'username-error'
                  : undefined
              }
            />
            {fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="name-error"
              >
                {fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={values?.password}
              aria-invalid={
                Boolean(fieldErrors?.password) ||
                undefined
              }
              aria-errormessage={
                fieldErrors?.password
                  ? 'password-error'
                  : undefined
              }
            />
            {fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="name-error"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {formError ? (
              <p
                className="form-validation-error"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}