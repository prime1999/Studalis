import { SignIn } from "@clerk/nextjs";

const page = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      <h3 className="mt-8 font-sans font-semibold text-lg">Welcome back!</h3>
      <SignIn />
    </div>
  );
};

export default page;
