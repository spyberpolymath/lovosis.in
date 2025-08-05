import { Metadata } from 'next';
import Certificates from '../Components/Certificates';

export const metadata: Metadata = {
  title: 'certificates - Lovosis Technologies Pvt Ltd',
  description: 'Explore our certificates of products, events, and projects at Lovosis Technologies Pvt Ltd.',
  keywords: 'certificates, products, events, projects, Lovosis Technologies, company portfolio',
  openGraph: {
    title: 'certificates - Lovosis Technologies Pvt Ltd',
    description: 'Explore our certificates of products, events, and projects at Lovosis Technologies Pvt Ltd.',
    type: 'website',
    url: 'https://lovosis.in/certificates',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function certificatesPage() {
  return <Certificates />;
}