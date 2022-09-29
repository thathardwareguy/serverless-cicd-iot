#include <Arduino.h>
//Include required libraries
#include <WiFi.h>
#include <HTTPClient.h>
#include <Update.h>
#ifndef VERSION
#define VERSION local
#endif
#define STRINGIFY(s) STRINGIFY1(s)
#define STRINGIFY1(s) #s
#define RAWVERSION STRINGIFY(VERSION)

#define getFirmwareUrl "https://strzmsrcsi.execute-api.us-east-2.amazonaws.com/dev/firmwares"
WiFiClient Client;
// WiFi credentials
const char* ssid = "DIT";         
const char* password = "Project12"; 

/* 
 * Check if needs to update the device and returns the download url.
 */
String getDownloadUrl()
{
  HTTPClient http;
  String downloadUrl;
  Serial.print("[HTTP] begin...\n");

  String url = getFirmwareUrl;
  url += String("?rawVersion=") + RAWVERSION;
  http.begin(url);

  Serial.print("[HTTP] GET...\n");
  // start connection and send HTTP header
  int httpCode = http.GET();

  // httpCode will be negative on error
  if (httpCode > 0)
  {
    // HTTP header has been send and Server response header has been handled
    Serial.printf("[HTTP] GET... code: %d\n", httpCode);

    // file found at server
    if (httpCode == HTTP_CODE_OK)
    {
      String payload = http.getString();
      Serial.println(payload);
      downloadUrl = payload.substring(13,payload.length()-2);
    }
    else
    {
      Serial.println("Device is up to date!");
    }
  }
  else
  {
    Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();

  return downloadUrl;
}

/* 
 * Download binary image and use Update library to update the device.
 */
bool downloadUpdate(String url)
{
  HTTPClient http;
  Serial.print("[HTTP] Download begin...\n");

  http.begin(url);

  Serial.print("[HTTP] GET...\n");
  // start connection and send HTTP header
  delay(3000);
  Serial.println("Start update...");
  int httpCode = http.GET();
  if (httpCode > 0)
  {
    // HTTP header has been send and Server response header has been handled
    Serial.printf("[HTTP] GET... code: %d\n", httpCode);
    bool flag = true;
    // file found at server
    if (httpCode == HTTP_CODE_OK)
    {

      int contentLength = http.getSize();
      Serial.println("contentLength : " + String(contentLength));

      if (contentLength > 0)
      {
        bool canBegin = Update.begin(contentLength);
        if (canBegin)
        {
          WiFiClient stream = http.getStream();
          Serial.println("Begin OTA. This may take 2 - 5 mins to complete. Things might be quite for a while.. Patience!");
          size_t written = Update.writeStream(stream);

          if (written == contentLength)
          {
            Serial.println("Written : " + String(written) + " successfully");
            flag = false;
          }
          else
          {
            Serial.println("Written only : " + String(written) + "/" + String(contentLength) + ". Retry?");
          }

          if (Update.end())
          {
            Serial.println("OTA done!");
            if (Update.isFinished())
            {
              Serial.println("Update successfully completed. Rebooting.");
              ESP.restart();
              return true;
            }
            else
            {
              Serial.println("Update not finished? Something went wrong!");
              return false;
            }
          }
          else
          {
            Serial.println("Error Occurred. Error #: " + String(Update.getError()));
            return false;
          }
        }
        else
        {
          Serial.println("Not enough space to begin OTA");
          Client.flush();
          return false;
        }
      }
      else
      {
        Serial.println("There was no content in the response");
        Client.flush();
        return false;
      }
    }
    else
    {
      return false;
    }
  }
  else
  {
    return false;
  }
}

void setup()
{
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  pinMode(LED_BUILTIN, OUTPUT);
  delay(10000);
  Serial.println("\n Starting");
  Serial.println();
  Serial.print("Connecting to wifi: ");
  Serial.println(ssid);
  Serial.flush();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(RAWVERSION);
  delay(3000);
  // Check if we need to download a new version
  String downloadUrl = getDownloadUrl();
  if (downloadUrl.length() > 0)
  {
    bool success = downloadUpdate(downloadUrl);
    if (!success)
    {
      Serial.println("Error updating device");
    }
  }

  Serial.println("HTTP server started");

  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

int ledState = LOW;
const long interval = 3000;
unsigned long previousMillis = 0;

void loop()
{
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval)
  {
    previousMillis = currentMillis;
    ledState = ledState == LOW ? HIGH : LOW;
    digitalWrite(BUILTIN_LED, ledState);
  }
Serial.println("Reading to test version 4.1.1....");
delay(2000);
}