// navigationUtils.ts
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './navigation/StackNavigator';

/**
 * Type-safe navigation hook that provides proper typing for the navigation object
 * Use this instead of the regular useNavigation() to get TypeScript support
 */
export function useAppNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

/**
 * Type-safe route hook for accessing route params
 * Use this with a specific route name to get properly typed params
 * @example const route = useAppRoute<'RideDetails'>();
 */
export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>();
}