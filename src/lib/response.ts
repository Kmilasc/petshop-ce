export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function apiHandler(
  fn: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      if (message === "Unauthorized" || message === "Invalid token") {
        return error(message, 401);
      }
      if (message === "Forbidden") {
        return error(message, 403);
      }
      console.error(err);
      return error(message, 500);
    }
  };
}
