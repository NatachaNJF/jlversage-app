import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { formatDateFr } from "@/lib/date";

function CheckRow({ label, value }: { label: string; value: boolean | null | undefined }) {
  const colors = useColors();
  if (value === null || value === undefined) return null;
  return (
    <View style={styles.checkRow}>
      <Text style={[styles.checkIcon, { color: value ? colors.success : colors.error }]}>
        {value ? '✓' : '✕'}
      </Text>
      <Text style={[styles.checkLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function PassageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const passageQuery = trpc.passages.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  const passage = passageQuery.data;

  if (passageQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!passage) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Retour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.muted }]}>Passage introuvable</Text>
        </View>
      </ScreenContainer>
    );
  }

  const anomalies: string[] = passage.anomalies ? JSON.parse(passage.anomalies) : [];
  const dateFormatee = formatDateFr(passage.date, { withWeekday: true });

  return (
    <ScreenContainer>
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Registre</Text>
        </TouchableOpacity>
        <View style={[
          styles.statutBadge,
          { backgroundColor: passage.accepte ? colors.success + '20' : colors.error + '20' }
        ]}>
          <Text style={[styles.statutText, { color: passage.accepte ? colors.success : colors.error }]}>
            {passage.accepte ? '✓ Accepté' : '✕ Refusé'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Plaque + infos principales */}
        <View style={[styles.plaqueCard, {
          backgroundColor: passage.accepte ? colors.success + '10' : colors.error + '10',
          borderColor: passage.accepte ? colors.success + '40' : colors.error + '40',
        }]}>
          <Text style={[styles.plaque, { color: colors.foreground }]}>{passage.plaque}</Text>
          <Text style={[styles.plaqueDate, { color: colors.muted }]}>
            {dateFormatee} à {passage.heure}
          </Text>
          {passage.accepte && (
            <Text style={[styles.tonnage, { color: colors.success }]}>
              {Number(passage.tonnage).toFixed(2)} T acceptées
            </Text>
          )}
          {!passage.accepte && passage.motifRefus && (
            <View style={[styles.motifBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <Text style={[styles.motifLabel, { color: colors.error }]}>Motif de refus</Text>
              <Text style={[styles.motifText, { color: colors.foreground }]}>{passage.motifRefus}</Text>
              {passage.motifRefusDetail && (
                <Text style={[styles.motifDetail, { color: colors.muted }]}>{passage.motifRefusDetail}</Text>
              )}
            </View>
          )}
        </View>

        {/* Photo */}
        {passage.photoUrl ? (
          <Section title="PHOTO PRISE LORS DU CONTRÔLE">
            <Image
              source={{ uri: passage.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          </Section>
        ) : (
          <View style={[styles.noPhoto, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="photo.fill" size={32} color={colors.muted} />
            <Text style={[styles.noPhotoText, { color: colors.muted }]}>Aucune photo enregistrée</Text>
          </View>
        )}

        {/* Chantier */}
        <Section title="CHANTIER">
          <Text style={[styles.infoValue, { color: colors.foreground }]}>{passage.chantierNom}</Text>
          <Text style={[styles.infoSub, { color: colors.muted }]}>Réf. {passage.referenceChantier}</Text>
        </Section>

        {/* Transporteur */}
        <Section title="TRANSPORTEUR">
          <Text style={[styles.infoValue, { color: colors.foreground }]}>{passage.transporteur}</Text>
        </Section>

        {/* Contrôles administratifs */}
        {(passage.bonWalterreOk !== null || passage.referenceOk !== null || passage.plaqueOk !== null || passage.correspondanceOk !== null) && (
          <Section title="CONTRÔLES ADMINISTRATIFS">
            <CheckRow label="Bon Walterre présent et valide" value={passage.bonWalterreOk} />
            <CheckRow label="Référence chantier correcte" value={passage.referenceOk} />
            <CheckRow label="Plaque d'immatriculation conforme" value={passage.plaqueOk} />
            <CheckRow label="Correspondance transporteur/chantier" value={passage.correspondanceOk} />
          </Section>
        )}

        {/* Contrôle visuel */}
        {passage.controleVisuelOk !== null && passage.controleVisuelOk !== undefined && (
          <Section title="CONTRÔLE VISUEL">
            <CheckRow label="Contrôle visuel satisfaisant" value={passage.controleVisuelOk} />
            {anomalies.length > 0 && (
              <View style={[styles.anomaliesBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
                <Text style={[styles.anomaliesLabel, { color: colors.warning }]}>Anomalies constatées</Text>
                {anomalies.map((a, i) => (
                  <Text key={i} style={[styles.anomalieItem, { color: colors.foreground }]}>• {a}</Text>
                ))}
              </View>
            )}
          </Section>
        )}

        {/* Opérateur */}
        {passage.operateurNom && (
          <Section title="ENREGISTRÉ PAR">
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{passage.operateurNom}</Text>
          </Section>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, fontWeight: '500' },
  statutBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statutText: { fontSize: 13, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16 },

  plaqueCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, gap: 6,
  },
  plaque: { fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  plaqueDate: { fontSize: 13 },
  tonnage: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  motifBox: {
    marginTop: 10, borderRadius: 10, borderWidth: 1, padding: 12, gap: 4,
  },
  motifLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  motifText: { fontSize: 15, fontWeight: '600' },
  motifDetail: { fontSize: 13, marginTop: 2 },

  photo: { width: '100%', height: 220, borderRadius: 10, marginTop: 4 },
  noPhoto: {
    borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
    padding: 24, alignItems: 'center', gap: 8,
  },
  noPhotoText: { fontSize: 13 },

  section: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 6,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  infoSub: { fontSize: 13 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  checkIcon: { fontSize: 16, fontWeight: '700', width: 20, textAlign: 'center' },
  checkLabel: { fontSize: 14, flex: 1 },

  anomaliesBox: {
    marginTop: 8, borderRadius: 10, borderWidth: 1, padding: 12, gap: 4,
  },
  anomaliesLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  anomalieItem: { fontSize: 13, paddingLeft: 4 },
});
