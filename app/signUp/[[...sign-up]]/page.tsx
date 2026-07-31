import { SignUp } from "@clerk/nextjs";

const page = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      <h3 className="mt-8 font-sans font-semibold text-lg">
        Need a Study partner?
      </h3>
      <SignUp />
    </div>
  );
};

export default page;
