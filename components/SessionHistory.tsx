import { useSessions } from "@/lib/ReactQueries/useSession";

import { useSessionStore } from "@/store/session-store";

const SessionHistory = () => {
  const { data, isPending } = useSessions();

  const { setSessionId } = useSessionStore();

  if (isPending) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      {data?.map((session: { id: string; title?: string }) => (
        <button
          key={session.id}
          onClick={() => setSessionId(session.id)}
          className="border-b p-3 text-left hover:bg-muted"
        >
          {session.title ?? "Untitled Session"}
        </button>
      ))}
    </div>
  );
};

export default SessionHistory;
