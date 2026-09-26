import Image from "next/image";
import illustration from "@/public/assets/images/illustration-authentication.svg";
import AuthItem from "../_components/authentication/AuthItem";
import Signup from "../_components/authentication/Signup";
export const metadata = {
  title: "Sign up",
};

function page() {
  return (
    <div>
      <Signup />
    </div>
  );
}

export default page;
