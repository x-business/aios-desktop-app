import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { supabase } from "../config/database";
import { TransactionType, OperationType } from "../models/PointTransaction";
import { encode as gptEncode } from "gpt-tokenizer";
import { countTokens } from "@anthropic-ai/tokenizer";
import logger from "../utils/logger";
import { Request } from "express";
import { getModelConfig, ModelConfig } from "../config/modelConfig";

// Get user's points balance
export const getPointsBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("pointsBalance")
      .eq("id", req.user?.id || "")
      .single();

    if (error) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ pointsBalance: user.pointsBalance || 0 });
  } catch (error) {
    next(error);
  }
};

// Get user's point transactions
export const getPointTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Get paginated transactions
    const {
      data: transactions,
      error,
      count,
    } = await supabase
      .from("point_transactions")
      .select("*", { count: "exact" })
      .eq("userId", req.user?.id || "")
      .order("createdAt", { ascending: false })
      .range(start, end);

    if (error) throw error;

    res.status(200).json({
      transactions,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Record a point usage transaction
export const recordPointUsage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { operationType, points, description, metadata } = req.body;

    if (!operationType || !points) {
      res
        .status(400)
        .json({ message: "Operation type and points are required" });
      return;
    }

    // Get user's current points balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("pointsBalance")
      .eq("id", req.user?.id || "")
      .single();

    if (userError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user has enough points
    if ((user.pointsBalance || 0) < points) {
      res.status(400).json({ message: "Insufficient points balance" });
      return;
    }

    // // Start a Supabase transaction using rpc
    // const { data: result, error: transactionError } = await supabase.rpc<{
    //   new_balance: number;
    // }>(
    //   'record_point_usage',
    //   {
    //     p_user_id: req.user?.id || '',
    //     p_points: points,
    //     p_operation_type: operationType,
    //     p_description: description,
    //     p_metadata: metadata
    //   }
    // );

    // if (transactionError) throw transactionError;

    // res.status(200).json({
    //   newBalance: result?.new_balance,
    // });
  } catch (error) {
    next(error);
  }
};

// Get token counts for text based on model
export const getTokenCounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, model } = req.body;

    if (!text || !model) {
      res.status(400).json({ message: "Text and model are required" });
      return;
    }

    const modelConfig: ModelConfig | undefined = getModelConfig(model);
    if (!modelConfig) {
      res.status(400).json({ message: "Unsupported model" });
      return;
    }

    let tokenCount: number;
    let tokenizerUsed: string;

    // Calculate tokens based on tokenizer type
    switch (modelConfig.tokenizerType) {
      case "gpt":
        tokenCount = gptEncode(text).length;
        tokenizerUsed = "gpt-tokenizer";
        break;
      case "claude":
        tokenCount = countTokens(text);
        tokenizerUsed = "claude-tokenizer";
        break;
      case "character":
        tokenCount = Math.ceil(text.length / 4);
        tokenizerUsed = "character-based";
        break;
      default:
        res.status(400).json({ message: "Unsupported tokenizer type" });
        return;
    }

    const estimatedPoints = Math.ceil(
      (tokenCount * modelConfig.costPerThousandTokens) / 1000
    );

    logger.debug("Token count calculation:", {
      model: modelConfig.id,
      modelName: modelConfig.name,
      provider: modelConfig.provider,
      tokenCount,
      tokenizerUsed,
      estimatedPoints,
      costPerThousandTokens: modelConfig.costPerThousandTokens,
    });

    res.status(200).json({
      text,
      model: modelConfig.id,
      modelName: modelConfig.name,
      provider: modelConfig.provider,
      family: modelConfig.family,
      tokenCount,
      tokenizerUsed,
      estimatedPoints,
      metadata: {
        costPerThousandTokens: modelConfig.costPerThousandTokens,
        calculatedAt: new Date().toISOString(),
        pricing: {
          inputTokens: modelConfig.costPerThousandTokens,
          outputTokens: modelConfig.costPerThousandTokens * 1.5,
          unit: "per 1K tokens",
        },
        description: modelConfig.description,
      },
    });
  } catch (error) {
    logger.error("Token count error:", error);
    next(error);
  }
};

// Handle message and check points
export const handleMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, model } = req.body;

    // Get model configuration
    const modelConfig: ModelConfig | undefined = getModelConfig(model);
    if (!modelConfig) {
      res.status(400).json({ message: "Unsupported model" });
      return;
    }

    // Calculate tokens and points
    let tokenCount: number;
    let tokenizerUsed: string;

    switch (modelConfig.tokenizerType) {
      case "gpt":
        tokenCount = gptEncode(text).length;
        tokenizerUsed = "gpt-tokenizer";
        break;
      case "claude":
        tokenCount = countTokens(text);
        tokenizerUsed = "claude-tokenizer";
        break;
      case "character":
        tokenCount = Math.ceil(text.length / 4);
        tokenizerUsed = "character-based";
        break;
      default:
        res.status(400).json({ message: "Unsupported tokenizer type" });
        return;
    }

    const requiredPoints = Math.ceil(
      (tokenCount * modelConfig.costPerThousandTokens) / 1000
    );

    // Check user's balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("pointsBalance")
      .eq("id", req.user?.id || "")
      .single();

    if (userError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user has enough points
    if ((user.pointsBalance || 0) < requiredPoints) {
      res.status(402).json({
        message: "Insufficient points balance",
        tokenCount,
        required: requiredPoints,
        available: user.pointsBalance || 0,
        deficit: requiredPoints - (user.pointsBalance || 0),
      });
      return;
    }

    // Deduct points using RPC
    const { data: result, error: transactionError } = await supabase.rpc(
      "record_point_usage",
      {
        p_user_id: req.user?.id || "",
        p_points: requiredPoints,
        p_operation_type: "API_USAGE",
        p_description: `Message processed using ${modelConfig.name}`,
        p_metadata: {
          model: modelConfig.id,
          tokenCount,
          tokenizerUsed,
        },
      }
    );

    if (transactionError) {
      logger.error("Point usage transaction error:", transactionError);
      throw transactionError;
    }

    logger.debug("Message handled successfully:", {
      userId: req.user?.id,
      model: modelConfig.id,
      tokenCount,
      pointsUsed: requiredPoints,
      newBalance: result?.[0]?.new_balance,
    });

    res.status(200).json({
      success: true,
      message: "Message processed successfully",
      details: {
        tokenCount,
        pointsUsed: requiredPoints,
        newBalance: result?.[0]?.new_balance,
        model: modelConfig.id,
        tokenizerUsed,
      },
    });
  } catch (error) {
    logger.error("Handle message error:", error);
    next(error);
  }
};
