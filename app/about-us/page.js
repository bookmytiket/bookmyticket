import CmsPageRenderer from "@/components/CmsPageRenderer";

export const metadata = {
  title: 'About Us | BookMyTicket',
  description: 'Learn more about BookMyTicket, our mission, vision, and the services we offer for event organizers and attendees.',
};

export default function AboutUsPage() {
    return <CmsPageRenderer pageKey="about-us" defaultTitle="About Us" />;
}
