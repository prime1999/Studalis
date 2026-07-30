import { SignIn } from "@clerk/nextjs";

const page = () => {
  return (
    <div className="flex p-8 min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
};

export default page;
