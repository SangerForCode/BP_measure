import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

// Type definitions for health data
interface VitalSigns {
  blood_pressure: {
    systolic: number;
    diastolic: number;
  };
  pulse_rate: {
    value: number;
  };
  high_stress_level?: boolean;
  had_symptoms?: boolean;
  exercised_today?: boolean;
  medication_taken?: boolean;
  notes?: string;
  timestamp?: string;
}

interface HealthData {
  vital_signs: VitalSigns;
}

// Add a type for the record to help TypeScript
interface FirebaseHealthRecord {
  vital_signs: {
    blood_pressure?: { systolic?: number; diastolic?: number };
    pulse_rate?: { value?: number };
    high_stress_level?: boolean;
    had_symptoms?: boolean;
    exercised_today?: boolean;
    medication_taken?: boolean;
    notes?: string;
    timestamp?: string;
  };
}

const MedicalAIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Dr. AI, your virtual medical assistant. I can help with health questions and provide medical recommendations. You can also fetch your health data for personalized advice. Please describe your symptoms or health concerns.",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userHealthData, setUserHealthData] = useState<HealthData | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [useHealthData, setUseHealthData] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyApeS7EsK4LzpkYYCxz_1Za-pOD5qWJcCk';
  const FIREBASE_API_URL = 'https://health-app-asr-default-rtdb.firebaseio.com/tryout.json';

  // Remove or comment out the scrollToBottom effect and function
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // const scrollToBottom = () => {
  //   setTimeout(() => {
  //     scrollViewRef.current?.scrollToEnd({ animated: true });
  //   }, 100);
  // };

  // Utility functions for status
  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic > 160 || diastolic > 100) return '🟡 Elevated';
    if (systolic > 140 || diastolic > 90) return '🟢 Normal';
    if (systolic < 90 || diastolic < 60) return '🔴 Low';
    return '🟢 Normal';
  };

  const getPulseStatus = (pulse: number) => {
    if (pulse > 100) return '🔴 High (Tachycardia)';
    if (pulse < 60) return '🔴 Low (Bradycardia)';
    return '🟢 Normal';
  };

  // Enhanced formatHealthData
  const formatHealthData = (data: HealthData) => {
    let formattedData = '';
    if (data.vital_signs?.blood_pressure) {
      formattedData += `🩺 Blood Pressure: ${data.vital_signs.blood_pressure.systolic}/${data.vital_signs.blood_pressure.diastolic} mmHg ${getBPStatus(data.vital_signs.blood_pressure.systolic, data.vital_signs.blood_pressure.diastolic)}\n`;
    }
    if (data.vital_signs?.pulse_rate?.value) {
      formattedData += `💓 Pulse: ${data.vital_signs.pulse_rate.value} bpm ${getPulseStatus(data.vital_signs.pulse_rate.value)}\n`;
    }
    if (data.vital_signs?.medication_taken !== undefined) {
      formattedData += `💊 Medication: ${data.vital_signs.medication_taken ? 'Taken' : 'Not taken'}\n`;
    }
    if (data.vital_signs?.had_symptoms !== undefined) {
      formattedData += `😷 Symptoms: ${data.vital_signs.had_symptoms ? 'Present' : 'None reported'}\n`;
    }
    if (data.vital_signs?.exercised_today !== undefined) {
      formattedData += `🏃 Activity: ${data.vital_signs.exercised_today ? 'Active' : 'Sedentary'}\n`;
    }
    if (data.vital_signs?.high_stress_level !== undefined) {
      formattedData += `😰 Stress: ${data.vital_signs.high_stress_level ? 'High' : 'Normal'}\n`;
    }
    if (data.vital_signs?.notes) {
      formattedData += `📝 Notes: ${data.vital_signs.notes}\n`;
    }
    return formattedData || 'No health data available';
  };

  // Enhanced fetchUserHealthData
  const fetchUserHealthData = async () => {
    setIsFetchingData(true);
    try {
      console.log('Starting health data fetch from:', FIREBASE_API_URL);
      const response = await axios.get(FIREBASE_API_URL);
      console.log('Raw API response:', response.data);
      const healthData = response.data;
      console.log('Raw health data before transform:', healthData);
      // Convert the object of records into an array of record objects
      const records: FirebaseHealthRecord[] = Object.values(healthData);
      let latestRecord: FirebaseHealthRecord | null = null;
      if (records.length > 0) {
        // Filter out any records that might be malformed or lack a timestamp
        const validRecords = records.filter(record => record?.vital_signs?.timestamp);
        if (validRecords.length > 0) {
          // Sort records by timestamp in descending order to get the latest
          validRecords.sort((a, b) => {
            const timestampA = new Date(a.vital_signs.timestamp!).getTime();
            const timestampB = new Date(b.vital_signs.timestamp!).getTime();
            return timestampB - timestampA; // Descending sort
          });
          latestRecord = validRecords[0]; // The first element is now the latest
        }
      }
      if (!latestRecord) {
        console.warn("No valid latest health record found. Initializing with empty data.");
        setUserHealthData({
          vital_signs: {
            blood_pressure: { systolic: 0, diastolic: 0 },
            pulse_rate: { value: 0 },
            notes: '',
            timestamp: new Date().toISOString()
          }
        });
        const noDataMessage = {
          id: Date.now(),
          text: "ℹ️ No recent health data found. Please ensure your health records are being saved correctly.",
          isBot: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, noDataMessage]);
        setIsFetchingData(false);
        return;
      }
      const latestVitalSigns = latestRecord.vital_signs;
      const transformedData = {
        vital_signs: {
          blood_pressure: {
            systolic: latestVitalSigns.blood_pressure?.systolic ?? 0,
            diastolic: latestVitalSigns.blood_pressure?.diastolic ?? 0
          },
          pulse_rate: { value: latestVitalSigns.pulse_rate?.value ?? 0 },
          high_stress_level: latestVitalSigns.high_stress_level ?? false,
          had_symptoms: latestVitalSigns.had_symptoms ?? false,
          exercised_today: latestVitalSigns.exercised_today ?? false,
          medication_taken: latestVitalSigns.medication_taken ?? false,
          notes: latestVitalSigns.notes || '',
          timestamp: latestVitalSigns.timestamp ?? new Date().toISOString()
        }
      };
      console.log('Transformed health data:', transformedData);
      setUserHealthData(transformedData);
      setHealthHistory(prev => [...prev.slice(-4), transformedData]);
      console.log('Updated health history:', [...healthHistory.slice(-4), transformedData]);
      const formattedData = formatHealthData(transformedData);
      console.log('Formatted data string:', formattedData);
      const dataMessage = {
        id: Date.now(),
        text: `✅ Health data retrieved successfully!\n\n📊 Current Health Status:\n${formattedData}`,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, dataMessage]);
      console.log('Added data message to chat');
      setTimeout(() => {
        console.log('Starting health data analysis...');
        analyzeHealthData(transformedData);
      }, 1000);
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert(
        'Error',
        'Failed to fetch user health data. Please check your internet connection and try again.'
      );
      const errorMessage = {
        id: Date.now(),
        text: "❌ I couldn't retrieve your health data at the moment. Please try again later or contact support if the issue persists.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Enhanced analyzeHealthData
  const analyzeHealthData = async (healthData: HealthData) => {
    setIsLoading(true);
    try {
      console.log('Current health history for trends:', healthHistory);
      // Improved trend summary generation
      const trendSummary = healthHistory
        .filter(entry => entry?.vital_signs?.blood_pressure && entry?.vital_signs?.pulse_rate)
        .map((entry, i) =>
          `Reading ${i+1}: BP ${entry.vital_signs.blood_pressure.systolic}/${entry.vital_signs.blood_pressure.diastolic}, Pulse ${entry.vital_signs.pulse_rate.value}`
        )
        .join('\n');
      console.log('Trend summary being sent to AI:', trendSummary);
      const currentStatus = formatHealthData(healthData);
      console.log('Current status being sent to AI:', currentStatus);
      const analysisPrompt = `You are a doctor analyzing a patient's health data. Consider these trends:\n\n${trendSummary || "No significant trends detected"}\n\nCurrent Status:\n${currentStatus}\n\nProvide analysis covering:\n1. Trend interpretation\n2. Immediate concerns\n3. Recommended actions\n4. When to seek help`;
      console.log('Full prompt being sent to AI:', analysisPrompt);

      const response = await axios({
        url: GEMINI_API_URL,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt
                }
              ]
            }
          ]
        }
      });
      console.log('Raw AI response:', response.data);
      const aiAnalysis = response.data.candidates[0].content.parts[0].text;
      console.log('AI analysis result:', aiAnalysis);
      const analysisMessage = {
        id: Date.now() + 1,
        text: `🩺 **Comprehensive Health Analysis:**\n\n${aiAnalysis}`,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Error analyzing health data:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I encountered an issue while analyzing your health data. Please try asking me specific questions about your health concerns.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CSV Health Data Conversion Section --- 
  const convertHealthDataToCSV = (data: any) => {
    // 1. Convert Firebase object to array of records
    const records = Object.values(data) as any[];
    
    // 2. Process Blood Pressure Data
    const bloodPressureCSV = records
      .filter(record => record?.vital_signs?.blood_pressure && record?.vital_signs?.timestamp)
      .map(record => ({
        date: new Date(record.vital_signs.timestamp).toLocaleDateString(),
        time: new Date(record.vital_signs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
        systolic: record.vital_signs.blood_pressure.systolic,
        diastolic: record.vital_signs.blood_pressure.diastolic,
        unit: 'mmHg'
      }))
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

    // 3. Process Pulse Rate Data
    const pulseRateCSV = records
      .filter(record => record?.vital_signs?.pulse_rate && record?.vital_signs?.timestamp)
      .map(record => ({
        date: new Date(record.vital_signs.timestamp).toLocaleDateString(),
        time: new Date(record.vital_signs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
        pulse: record.vital_signs.pulse_rate.value,
        unit: 'bpm'
      }))
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

    // 4. Convert arrays to CSV strings
    const arrayToCSV = (arr: any[], title: string) => {
      if (arr.length === 0) return `${title}\nNo data available\n\n`;
      const headers = Object.keys(arr[0]).join(',');
      const rows = arr.map(obj => Object.values(obj).join(','));
      return `${title}\n${headers}\n${rows.join('\n')}\n\n`;
    };

    // 5. Combine both CSV outputs
    return arrayToCSV(bloodPressureCSV, 'Blood Pressure Data') + 
           arrayToCSV(pulseRateCSV, 'Pulse Rate Data');
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let prompt = "You are a medical AI assistant. ";
      console.log('Building AI prompt with user question:', inputText);
      
      if (useHealthData) {
        console.log('Health data checkbox is checked, fetching CSV data...');
        const response = await axios.get(FIREBASE_API_URL);
        const csvData = convertHealthDataToCSV(response.data);
        console.log('Generated CSV data:', csvData);
        
        prompt += `Here is the patient's complete health history in CSV format:\n\n${csvData}\n` +
                  `Question: ${inputText}\n\n` +
                  "Please analyze this data and provide:\n" +
                  "1. Any concerning trends or patterns\n" +
                  "2. Specific recommendations based on the data\n" +
                  "3. When to seek immediate medical attention\n" +
                  "4. Lifestyle adjustments if needed";
      } else {
        prompt += `Question: ${inputText}\n\n` +
                  "Please provide general medical advice.";
      }

      console.log('Final prompt being sent to AI:', prompt);

      const aiResponse = await axios({
        url: GEMINI_API_URL,
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        data: {
          contents: [{
            parts: [{ text: prompt }]
          }]
        }
      });
      
      console.log('Received AI response:', aiResponse.data);
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.data.candidates[0].content.parts[0].text,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      Alert.alert(
        'Error', 
        'Failed to get response. Please check your internet connection and try again.'
      );
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. If this is a medical emergency, please contact emergency services immediately.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: () => {
            setMessages([
              {
                id: 1,
                text: "Hello! I'm Dr. AI, your virtual medical assistant. I can help with health questions and provide medical recommendations. Please describe your symptoms or health concerns.",
                isBot: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          },
        },
      ]
    );
  };

  // Add markdownStyles for Markdown component
  const markdownStyles = StyleSheet.create({
    strong: {
      fontWeight: 'bold',
      color: '#000',
    },
    list_item: {
      marginVertical: 2,
      lineHeight: 20,
    },
    bullet_list: {
      marginBottom: 5,
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 10,
      color: '#333',
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 8,
      color: '#333',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 6,
      color: '#444',
    },
    code_inline: {
      backgroundColor: '#f0f0f0',
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
      padding: 2,
      borderRadius: 3,
    },
    code_block: {
      backgroundColor: '#f0f0f0',
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
      padding: 10,
      borderRadius: 5,
      marginVertical: 8,
    },
  });

  const renderMessage = (message: any) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isBot ? styles.botMessage : styles.userMessage
    ]}>
      <View style={[
        styles.messageBubble,
        message.isBot ? styles.botBubble : styles.userBubble
      ]}>
        {message.isBot && (
          <View style={styles.doctorHeader}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#2d5aa0" />
            <Text style={styles.doctorLabel}> Dr. AI</Text>
          </View>
        )}
        <Markdown
          style={
            message.isBot
              ? markdownStyles
              : { ...markdownStyles, text: { ...markdownStyles.text, color: '#fff' }, strong: { ...markdownStyles.strong, color: '#fff' } }
          }
        >
          {message.text}
        </Markdown>
        <Text style={[
          styles.timestamp,
          message.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#2d5aa0" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Medical AI Assistant</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This is for informational purposes only. Always consult a healthcare professional for medical advice.
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={styles.loadingText}>Dr. AI is analyzing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.fetchButtonContainer}>
            <TouchableOpacity
              style={[styles.fetchButton, isFetchingData && styles.disabledButton]}
              onPress={fetchUserHealthData}
              disabled={isFetchingData}
            >
              {isFetchingData ? (
                <View style={styles.loadingRow}>
                  <Ionicons name="stats-chart" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.fetchButtonText}>Loading...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="stats-chart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.fetchButtonText}>Fetch Health Data</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ADDED: Checkbox for using health data */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setUseHealthData(!useHealthData)}
            >
              <View style={[styles.checkbox, useHealthData && styles.checkedCheckbox]}>
                {useHealthData && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Use my data</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your health or describe symptoms..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <Text style={styles.characterCount}>{inputText.length}/500</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.disabledButton]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
              ) : (
                <Ionicons name="send" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  clearButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disclaimer: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  messageContainer: {
    marginVertical: 5,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  doctorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5aa0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  listItem: {
    marginLeft: 20,
    marginVertical: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fetchButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fetchButton: {
    backgroundColor: '#28a745',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    marginRight: 10,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  dataIndicator: {
    backgroundColor: '#d4edda',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  dataIndicatorText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    minHeight: 48,
  },
  characterCount: {
    position: 'absolute',
    bottom: 2,
    right: 12,
    fontSize: 10,
    color: '#999',
    backgroundColor: 'transparent',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  // ADDED: Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  headingText: {
    marginVertical: 8,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  heading4: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  codeBlock: {
    backgroundColor: '#f0f0f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    padding: 10,
    borderRadius: 5,
    marginVertical: 8,
  },
});

export default MedicalAIChatbot;