import React from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

export default function TimeTrackerScreen() {
    const [isTracking, setIsTracking] = React.useState(false);
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTracking) {
            interval = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking]);

    // Stop timer when app goes to background
    React.useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'background' && isTracking) {
                setIsTracking(false);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [isTracking]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Time Tracker
            </Text>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="displayMedium" style={styles.timer}>
                        {formatTime(elapsed)}
                    </Text>
                    <Text variant="bodyLarge" style={styles.status}>
                        {isTracking ? 'Tracking time...' : 'Not tracking'}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => setIsTracking(!isTracking)}
                        style={styles.button}
                        buttonColor={isTracking ? '#ef4444' : '#6366f1'}
                    >
                        {isTracking ? 'Stop' : 'Start'} Timer
                    </Button>
                </Card.Content>
            </Card>

            <View style={styles.stats}>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="bodySmall" style={styles.statLabel}>
                            Today
                        </Text>
                        <Text variant="headlineSmall" style={styles.statValue}>
                            0h 0m
                        </Text>
                    </Card.Content>
                </Card>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="bodySmall" style={styles.statLabel}>
                            This Week
                        </Text>
                        <Text variant="headlineSmall" style={styles.statValue}>
                            0h 0m
                        </Text>
                    </Card.Content>
                </Card>
            </View>
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
    card: {
        marginBottom: 16,
    },
    timer: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginVertical: 24,
    },
    status: {
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 24,
    },
    button: {
        paddingVertical: 6,
    },
    stats: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
    },
    statLabel: {
        color: '#6b7280',
        marginBottom: 4,
    },
    statValue: {
        fontWeight: 'bold',
    },
});
