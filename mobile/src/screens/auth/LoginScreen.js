import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      alert(result.error);
    }
  };

  return (
    <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior="padding">
        <View style={styles.header}>
          <Text style={styles.title}>MindWear</Text>
          <Text style={styles.subtitle}>Mental Health Monitoring</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={secureText ? 'eye-off' : 'eye'}
                onPress={() => setSecureText(!secureText)}
              />
            }
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 50
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  input: {
    marginBottom: 15
  },
  error: {
    color: '#d32f2f',
    marginBottom: 10,
    fontSize: 12
  },
  button: {
    marginTop: 20,
    paddingVertical: 8
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  registerText: {
    color: '#666',
    fontSize: 14
  },
  registerLink: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default LoginScreen;
