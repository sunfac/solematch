import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { bySlug } from '@/data/catalogue';
import { SCORED } from '@/scores/formulas';
import { ShoeCard } from '@/components/card/ShoeCard';
import { EvidenceBadge } from '@/components/ui/Badge';
import { PillButton } from '@/components/ui/PillButton';
import { Screen } from '@/components/ui/Screen';
import { buildAffiliateUrl, offersFor } from '@/lib/affiliate';
import { track } from '@/lib/analytics';
import { useQuizStore } from '@/state/quizStore';
import { useResultsStore } from '@/state/resultsStore';
import { RULES } from '@/data/rules';
import { color, font, space } from '@/theme/tokens';

function SpecRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <Text style={styles.specValue}>{value}</Text>
        {note ? <Text style={styles.specNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

export default function ShoeDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const shoe = slug ? bySlug.get(slug) : undefined;
  const result = useResultsStore((s) => s.result);
  const matchId = useResultsStore((s) => s.matchId);
  const region = useQuizStore((s) => s.region);

  if (!shoe) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.muted}>Shoe not found.</Text>
          <PillButton label="Browse all shoes" onPress={() => router.replace('/browse')} />
        </View>
      </Screen>
    );
  }

  const scores = SCORED.get(shoe.slug)!;
  const inResult = result?.roles.find((r) => r.pick.shoe.slug === shoe.slug);
  const offers = offersFor(shoe.slug, region);

  const openOffer = (offer: (typeof offers)[number]) => {
    const subId = `${matchId ?? 'browse'}:${shoe.slug}:detail`;
    track('offer_click', { slug: shoe.slug, retailer: offer.retailer, subId });
    Linking.openURL(buildAffiliateUrl(offer, subId)).catch(() => {});
  };

  return (
    <Screen scroll maxWidth={560}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.cardWrap}>
        <ShoeCard
          shoe={shoe}
          scores={scores}
          match={inResult?.pick.match}
          context={inResult ? 'match' : 'catalogue'}
        />
      </View>

      {inResult ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why this shoe, for you</Text>
          {inResult.pick.reasons.map((reason, i) => (
            <Pressable
              key={i}
              style={styles.reasonCard}
              onPress={() => Linking.openURL(RULES[reason.ruleId].url).catch(() => {})}
            >
              <EvidenceBadge level={reason.evidence} />
              <Text style={styles.reasonText}>{reason.text}</Text>
              <Text style={styles.citation}>{RULES[reason.ruleId].citation} ↗</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specs</Text>
        <SpecRow label="Weight" value={`${shoe.weightG} g`} note="men's US9 where stated" />
        <SpecRow label="Heel-to-toe drop" value={`${shoe.dropMm} mm`} />
        <SpecRow
          label="Stack height"
          value={`${shoe.stackHeelMm} / ${shoe.stackFfMm} mm`}
          note={shoe.specEstimated ? 'estimated, pending verification' : undefined}
        />
        <SpecRow label="Midsole" value={shoe.foamName} />
        <SpecRow label="Plate" value={shoe.plate === 'none' ? 'None' : shoe.plate} />
        <SpecRow label="Widths" value={shoe.widths.join(', ')} />
        <SpecRow label="RRP" value={`£${shoe.msrpGbp}${shoe.priceApprox ? ' (approx)' : ''}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What runners say</Text>
        <Text style={styles.consensus}>{shoe.consensus}</Text>
        {shoe.athleteNotes ? <Text style={styles.athlete}>{shoe.athleteNotes}</Text> : null}
      </View>

      <View style={styles.section} nativeID="offers">
        <Text style={styles.sectionTitle}>Where to buy</Text>
        {offers.length > 0 ? (
          offers.map((o) => (
            <Pressable key={o.retailer + o.url} style={styles.offerRow} onPress={() => openOffer(o)}>
              <View>
                <Text style={styles.offerRetailer}>{o.retailer}</Text>
                <Text style={styles.offerChecked}>price as of {o.checkedAt}</Text>
              </View>
              <Text style={styles.offerPrice}>£{o.priceGbp} →</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.muted}>Retailer links coming shortly — RRP £{shoe.msrpGbp}.</Text>
        )}
        <Text style={styles.disclosure}>We may earn commission on retailer links.</Text>
      </View>

      {inResult && inResult.alternates.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternates for this slot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(3) }}>
            {inResult.alternates.map((alt) => (
              <Pressable
                key={alt.shoe.slug}
                style={styles.altCard}
                onPress={() => router.push(`/shoe/${alt.shoe.slug}`)}
              >
                <Text style={styles.altName}>
                  {alt.shoe.brand} {alt.shoe.model} {alt.shoe.version}
                </Text>
                <Text style={styles.altMeta}>
                  {alt.match}% match · £{alt.shoe.msrpGbp}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: font.ui, fontSize: 14, color: color.muted, marginBottom: space(3) },
  cardWrap: { alignItems: 'center', marginBottom: space(5) },
  section: { marginBottom: space(6), gap: space(2.5) },
  sectionTitle: { fontFamily: font.display, fontSize: 16, color: color.ink, letterSpacing: 0.5 },
  reasonCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    padding: space(3.5),
    gap: space(2),
  },
  reasonText: { fontFamily: font.ui, fontSize: 13.5, lineHeight: 19, color: color.ink },
  citation: { fontFamily: font.ui, fontSize: 11.5, color: color.cyan },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space(4),
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    paddingVertical: space(2.5),
  },
  specLabel: { fontFamily: font.ui, fontSize: 13.5, color: color.muted },
  specValue: { fontFamily: font.uiMed, fontSize: 13.5, color: color.ink, textAlign: 'right' },
  specNote: { fontFamily: font.ui, fontSize: 11, color: color.muted, opacity: 0.8 },
  consensus: { fontFamily: font.ui, fontSize: 14, lineHeight: 21, color: color.ink },
  athlete: { fontFamily: font.ui, fontSize: 12.5, lineHeight: 18, color: color.muted },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    padding: space(3.5),
  },
  offerRetailer: { fontFamily: font.uiMed, fontSize: 14, color: color.ink },
  offerChecked: { fontFamily: font.ui, fontSize: 11, color: color.muted },
  offerPrice: { fontFamily: font.display, fontSize: 16, color: color.volt },
  disclosure: { fontFamily: font.ui, fontSize: 11, color: color.muted, opacity: 0.8 },
  altCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    padding: space(3.5),
    minWidth: 180,
  },
  altName: { fontFamily: font.uiMed, fontSize: 13.5, color: color.ink },
  altMeta: { fontFamily: font.ui, fontSize: 12, color: color.muted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4) },
  muted: { fontFamily: font.ui, fontSize: 13.5, color: color.muted },
});
