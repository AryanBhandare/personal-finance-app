import Image from "next/image";
import illustration from "@/public/assets/images/Sidebar.png";
import AuthItem from "./AuthItem";

function Signup() {
  return (
    <div className="flex items-center justify-center auth xl:grid xl:grid-cols-[minmax(420px,560px),1fr]">
      <div className="h-dvh sticky top-0 w-full relative hidden xl:flex p-5">
        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-pop">
        <Image src={illustration} alt="" fill className="object-cover" priority />
        </div>
      </div>
      <div className="flex items-center justify-center w-full px-4 py-10">
        <AuthItem pageName="signup" />
      </div>
    </div>
  );
}

export default Signup;
