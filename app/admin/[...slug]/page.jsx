import AdminRedirect from "./components/AdminRedirect";

export function generateStaticParams() {
  return [{ slug: ["index"] }];
}

export default function Page() {
  return <AdminRedirect />;
}
