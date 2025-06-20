import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  console.log('TabLayout rendered');

  // Adjust for Android's system navigation bar
  const tabBarHeight = Platform.OS === 'android' ? 70 : 60;
  const tabBarPadding = Platform.OS === 'android' ? 10 : 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6', // Blue-500
        tabBarInactiveTintColor: '#6B7280', // Gray-500
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: tabBarPadding,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        }
      }}>
        {/* Record Tab */}
        <Tabs.Screen
          name="record"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeTab : null}>
                <Ionicons 
                  name={focused ? "add-circle" : "add-circle-outline"} 
                  size={28} 
                  color={color} 
                />
                <StatusBar style="dark" />
              </View>
            ),
          }}
        />

        {/* Graph Tab */}
        <Tabs.Screen
          name="graph"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeTab : null}>
                <Ionicons 
                  name={focused ? "stats-chart" : "stats-chart-outline"} 
                  size={26} 
                  color={color} 
                />
                <StatusBar style="dark" />
              </View>
            ),
          }}
        />

        {/* Family Tab */}
        <Tabs.Screen
          name="familycode"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeTab : null}>
                <Ionicons 
                  name={focused ? "people" : "people-outline"} 
                  size={26} 
                  color={color} 
                />
                <StatusBar style="dark" />
              </View>
            ),
          }}
        />

        {/* AI Tab */}
        <Tabs.Screen
          name="askai"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activeTab : null}>
                <Ionicons 
                  name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} 
                  size={26} 
                  color={color} 
                />
                <StatusBar style="dark" />
              </View>
            ),
          }}
        />
      </Tabs>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = {
  activeTab: {
    backgroundColor: '#EFF6FF', // Light blue background for active tab
    borderRadius: 12,
    padding: 8,
    margin: -8, // Compensate for padding
  }
};