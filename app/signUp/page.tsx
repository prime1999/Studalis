import { SignUp } from "@clerk/nextjs";

const page = () => {
  return (
    <div className="flex p-8 min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
};

export default page;
