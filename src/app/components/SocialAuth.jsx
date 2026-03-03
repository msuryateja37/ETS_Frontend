import { signIn } from "next-auth/react";
import { FaGoogle, FaGithub } from "react-icons/fa";

export default function SocialAuth() {
  return (
    <>
      <div className="flex items-center my-6">
        <div className="flex-grow border-t" />
        <span className="mx-3 text-sm text-gray-400">OR</span>
        <div className="flex-grow border-t" />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-50"
        >
          <FaGoogle className="text-red-500" />
          Continue with Google
        </button>

        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-50"
        >
          <FaGithub />
          Continue with GitHub
        </button>
      </div>
    </>
  );
}
