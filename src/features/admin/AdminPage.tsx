import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminSessionResponse = {
  authenticated: boolean;
  adminPath?: string;
};

type AdminHealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error";
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed with ${response.status}`);
  }

  return payload;
}

export function AdminPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState<AdminHealthResponse | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadSession() {
      setIsCheckingSession(true);
      const response = await fetch("/api/admin/session", {
        credentials: "include",
      });
      const payload = await readJson<AdminSessionResponse>(response);

      if (isCurrent) {
        setIsAuthenticated(payload.authenticated);
        setIsCheckingSession(false);
      }
    }

    loadSession().catch((error) => {
      if (isCurrent) {
        setMessage(getErrorMessage(error));
        setIsCheckingSession(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const payload = await readJson<AdminSessionResponse>(response);

      setIsAuthenticated(payload.authenticated);
      setToken("");
      setMessage(payload.authenticated ? "Admin session active." : "");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleLogout() {
    setMessage("");
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "include",
    });
    setHealth(null);
    setIsAuthenticated(false);
  }

  async function checkAdminApi() {
    setMessage("");

    try {
      const response = await fetch("/api/admin/health", {
        credentials: "include",
      });
      setHealth(await readJson<AdminHealthResponse>(response));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">PearlDeals</p>
            <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
          </div>
          {isAuthenticated ? (
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          ) : null}
        </header>

        {isCheckingSession ? (
          <section className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Checking admin session.</p>
          </section>
        ) : isAuthenticated ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-foreground" aria-hidden="true" />
                <div className="space-y-1">
                  <h2 className="text-lg font-medium">Session active</h2>
                  <p className="text-sm text-muted-foreground">
                    Phase 1 access controls are ready.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Button type="button" onClick={checkAdminApi}>
                  <ShieldCheck aria-hidden="true" />
                  Check admin API
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-muted/40 p-5">
              <h2 className="text-sm font-medium">Protected API</h2>
              {health ? (
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">{health.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Service</dt>
                    <dd className="font-medium">{health.service}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Checked</dt>
                    <dd className="font-medium">
                      {new Date(health.timestamp).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No check has run yet.
                </p>
              )}
            </aside>
          </section>
        ) : (
          <section className="max-w-md rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-5 text-foreground" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-medium">Admin sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the admin token to continue.
                </p>
              </div>
            </div>
            <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
              <label className="grid gap-1.5 text-sm font-medium">
                Admin token
                <Input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <Button type="submit">
                <LockKeyhole aria-hidden="true" />
                Sign in
              </Button>
            </form>
          </section>
        )}

        {message ? (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
