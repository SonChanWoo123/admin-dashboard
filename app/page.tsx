import { headers } from "next/headers";
import HomeClient from "./components/HomeClient";

export default async function Home() {
  const headersList = await headers();
  const uuid = headersList.get("uuid");

  return <HomeClient userId={uuid} />;
}
