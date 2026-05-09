import { getCurrentUser } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";
import PDFParser from "pdf2json";

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function parsePdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataReady", (data: any) => {
      try {
        const text = data.Pages
          .map((page: any) =>
            page.Texts.map((t: any) => safeDecode(t.R[0].T)).join(" ")
          )
          .join("\n");
        resolve(text);
      } catch (e) {
        reject(e);
      }
    });
    parser.on("pdfParser_dataError", (err: any) => {
      reject(new Error(err?.parserError?.message || "Failed to parse PDF"));
    });
    parser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Sign in to continue" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const raw = await parsePdfBuffer(buffer);

    const text = raw
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text || text.length < 50) {
      return Response.json({
        text: "Could not extract text from this PDF. The file may be scanned or image-based. Try copying and pasting your resume text instead.",
      });
    }

    return Response.json({ text });
  } catch (error: any) {
    console.error("PDF parse error:", error);
    return Response.json(
      { error: "Failed to parse PDF. Try pasting your resume text instead." },
      { status: 500 }
    );
  }
}
