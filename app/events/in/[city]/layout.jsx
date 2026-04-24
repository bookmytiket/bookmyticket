export async function generateMetadata({ params }) {
  const { city } = params;
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);

  return {
    title: `Best Events in ${capitalizedCity} - Book Tickets Online | BookMyTicket`,
    description: `Discover upcoming concerts, comedy shows, sports events, and festivals in ${capitalizedCity}. Book your tickets instantly on BookMyTicket, the most trusted ticketing platform.`,
    keywords: [`events in ${city}`, `book tickets ${city}`, `${city} concerts`, `${city} nightlife`, `things to do in ${city}`],
    openGraph: {
      title: `Upcoming Events in ${capitalizedCity} | BookMyTicket`,
      description: `Explore and book the most exciting events happening in ${capitalizedCity}.`,
      url: `https://bookmyticket.net/events/in/${city}`,
    },
  };
}

export default function CityEventsLayout({ children }) {
  return <>{children}</>;
}
