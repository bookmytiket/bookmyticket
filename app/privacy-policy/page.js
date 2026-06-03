import CmsPageRenderer from "@/components/CmsPageRenderer";

export const metadata = {
  title: 'Privacy Policy | BookMyTicket',
  description: 'BookMyTicket privacy policy detailing data collection, storage, and user rights.',
};

export default function PrivacyPage() {
    return <CmsPageRenderer pageKey="privacy-policy" defaultTitle="Privacy Policy" />;
}
