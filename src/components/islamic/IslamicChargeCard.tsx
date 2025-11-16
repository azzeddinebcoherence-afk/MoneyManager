// src/components/islamic/IslamicChargeCard.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../hooks/useAccounts';
import { IslamicCharge } from '../../types/IslamicCharge';

interface IslamicChargeCardProps {
  charge: IslamicCharge;
  onUpdateAmount: (chargeId: string, newAmount: number) => void;
  onMarkAsPaid: (chargeId: string, accountId?: string) => void;
  onAssignAccount: (chargeId: string, accountId: string, autoDeduct: boolean) => void;
  onCanPayCharge?: (chargeId: string) => Promise<{ canPay: boolean; reason?: string }>;
}

export const IslamicChargeCard: React.FC<IslamicChargeCardProps> = ({
  charge,
  onUpdateAmount,
  onMarkAsPaid,
  onAssignAccount,
  onCanPayCharge
}) => {
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const { accounts } = useAccounts();
  
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAmount, setNewAmount] = useState(charge.amount.toString());
  const [selectedAccountId, setSelectedAccountId] = useState(charge.accountId || '');
  const [autoDeduct, setAutoDeduct] = useState(charge.autoDeduct || false);
  const [isPaying, setIsPaying] = useState(false);

  const isDark = theme === 'dark';

  const handleUpdateAmount = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }
    onUpdateAmount(charge.id, amount);
    setShowAmountModal(false);
  };

  const handleAssignAccount = () => {
    if (!selectedAccountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
      return;
    }
    onAssignAccount(charge.id, selectedAccountId, autoDeduct);
    setShowAccountModal(false);
  };

  const handlePayCharge = async () => {
    if (isPaying) return;
    
    setIsPaying(true);
    try {
      // ✅ Vérifier si la charge peut être payée
      if (onCanPayCharge) {
        const validation = await onCanPayCharge(charge.id);
        if (!validation.canPay) {
          Alert.alert('Impossible de payer', validation.reason || 'Cette charge ne peut pas être payée pour le moment');
          return;
        }
      }

      if (charge.accountId) {
        // Payer avec le compte assigné
        await onMarkAsPaid(charge.id, charge.accountId);
        Alert.alert('Succès', 'Charge payée avec succès');
      } else {
        // Demander de sélectionner un compte
        setShowAccountModal(true);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      Alert.alert('Erreur', 'Impossible de payer cette charge');
    } finally {
      setIsPaying(false);
    }
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'Aucun compte';
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Compte inconnu';
  };

  const getStatusColor = () => {
    if (charge.isPaid) return '#10B981'; // Vert pour payé
    const dueDate = new Date(charge.calculatedDate);
    const today = new Date();
    if (dueDate < today) return '#EF4444'; // Rouge pour en retard
    return '#F59E0B'; // Orange pour à venir
  };

  const getStatusText = () => {
    if (charge.isPaid) return '✅ Payé';
    const dueDate = new Date(charge.calculatedDate);
    const today = new Date();
    if (dueDate < today) return '⏰ En retard';
    return '📅 À venir';
  };

  return (
    <View style={[styles.card, isDark && styles.darkCard]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, isDark && styles.darkText]}>
            {charge.name}
          </Text>
          <Text style={[styles.arabicName, isDark && styles.darkSubtext]}>
            {charge.arabicName}
          </Text>
        </View>
        <View style={[
          styles.typeBadge,
          charge.type === 'obligatory' ? styles.obligatoryBadge : 
          charge.type === 'recommended' ? styles.recommendedBadge : styles.customBadge
        ]}>
          <Text style={styles.typeText}>
            {charge.type === 'obligatory' ? 'Obligatoire' : 
             charge.type === 'recommended' ? 'Recommandé' : 'Personnalisé'}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, isDark && styles.darkSubtext]}>
        {charge.description}
      </Text>

      <View style={styles.details}>
        <View style={styles.dateContainer}>
          <Text style={[styles.date, isDark && styles.darkSubtext]}>
            📅 {charge.calculatedDate.toLocaleDateString('fr-FR')}
          </Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {charge.accountId && (
            <Text style={[styles.account, isDark && styles.darkSubtext]}>
              💳 {getAccountName(charge.accountId)}
              {charge.autoDeduct && ' (Auto)'}
            </Text>
          )}
        </View>
        <Text style={[styles.amount, isDark && styles.darkText]}>
          {formatAmount(charge.amount)}
        </Text>
      </View>

      <View style={styles.actions}>
        {!charge.isPaid ? (
          <>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.payButton,
                isPaying && styles.disabledButton
              ]}
              onPress={handlePayCharge}
              disabled={isPaying}
            >
              <Text style={styles.actionText}>
                {isPaying ? '⏳' : '💰'} {isPaying ? 'Paiement...' : 'Payer'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setShowAmountModal(true)}
            >
              <Text style={styles.actionText}>✏️ Montant</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.accountButton]}
              onPress={() => setShowAccountModal(true)}
            >
              <Text style={styles.actionText}>🏦 Compte</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.paidContainer}>
            <Text style={[styles.paidText, isDark && styles.darkSubtext]}>
              ✅ Payé le {charge.paidDate?.toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>

      {/* Modal de modification du montant */}
      <Modal
        visible={showAmountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Modifier le montant
            </Text>
            <Text style={[styles.modalSubtitle, isDark && styles.darkSubtext]}>
              {charge.name}
            </Text>
            
            <TextInput
              style={[styles.amountInput, isDark && styles.darkInput]}
              value={newAmount}
              onChangeText={setNewAmount}
              placeholder="Montant"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAmountModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateAmount}
              >
                <Text style={styles.confirmButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection de compte */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Assigner un compte
            </Text>
            <Text style={[styles.modalSubtitle, isDark && styles.darkSubtext]}>
              {charge.name} - {formatAmount(charge.amount)}
            </Text>
            
            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>
              Sélectionner un compte:
            </Text>
            
            <View style={styles.accountsList}>
              {accounts.map(account => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountOption,
                    selectedAccountId === account.id && styles.accountOptionSelected,
                    isDark && styles.darkAccountOption
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
                  <View style={styles.accountInfo}>
                    <Text style={[
                      styles.accountName,
                      selectedAccountId === account.id && styles.accountNameSelected,
                      isDark && styles.darkText
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.accountBalance, isDark && styles.darkSubtext]}>
                      {formatAmount(account.balance)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.autoDeductToggle, autoDeduct && styles.autoDeductActive]}
              onPress={() => setAutoDeduct(!autoDeduct)}
            >
              <View style={[styles.toggleThumb, autoDeduct && styles.toggleThumbActive]} />
              <Text style={[styles.autoDeductText, isDark && styles.darkText]}>
                Prélèvement automatique
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAssignAccount}
                disabled={!selectedAccountId}
              >
                <Text style={styles.confirmButtonText}>
                  Assigner
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  arabicName: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  obligatoryBadge: {
    backgroundColor: '#FFE5E5',
  },
  recommendedBadge: {
    backgroundColor: '#E5F3FF',
  },
  customBadge: {
    backgroundColor: '#F0E5FF',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  account: {
    fontSize: 11,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#10B981',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  accountButton: {
    backgroundColor: '#8B5CF6',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paidContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  paidText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  darkModalContent: {
    backgroundColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: '#38383a',
    borderColor: '#555',
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  accountsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkAccountOption: {
    backgroundColor: '#38383a',
    borderColor: '#555',
  },
  accountOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  accountNameSelected: {
    color: '#fff',
  },
  accountBalance: {
    fontSize: 12,
    color: '#666',
  },
  autoDeductToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  autoDeductActive: {
    backgroundColor: '#E5F3FF',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  toggleThumbActive: {
    backgroundColor: '#007AFF',
  },
  autoDeductText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default IslamicChargeCard;