import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Standard Gemini config
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Lazy Supabase init
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Please define SUPABASE_URL and SUPABASE_KEY.");
  }
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard JSON middleware with size limit to support images
  app.use(express.json({ limit: "15mb" }));

  // API endpoint: Config status
  app.get("/api/config", (req, res) => {
    const url = process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_KEY || "";
    const isConfigured = !!(url && key);
    res.json({
      configured: isConfigured,
      supabaseUrl: url,
      hasKey: !!key,
    });
  });

  // API endpoint: Get records from Supabase
  app.get("/api/records", async (req, res) => {
    try {
      const supabase: any = getSupabase();
      const { data, error } = await supabase
        .from("financial_records")
        .select("*")
        .order("parsed_at", { ascending: false });

      if (error) {
        throw error;
      }
      return res.json({ success: true, records: data || [] });
    } catch (error: any) {
      console.error("Retrieve error from Supabase:", error);
      const isMissingTable = error.message?.includes("relation") && error.message?.includes("does not exist");
      return res.status(200).json({
        success: false,
        error: error.message || error,
        isMissingTable: !!isMissingTable,
        records: [], // Fallback empty records list so client handles gracefully
      });
    }
  });

  // API endpoint: Save new record to Supabase
  app.post("/api/records", async (req, res) => {
    try {
      const supabase: any = getSupabase();
      const record = req.body;

      if (!record.id) {
        record.id = "rec_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      }

      const { data, error } = await supabase
        .from("financial_records")
        .insert([
          {
            id: record.id,
            date: record.date || null,
            amount: record.amount !== null && record.amount !== undefined ? Number(record.amount) : null,
            vendor: record.vendor || null,
            category: record.category || "Miscellaneous",
            confidence_score: record.confidence_score !== null && record.confidence_score !== undefined ? Number(record.confidence_score) : null,
            source_text: record.sourceText || null,
            source_image_name: record.sourceImageName || null,
            parsed_at: record.parsedAt || new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        throw error;
      }
      return res.json({ success: true, record: data ? data[0] : record });
    } catch (error: any) {
      console.error("Save error to Supabase:", error);
      return res.status(500).json({
        success: false,
        error: error.message || error,
      });
    }
  });

  // API endpoint: Update existing record in Supabase
  app.put("/api/records/:id", async (req, res) => {
    try {
      const supabase: any = getSupabase();
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from("financial_records")
        .update({
          date: updates.date || null,
          amount: updates.amount !== null && updates.amount !== undefined ? Number(updates.amount) : null,
          vendor: updates.vendor || null,
          category: updates.category || "Miscellaneous",
          confidence_score: updates.confidence_score !== null && updates.confidence_score !== undefined ? Number(updates.confidence_score) : null,
        })
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }
      return res.json({ success: true, record: data ? data[0] : updates });
    } catch (error: any) {
      console.error("Update error to Supabase:", error);
      return res.status(500).json({
        success: false,
        error: error.message || error,
      });
    }
  });

  // API endpoint: Delete record from Supabase
  app.delete("/api/records/:id", async (req, res) => {
    try {
      const supabase: any = getSupabase();
      const { id } = req.params;

      const { error } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Delete error from Supabase:", error);
      return res.status(500).json({
        success: false,
        error: error.message || error,
      });
    }
  });

  // API endpoint: Parse receipt/invoice content
  app.post("/api/parse", async (req, res) => {
    try {
      const { text, image, mimeType } = req.body;

      if (!text && !image) {
        return res.status(400).json({ error: "No document text or receipt image provided." });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: "GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not configured. Please add it via the Settings > Secrets panel.",
        });
      }

      // Build contents array for Gemini
      const contentsParts: any[] = [];

      if (image && mimeType) {
        contentsParts.push({
          inlineData: {
            data: image,
            mimeType: mimeType,
          },
        });
        contentsParts.push({
          text: "Extract five financial fields from this receipt/invoice image. If text is also provided below, use it to assist with clarification.",
        });
      }

      if (text) {
        contentsParts.push({
          text: `Here is the financial document text or OCR dump to parse: \n\n${text}`,
        });
      }

      // Prompt to instruct the model to pay attention to details
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction:
            "You are a precise document-parsing assistant specialized in financial operations, receipt scanning, and invoice data extraction. " +
            "Analyze the provided raw inputs (which may be OCR output, invoice text, CSV dump, email body, multi-line receipts, or an image of the physical document). " +
            "Follow these strict formatting and translation logic guidelines:\n" +
            "1. Date: Formatted strictly as YYYY-MM-DD. If the year is missing or ambiguous, assume the default year 2026. Set to null if not found.\n" +
            "2. Amount: Clean floating-point value. Strip currency symbols ($, ₹, €, etc.), commas, and any other formatting, keeping only the raw decimal rating. Set to null if not found.\n" +
            "3. Vendor: Capitalize nicely. Clean merchant/service name. Set to null if not found.\n" +
            "4. Category: Map the expense strictly to one of the standard business categories: 'Software/SaaS', 'Travel', 'Meals & Entertainment', 'Office Supplies', 'Utilities', 'Marketing', or 'Miscellaneous'.\n" +
            "5. Confidence Score: Value from 0.0 to 1.0 indicating data extraction accuracy level.\n" +
            "Set values to null if they cannot be found or inferred from the document.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.STRING,
                description: "Transaction date formatted strictly as YYYY-MM-DD (e.g. 2026-04-12). If the year is missing or ambiguous, assume 2026. If unable to find, return null.",
              },
              amount: {
                type: Type.NUMBER,
                description: "Clean floating-point amount value. No currency symbols, no commas. Set to null if unable to find.",
              },
              vendor: {
                type: Type.STRING,
                description: "Name of the merchant, company, or service provider. Set to null if unable to determine.",
              },
              category: {
                type: Type.STRING,
                description: "Classification of expense into standard business buckets: 'Software/SaaS', 'Travel', 'Meals & Entertainment', 'Office Supplies', 'Utilities', 'Marketing', or 'Miscellaneous'.",
              },
              confidence_score: {
                type: Type.NUMBER,
                description: "Calculated confidence certainty level ranging from 0.0 (unparseable) to 1.0 (completely certain).",
              },
            },
            required: ["date", "amount", "vendor", "category", "confidence_score"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: "Empty response received from the Gemini parsing model." });
      }

      // Parse JSON
      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);
    } catch (error: any) {
      console.error("Parse Error Details:", error);
      return res.status(500).json({
        error: "Failed to parse document content.",
        details: error.message || error,
      });
    }
  });

  // Client-side static or development assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Financial Document Parser server running on port ${PORT}`);
  });
}

startServer();
