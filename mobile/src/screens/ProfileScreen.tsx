import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Profile
            </Text>
            <Text variant="bodyLarge" style={styles.placeholder}>
                Your profile information
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
