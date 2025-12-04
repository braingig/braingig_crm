import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen() {
    const stats = [
        { label: 'Employees', value: '24', icon: 'account-group', color: '#6366f1' },
        { label: 'Projects', value: '12', icon: 'folder', color: '#14b8a6' },
        { label: 'Tasks', value: '48', icon: 'check-circle', color: '#f59e0b' },
        { label: 'Hours', value: '160', icon: 'clock', color: '#ef4444' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    Dashboard
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Overview of your activities
                </Text>
            </View>

            <View style={styles.statsGrid}>
                {stats.map((stat) => (
                    <Card key={stat.label} style={styles.statCard}>
                        <Card.Content>
                            <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                                <Icon name={stat.icon} size={24} color={stat.color} />
                            </View>
                            <Text variant="headlineMedium" style={styles.statValue}>
                                {stat.value}
                            </Text>
                            <Text variant="bodyMedium" style={styles.statLabel}>
                                {stat.label}
                            </Text>
                        </Card.Content>
                    </Card>
                ))}
            </View>

            <Card style={styles.card}>
                <Card.Title title="Recent Activity" />
                <Card.Content>
                    <Text variant="bodyMedium" style={styles.placeholder}>
                        No recent activity
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#6b7280',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
    },
    statCard: {
        width: '48%',
        margin: '1%',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#6b7280',
    },
    card: {
        margin: 16,
    },
    placeholder: {
        color: '#9ca3af',
        textAlign: 'center',
        paddingVertical: 24,
    },
});
