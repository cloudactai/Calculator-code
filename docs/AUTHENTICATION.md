# Sign-in, profile & the authentication process

How a user creates an account, verifies their email, signs in, stays signed in, edits
their profile, and signs out, and what happens on the server at each step. Start here if
you are investigating an unexpected logout, a 401 response, or a sign-in that fails.

> **The model in short.** This is a **personal** auth system: each account is
> its own tenant, the real session is an **httpOnly JWT cookie** set by the
> **auth-server** (Node), and a small **bridge** re-creates the client-readable cookies
> the older UI expects so every existing page keeps working. There is no law firm, no
> Clio/QBO, no Azure login for users — every signed-in user is an **ADMIN of their own
> account** with all pages unlocked.
>
> This replaced the legacy firm/subscriber `/v1` login. See the deploy/topology map in
> [ARCHITECTURE.md](ARCHITECTURE.md) for where each service runs.

---

## Where it lives

**Frontend ([cloudact-ui/](../cloudact-ui/))**

| Piece | File |
| --- | --- |
| Sign-in form | [components/SignUser/SignIn.js](../cloudact-ui/src/components/SignUser/SignIn.js) |
| Create account | [pages/CreateAccount.js](../cloudact-ui/src/pages/CreateAccount.js) |
| Verify email (link landing) | [pages/VerifyEmail.js](../cloudact-ui/src/pages/VerifyEmail.js) |
| Forgot password | [pages/ForgetPassword.js](../cloudact-ui/src/pages/ForgetPassword.js) |
| Reset password | [pages/NewPasswordPage.js](../cloudact-ui/src/pages/NewPasswordPage.js) |
| Profile (view) | [pages/ProfilePage.jsx](../cloudact-ui/src/pages/ProfilePage.jsx) |
| Profile (edit) | [pages/ProfileEdit.jsx](../cloudact-ui/src/pages/ProfileEdit.jsx) |
| Logout | [pages/Logout.js](../cloudact-ui/src/pages/Logout.js) + [actions/userActions.js](../cloudact-ui/src/actions/userActions.js) |
| Auth API client | [utils/Apis/auth/authApi.js](../cloudact-ui/src/utils/Apis/auth/authApi.js) |
| URL resolver | [lib/apiUrls.js](../cloudact-ui/src/lib/apiUrls.js) |
| **Session bridge** | [utils/personalAuthSession.js](../cloudact-ui/src/utils/personalAuthSession.js) |
| Token reader (for API calls) | [utils/authToken.js](../cloudact-ui/src/utils/authToken.js) |
| Profile media (avatar/signature) | [utils/profileMedia.js](../cloudact-ui/src/utils/profileMedia.js) |

**Backend ([auth-server/](../auth-server/))**

| Piece | File |
| --- | --- |
| Auth routes (`/api/*`) | [src/routes/authRoutes.js](../auth-server/src/routes/authRoutes.js) |
| JWT middleware | [src/middleware/authMiddleware.js](../auth-server/src/middleware/authMiddleware.js) |
| Rate limiter | [src/middleware/rateLimiter.js](../auth-server/src/middleware/rateLimiter.js) |
| CORS + mount order | [server.js](../auth-server/server.js) |
| Email sender (Graph) | [src/services/apiEmail.js](../auth-server/src/services/apiEmail.js) |
| User schema | [prisma/schema.prisma](../auth-server/prisma/) |

---

## The two-cookie model (and why it matters)

There are **two** kinds of cookie, and confusing them is the cause of most auth bugs:

1. **The real session — httpOnly, set by the auth-server.** On login/verify the server
   issues JWTs and sets them as httpOnly cookies: `auth_token`, `AccessToken`
   (24h), and `RefreshToken` (30d). JavaScript **cannot read or delete these** — only
   the server can, via `Set-Cookie`. These are what actually authenticate `/api/*` and
   `/v1/*` requests.

2. **The legacy client cookies — readable, set by the frontend "bridge."** The existing
   UI (menus, guards, headers, the Redux initial state) reads login state from
   encrypted **client-side** cookies the old backend used to set: `allUserInfo`,
   `currentUserRole`, `access_pages`, `companyInfo`, `userProfile`, `province`, plus a
   readable `AccessToken`. After a successful login the bridge in
   [personalAuthSession.js](../cloudact-ui/src/utils/personalAuthSession.js) rebuilds
   these from the auth-server's `user` payload so nothing downstream has to change.

`establishSession(user, accessToken)` performs the whole bridge in one place:

```
clearClientSessionCookies()          // clear any stale legacy cookies
userInfo = buildLegacyUserInfo(user) // map {id,email,name,…} → legacy shape
seedSessionCookies(userInfo, token)  // write allUserInfo / currentUserRole / access_pages / …
```

Key transforms it does:

- **`id`, `uid`, and `sid` are all set to the auth-server user id** — a personal account
  is its own tenant, so `id === sid`. `isPersonalAuthUser()` keys off exactly that.
- **`role: [{ …, role: "ADMIN" }]`** and **`access_pages = ALL_ACCESS`** — every
  `auth_*` page flag is `true`, so [Routes.jsx](../cloudact-ui/src/routes/Routes.jsx)
  lets the user into everything.
- **Clio/QBO are marked "connected"** (`authClio`/`authIntuit = true`) so nothing
  redirects the user into the legacy firm setup wizard.
- **Avatar and signature (base64) are kept OUT of cookies.** They would exceed the 4KB
  cookie limit and cause the whole session to be dropped without any error. They are
  stored in `localStorage` via
  [profileMedia.js](../cloudact-ui/src/utils/profileMedia.js); only small, image-free
  objects go into cookies.

---

## Sign in

Form: [SignIn.js](../cloudact-ui/src/components/SignUser/SignIn.js) · route `/signIn`.

1. User submits email + password. `submitLogin()` dispatches `USER_LOGIN_REQUEST` and
   calls `login({ email, password })` → `POST /api/login` (via
   [authApi.js](../cloudact-ui/src/utils/Apis/auth/authApi.js), which sends
   `credentials: "include"` so the browser stores the returned cookies cross-domain).
2. **Server** ([authRoutes.js](../auth-server/src/routes/authRoutes.js) `POST /login`):
   - looks up the user, `bcrypt.compare`s the password;
   - **wrong credentials → 401** and a failure is recorded (see rate-limiting);
   - **unverified account → 403** with "Please verify your email…";
   - success → mints a 24h access JWT + 30d refresh JWT, sets the httpOnly cookies, and
     returns `{ ok, user, accessToken }`.
3. **Frontend on `ok`:** `establishSession(data.user, data.accessToken)` seeds the
   legacy cookies, then dispatches `USER_CHANGE_SUCCESS` + `USER_LOGIN_SUCCESS`. A
   `useEffect` watching `userInfo` redirects: SUPERADMIN → the superadmin dashboard,
   everyone else → `/`.
4. **On 403** the user is routed to `/verify-email` (with their email in state) so they
   can resend the link. On other failures the form shows the error and swaps the side
   image to the "invalid username or password" graphic.

**Remember me** persists **only the email** in `localStorage` and pre-fills it next
time; the password is never stored. (It used to store the password too — that was
removed, and SignIn purges any stale `password` key on mount. "Stay signed in" longer
than 24h is a future refresh-token task, not stored credentials.)

> **Unused OTP modal:** SignIn.js still contains a 4-digit OTP modal wired to
> `userLoginAuth`/`userOPTMatch`. The personal-auth login never populates
> `userLoginAuth`, so **the modal never opens**. It is leftover UI from the old SMS
> two-factor flow and is not part of the current process.

---

## Create account (sign up)

Form: [CreateAccount.js](../cloudact-ui/src/pages/CreateAccount.js) · route
`/createAccount` → `signup({ name, email, password })` → `POST /api/signup`.

**Server** (`POST /signup`):

- validates email format and an 8-char minimum password;
- **already-verified email → 409** "sign in instead";
- **existing but unverified email → reuses that row** (refreshes the password and token
  and re-sends the email) rather than rejecting the request; this covers the case where
  the first email never arrived;
- hashes the password with `bcrypt` (cost 12), stores a **hashed** verification token
  with a 24h expiry, and emails a link `${FRONTEND_URL}/verify-email?token=…` via
  Microsoft Graph;
- if the email **fails to send**, a brand-new row is rolled back (an account that can
  never be verified is worse than none);
- responds `201`/`200` with a "check your email" message.

If `EMAIL_VERIFICATION_REQUIRED=false` (local dev), new accounts are created
pre-verified and no email is sent.

---

## Verify email (and auto-login)

Landing page: [VerifyEmail.js](../cloudact-ui/src/pages/VerifyEmail.js) · route
`/verify-email?token=…`.

- With a `token` in the URL it calls `verifyEmail(token)` → `POST /api/verify-email`.
- **Server** hashes the token, finds the matching **unexpired** user, sets
  `emailVerifiedAt`, clears the token, **and logs them in** (sets the same session
  cookies as login), so verifying takes the user straight into the app.
- **Frontend** runs `establishSession(...)` on success and `history.replace("/")`.
- Without a token the page shows a "check your email" state with a **resend** form
  (`resendVerification(email)` → `POST /api/resend-verification`).

Both signup and resend responses are deliberately **generic** ("if that email
exists…") so the endpoint cannot be used to find out which emails are registered.

---

## Forgot / reset password

- **Forgot:** [ForgetPassword.js](../cloudact-ui/src/pages/ForgetPassword.js) →
  `forgotPassword(email)` → `POST /api/forgot-password`. The server always returns the
  same generic message (no user enumeration); if the email exists **and is verified** it
  stores a hashed reset token (1h expiry) and emails
  `${FRONTEND_URL}/reset-password?token=…`.
- **Reset:** [NewPasswordPage.js](../cloudact-ui/src/pages/NewPasswordPage.js) →
  `resetPassword({ token, password })` → `POST /api/reset-password`. Validates the
  unexpired token, hashes and stores the new password, and clears the token. The user
  then signs in normally.

---

## How a request proves that it is authenticated

Every data/API call carries auth **two ways**, and the middleware accepts either:

- **Cookie:** the httpOnly `auth_token`/`AccessToken` is sent automatically because
  the frontend uses `withCredentials: true` (axios,
  [utils/axios.js](../cloudact-ui/src/utils/axios.js)) / `credentials: "include"`
  (fetch).
- **Bearer header:** the axios instance also reads a token via
  [authToken.js](../cloudact-ui/src/utils/authToken.js) (`getAuthToken()` — the readable
  `AccessToken` cookie, or the token embedded in `allUserInfo`) and sets
  `Authorization: Bearer <jwt>`.

**Server** [authMiddleware.js](../auth-server/src/middleware/authMiddleware.js) checks
the `Authorization: Bearer` header **first**, then falls back to parsing the cookie
by hand (no cookie-parser dependency). It `jwt.verify`s against `JWT_SECRET` and sets
`req.user = { id }`. Anything invalid/expired → **401**.

**Session lifetime:** the access token is valid **24h**; there's a 30-day refresh
cookie but **no refresh endpoint is wired up**, so in practice a session lasts until the
24h access token expires or the cookie is cleared — after which the user re-logs in. A
401 from `authMiddleware` means "token missing/expired/invalid" (a *session* problem),
which is different from a 500 (a *database* problem — see ARCHITECTURE.md).

### Cross-domain cookies — the config that makes it work

The frontend (Vercel) and auth-server (Render) are different origins, so the session
cookie is cross-domain. All three of the following must be true, or the browser drops
the cookie without reporting an error:

1. **Server:** `NODE_ENV=production` → cookies set `Secure` + `SameSite=None`
   (`buildCookieOptions` in authRoutes.js). Locally (http) it uses `SameSite=Lax`.
2. **Server CORS:** `credentials: true` with the origin reflected from `FRONTEND_URL`
   ([server.js](../auth-server/server.js)).
3. **Client:** every auth call sends `credentials: "include"` / `withCredentials`.

If a login appears to succeed but the user is not signed in on the next page, these three
settings are almost always the cause — usually `NODE_ENV` not being set to `production`.

---

## Profile

**View — [ProfilePage.jsx](../cloudact-ui/src/pages/ProfilePage.jsx)** (route
`/profile`): a simple card showing `getAllUserInfo().username` / province from the
client cookies, with an **Edit Profile** link.

**Edit — [ProfileEdit.jsx](../cloudact-ui/src/pages/ProfileEdit.jsx)** (route
`/profile/edit`): the real profile management screen. It:

- **Saves profile fields** via `updateProfile(body)` → `PUT /api/profile`. The server
  does a **partial update**: it only writes the columns the request actually contains, so
  a photo-only save (`{ profilePic }`) does not clear the name, phone, or other fields.
- **After each save, mirrors the change into the client cookies** with
  `updatePersonalSessionProfile(profile)` so the UI (header name, address panel) updates
  without needing a fresh login.
- **Avatar & signature** are validated server-side (must be a `data:image/*;base64,`
  under ~1.5MB) and, on the client, stored in `localStorage` (via profileMedia.js), not
  cookies.
- **Change password** via `changePassword({ currentPassword, newPassword,
  confirmPassword })` → `POST /api/profile/password`. The server verifies the current
  password, updates the hash, and **clears the auth cookies** — so changing the password
  logs you out of the current session by design.

The public user object the server returns (`publicUser()`) deliberately **never includes
`passwordHash`** or raw tokens.

---

## Logout

[Logout.js](../cloudact-ui/src/pages/Logout.js) (route `/logout`) dispatches
`userLogoutAction()` ([userActions.js](../cloudact-ui/src/actions/userActions.js)),
which:

1. calls `logout()` from authApi.js → **`POST /api/logout`** (with
   `credentials: "include"`) so the server clears its **httpOnly** session cookies —
   the only cookies JavaScript cannot touch. This is wrapped in try/catch so a failure
   never blocks sign-out.
2. calls `clearClientSessionCookies()` to wipe every readable client cookie
   (`allUserInfo`, `currentUserRole`, `access_pages`, `AccessToken`, `RefreshToken`, …)
   **and** the localStorage avatar/signature media, plus the extra legacy calculator
   cookies (`checklistId`, `calculatorLabel`, `DiagnoseConnection`);
3. resets Redux auth state and redirects to `/signIn` — unconditionally, so the user is
   always logged out even if the network call failed.

> This previously posted to the data client's `/v1/logout` (which does not exist) and
> only redirected on a `status === 'success'` response that never arrived, so the
> httpOnly server session was never revoked. It now calls `/api/logout` and always
> clears the session and redirects.

---

## Backend endpoint reference

All under `/api` on the auth-server, rate-limited to 60 requests / 15 min per IP.

| Method | Path | Auth? | Purpose |
| --- | --- | --- | --- |
| POST | `/api/signup` | — | Create account (unverified) + send verify email |
| POST | `/api/login` | — | Email+password → session cookies + `accessToken` |
| POST | `/api/verify-email` | — | Token → verified **and auto-logged-in** |
| POST | `/api/resend-verification` | — | Re-send the verify link (generic response) |
| POST | `/api/forgot-password` | — | Send reset link (generic response) |
| POST | `/api/reset-password` | — | Token + new password → update |
| GET | `/api/me` | ✅ | Current user |
| GET | `/api/profile` | ✅ | Full profile |
| PUT | `/api/profile` | ✅ | Partial profile update (name/avatar/address/…) |
| POST | `/api/profile/password` | ✅ | Change password (then clears cookies) |
| POST | `/api/logout` | — | Clear session cookies |

---

## Security measures already in place

- **Passwords:** `bcrypt` hashed at cost 12; never returned to the client.
- **Tokens at rest:** email-verification and password-reset tokens are stored **hashed**
  (SHA-256), with expiries (24h verify / 1h reset). The raw token only ever lives in the
  emailed link.
- **Rate limiting:** 60 auth requests / 15 min per IP, **plus** a per-`(IP,email)`
  counter that blocks after **5 failed logins / 15 min** (429).
- **No user enumeration:** signup/forgot/resend all return generic messages.
- **Verification enforced on login** regardless of the `EMAIL_VERIFICATION_REQUIRED`
  flag — an account can never sign in while `emailVerifiedAt` is null.
- **Security headers** (`X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, HSTS on https) set in server.js.

---

## Common pitfalls

- **`NODE_ENV=production` is mandatory in production**, or the cross-domain cookie is
  dropped and logins do not persist. This is the most common cause of "it signs in, then
  forgets me".
- **401 is not 500.** A 401 is a session or token problem (expired JWT, missing cookie,
  mismatched `JWT_SECRET`). A 500 on `/v1/*` is a database problem — see
  [ARCHITECTURE.md](ARCHITECTURE.md).
- **Rotating `JWT_SECRET` signs everyone out**, because all existing tokens then fail
  verification.
- **Changing a password signs that user out**: the server clears the cookies on success.
- **"Remember me" stores the email only.** The password is no longer saved. A session
  lasting longer than the 24-hour access token still requires the refresh-token flow,
  which has not been built.
- **The OTP modal in SignIn.js is unused code** and never opens under personal auth.
- **Avatar and signature are never stored in cookies.** They are in localStorage, so if
  a user's photo disappears while their session is fine, check profileMedia and
  localStorage rather than the cookies.
- **There is no token refresh flow.** A 30-day refresh cookie is set but not used, so
  sessions end when the 24-hour access token expires.

See also: [ARCHITECTURE.md](ARCHITECTURE.md) (hosting, env vars, DB),
[AUTH_HANDOFF/](AUTH_HANDOFF/) (original wiring notes), [MATTERS.md](MATTERS.md),
[FORMS.md](FORMS.md).
