import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useReports } from '../hooks/useReports';
import { notificationService } from '../services/NotificationService';

const InsightsScreen: React.FC = () => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { currentReport, spendingAnalysis, budgetPerformance, financialHealth, refreshReports } = useReports();
  const [insights, setInsights] = useState<string[]>([]);

  // Prevent infinite loops: refresh reports once on mount, then generate insights
  const generatedRef = useRef(false);

  useEffect(() => {
    // Refresh data once on mount
    refreshReports().catch(err => console.error('❌ [InsightsScreen] refreshReports error', err));
  }, [refreshReports]);

  useEffect(() => {
    // Generate insights only once when currentReport becomes available
    const run = async () => {
      try {
        if (!generatedRef.current && currentReport) {
          const reportService = (await import('../services/reportService.js')).reportService;
          const generated = await reportService.generateInsights(
            currentReport as any,
            spendingAnalysis as any,
            budgetPerformance as any,
            (financialHealth as any) || { score: 0, status: 'fair', indicators: {}, recommendations: [] }
          );

          generatedRef.current = true;
          setInsights(generated || []);

          const count = (currentReport && (currentReport as any).transactionsCount) || 0;
          await notificationService.notifySyncSuccess(count);
        }
      } catch (err) {
        console.error('❌ [InsightsScreen] generate insights error', err);
      }
    };

    run();
  }, [currentReport, spendingAnalysis, budgetPerformance, financialHealth]);

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.background.card }]}> 
          <Text style={[styles.title, { color: colors.text.primary }]}>{t.insights}</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.background.secondary }]}> 
            <View style={styles.iconBox}>
              <Ionicons name="bulb" size={22} color={colors.primary[700]} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{t.insightOfTheDay}</Text>
                  <Text style={[styles.cardText, { color: colors.text.secondary }]}>{insights.length > 0 ? insights[0] : '...'}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t.habitAnalysis}</Text>

          <View style={[styles.smallCard, { backgroundColor: colors.background.secondary }]}> 
            <Text style={[styles.smallCardTitle, { color: colors.text.primary }]}>Comparaison avec la moyenne</Text>
            <Text style={[styles.smallCardText, { color: colors.text.secondary }]}>Alimentation • Vous: 485 € • Moyenne: 550 €</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t.suggestions}</Text>

          <View style={[styles.suggestionCard, { backgroundColor: colors.background.secondary }]}>
            <View style={[styles.suggestionDot, { backgroundColor: colors.primary[700] }]} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.suggestionTitle, { color: colors.text.primary }]}>Réduisez les cafés quotidiens</Text>
              <Text style={[styles.suggestionText, { color: colors.text.secondary }]}>Vous achetez en moyenne 8 cafés par semaine. En préparant votre café à la maison 3 fois par semaine, vous économiserez ~40 € par mois.</Text>
            </View>
          </View>

          {insights.length > 1 && (
            <View style={{ marginTop: 12 }}>
              {insights.slice(1).map((ins, idx) => (
                <View key={idx} style={[styles.smallCard, { backgroundColor: colors.background.secondary, marginBottom: 8 }]}>
                  <Text style={[styles.smallCardText, { color: colors.text.primary }]}>{ins}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.scoreCard}>
            <Text style={styles.scoreText}>82/100</Text>
            <Text style={[styles.scoreLabel, { color: colors.text.secondary }]}>{t.financialScore}</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  card: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  smallCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  smallCardTitle: { fontSize: 14, fontWeight: '700' },
  smallCardText: { fontSize: 13, marginTop: 6 },
  suggestionCard: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  suggestionTitle: { fontSize: 14, fontWeight: '700' },
  suggestionText: { fontSize: 13, marginTop: 4 },
  suggestionDot: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scoreCard: { marginTop: 12, borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  scoreText: { fontSize: 48, fontWeight: '800', color: '#6B46C1' },
  scoreLabel: { fontSize: 14, marginTop: 8 },
});

export default InsightsScreen;
