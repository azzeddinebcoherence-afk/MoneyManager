// src/screens/auth/ForgotPasswordScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordAuth } from '../../services/auth/passwordAuth';

const ForgotPasswordScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string;
    newPassword?: string; 
    confirmPassword?: string;
    verificationCode?: string;
  }>({});

  // Code de vérification simulé (dans une vraie app, ce serait envoyé par email)
  const VERIFICATION_CODE = '123456';

  const validateEmail = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Validation code
    if (!verificationCode) {
      newErrors.verificationCode = 'Le code de vérification est requis';
    } else if (verificationCode !== VERIFICATION_CODE) {
      newErrors.verificationCode = 'Code de vérification invalide';
    }
    
    // Validation nouveau mot de passe
    if (!newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    // Validation confirmation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;
    
    setLoading(true);
    setErrors({});

    try {
      // Vérifier si l'email existe
      const isRegistered = await PasswordAuth.isRegistered();
      
      if (!isRegistered) {
        Alert.alert('Erreur', 'Aucun compte trouvé avec cet email');
        return;
      }

      // Dans une vraie app, on enverrait un email ici
      // Pour le moment, on simule l'envoi
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        '✉️ Code envoyé', 
        `Un code de vérification a été envoyé à ${email}\n\nCode de test : ${VERIFICATION_CODE}`,
        [{ 
          text: 'OK',
          onPress: () => setStep('reset')
        }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;
    
    setLoading(true);

    try {
      // Réinitialiser le mot de passe
      const result = await PasswordAuth.resetPassword(newPassword);
      
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de réinitialiser le mot de passe');
        return;
      }
      
      Alert.alert(
        '✅ Mot de passe réinitialisé', 
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        [{ 
          text: 'OK',
          onPress: () => navigation?.navigate('Login')
        }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de réinitialiser le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header avec bouton retour */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goToLogin} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#17233C" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={32} color="#6C63FF" />
          </View>
          <Text style={styles.title}>
            {step === 'verify' ? 'Mot de passe oublié' : 'Réinitialiser'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'verify' 
              ? 'Entrez votre email pour recevoir un code de vérification'
              : 'Entrez le code reçu et votre nouveau mot de passe'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'verify' ? (
            <>
              {/* Étape 1: Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#bdbdbd"
                    editable={!loading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSendCode} 
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="mail" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Envoyer le code</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Étape 2: Code et nouveau mot de passe */}
              <View style={styles.emailDisplay}>
                <Ionicons name="mail" size={16} color="#6B7280" />
                <Text style={styles.emailDisplayText}>{email}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Code de vérification</Text>
                <View style={[styles.inputWrapper, errors.verificationCode && styles.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    value={verificationCode}
                    onChangeText={(text) => {
                      setVerificationCode(text);
                      if (errors.verificationCode) setErrors({ ...errors, verificationCode: undefined });
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#bdbdbd"
                    editable={!loading}
                  />
                </View>
                {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={[styles.inputWrapper, errors.newPassword && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Au moins 6 caractères"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                    }}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor="#bdbdbd"
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)} 
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#bdbdbd"
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleResetPassword} 
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={() => setStep('verify')}
              >
                <Text style={styles.resendText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Lien vers connexion */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous vous souvenez ? </Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { flexGrow: 1, padding: 24 },
  
  topBar: {
    marginBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#17233c' },
  subtitle: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginTop: 6, 
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  form: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },

  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  emailDisplayText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
  },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputError: { borderColor: '#EF4444' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#17233C',
  },
  eyeIcon: { padding: 4 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  button: {
    marginTop: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
