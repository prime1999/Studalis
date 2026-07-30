import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <nav className="relative w-10/12 z-50 flex items-center justify-between mx-auto p-4">
      <Link
        href="/"
        className="font-voegies text-3xl tracking-widest font-semibold"
      >
        Studalis
      </Link>
      <Show when="signed-out">
        <Link
          href="/signUp"
          className="bg-black text-xs text-white rounded-full px-4 py-2 text-center shadow-xl cursor-pointer duration-500 transition hover:bg-black/80"
        >
          Sign Up
        </Link>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </nav>
  );
};

export default Navbar;
