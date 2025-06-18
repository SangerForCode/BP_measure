import axios from 'axios';
import React, { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Errors {
  systolic?: string;
  diastolic?: string;
  pulse?: string;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  unit: string;
  icon?: string;
}

export default function VitalSignsForm() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [tookMedicine, setTookMedicine] = useState(false);
  const [hadSymptoms, setHadSymptoms] = useState(false);
  const [exercised, setExercised] = useState(false);
  const [stressLevel, setStressLevel] = useState(false);

  const validateInput = (value: string, min: number, max: number) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  const handleSubmit = async () => {
    const newErrors: Errors = {};
    
    if (!validateInput(systolic, 50, 300)) {
      newErrors.systolic = 'Enter a valid systolic pressure (50-300)';
    }
    if (!validateInput(diastolic, 40, 200)) {
      newErrors.diastolic = 'Enter a valid diastolic pressure (40-200)';
    }
    if (!validateInput(pulse, 30, 200)) {
      newErrors.pulse = 'Enter a valid pulse rate (30-200)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const vital_signs = {
        timestamp: new Date().toISOString(),
        blood_pressure: {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          unit: 'mmHg'
        },
        pulse_rate: {
          value: parseInt(pulse),
          unit: 'bpm'
        },
        medication_taken: tookMedicine,
        had_symptoms: hadSymptoms,
        exercised_today: exercised,
        high_stress_level: stressLevel,
        notes: ''
      };

      try {
        const response = await axios.post('https://health-app-asr-default-rtdb.firebaseio.com/tryout.json', {vital_signs});
        console.log('Data uploaded successfully:', response.data);
        Alert.alert('Success', 'Data has been uploaded to the cloud!');
        
        // Clear form after successful upload
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setTookMedicine(false);
        setHadSymptoms(false);
        setExercised(false);
        setStressLevel(false);
      } catch (error) {
        console.error('Error uploading data:', error);
        Alert.alert('Error', 'Failed to upload data. Please try again.');
      }
    }
  };

  const renderCheckbox = (label: string, value: boolean, onValueChange: (value: boolean) => void, icon: string) => (
    <TouchableOpacity 
      style={styles.checkboxContainer} 
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxIcon}>{icon}</Text>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderInputField = ({ label, value, onChangeText, placeholder, error, unit, icon }: InputFieldProps) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
        <View style={styles.unitContainer}>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>❤️</Text>
          </View>
          <Text style={styles.title}>Vital Signs</Text>
          <Text style={styles.subtitle}>Record your health measurements</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Blood Pressure Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Blood Pressure</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Systolic</Text>
                <View style={[styles.inputWrapper, errors.systolic && styles.inputError]}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.systolicIcon}>↑</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    value={systolic}
                    onChangeText={setSystolic}
                    placeholder="120"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.unitContainer}>
                    <Text style={styles.unit}>mmHg</Text>
                  </View>
                </View>
                {errors.systolic && (
                  <Text style={styles.smallErrorText}>{errors.systolic}</Text>
                )}
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Diastolic</Text>
                <View style={[styles.inputWrapper, errors.diastolic && styles.inputError]}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.diastolicIcon}>↓</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    value={diastolic}
                    onChangeText={setDiastolic}
                    placeholder="80"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.unitContainer}>
                    <Text style={styles.unit}>mmHg</Text>
                  </View>
                </View>
                {errors.diastolic && (
                  <Text style={styles.smallErrorText}>{errors.diastolic}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Pulse Section */}
          {renderInputField({
            label: 'Pulse Rate',
            value: pulse,
            onChangeText: setPulse,
            placeholder: '72',
            error: errors.pulse,
            unit: 'bpm',
            icon: '⚡'
          })}

          {/* Health Checkboxes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📝</Text>
              <Text style={styles.sectionTitle}>Health Status</Text>
            </View>
            
            {renderCheckbox('Did you take your medicine?', tookMedicine, setTookMedicine, '💊')}
            {renderCheckbox('Did you experience any symptoms?', hadSymptoms, setHadSymptoms, '🤒')}
            {renderCheckbox('Did you exercise today?', exercised, setExercised, '🏃')}
            {renderCheckbox('Are you feeling stressed?', stressLevel, setStressLevel, '😰')}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Record Vital Signs</Text>
          </TouchableOpacity>

          {/* Info Footer */}
          <View style={styles.infoFooter}>
            <Text style={styles.infoText}>
              💡 Normal ranges: BP 90-140/60-90 mmHg, Pulse 60-100 bpm
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  contentContainer: {
    flexGrow: 1,
  },
  wrapper: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerIconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
    minHeight: 56,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  icon: {
    fontSize: 20,
  },
  systolicIcon: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  diastolicIcon: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  unitContainer: {
    paddingRight: 12,
  },
  unit: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  smallErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  spacer: {
    height: 32,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoFooter: {
    marginTop: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#2563EB',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});