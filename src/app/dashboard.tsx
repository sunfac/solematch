import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { TopBar } from '@/components/ui/TopBar';
import { color, font, space } from '@/theme/tokens';

/**
 * Owner-only earnings dashboard. Localhost-gated like devImages — deployed
 * domains see a "not for you" screen so a curious user can't game the
 * conversion projections. The owner can still hit /dashboard locally to
 * model the math.
 *
 * What this page IS: a realistic revenue projector + the directory of every
 * network's own reporting dashboard.
 *
 * What this page is NOT: a live earnings feed. Network APIs require server-
 * side keys we don't store in the bundle (Skimlinks Hub Reporting API needs
 * a private API key, Awin a publisher token, etc.). The actual £ totals
 * live on each network's hub — links below.
 */

const NETWORKS = [
  {
    name: 'Skimlinks',
    status: 'active' as const,
    rate: '75% of merchant rate (~4-7% on shoes)',
    dashboard: 'https://hub.skimlinks.com/reports/transactions',
    note: 'Reports per xcust (matchId:slug:placement). Filter for solematch traffic.',
  },
  {
    name: 'Amazon Associates UK',
    status: 'pending' as const,
    rate: '4% on shoes, 24h cookie',
    dashboard: 'https://affiliate-program.amazon.co.uk/home',
    note: 'Set EXPO_PUBLIC_AMAZON_TAG on Railway to activate. ascsubtag carries our subId.',
  },
  {
    name: 'Awin',
    status: 'pending' as const,
    rate: '7-10% Nike, 5-8% SportsShoes/Mizuno/Saucony',
    dashboard: 'https://ui.awin.com/affiliate/reports',
    note: 'Per-advertiser approval. clickref carries our subId.',
  },
  {
    name: 'Webgains',
    status: 'pending' as const,
    rate: '8% Runners Need (UK anchor)',
    dashboard: 'https://platform.webgains.com/affiliate/reports',
    note: 'Apply to Runners Need specifically. clickref carries our subId.',
  },
  {
    name: 'Impact',
    status: 'pending' as const,
    rate: '~10% Adidas direct',
    dashboard: 'https://app.impact.com/secure/reports',
    note: 'Days to approve. subId1 carries our subId.',
  },
  {
    name: 'Rakuten Advertising',
    status: 'pending' as const,
    rate: '3-14% Hoka direct (UK availability varies)',
    dashboard: 'https://rakutenadvertising.com/login/',
    note: 'u1 carries our subId.',
  },
];

const isLocalPreview =
  typeof window !== 'undefined' &&
  /^(localhost|127\.|0\.0\.0\.0)/.test(window.location?.hostname ?? '');

export default function DashboardScreen() {
  if (!isLocalPreview) {
    return (
      <Screen scroll maxWidth={560}>
        <TopBar />
        <View style={styles.gate}>
          <Text style={styles.gateHead}>Owner-only</Text>
          <Text style={styles.gateBody}>
            This page lives on localhost during development. The deployed app keeps it
            hidden — actual earnings live on each network's own dashboard.
          </Text>
          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.link}>← Back to the app</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // Conservative model assumptions, calibrated from public running-retail
  // benchmarks (Webgains, Affilimate, Skimlinks public case studies). Defaults
  // are the mid-band; sliders let you sanity-check the edges.
  const [sessions, setSessions] = useState(1000);
  const [completion, setCompletion] = useState(35); // % of sessions that finish the quiz
  const [ctr, setCtr] = useState(25); // % of completers who click out
  const [clicksPerSession, setClicksPerSession] = useState(1.6);
  const [conversion, setConversion] = useState(3.5); // % of clicks that convert
  const [aov, setAov] = useState(110); // £ average order value
  const [commission, setCommission] = useState(6); // % blended commission

  const completers = Math.round((sessions * completion) / 100);
  const outboundClicks = Math.round((completers * ctr * clicksPerSession) / 100);
  const conversions = Math.round((outboundClicks * conversion) / 100);
  const revenue = Math.round(conversions * aov);
  const earnings = Math.round((revenue * commission) / 100);
  const epc = outboundClicks > 0 ? (earnings / outboundClicks).toFixed(2) : '0.00';

  return (
    <Screen scroll maxWidth={680}>
      <TopBar />
      <Text style={styles.title}>Earnings dashboard</Text>
      <Text style={styles.lead}>
        A sober look at what the wire can realistically pay. Networks publish click and
        conversion benchmarks (Affilimate, Webgains, Skimlinks); the calculator below uses
        the mid-band of those. Drag the inputs to see the bookends.
      </Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Revenue projector — your numbers</Text>
        <SliderRow
          label="Weekly sessions"
          value={sessions}
          min={50}
          max={20000}
          step={50}
          format={(v) => v.toLocaleString()}
          onChange={setSessions}
          hint="Reddit + Product Hunt launch typically lands 200-1,000 first-week"
        />
        <SliderRow
          label="Quiz completion %"
          value={completion}
          min={10}
          max={70}
          step={1}
          format={(v) => `${v}%`}
          onChange={setCompletion}
          hint="Multi-step quizzes benchmark 30-45%"
        />
        <SliderRow
          label="Outbound click-out %"
          value={ctr}
          min={10}
          max={60}
          step={1}
          format={(v) => `${v}%`}
          onChange={setCtr}
          hint="High-intent recommendation traffic: 20-30%"
        />
        <SliderRow
          label="Clicks per completer"
          value={clicksPerSession}
          min={1}
          max={4}
          step={0.1}
          format={(v) => v.toFixed(1)}
          onChange={setClicksPerSession}
          hint="Rotation mode generates more clicks than single-shoe"
        />
        <SliderRow
          label="Click → sale conversion %"
          value={conversion}
          min={1}
          max={8}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
          onChange={setConversion}
          hint="UK specialist running retail benchmarks 2-5%"
        />
        <SliderRow
          label="Average order value (£)"
          value={aov}
          min={50}
          max={250}
          step={5}
          format={(v) => `£${v}`}
          onChange={setAov}
          hint="Mix of race day + daily skews higher than commodity shoes"
        />
        <SliderRow
          label="Blended commission %"
          value={commission}
          min={3}
          max={10}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
          onChange={setCommission}
          hint="Skimlinks-only ~5%, full direct stack 7-8%"
        />
      </View>

      <View style={[styles.section, styles.outputCard]}>
        <Text style={styles.h2}>Projected weekly outcome</Text>
        <OutputRow label="Quiz completers" value={completers.toLocaleString()} />
        <OutputRow label="Outbound clicks" value={outboundClicks.toLocaleString()} />
        <OutputRow label="Conversions" value={conversions.toLocaleString()} />
        <OutputRow label="Gross merchant revenue" value={`£${revenue.toLocaleString()}`} />
        <OutputRow label="Your earnings (gross)" value={`£${earnings.toLocaleString()}`} hero />
        <OutputRow label="Earnings per click (EPC)" value={`£${epc}`} />
        <Text style={styles.outputFootnote}>
          Annualised: £{(earnings * 52).toLocaleString()} at this run rate.
          Networks typically pay 60-90 days after the conversion clears.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Where the actual £ lives</Text>
        <Text style={styles.body}>
          Networks don't publish a unified API for free; each one's own dashboard is the
          source of truth. The xcust / clickref / ascsubtag / u1 / subId1 we attach to
          every click filters reports back to solematch traffic.
        </Text>
        {NETWORKS.map((n) => (
          <Pressable
            key={n.name}
            style={styles.netRow}
            onPress={() => Linking.openURL(n.dashboard).catch(() => {})}
          >
            <View style={styles.netLeft}>
              <View style={styles.netHead}>
                <Text style={styles.netName}>{n.name}</Text>
                <View
                  style={[
                    styles.statusChip,
                    n.status === 'active' ? styles.statusActive : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      n.status === 'active' ? styles.statusTextActive : styles.statusTextPending,
                    ]}
                  >
                    {n.status === 'active' ? 'LIVE' : 'NOT WIRED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.netRate}>{n.rate}</Text>
              <Text style={styles.netNote}>{n.note}</Text>
            </View>
            <Text style={styles.netGo}>→</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Click attribution model</Text>
        <Text style={styles.body}>
          Every outbound click carries <Text style={styles.code}>matchId:slug:placement</Text> in
          the network's subID slot (xcust / clickref / ascsubtag / u1 / subId1). When the
          conversion clears, that string appears in the network's report — so revenue is
          attributable per match × per shoe × per placement (reveal / results / detail).
        </Text>
        <Text style={styles.body}>
          Same string flows into PostHog as <Text style={styles.code}>offer_click</Text> events
          (set <Text style={styles.code}>EXPO_PUBLIC_POSTHOG_KEY</Text> on Railway). Joining
          the two answers: which surface is your money maker?
        </Text>
      </View>
    </Screen>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  // Web-native range input via dangerouslySetInnerHTML-friendly wrapper:
  // React Native Web passes a `<input type="range">` through reliably.
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHead}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{format(value)}</Text>
      </View>
      <RangeInput min={min} max={max} step={step} value={value} onChange={onChange} hasHint={!!hint} />
      {hint ? <Text style={styles.sliderHint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Native <input type="range"> via a thin React.createElement bridge — RN-Web
 * tolerates raw DOM elements but the TS types don't expose them, so we go
 * through createElement to satisfy the compiler without an unused-directive.
 */
function RangeInput({
  min, max, step, value, onChange, hasHint,
}: { min: number; max: number; step: number; value: number; onChange: (v: number) => void; hasHint: boolean }) {
  return require('react').createElement('input', {
    type: 'range',
    min,
    max,
    step,
    value,
    onChange: (e: { target: { value: string } }) => onChange(Number(e.target.value)),
    style: {
      width: '100%',
      accentColor: color.volt,
      marginTop: 6,
      marginBottom: hasHint ? 2 : 8,
    },
  });
}

function OutputRow({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <View style={styles.outputRow}>
      <Text style={[styles.outputLabel, hero && styles.outputLabelHero]}>{label}</Text>
      <Text style={[styles.outputValue, hero && styles.outputValueHero]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.display, fontSize: 28, color: color.ink, marginBottom: space(2) },
  lead: { fontFamily: font.ui, fontSize: 13.5, color: color.muted, lineHeight: 20, marginBottom: space(6) },
  h2: { fontFamily: font.display, fontSize: 16, color: color.ink, marginBottom: space(3) },
  body: { fontFamily: font.ui, fontSize: 13, lineHeight: 19, color: color.muted, marginBottom: space(3) },
  code: { fontFamily: 'monospace', fontSize: 12, color: color.cyan },
  section: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: space(4),
    marginBottom: space(4),
  },
  outputCard: { backgroundColor: color.surface2 },
  sliderRow: { marginBottom: space(3) },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: { fontFamily: font.uiMed, fontSize: 13, color: color.ink },
  sliderValue: { fontFamily: font.display, fontSize: 15, color: color.volt },
  sliderHint: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginBottom: space(2), opacity: 0.85 },
  outputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space(2),
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  outputLabel: { fontFamily: font.ui, fontSize: 13, color: color.muted },
  outputLabelHero: { fontFamily: font.uiMed, fontSize: 14, color: color.ink },
  outputValue: { fontFamily: font.display, fontSize: 15, color: color.ink },
  outputValueHero: { fontSize: 24, color: color.volt },
  outputFootnote: {
    fontFamily: font.ui,
    fontSize: 11.5,
    color: color.muted,
    marginTop: space(3),
    fontStyle: 'italic',
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    gap: space(3),
  },
  netLeft: { flex: 1 },
  netHead: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  netName: { fontFamily: font.uiMed, fontSize: 14, color: color.ink },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusActive: { backgroundColor: color.voltDim, borderWidth: 1, borderColor: color.volt },
  statusPending: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.line },
  statusText: { fontFamily: font.display, fontSize: 9, letterSpacing: 1 },
  statusTextActive: { color: color.volt },
  statusTextPending: { color: color.muted },
  netRate: { fontFamily: font.ui, fontSize: 12, color: color.cyan, marginTop: 2 },
  netNote: { fontFamily: font.ui, fontSize: 11.5, color: color.muted, marginTop: 3, lineHeight: 16 },
  netGo: { fontFamily: font.display, fontSize: 18, color: color.muted },
  gate: { paddingVertical: space(10), gap: space(3), alignItems: 'flex-start' },
  gateHead: { fontFamily: font.display, fontSize: 22, color: color.ink },
  gateBody: { fontFamily: font.ui, fontSize: 14, color: color.muted, lineHeight: 20 },
  link: { fontFamily: font.uiMed, fontSize: 13, color: color.cyan, marginTop: space(2) },
});
