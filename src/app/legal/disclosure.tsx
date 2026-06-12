import { TextPage } from '@/components/ui/TextPage';

export default function DisclosureScreen() {
  return (
    <TextPage
      title="Affiliate disclosure"
      sections={[
        {
          p: 'SoleMatch is free to use. When you click through to a retailer and buy a shoe, we may earn a commission from that retailer at no extra cost to you. This is how the project is funded.',
        },
        {
          h: 'Commission never changes the match',
          p: 'Recommendations come from a deterministic engine published on our methodology page — manufacturer specs, peer-reviewed evidence and your answers. Retailers and brands cannot pay to rank higher, and commission rates play no part in any score.',
        },
        {
          h: 'Prices',
          p: 'Prices shown are recommended retail or recently checked retailer prices, with their checked date displayed. Always confirm the final price on the retailer’s site.',
        },
        {
          p: 'This disclosure is made in line with UK ASA/CAP guidance and the US FTC endorsement guides.',
        },
      ]}
    />
  );
}
