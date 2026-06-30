#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>

class WiFiManager {
public:
  static bool connectToWiFi(const char* ssid, const char* password, int maxAttempts = 20) {
    Serial.println("\nStarting WiFi connection...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi connected");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      return true;
    } else {
      Serial.println("\nFailed to connect to WiFi");
      return false;
    }
  }
  
  static bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
  }
  
  static String getLocalIP() {
    return WiFi.localIP().toString();
  }
  
  static String getMacAddress() {
    return WiFi.macAddress();
  }
  
  static void disconnect() {
    WiFi.disconnect(true); // true = turn off WiFi radio
  }
};

#endif // WIFI_MANAGER_H
