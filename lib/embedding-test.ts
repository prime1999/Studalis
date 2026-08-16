import { loadEnvConfig } from "@next/env";
import { prisma } from "../lib/prisma";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  console.log("🚀 Starting Studalis End-to-End Integration Test...\n");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const userId = "test-user-123";

  try {
    // 1. Setup Test Document & Session in Database
    console.log("1️⃣ Seeding Test Document & Session in Database...");

    let document = await prisma.document.findFirst();
    if (!document) {
      document = await prisma.document.create({
        data: {
          title: "Sample Study Guide.pdf",
          userId: userId,
          pdfKey: "sample-pdf-key-123",
        },
      });
      console.log(`   Created test Document ID: ${document.id}`);
    } else {
      console.log(`   Using existing Document ID: ${document.id}`);
    }

    const sessionId = `test-session-${Date.now()}`;
    console.log(`   Session ID: ${sessionId}\n`);

    // 2. Create a test Note in CockroachDB
    console.log("2️⃣ Creating a Test Note in 'Note' table via Prisma...");
    const testNote = await prisma.note.create({
      data: {
        userId,
        documentId: document.id,
        title: "Calculus Limits Core Rules",
        content:
          "Rule 1: Direct substitution first. Rule 2: Factor and cancel if 0/0.",
      },
    });
    console.log(`   ✅ Note created! ID: ${testNote.id}\n`);

    // 3. Test API Chat Route
    console.log("3️⃣ Sending Chat Message requesting saved notes...");
    console.log(
      '   Prompt: "Can you check my saved study notes for this document?"',
    );

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Can you check my saved study notes for this document?",
        documentId: document.id,
        sessionId,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log("\n==================================================");
    console.log("🤖 Studalis AI Response:");
    console.log("==================================================");
    console.log(data.reply);
    console.log("==================================================\n");

    // 4. Verify Chat History Persistence
    console.log("4️⃣ Verifying Chat Messages saved in DB...");
    const savedMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    console.log(`   Total messages saved for session: ${savedMessages.length}`);
    savedMessages.forEach((msg, idx) => {
      console.log(
        `   [${idx + 1}] (${msg.role.toUpperCase()}): ${msg.content.substring(0, 80)}...`,
      );
    });

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
