"use client";

import { getUser } from "@/app/_lib/actions";
import Image from "next/image";
import { useEffect, useState } from "react";

import defaultPicture from "@/public/assets/images/avatars/buzz-marketing-group.jpg";
import { FaCheck, FaRegCopy } from "react-icons/fa";

type UserType = {
  name: string;
  avatar: string;
  user_id: string;
};
function User() {
  const [user, setUser] = useState<UserType>({
    name: "",
    avatar: "",
    user_id: "",
  });

  const [avatarFailed, setAvatarFailed] = useState(false);

  const [text, setText] = useState({
    text: "copy",
    icon: <FaRegCopy size={12} />,
  });

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    try {
      await navigator.clipboard.writeText(user.user_id);

      // Change button text to "Copied"
      setText({
        text: "copied",
        icon: <FaCheck size={12} />,
      });
      // Reset the button text after 3 seconds
      setTimeout(() => {
        setText({ text: "copy", icon: <FaRegCopy size={12} /> });
      }, 3000); // 3000ms = 3 seconds
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  }

  useEffect(() => {
    async function fetchUser() {
      const curUser = await getUser();
      setUser(curUser);
    }

    fetchUser();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full relative overflow-hidden bg-beige-100 ring-2 ring-white shadow-card shrink-0">
          <Image
            src={user?.avatar && !avatarFailed ? user.avatar : defaultPicture}
            alt=""
            fill
            sizes="44px"
            className="rounded-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-normal normal-case text-grey-500">
            Welcome back,
          </span>
          <span className="text-[22px] sm:text-2xl md:text-[28px] leading-tight tracking-tight font-bold normal-case text-grey-900">
            {user?.name?.split(" ")[1] || user?.name?.split(" ")[0]}
          </span>
        </div>
      </div>

      <span className="flex flex-wrap text-grey-500 items-center gap-2 mt-3 font-normal normal-case">
        <p className="text-sm hidden md:flex">Account ID:</p>
        <p className="text-sm font-mono">{user?.user_id.slice(0, 11) + "…"}</p>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-white border border-grey-900/10 rounded-full hover:border-grey-900/30 hover:text-grey-900 transition-colors"
          onClick={handleCopy}
        >
          <span>{text.text}</span> {text.icon}
        </button>
      </span>
    </div>
  );
}

export default User;
