import CmsPageRenderer from "@/components/CmsPageRenderer";

export const metadata = {
  title: 'Terms & Conditions | BookMyTicket',
  description: 'Read the terms and conditions for using BookMyTicket platform and services.',
};

export default function TermsPage() {
    return <CmsPageRenderer pageKey="terms-and-conditions" defaultTitle="Terms & Conditions" />;
}
