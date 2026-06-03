import CmsPageRenderer from "@/components/CmsPageRenderer";

export const metadata = {
  title: 'Refund & Cancellation Policy | BookMyTicket',
  description: 'BookMyTicket refund and cancellation policy for event bookings and ticket purchases.',
};

export default function RefundPage() {
    return <CmsPageRenderer pageKey="refund-policy" defaultTitle="Refund & Cancellation Policy" />;
}
