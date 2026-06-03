import CmsPageRenderer from "@/components/CmsPageRenderer";

export const metadata = {
  title: 'Organizer Information | BookMyTicket',
  description: 'Information for event organizers regarding registration, KYC, approval workflows, and commission structure on BookMyTicket.',
};

export default function OrganizerInfoPage() {
    return <CmsPageRenderer pageKey="organizer-information" defaultTitle="Organizer Information" />;
}
