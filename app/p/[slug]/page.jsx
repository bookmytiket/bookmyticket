import LandingPageClient from './LandingPageClient';
import React from 'react';

export async function generateStaticParams() {
    return [{ slug: 'about' }];
}

export default function Page({ params }) {
    const { slug } = React.use(params);
    return <LandingPageClient slug={slug} />;
}
