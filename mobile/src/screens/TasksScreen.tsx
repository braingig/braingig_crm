import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TasksScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Tasks
            </Text>
            <Text variant="bodyLarge" style={styles.placeholder}>
                Your tasks will appear here
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 16,
    },
    placeholder: {
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 48,
    },
});
