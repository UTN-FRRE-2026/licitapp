// Pantalla — Recuperar contraseña
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../constants/colors';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { sendPasswordReset } from '../../services/auth.service';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

export default function RecuperarScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await sendPasswordReset(data.email.trim());
      setSentTo(data.email.trim());
      setSent(true);
    } catch {
      // Por privacidad no revelamos si el correo existe: mostramos éxito igual.
      setSentTo(data.email.trim());
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <BackButton />
          </View>

          {sent ? (
            <View style={styles.successBlock}>
              <View style={styles.successIconWrap}>
                <Text style={styles.successIcon}>✉️</Text>
              </View>
              <Text style={styles.title}>Revisá tu correo</Text>
              <Text style={styles.subtitle}>
                Si <Text style={styles.email}>{sentTo}</Text> tiene una cuenta,
                te enviamos un enlace para restablecer tu contraseña. Mirá también
                la carpeta de spam.
              </Text>
              <Button
                label="Volver a iniciar sesión"
                onPress={() => router.replace('/(auth)/login')}
                style={{ marginTop: 24 }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresá el correo con el que te registraste y te enviamos un enlace
                para crear una nueva.
              </Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Correo electrónico"
                    placeholder="vos@ejemplo.com"
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <Button
                label="Enviar enlace"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={styles.submitBtn}
              />

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={styles.loginLink}
              >
                <Text style={styles.loginText}>
                  ¿Te acordaste?{' '}
                  <Text style={styles.link}>Iniciá sesión</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: colors.gray[500], marginBottom: 28, lineHeight: 21 },
  email: { fontWeight: '700', color: colors.gray[700] },
  submitBtn: { marginTop: 8 },
  loginLink: { paddingVertical: 16, alignItems: 'center' },
  loginText: { fontSize: 13, color: colors.gray[500] },
  link: { color: colors.brand[600], fontWeight: '600' },

  successBlock: { alignItems: 'center', paddingTop: 20 },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: { fontSize: 44 },
});
