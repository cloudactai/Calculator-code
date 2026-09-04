import {
  AUTH_FLAG,
  isSessionExpiry,
  isUnauthorized,
  reportIfSessionExpired,
  resetSessionExpiryNotice,
} from "./sessionExpiry";

const error = (status, config = {}) => ({ response: { status }, config });
const withToken = (config = {}) => ({ ...config, [AUTH_FLAG]: true });

describe("isSessionExpiry", () => {
  it("treats a rejected token as an expired session", () => {
    expect(isSessionExpiry(error(401, withToken({ url: "/form-templates/x/pdf" })))).toBe(true);
  });

  it("ignores a 401 on a request that carried no token", () => {
    // The startup/pre-login case commit e7e6c4f was written to silence: the
    // route guard handles it, and a modal here is noise.
    expect(isSessionExpiry(error(401, { url: "/matters", [AUTH_FLAG]: false }))).toBe(false);
  });

  it("ignores a 401 from the auth endpoints themselves", () => {
    // A bad password is not an expired session.
    expect(isSessionExpiry(error(401, withToken({ url: "/api/login" })))).toBe(false);
    expect(isSessionExpiry(error(401, withToken({ url: "/api/logout" })))).toBe(false);
  });

  it("honours an explicit opt-out", () => {
    expect(isSessionExpiry(error(401, withToken({ url: "/matters", skipUnauthorizedModal: true }))))
      .toBe(false);
  });

  it("ignores statuses that are not 401", () => {
    // A 403 is a permissions problem and a 500 is a server fault; neither is
    // fixed by signing in again.
    expect(isSessionExpiry(error(403, withToken({ url: "/matters" })))).toBe(false);
    expect(isSessionExpiry(error(500, withToken({ url: "/matters" })))).toBe(false);
    expect(isSessionExpiry(error(404, withToken({ url: "/matters" })))).toBe(false);
  });

  it("survives a network error with no response or config", () => {
    expect(isSessionExpiry({ message: "Network Error" })).toBe(false);
    expect(isSessionExpiry(undefined)).toBe(false);
  });
});

describe("reportIfSessionExpired", () => {
  let fired;
  const listener = () => { fired += 1; };

  beforeEach(() => {
    fired = 0;
    resetSessionExpiryNotice();
    window.addEventListener("unauthorized", listener);
  });

  afterEach(() => {
    window.removeEventListener("unauthorized", listener);
  });

  it("announces an expired session once", () => {
    reportIfSessionExpired(error(401, withToken({ url: "/matters" })));
    expect(fired).toBe(1);
  });

  it("announces only once when a page fails many calls at once", () => {
    // Opening a matter fires a dozen requests; an expired token fails them all.
    for (let i = 0; i < 12; i += 1) {
      reportIfSessionExpired(error(401, withToken({ url: `/matters/${i}` })));
    }
    expect(fired).toBe(1);
  });

  it("stays silent for anything that is not an expired session", () => {
    reportIfSessionExpired(error(500, withToken({ url: "/matters" })));
    reportIfSessionExpired(error(401, { url: "/matters", [AUTH_FLAG]: false }));
    expect(fired).toBe(0);
  });
});

describe("isUnauthorized", () => {
  it("lets a caller phrase its own error honestly", () => {
    expect(isUnauthorized(error(401))).toBe(true);
    expect(isUnauthorized(error(500))).toBe(false);
    expect(isUnauthorized({ message: "Network Error" })).toBe(false);
  });
});
