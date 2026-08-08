import { useQuery } from "@tanstack/react-query";

// ---------------------- HELPER FUNCTIONS ---------------------- //
const getDocument = async (documentId: string) => {
  const res = await fetch(`/api/documents/${documentId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch document");
  }

  return res.json();
};

const getDocumentChunks = async (documentId: string) => {
  const res = await fetch(`/api/documents/${documentId}/chunks`);

  if (!res.ok) {
    throw new Error("Failed to fetch chunks");
  }

  return res.json();
};

const getAllUserDocuments = async () => {
  const res = await fetch(`/api/documents`);

  if (!res.ok) {
    throw new Error("Failed to fetch documents");
  }

  return res.json();
};

const getDocumentUrl = async (documentId: string) => {
  const res = await fetch(`/api/documents/${documentId}/view`);

  if (!res.ok) {
    throw new Error("Failed to fetch pdf");
  }

  return res.json();
};

//-------------------------------- HOOKS -------------------------//
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
    enabled: !!documentId,
  });
}

export const useDocumentChunks = (documentId: string) => {
  return useQuery({
    queryKey: ["document-chunks", documentId],
    queryFn: () => getDocumentChunks(documentId),
    enabled: !!documentId,
  });
};

export const useAllUserDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => getAllUserDocuments(),
    enabled: true,
  });
};

export const useDocumentUrl = (documentId: string) => {
  return useQuery({
    queryKey: ["document-url", documentId],
    queryFn: () => getDocumentUrl(documentId),
    enabled: !!documentId,
  });
};
