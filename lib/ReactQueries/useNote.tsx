import { useQuery, useMutation } from "@tanstack/react-query";

// ---------------------- HELPER FUNCTIONS ---------------------- //
const getNote = async (noteId: string) => {
  console.log("Fetching note with ID:", noteId); // Debugging log
  const res = await fetch(`/api/sessions/note/${noteId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch note");
  }

  return res.json();
};

//-------------------------------- HOOKS -------------------------//
export function useNote(noteId: string) {
  return useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNote(noteId),
    enabled: !!noteId,
  });
}
