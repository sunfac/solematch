import { TextPage } from '@/components/ui/TextPage';

export default function TermsScreen() {
  return (
    <TextPage
      title="Terms of use"
      sections={[
        {
          h: 'Not medical advice',
          p: 'SoleMatch provides general information to help you choose running shoes for performance, comfort and fit. It is not medical advice, diagnosis or treatment, and no shoe or shoe-matching method is proven to prevent injury. If you have pain or an injury, consult a qualified professional — a physiotherapist, not a quiz.',
        },
        {
          h: 'Honest uncertainty',
          p: 'Recommendations are graded by evidence strength and published on the methodology page. Research evolves; effect sizes are averages; individual responses vary. Use your own judgement, especially around transitions to new shoe geometries.',
        },
        {
          h: 'Prices and availability',
          p: 'Shoe specifications are compiled with care from manufacturer data but may contain errors; prices and availability change without notice. Verify details with the retailer before purchase.',
        },
        {
          h: 'Liability',
          p: 'To the maximum extent permitted by law, SoleMatch accepts no liability for decisions made using the service. Nothing in these terms limits liability that cannot lawfully be limited.',
        },
        { p: 'Last updated June 2026.' },
      ]}
    />
  );
}
