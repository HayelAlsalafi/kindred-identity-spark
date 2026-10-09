import express, { type RequestHandler } from "express";

const jsonParser = express.json();
const formParser = express.urlencoded({ extended: true });

/**
 * Progress accepts no body. Leave it unread so authentication runs first and
 * the route can reject even malformed JSON with its contract error/headers.
 * Every existing route retains the original JSON-then-form parsing behavior.
 */
export const parseApiBody: RequestHandler = (req, res, next) => {
  if (req.method === "GET" && /^\/api\/learning\/progress\/?$/i.test(req.path)) {
    next();
    return;
  }
  jsonParser(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    formParser(req, res, next);
  });
};
