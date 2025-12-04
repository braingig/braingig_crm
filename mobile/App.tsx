import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import AppNavigator from './src/navigation/AppNavigator';

const client = new ApolloClient({
    uri: 'http://localhost:4000/graphql',
    cache: new InMemoryCache(),
});

export default function App() {
    return (
        <ApolloProvider client={client}>
            <PaperProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </PaperProvider>
        </ApolloProvider>
    );
}
