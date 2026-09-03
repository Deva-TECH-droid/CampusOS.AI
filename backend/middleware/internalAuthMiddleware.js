import ApiError from "../utils/apiError.js";

// Guards /api/internal/* — routes that n8n's tool nodes call, never the
// frontend. This is NOT a replacement for authMiddleware: it doesn't know
// who a "user" is, it only verifies the caller is our own n8n instance
// (via a shared secret both sides hold in their .env).
//
// The actual user identity was already verified once, upstream, by
// authMiddleware on the outward /api/chatbot/message route — this
// middleware just checks that the userContext being relayed here has the
// expected shape, so a tool can't be called with a missing/malformed id.
const internalAuthMiddleware = (req, res, next) => {
  const providedSecret = req.headers["x-internal-secret"];

  if (!process.env.INTERNAL_CHATBOT_SECRET) {
    // Fail closed: if the secret isn't configured, nothing should be able
    // to authenticate against this route, ever.
    throw new ApiError(500, "Internal chatbot secret is not configured.");
  }

  if (!providedSecret || providedSecret !== process.env.INTERNAL_CHATBOT_SECRET) {
    throw new ApiError(401, "Invalid or missing internal secret.");
  }

  const { userContext } = req.body;
  if (!userContext || !userContext.userId || !userContext.role) {
    throw new ApiError(400, "userContext with userId and role is required.");
  }

  req.chatUser = userContext;
  next();
};

export default internalAuthMiddleware;