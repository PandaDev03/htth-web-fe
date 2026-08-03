export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const apiOrigin = new URL(env.API_ORIGIN || "https://api.haitacvuive.xyz");
      const upstreamUrl = new URL(request.url);
      upstreamUrl.protocol = apiOrigin.protocol;
      upstreamUrl.hostname = apiOrigin.hostname;
      upstreamUrl.port = apiOrigin.port;

      const headers = new Headers(request.headers);
      headers.set("X-Forwarded-Host", url.host);
      headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

      const init = {
        method: request.method,
        headers,
        redirect: "manual",
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
      }

      return fetch(upstreamUrl, init);
    }

    return env.ASSETS.fetch(request);
  },
};
