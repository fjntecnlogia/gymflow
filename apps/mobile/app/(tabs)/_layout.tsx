import { Tabs } from "expo-router"
import { Home, QrCode, Calendar, CreditCard, User } from "lucide-react-native"

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#0D0D1A",
        borderTopColor: "#2A2A3A",
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: "#00E5FF",
      tabBarInactiveTintColor: "#8888AA",
      tabBarLabelStyle: { fontSize: 9, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index"      options={{ title: "Home",    tabBarIcon: ({ color }) => <Home      size={22} color={color} /> }} />
      <Tabs.Screen name="qrcode"     options={{ title: "QR Code", tabBarIcon: ({ color }) => <QrCode    size={22} color={color} /> }} />
      <Tabs.Screen name="agenda"     options={{ title: "Agenda",  tabBarIcon: ({ color }) => <Calendar  size={22} color={color} /> }} />
      <Tabs.Screen name="plano"      options={{ title: "Plano",   tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="perfil"     options={{ title: "Perfil",  tabBarIcon: ({ color }) => <User      size={22} color={color} /> }} />
    </Tabs>
  )
}
