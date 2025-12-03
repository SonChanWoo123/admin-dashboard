import { headers } from "next/headers";
import DashboardClient from "./components/DashboardClient";

export default async function Home() {
  // Server Component에서 HTTP 헤더에서 UUID를 직접 읽습니다
  const headersList = await headers();
  const userId = headersList.get("uuid");

  return <DashboardClient initialUserId={userId} />;
}
