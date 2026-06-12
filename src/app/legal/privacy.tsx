import { TextPage } from '@/components/ui/TextPage';

export default function PrivacyScreen() {
  return (
    <TextPage
      title="Privacy"
      sections={[
        {
          h: 'No accounts, no server storage',
          p: 'SoleMatch MVP has no accounts. Your quiz answers live only in your browser’s memory for the current session: closing the tab or pressing Start Over erases everything. Nothing you enter is sent to or stored on our servers.',
        },
        {
          h: 'Injury history is special-category data',
          p: 'The optional injury-history step is health-related data under UK GDPR. We only use it with your explicit consent (the toggle on that step), solely to make recommendations more conservative, for the current session only. Skipping it never penalises your match. It is never transmitted or stored server-side, and Start Over erases it.',
        },
        {
          h: 'Analytics',
          p: 'We record anonymous product events (quiz started, match revealed, retailer link clicked) to understand what works. These contain no quiz answers, no health data and no identity — just a random session identifier.',
        },
        {
          h: 'Retailer links',
          p: 'Outbound links may be affiliate links. The retailer and the affiliate network may set cookies on their own sites under their own policies — see our affiliate disclosure.',
        },
        {
          p: 'Questions or requests: contact the team via the address on the site footer once published. Last updated June 2026.',
        },
      ]}
    />
  );
}
