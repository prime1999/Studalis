import Image from "next/image";
import Link from "next/link";
import hero from "@/public/images/hero.png";
import headShot from "@/public/images/headShot.png";
import { MoveUpRight } from "lucide-react";

const Hero = () => {
  return (
    <main className="relative h-[520px] overflow-y-hidden">
      <h1 className="absolute -top-10 left-8 z-10 font-bold text-[150px] text-center text-gray-200 flex items-center justify-center tracking-wider">
        STUDY BETTER
      </h1>
      <div className="relative w-11/12 mx-auto z-30 flex items-center justify-between">
        <div className="flex flex-col justify-center w-1/3">
          <h6 className="font-sans font-bold text-black text-2xl">
            An AI that studies with you, <br />
            <span className="text-blue-600">not instead of you.</span>
          </h6>
          <p className="text-gray-500 text-sm mt-2 font-sans">
            Bring anything you're learning, and Studalis will study alongside
            you. Ask questions, explore ideas, review concepts, and have
            meaningful discussions, all with an AI that stays in sync with your
            learning journey.
          </p>
          <Link
            href="/signUp"
            className="w-30 flex gap-2 items-center mt-4 bg-blue-600 text-xs text-white rounded-full px-4 py-2 shadow-xl cursor-pointer duration-500 transition hover:bg-blue-700"
          >
            Get Started <MoveUpRight size={15} />
          </Link>
        </div>
        {/* <div></div> */}
        <Image src={hero} alt="hero-image" width={400} height={200} />
        <div className="h-full w-1/3 relative">
          <div className="absolute top-20 right-0 w-full h-22 flex items-start gap-2 bg-gray-100 rounded-md">
            <Image
              src={headShot}
              alt="head-shot"
              width={100}
              height={100}
              className="rounded-md bg-gray-300"
            />
            <p className="text-xs p-2 text-gray-800">
              Bring your notes, PDFs, videos, or ideas. I'll help you explore
              them, challenge your thinking, and learn alongside you.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Hero;
