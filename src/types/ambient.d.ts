// Ambient module declarations to reduce noise during initial TS pass

declare module 'expo-sharing';
declare module 'expo-crypto';
declare module 'expo-localization';
declare module 'expo-constants';
declare module 'expo-secure-store';
declare module 'expo-updates';
declare module 'expo-linear-gradient';
declare module 'expo-linking';
declare module 'expo-router';

// Minimal typed shim for expo-local-authentication used in the app
declare module 'expo-local-authentication' {
	export enum AuthenticationType {
		FINGERPRINT = 1,
		FACIAL_RECOGNITION = 2,
		IRIS = 3
	}

	export function hasHardwareAsync(): Promise<boolean>;
	export function isEnrolledAsync(): Promise<boolean>;
	export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
	export function authenticateAsync(options?: any): Promise<{ success: boolean; error?: string }>; 
}

// Minimal shim for expo-sqlite
declare module 'expo-sqlite' {
  // Simple ambient types to satisfy usage in the repo
  export interface SQLiteDatabase {
    getAllAsync<T = any>(query: string, params?: any[]): Promise<T[]>;
    getFirstAsync<T = any>(query: string, params?: any[]): Promise<T | null>;
    runAsync(query: string, params?: any[]): Promise<any>;
    execAsync(query: string): Promise<any>;
    closeAsync(): Promise<void>;
  }
  export function openDatabase(name?: string): SQLiteDatabase;
  export function openDatabaseAsync(name?: string): Promise<SQLiteDatabase>;
}

declare module 'react-native-chart-kit';
declare module 'react-native-svg';

// Navigation type shims to avoid namespace-as-type errors across the repo
declare module '@react-navigation/native' {
  export type RouteProp<T, K extends keyof T> = any;
  export function useNavigation<T = any>(): any;
  export function useRoute<T = any>(): any;
  export function useFocusEffect(cb: any): any;
  export const NavigationContainer: any;
}

declare module '@react-navigation/stack' {
  export type StackNavigationProp<ParamList extends Record<string, any> = any, RouteName extends keyof ParamList = any> = any;
  export function createStackNavigator<ParamList extends Record<string, any> = any>(): any;
}

declare module '@react-navigation/drawer' {
  export type DrawerContentComponentProps = any;
  export function createDrawerNavigator<ParamList extends Record<string, any> = any>(): any;
}

declare module '@react-navigation/native-stack' {
	export type NativeStackNavigationProp<ParamList extends Record<string, any> = any, RouteName extends keyof ParamList = any> = any;
	export function createNativeStackNavigator<ParamList extends Record<string, any> = any>(): any;
}

declare module '@/*';

// Image modules
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' { const content: any; export default content; }
declare module '*.webp';
