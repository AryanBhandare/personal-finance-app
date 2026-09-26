import AuthItem from "../_components/authentication/AuthItem";
import { getUser } from "../_lib/actions";

export const metadata = {
  title: "Profile update page",
};

async function page() {
  const user = await getUser();
  return (
    <div className="flex justify-center items-center">
      <AuthItem pageName="" type="edit" userData={user} />
    </div>
  );
}

export default page;
