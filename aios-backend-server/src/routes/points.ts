import { RequestHandler, Router } from "express";
import { authenticateJwt } from "../middleware/auth";
import {
  getPointsBalance,
  getPointTransactions,
  recordPointUsage,
  getTokenCounts,
  handleMessage,
} from "../controllers/pointsController";
import { body } from "express-validator";
import { validate } from "../middleware/validation";
import { getModelIds } from "../config/modelConfig";

const router = Router();

// Get user's points balance
router.get("/balance", authenticateJwt, getPointsBalance as RequestHandler);

// Get user's point transactions
router.get(
  "/transactions",
  authenticateJwt,
  getPointTransactions as RequestHandler
);

// Record a point usage transaction
router.post(
  "/usage",
  authenticateJwt,
  validate([
    body("operationType")
      .isString()
      .notEmpty()
      .withMessage("Operation type is required"),
    body("points")
      .isInt({ min: 1 })
      .withMessage("Points must be a positive integer"),
    body("description").optional().isString(),
    body("metadata").optional().isObject(),
  ]),
  recordPointUsage as RequestHandler
);

// Get token counts for a text based on model
router.post(
  "/tokens",
  validate([
    body("text").isString().notEmpty().withMessage("Text is required"),
    body("model")
      .isString()
      .notEmpty()
      .isIn(getModelIds())
      .withMessage("Valid model name is required"),
  ]),
  getTokenCounts as RequestHandler
);

// Handle message and check points
router.post(
  "/handle-message",
  authenticateJwt,
  validate([
    body("text").isString().notEmpty().withMessage("Message text is required"),
    body("model")
      .isString()
      .notEmpty()
      .isIn(getModelIds())
      .withMessage("Valid model name is required"),
  ]),
  handleMessage as RequestHandler
);

export default router;
