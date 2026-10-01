import { Router, type IRouter } from "express";
import {
  AuthError,
  requireAdmin,
  requireAuthenticatedUser,
  resolveLocalUser,
  toSafeUser,
} from "../middlewares/auth";

const router: IRouter = Router();

router.get("/auth/me", async (req, res): Promise<void> => {
  try {
    const user = await resolveLocalUser(req);
    if (user.status !== "ACTIVE") {
      res.status(403).json({
        error: {
          code: "ACCOUNT_DISABLED",
          message: "This account is disabled.",
        },
      });
      return;
    }
    res.json({ user: toSafeUser(user) });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    req.log.error({ err: error }, "Failed to load current user");
    res.status(500).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Authentication could not be completed.",
      },
    });
  }
});

router.get(
  "/admin/access",
  requireAuthenticatedUser,
  requireAdmin,
  (req, res) => {
    res.json({
      allowed: true,
      role: req.dbUser?.role,
    });
  },
);

export default router;