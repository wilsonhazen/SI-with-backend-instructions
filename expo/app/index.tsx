import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, SplashScreen } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

const TOS_ACCEPTED_KEY = '@sourceimpact_tos_accepted';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const navigate = async () => {
      if (!authLoading && !dataLoading) {
        await SplashScreen.hideAsync();
        
        if (isAuthenticated) {
          try {
            const tosAccepted = await AsyncStorage.getItem(TOS_ACCEPTED_KEY);
            if (!tosAccepted) {
              router.replace('/terms-of-service');
            } else {
              router.replace('/(tabs)/home');
            }
          } catch (error) {
            console.error('Failed to check ToS acceptance:', error);
            router.replace('/(tabs)/home');
          }
        } else {
          router.replace('/onboarding');
        }
        setIsChecking(false);
      }
    };

    navigate();
  }, [isAuthenticated, authLoading, dataLoading, router]);

  if (isChecking) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
