import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserLearningInsights } from "@/lib/memory/get-insights";
import { CheckCircle2, AlertCircle, BookOpen, Flame } from "lucide-react";

const page = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const insights = await getUserLearningInsights(userId);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Insights</h1>
        <p className="text-zinc-500 mt-1">
          Real-time analytics powered by your study sessions and quiz
          performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 border rounded-lg border flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-zinc-500 font-medium">Topics Tracked</p>
            <p className="text-2xl font-bold">{insights.totalTopicsTracked}</p>
          </div>
        </div>

        <div className="p-5 rounded-lg border flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-sm text-zinc-500 font-medium">Strong Topics</p>
            <p className="text-2xl font-bold">{insights.strongTopics.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-lg border flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-sm text-zinc-500 font-medium">Needs Review</p>
            <p className="text-2xl font-bold">{insights.needsReview.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Topics To Review</h2>
          </div>

          {insights.needsReview.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              No struggling topics detected yet.
            </p>
          ) : (
            <ul className="divide-y">
              {insights.needsReview.map((item: any) => (
                <li
                  key={item.topic}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{item.topic}</p>
                    <p className="text-xs text-zinc-500">
                      {item.explainRequests} explanation requests
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                    {item.accuracy !== null
                      ? `${item.accuracy}% Accuracy`
                      : "Needs Practice"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Strong Topics</h2>
          </div>

          {insights.strongTopics.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              Complete quizzes to flag topics as strong.
            </p>
          ) : (
            <ul className="divide-y">
              {insights.strongTopics.map((item: any) => (
                <li
                  key={item.topic}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{item.topic}</p>
                    <p className="text-xs text-zinc-500">
                      {item.studyCount} sessions completed
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {item.accuracy}% Accuracy
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-6 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Most Interacted Topics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights.mostStudied.map((item: any) => (
            <div key={item.topic} className="p-4 bg-zinc-50 rounded-lg border">
              <p className="font-semibold text-sm text-zinc-900">
                {item.topic}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {item.studyCount} Total Interactions
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;
