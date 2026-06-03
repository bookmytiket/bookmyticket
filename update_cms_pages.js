const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pages = [
  {
    page_key: 'about-us',
    page_title: 'About Us',
    page_content: `### Your Ultimate Event Discovery Hub

Discover and experience the best events around you with our platform. We connect you to a curated selection of exciting events, ensuring you never miss out on the happenings that matter most.

### Our Vision

At BookMyTicket, we strive to connect people with unforgettable experiences. We believe events inspire, entertain, and unite communities. Our goal is to make discovering and attending these events as seamless and enjoyable as possible.

### Our Mission

At BookMyTicket, we are dedicated to providing an exceptional event discovery experience. Our diverse, high-quality listings and user-friendly platform prioritize transparency, security, and accessibility, ensuring that everyone can find and enjoy the best events. We value your feedback, offer robust support, and foster a vibrant community, all while promoting sustainability. Join us and let BookMyTicket light up your event experiences.

### What we offer

**Comprehensive Listings**  
From concerts and festivals to workshops and sports tournaments, BookMyTicket offers a wide range of event categories to ensure there’s something for everyone.

**Personalized Recommendations**  
Our platform uses advanced algorithms to understand your preferences and suggest events that you’ll love.

**Easy Booking**  
With our user-friendly interface, you can browse, book, and manage your event tickets effortlessly.

**Exclusive Deals**  
Get access to special discounts and exclusive offers on a variety of events, making your experiences even more memorable.

**Community Engagement**  
Join a community of like-minded individuals, share your experiences, and connect with others who share your passions.

---
BookMyTicket Pvt Ltd, makes every experience from festivals to concerts seamless and trusted.
Copyright 2026 @ BookMyTicket. All Rights Reserved.`
  },
  {
    page_key: 'terms-and-conditions',
    page_title: 'Terms & Conditions',
    page_content: `### TERMS AND CONDITIONS

By purchasing tickets or registering via BookMyTicket, you (the ‘Purchaser’ or ‘Attendee’) agree to comply with and be bound by the following terms and conditions. Please read them carefully before completing your ticket purchase or registration.

### Ticket Use

Tickets grant admission solely on the dates, times, and venues specified at the time of purchase.

A valid ticket, either digital (e-ticket) or physical, must be presented upon entry. Failure to produce a valid ticket may result in denied entry without refund.

Tickets may confer access to specific sessions, workshops, merchandise, or services outlined in the event package. These benefits are non-transferable unless explicitly authorized by the organizer.

### Ticket Transfer and Resale

Unauthorized resale, duplication, or transfer of tickets is strictly prohibited.

Tickets obtained through unofficial channels may be invalidated, and entry may be refused. No refunds will be issued for such tickets.

Transfer of tickets to a third party is only permitted with prior written consent from BookMyTicket or the event organizer.

### Booking and Payment

All ticket sales are final unless otherwise specified in the refund policy.

Ticket prices listed include applicable taxes unless mentioned otherwise. Additional service fees may apply.

Payment must be made in full at the time of booking through authorized payment gateways supported by BookMyTicket.

BookMyTicket reserves the right to cancel or refuse any booking if payment is not received or if fraudulent activity is suspected.

### Event Changes, Cancellation, and Postponement

BookMyTicket and the event organizers reserve the right to modify event details, including date, location, schedule, speakers, or programming, at any time without prior notice.

In the event of cancellation or postponement, BookMyTicket is not responsible for the cancellation of the events. It completely becomes the responsibility of the Organiser.

Refunds or exchanges, if applicable due to cancellation or postponement, will follow the terms expressed in the refund policy.

BookMyTicket is not liable for any travel, accommodation, or other costs incurred by attendees due to event changes.

### Conduct and Venue Rules

Attendees must comply with all venue rules, security, safety instructions, and protocols.

BookMyTicket reserves the right to refuse admission or eject any attendee for inappropriate behavior, including but not limited to intoxication, violence, harassment, or violation of venue policies, without refund.

Attendees are responsible for their personal belongings. BookMyTicket and event organizers are not liable for loss, theft, or damage of personal items during the event.

### Intellectual Property

All intellectual property rights in relation to the event and BookMyTicket platform content, including trademarks, logos, event materials, and digital content, remain the property of their respective owners.

Attendees may not reproduce, distribute, or use this content without prior written permission.

### Limitation of Liability

BookMyTicket and event organizers shall not be liable for any direct or indirect damages arising from participation in the event, including but not limited to personal injury, loss, or interruption of business.

No warranties are made regarding the availability or uninterrupted operation of the event or the BookMyTicket platform.

### Privacy and Data Protection

Personal information collected during ticketing is handled in accordance with the Privacy Policy available on the BookMyTicket website.

By using our services, you consent to the collection and processing of your data as described in said policy.

### Governing Law and Jurisdiction

These terms shall be governed by and construed in accordance with the laws applicable to the jurisdiction in which BookMyTicket operates.

Any disputes arising shall be subject to the exclusive jurisdiction of the courts located within the jurisdiction of the service provider.

### Changes to Terms

BookMyTicket reserves the right to amend or update these Terms & Conditions at any time without prior notice.

Revised terms will be posted on the website and will apply from their date of publication.`
  },
  {
    page_key: 'privacy-policy',
    page_title: 'Privacy Policy',
    page_content: `### PRIVACY POLICY

At BookMyTicket, we are committed to protecting your personal information and your right to privacy.

### Information We Collect

We collect personal information that you voluntarily provide to us when registering on the platform, purchasing tickets, or contacting us. This includes:

- **Name and Contact Data** (Email address, phone number)
- **Payment Information** (Processed securely via Razorpay/Cashfree; we do not store full credit card details)
- **Demographic Information** (Age, gender, location for specific event requirements)

### How We Use Your Information

We use your data to:

- Facilitate account creation and logon processes.
- Fulfill and manage your ticket orders and registrations.
- Send administrative information, such as booking confirmations and event updates.
- Respond to customer service requests.

### Sharing Your Information

We only share your information with:

- **Event Organizers**: Necessary details are shared with the organizer of the event you registered for to facilitate entry and event management.
- **Service Providers**: Payment processors and SMS/Email gateways strictly for operational purposes.
- **Legal Obligations**: If required by law, court order, or governmental regulation.

### Data Security

We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.

### Your Rights

You have the right to request access, correction, or deletion of your personal data. You may also opt-out of marketing communications at any time.

For any privacy-related concerns, please contact our support team.`
  },
  {
    page_key: 'refund-policy',
    page_title: 'Refund & Cancellation Policy',
    page_content: `### REFUND & CANCELLATION POLICY

BookMyTicket serves as a ticketing platform on behalf of event organizers. Our refund policy strictly adheres to the guidelines set by the respective organizers.

### Standard Policy

As a general rule, all ticket sales are final. Tickets cannot be cancelled, exchanged, or refunded after purchase unless the event is cancelled or significantly rescheduled by the organizer.

### Event Cancellations

If an event is officially cancelled by the organizer, you will be entitled to a full refund of the ticket face value. Please note that convenience fees, internet handling fees, and payment gateway charges are strictly non-refundable under any circumstances.

### Rescheduled Events

If an event is postponed or rescheduled, your existing tickets will generally remain valid for the new date. If you cannot attend the new date, refund eligibility is entirely at the discretion of the event organizer.

### Initiating a Refund

If you are eligible for a refund, it will be automatically processed to the original payment method used during the transaction. Please allow 5-7 business days for the funds to reflect in your bank account or credit card statement.

### Disputed Transactions

If you believe an unauthorized transaction has occurred, please contact your bank and our support team immediately. Do not initiate a chargeback without contacting us first, as it may result in permanent suspension from the platform.

For specific refund requests, please contact the event organizer directly using the contact details provided on the event page, or reach out to our support team for assistance.`
  }
];

async function updatePages() {
  console.log('Updating CMS pages with markdown formatted details...');
  for (const page of pages) {
    const { error } = await supabase
      .from('cms_pages')
      .update({ page_content: page.page_content, updated_at: new Date() })
      .eq('page_key', page.page_key);
    
    if (error) {
      console.error(`Error updating ${page.page_key}:`, error.message);
    } else {
      console.log(`Successfully updated ${page.page_key}`);
    }
  }
  console.log('Update complete.');
}

updatePages();
