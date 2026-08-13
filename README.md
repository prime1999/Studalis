# Studalis

Studalis is a document-based AI study assistant built with Next.js, Prisma, Clerk authentication, AWS S3, and Google Gemini. The app lets users upload PDFs, extract text, create vector embeddings for retrieval, and ask AI-powered study questions about the document.

This project is organized around a simple core flow:

1. A user uploads a PDF to S3.
2. The backend creates a database record for the document.
3. The PDF is downloaded and parsed.
4. The extracted text is split into chunks and embedded.
5. The user asks study questions through chat or explain actions.
6. The system retrieves relevant document chunks and passes them to Gemini with a prompt.
7. The answer and interaction are saved in the database.

---

## High-level architecture

### Frontend

- App pages in [app](app)
- Reusable UI in [components](components)
- Client state in [store](store)
- React Query data hooks in [lib/ReactQueries](lib/ReactQueries)

### Backend/API

- Next.js route handlers in [app/api](app/api)
- Shared business logic and AI helpers in [lib](lib)
- PostgreSQL database access through Prisma in [lib/prisma.ts](lib/prisma.ts)

### Data sources

- AWS S3 for uploaded PDFs and processed JSON output
- PostgreSQL for documents, sessions, messages, chunks, and learning interactions
- Google Gemini for embeddings and answer generation

---

## API route map

Below is the exact API surface of the project and the files that use them.

### 1) Upload a file and create a document record

#### Route

- [app/api/upload-url/route.ts](app/api/upload-url/route.ts)

#### Purpose

Creates a presigned S3 upload URL and inserts a new document row in the database with status "processing".

#### Request body

- fileName: original file name
- fileType: content type

#### Flow

- Authenticates the user with Clerk.
- Builds an S3 key like uploads/<timestamp>-<filename>.
- Generates a signed PUT URL using AWS S3.
- Creates a Prisma document row with title, pdfKey, and processing status.
- Returns the document, uploadUrl, and key to the frontend.

#### Used by

- [components/dashboard/UploadFile.tsx](components/dashboard/UploadFile.tsx)

#### Related helper usage

- S3 client from [lib/s3.ts](lib/s3.ts)
- Prisma client from [lib/prisma.ts](lib/prisma.ts)

---

### 2) Generate a signed URL for viewing an uploaded file

#### Route

- [app/api/files/view/route.ts](app/api/files/view/route.ts)

#### Purpose

Returns a temporary signed URL that the browser can use to fetch an object from S3.

#### Request body

- key: S3 object key

#### Used by

- [components/dashboard/UploadFile.tsx](components/dashboard/UploadFile.tsx)

#### Why this exists

The client cannot directly access private S3 objects without a signed URL, so this route acts as a secure proxy.

---

### 3) Process an uploaded PDF and store extracted chunks and embeddings

#### Route

- [app/api/files/process/route.ts](app/api/files/process/route.ts)

#### Purpose

Downloads a PDF from S3, extracts text page by page, splits into chunks, creates embeddings, saves chunk rows to PostgreSQL, and marks the document as ready.

#### Request body

- key: uploaded S3 key
- documentId: id of the Prisma document row

#### Important steps

1. Authenticates the user.
2. Converts the uploaded key into a processed JSON file key.
3. Fetches the PDF buffer from S3 via [lib/get-pdf-buttfer.ts](lib/get-pdf-buttfer.ts).
4. Extracts the text via [lib/s3-extract.ts](lib/s3-extract.ts).
5. Splits each page into text segments using [lib/chunk-text.ts](lib/chunk-text.ts).
6. Creates embeddings for each chunk using [lib/embeddings.ts](lib/embeddings.ts).
7. Saves the chunks and their vector data into the DocumentChunk table.
8. Saves the full extracted JSON to S3.
9. Updates the document status to ready.

#### Used by

- [components/dashboard/UploadFile.tsx](components/dashboard/UploadFile.tsx)

#### Related libraries used

- [lib/s3.ts](lib/s3.ts)
- [lib/get-pdf-buttfer.ts](lib/get-pdf-buttfer.ts)
- [lib/s3-extract.ts](lib/s3-extract.ts)
- [lib/chunk-text.ts](lib/chunk-text.ts)
- [lib/embeddings.ts](lib/embeddings.ts)
- [lib/prisma.ts](lib/prisma.ts)

---

### 4) List all documents for the signed-in user

#### Route

- [app/api/documents/route.ts](app/api/documents/route.ts)

#### Purpose

Returns the user’s document list ordered newest first.

#### Used by

- [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx) via the hook useAllUserDocuments

#### Typical consumers

- dashboard pages that show uploaded study documents

---

### 5) Fetch a single document by id

#### Route

- [app/api/documents/[documentId]/route.ts](app/api/documents/[documentId]/route.ts)

#### Purpose

Returns the metadata of one document if it belongs to the current user.

#### Used by

- [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx) via useDocument

---

### 6) Fetch all text chunks for a document

#### Route

- [app/api/documents/[documentId]/chunks/route.ts](app/api/documents/[documentId]/chunks/route.ts)

#### Purpose

Returns all chunk rows for a given document ordered by page and chunk index.

#### Used by

- [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx) via useDocumentChunks

#### Why it matters

This gives the app direct access to the raw document text segments used during retrieval and study interactions.

---

### 7) Fetch a signed URL for a document PDF

#### Route

- [app/api/documents/[documentId]/view/route.ts](app/api/documents/[documentId]/view/route.ts)

#### Purpose

Returns a temporary S3 signed URL for the PDF associated with a document.

#### Used by

- [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx) via useDocumentUrl
- [components/dashboard/PdfViewer.tsx](components/dashboard/PdfViewer.tsx) indirectly through the fetched file URL

---

### 8) Create or reuse the study session for a document

#### Route

- [app/api/sessions/create/route.ts](app/api/sessions/create/route.ts)

#### Purpose

Ensures a study session exists for the current user and document.

#### Request body

- documentId

#### Used by

- [lib/ReactQueries/useSession.tsx](lib/ReactQueries/useSession.tsx) via useCreateSession

#### Internal dependency

- [lib/sessions/get-or-create-session.ts](lib/sessions/get-or-create-session.ts)

---

### 9) Fetch the session for a document

#### Route

- [app/api/sessions/[documentId]/route.ts](app/api/sessions/[documentId]/route.ts)

#### Purpose

Loads the study session associated with a document and user.

#### Used by

- [lib/ReactQueries/useSession.tsx](lib/ReactQueries/useSession.tsx) via useSession

---

### 10) Fetch all messages in a session

#### Route

- [app/api/sessions/[documentId]/messages/route.ts](app/api/sessions/[documentId]/messages/route.ts)

#### Purpose

Returns all chat messages for a session in chronological order.

#### Important detail

This route expects a sessionId in the path param, but the folder is named [documentId]. In practice, the frontend uses the session id as the route parameter; this is a mismatch in naming, but the logic still fetches by session id.

#### Used by

- [lib/ReactQueries/useSessionMessages.tsx](lib/ReactQueries/useSessionMessages.tsx)
- [components/chat/StudyChatUI.tsx](components/chat/StudyChatUI.tsx)

---

### 11) Chat with the document-aware study assistant

#### Route

- [app/api/chat/route.ts](app/api/chat/route.ts)

#### Purpose

This is the main AI chat endpoint. It checks auth, verifies document ownership, loads or creates a session, stores the user message, retrieves the most relevant chunks, builds a study prompt, asks Gemini for a response, saves the assistant answer, and updates the study interaction data.

#### Request body

- documentId
- message
- action (default: CHAT)

#### Actions supported

- CHAT
- EXPLAIN
- NOTE
- FLASHCARD
- QUIZ
- SUMMARY

#### Helper dependencies

- [lib/sessions/get-or-create-session.ts](lib/sessions/get-or-create-session.ts)
- [lib/retrieval/search-similar-chunks.ts](lib/retrieval/search-similar-chunks.ts)
- [lib/prompts/build-study-prompts.ts](lib/prompts/build-study-prompts.ts)
- [lib/prisma.ts](lib/prisma.ts)

#### Used by

- [components/chat/StudyChatUI.tsx](components/chat/StudyChatUI.tsx)

#### Data flow

- Prisma document validation
- getOrCreateSession
- save user message
- vector search using document chunks
- buildStudyPrompt
- Gemini generateContent
- save assistant message
- optionally create LearningInteraction
- update studySession lastOpenedAt

---

### 12) Explain a selected text highlight using document context

#### Route

- [app/api/explain/route.ts](app/api/explain/route.ts)

#### Purpose

Answers a question or highlight explanation using the most relevant document chunks. It is optimized for “explain this concept” interactions.

#### Request body

- documentId
- question

#### Used by

- [lib/sessions/interaction.ts](lib/sessions/interaction.ts) via useExplainHighlight
- [components/dashboard/PdfViewer.tsx](components/dashboard/PdfViewer.tsx)

#### Helper dependencies

- [lib/retrieval/search-similar-chunks.ts](lib/retrieval/search-similar-chunks.ts)
- [lib/sessions/get-or-create-session.ts](lib/sessions/get-or-create-session.ts)
- Prisma learning interaction records

---

---

## Component-to-route relationship map

### Document upload flow

- [components/dashboard/UploadFile.tsx](components/dashboard/UploadFile.tsx)
  - POST to [app/api/upload-url/route.ts](app/api/upload-url/route.ts)
  - POST to [app/api/files/view/route.ts](app/api/files/view/route.ts)
  - POST to [app/api/files/process/route.ts](app/api/files/process/route.ts)

### PDF reading and explanation

- [components/dashboard/PdfViewer.tsx](components/dashboard/PdfViewer.tsx)
  - Uses the explain mutation from [lib/sessions/interaction.ts](lib/sessions/interaction.ts)
  - Calls [app/api/explain/route.ts](app/api/explain/route.ts)
  - Reads file URL from signed document view logic

### Chat UI

- [components/chat/StudyChatUI.tsx](components/chat/StudyChatUI.tsx)
  - Sends POST requests to [app/api/chat/route.ts](app/api/chat/route.ts)
  - Loads session history from [app/api/sessions/[documentId]/messages/route.ts](app/api/sessions/[documentId]/messages/route.ts)

### Data hooks

- [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx)
  - Reads document metadata and chunks
- [lib/ReactQueries/useSession.tsx](lib/ReactQueries/useSession.tsx)
  - Reads and creates session state
- [lib/ReactQueries/useSessionMessages.tsx](lib/ReactQueries/useSessionMessages.tsx)
  - Fetches message history

---

## Full lib folder reference and linking

### [lib/prisma.ts](lib/prisma.ts)

Purpose: Creates the shared Prisma database client used across the app.

What it does:

- Loads DATABASE_URL from environment variables
- Builds a PrismaPg adapter for PostgreSQL
- Instantiates PrismaClient
- Exports prisma for all database access

Used by:

- Almost every route in [app/api](app/api)
- Most retrieval and session functions

Why it matters:
This is the application’s database connection layer. Without it, routes cannot query documents, sessions, messages, or chunks.

---

### [lib/ai.tsx](lib/ai.tsx)

Purpose: Utility for extracting text content from AI message parts.

What it does:

- Accepts a UIMessage from the AI SDK
- Filters message parts where type === "text"
- Joins them into a single string

Used by:

- Not actively used in the current project flow as a central integration point, but it is a generic helper for AI message formatting.

---

### [lib/chunk-text.ts](lib/chunk-text.ts)

Purpose: Splits long document text into smaller overlapping chunks.

What it does:

- Takes a large string and slices it into smaller windows
- Uses a default chunk size of 1000 and overlap of 200 characters
- Moves the start position forward by chunkSize - overlap to preserve context continuity

Used by:

- [app/api/files/process/route.ts](app/api/files/process/route.ts)

Why it matters:
The vector search system works best when content is chunked. This makes large PDFs searchable and context-aware.

---

### [lib/embeddings.ts](lib/embeddings.ts)

Purpose: Generates vector embeddings for text using Gemini.

What it does:

- Initializes Gemini client with the API key
- Calls ai.models.embedContent with model gemini-embedding-001
- Returns the embedding vector values

Used by:

- [app/api/files/process/route.ts](app/api/files/process/route.ts)
- [lib/retrieval/search-similar-chunks.ts](lib/retrieval/search-similar-chunks.ts)

Why it matters:
This is the bridge between raw text and semantic retrieval. The database stores these vectors and compares them to user queries.

---

### [lib/get-pdf-buttfer.ts](lib/get-pdf-buttfer.ts)

Purpose: Downloads a PDF object from S3 as a buffer.

What it does:

- Creates a GetObjectCommand for the pdf key
- Sends the command to S3
- Streams the returned body into a Buffer

Used by:

- [app/api/files/process/route.ts](app/api/files/process/route.ts)

Why it matters:
The app needs the raw PDF bytes before it can parse and extract text.

---

### [lib/s3.ts](lib/s3.ts)

Purpose: Shared AWS S3 client configuration.

What it does:

- Creates an S3Client with AWS region and credentials
- Exposes it as the app-wide S3 client instance

Used by:

- [app/api/upload-url/route.ts](app/api/upload-url/route.ts)
- [app/api/files/view/route.ts](app/api/files/view/route.ts)
- [app/api/files/process/route.ts](app/api/files/process/route.ts)
- [lib/get-pdf-buttfer.ts](lib/get-pdf-buttfer.ts)

Why it matters:
This centralizes AWS configuration and avoids redefining the S3 client in many files.

---

### [lib/s3-extract.ts](lib/s3-extract.ts)

Purpose: Extracts clean text from a PDF using pdf.js.

What it does:

- Configures the pdf.js worker for Node.js
- Opens the PDF document from a binary buffer
- Iterates page by page
- Gets text items from each page
- Joins them without losing structure
- Cleans whitespace and punctuation
- Returns an object with totalPages and page-level cleaned text

Used by:

- [app/api/files/process/route.ts](app/api/files/process/route.ts)

Why it matters:
This is the text extraction layer that turns PDF content into searchable document text.

---

### [lib/retrieval/search-similar-chunks.ts](lib/retrieval/search-similar-chunks.ts)

Purpose: Performs semantic retrieval using vector similarity.

What it does:

- Converts a prompt or question into an embedding using Gemini
- Builds a raw SQL vector query against the DocumentChunk table
- Finds the closest matching chunks for a particular document
- Returns the most relevant chunks with distance metrics

Used by:

- [app/api/chat/route.ts](app/api/chat/route.ts)
- [app/api/explain/route.ts](app/api/explain/route.ts)

Why it matters:
This is the core retrieval engine. It lets the assistant answer from the user’s document instead of relying only on general knowledge.

---

### [lib/sessions/get-or-create-session.ts](lib/sessions/get-or-create-session.ts)

Purpose: Ensures each user-document pair has a study session.

What it does:

- Tries to find an existing studySession row
- If one exists, updates lastOpenedAt
- If one does not exist, creates a new session

Used by:

- [app/api/chat/route.ts](app/api/chat/route.ts)
- [app/api/explain/route.ts](app/api/explain/route.ts)
- [app/api/sessions/create/route.ts](app/api/sessions/create/route.ts)

Why it matters:
Sessions keep all conversation and learning interactions grouped by document.

---

### [lib/prompts/build-study-prompts.ts](lib/prompts/build-study-prompts.ts)

Purpose: Builds the final prompt sent to Gemini based on the selected study action.

What it does:

- Accepts action, context, and student message
- Wraps the document context and request in a prompt template
- Generates different prompt styles for CHAT, EXPLAIN, NOTE, FLASHCARD, QUIZ, and SUMMARY

Used by:

- [app/api/chat/route.ts](app/api/chat/route.ts)

Why it matters:
This is how the app shapes the AI behavior for different educational tasks and keeps the responses consistent.

---

### [lib/ReactQueries/getDocument.tsx](lib/ReactQueries/getDocument.tsx)

Purpose: Client-side data hooks for document queries.

Functions:

- getDocument
- getDocumentChunks
- getAllUserDocuments
- getDocumentUrl
- useDocument
- useDocumentChunks
- useAllUserDocuments
- useDocumentUrl

What they do:

- Fetch document metadata from the API
- Fetch all chunks for a document
- Fetch all docs for the current user
- Fetch the document’s PDF signed URL
- Wrap the fetchers in React Query hooks for caching and state management

Used by:

- Dashboard/document pages

---

### [lib/ReactQueries/useSession.tsx](lib/ReactQueries/useSession.tsx)

Purpose: Hooks for reading and creating sessions.

Functions:

- getSession
- createSession
- updateCurrentPage
- useSession
- useCreateSession
- useUpdateCurrentPage

Used by:

- App session UI and page state management

Notes:
The updateCurrentPage mutation points to an API path that does not currently appear in the server routes folder, so it appears to be partially implemented or planned.

---

### [lib/ReactQueries/useSessionMessages.tsx](lib/ReactQueries/useSessionMessages.tsx)

Purpose: Fetches the message history for a session.

What it does:

- Calls GET /api/sessions/:sessionId/messages
- Returns JSON containing sessionId and messages
- Enables the query only when sessionId is present

Used by:

- [components/chat/StudyChatUI.tsx](components/chat/StudyChatUI.tsx)

---

### [lib/sessions/interaction.ts](lib/sessions/interaction.ts)

Purpose: Client-side API helper for highlighted text explanations.

What it does:

- Calls POST /api/explain
- Sends documentId and selected question text
- Uses a mutation wrapper for UI interaction

Used by:

- [components/dashboard/PdfViewer.tsx](components/dashboard/PdfViewer.tsx)

---

### [lib/utils.ts](lib/utils.ts)

Purpose: Shared utility helper for class name merging.

What it does:

- Merges TailwindCSS class names using clsx and tailwind-merge

Used by:

- UI components throughout the app

---

---

## End-to-end user journey

### Upload and study flow

1. User uploads a PDF from [components/dashboard/UploadFile.tsx](components/dashboard/UploadFile.tsx)
2. The frontend requests a signed upload URL from [app/api/upload-url/route.ts](app/api/upload-url/route.ts)
3. The PDF is uploaded to S3
4. The frontend calls [app/api/files/process/route.ts](app/api/files/process/route.ts)
5. The PDF is parsed and chunked
6. Embeddings are created and stored in PostgreSQL
7. The document becomes ready
8. The user opens the document and interacts with chat or explain features
9. The system retrieves the best matching chunks for the user prompt
10. Gemini answers using the document context
11. The answer and interaction are saved to the database

---

## Key database entities

The app relies on these main Prisma models, all connected through document and session flows:

- Document
- DocumentChunk
- StudySession
- ChatMessage
- LearningInteraction

These models are used to:

- track uploaded files
- preserve extracted text chunks
- organize study sessions
- store the dialogue history
- track actions such as EXPLAIN, SUMMARY, NOTE, FLASHCARD, and QUIZ

---

## Environment variables expected

The app depends on environment configuration such as:

- DATABASE_URL
- GEMINI_API_KEY
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_BUCKET_NAME

Without these values, the upload, embedding, and AI answer flows will not work correctly.

---

## Notes about current implementation

This codebase is a working prototype and has a few implementation details worth noting:

- Some API routes are intentionally thin wrappers around database and S3 logic.
- Retrieval is semantic and document-aware, based on vector similarity.
- The app uses Next.js App Router route handlers rather than a separate backend service.
- Some session route naming is inconsistent, especially the folder [app/api/sessions/[documentId]/messages/route.ts](app/api/sessions/[documentId]/messages/route.ts), where the route param is actually a session id.
- The file name [lib/get-pdf-buttfer.ts](lib/get-pdf-buttfer.ts) contains a typo, but the function still works as intended.

---

## Summary

The project’s core architecture is:

- S3 stores PDF files and processed outputs
- Prisma stores user, document, session, chunk, and interaction data
- Gemini handles embeddings and text generation
- Next.js route handlers orchestrate the work
- React Query hooks provide a frontend API layer
- UI components trigger the routes and display results

This means the app is effectively a document retrieval + tutoring system: it does not just generate AI answers from general knowledge, it grounds the conversation in the user’s uploaded file.
