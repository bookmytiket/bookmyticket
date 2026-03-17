import OrganiserRedirect from "./components/OrganiserRedirect";

export function generateStaticParams() {
  return [{ slug: ["index"] }];
}

export default function Page() {
  return <OrganiserRedirect />;
}
