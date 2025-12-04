import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useMutation, gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      user {
        id
        name
        email
      }
    }
  }
`;

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [login, { loading }] = useMutation(LOGIN_MUTATION, {
        onCompleted: () => onLogin(),
    });

    const handleLogin = () => {
        login({ variables: { email, password } });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text variant="displaySmall" style={styles.title}>
                    Welcome Back
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Sign in to continue
                </Text>

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry
                />

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                >
                    Sign In
                </Button>

                <Text variant="bodySmall" style={styles.demo}>
                    Demo: admin@example.com / admin123
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        color: '#6b7280',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
    demo: {
        textAlign: 'center',
        marginTop: 24,
        color: '#9ca3af',
    },
});
