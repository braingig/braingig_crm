import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TimeTrackerScreen from '../screens/TimeTrackerScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#6366f1',
                tabBarInactiveTintColor: '#9ca3af',
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="view-dashboard" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="TimeTracker"
                component={TimeTrackerScreen}
                options={{
                    title: 'Time',
                    tabBarIcon: ({ color }) => <Icon name="clock-outline" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="check-circle-outline" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="account-outline" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <Stack.Screen name="Login">
                    {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
                </Stack.Screen>
            ) : (
                <Stack.Screen name="Main" component={MainTabs} />
            )}
        </Stack.Navigator>
    );
}
