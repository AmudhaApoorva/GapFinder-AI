import { redirect } from "next/navigation";
import { optionalUser } from "@/lib/session";
import { WelcomeAuth } from "@/components/welcome-auth";

export default async function HomePage() {
  const user = await optionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return <WelcomeAuth defaultMode="signin" />;
}
