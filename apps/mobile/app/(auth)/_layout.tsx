import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#08080F' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="esqueci-senha" />
      <Stack.Screen name="primeiro-acesso" />
      <Stack.Screen name="redefinir-senha" />
    </Stack>
  )
}
