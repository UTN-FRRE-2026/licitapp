import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PerfilPublicoContent } from '../../../components/PerfilPublicoContent';

export default function PerfilConstructorPublicoScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  return <PerfilPublicoContent uid={uid ?? ''} />;
}
