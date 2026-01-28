import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ImageBackground,
  ScrollView, Modal, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CountryPicker from 'react-native-country-picker-modal';
import Constants from 'expo-constants';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const activitiesOptions = ['ตั้งแคมป์', 'ดำน้ำ', 'นั่งเรือ', 'ถ่ายรูป', 'ชมพระอาทิตย์', 'เดินป่า'] as const;
type ActivityKey = typeof activitiesOptions[number];
const interestsOptions = ['ทะเล', 'ภูเขา', 'ป่า'] as const;
type InterestKey = typeof interestsOptions[number];

const interestIcons: Record<InterestKey, any> = {
  'ทะเล': require('@/assets/interests/sea.png'),
  'ภูเขา': require('@/assets/interests/mountain.png'),
  'ป่า': require('@/assets/interests/forest.png'),
};

const activityIcons: Record<ActivityKey, any> = {
  'ตั้งแคมป์': require('@/assets/activities/camping.png'),
  'ดำน้ำ': require('@/assets/activities/diving.png'),
  'นั่งเรือ': require('@/assets/activities/boat.png'),
  'ถ่ายรูป': require('@/assets/activities/photo.png'),
  'ชมพระอาทิตย์': require('@/assets/activities/sunrise.png'),
  'เดินป่า': require('@/assets/activities/trekking.png'),
};

export default function CreateProfile() {
  const router = useRouter();
  const { user, login, token, logout } = useAuth();
  const [step, setStep] = useState(1);

  const [avatar, setAvatar] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', gender: '',
    birth_date: '', phone: '', interests: [] as string[], activities: [] as string[]
  });

  const [countryCode, setCountryCode] = useState('TH');
  const [callingCode, setCallingCode] = useState('66');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const toggleArrayItem = (field: 'interests' | 'activities', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    const API_URL = Constants.expoConfig?.extra?.API_URL;
    try {

      if (!user?.id) {
        return;
      }

      const res = await axios.put(`${API_URL}/api/users/${user.id}`, {
        ...form,
        avatar: avatar,
        interests: form.interests,
        activities: form.activities,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await login(token!, res.data.user, true);

      setStep(4);
    } catch (err) {
      console.error('❌ Save failed', err);
      alert('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleBack = () => {
    if (step === 1) {
      logout();
      router.replace('/(auth)/login');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <ImageBackground source={require('@/assets/backgrounds/bg.png')} className="flex-1 px-6 pt-16 pb-10">
      <TouchableOpacity onPress={handleBack} className="absolute top-14 left-5 bg-white/70 rounded-full p-2 z-10">
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      {step === 1 && (
        <ScrollView>
          <Text className="text-2xl font-semibold text-center mt-2 mb-6">สร้างโปรไฟล์ของคุณ</Text>
          <Text className="text-center text-gray-700 font-sans mb-4">รูปโปรไฟล์</Text>

          <TouchableOpacity onPress={pickImage} className="self-center mb-4">
            {avatar ? (
              <Image source={{ uri: avatar }} className="w-36 h-36 rounded-full" />
            ) : (
              <View className="w-36 h-36 rounded-full bg-gray-300 justify-center items-center">
                <Text className="font-sans">เลือกรูป</Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="bg-white/90 p-6 rounded-2xl shadow-lg">
            <Text className="text-gray-700 font-medium mb-1">ชื่อจริง</Text>
            <TextInput placeholder="กรอกชื่อผู้ใช้งานของคุณ"value={form.first_name} onChangeText={v => setForm({ ...form, first_name: v })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4" />

            <Text className="text-gray-700 font-medium mb-1">นามสกุล</Text>
            <TextInput placeholder="กรอกนามสกุลของคุณ" value={form.last_name} onChangeText={v => setForm({ ...form, last_name: v })}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4" />

            {/* Gender + Birthday */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-1">เพศ</Text>
                <TouchableOpacity
                  onPress={() => setShowGenderModal(true)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
                >
                  <Text className={form.gender ? 'text-black' : 'text-gray-400'}>
                    {form.gender || 'เลือกเพศ'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#888" />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-1">วันเกิด</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
                >
                  <Text className={form.birth_date ? 'text-black' : 'text-gray-400'}>
                    {form.birth_date || 'เลือกวันเกิด'}
                  </Text>
                  <FontAwesome5 name="birthday-cake" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone */}
            <Text className="text-gray-700 font-medium mb-1">เบอร์โทรศัพท์</Text>
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white">
                <Ionicons name="chevron-down" size={18} color="#888" />
                <CountryPicker countryCode={countryCode as any} withFlag withCallingCode
                  onSelect={c => {
                    setCountryCode(c.cca2);
                    setCallingCode(c.callingCode[0]);
                  }} />
                <Text className="text-base">+{callingCode}</Text>
              </View>

              <TextInput
                placeholder="กรอกหมายเลขโทรศัพท์"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => setForm({ ...form, phone: v })}
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3"
              />
            </View>

            <TouchableOpacity onPress={() => setStep(2)} className="bg-orange-500 py-3 rounded-xl items-center mt-2">
              <Text className="text-white font-semibold text-lg">ถัดไป</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={showGenderModal} transparent animationType="fade">
            <TouchableOpacity className="flex-1 justify-center items-center bg-black/40"
              onPress={() => setShowGenderModal(false)}>
              <View className="bg-white w-64 rounded-xl p-4">
                {['ชาย', 'หญิง', 'อื่นๆ'].map(g => (
                  <TouchableOpacity key={g} onPress={() => {
                    setForm({ ...form, gender: g });
                    setShowGenderModal(false);
                  }} className="p-3 border-b border-gray-200">
                    <Text className="text-center">{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setForm({ ...form, birth_date: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView>
          <Text className="text-xl font-semibold text-center mb-4">เลือกประเภทท่องเที่ยวที่คุณชอบ</Text>
          <View className="flex flex-wrap flex-row justify-center gap-3 mt-12 mb-4">
            {interestsOptions.map(item => {
              const isSelected = form.interests.includes(item);
              return (
                <View key={item} className="items-center w-28">
                  <TouchableOpacity
                    onPress={() => toggleArrayItem('interests', item)}
                    className={`relative rounded-full border-4 ${
                      isSelected ? 'border-orange-400' : 'border-transparent'
                    }`}
                  >
                    <Image source={interestIcons[item]} className="w-24 h-24 rounded-full" />
                    {isSelected && (
                      <View className="absolute top-0 left-0 w-24 h-24 bg-black/40 rounded-full justify-center items-center z-10">
                        <Ionicons name="checkmark" size={32} color="white" />
                      </View>
                    )}
                </TouchableOpacity>
                <Text className="mt-2 text-center font-medium text-gray-700">{item}</Text>
              </View>
              );
            })}
          </View>

          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={() => setStep(3)}>
              <Text className="text-gray-600 font-sans underline">ข้าม</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(3)} className="bg-orange-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-medium">ถัดไป</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView>
          <Text className="text-xl font-semibold text-center mb-4">เลือกกิจกรรมที่คุณสนใจ</Text>
          <View className="flex flex-wrap flex-row justify-center gap-3 mt-12 mb-4">
            {activitiesOptions.map(item => {
              const isSelected = form.activities.includes(item);
              return (
                <View key={item} className="items-center w-28">
                  <TouchableOpacity 
                    onPress={() => toggleArrayItem('activities', item)}
                    className={`relative rounded-full border-4 ${
                      isSelected ? 'border-orange-400' : 'border-transparent'
                    }`}
                  >
                  <Image source={activityIcons[item]} className="w-24 h-24 rounded-full" />

                  {isSelected && (
                    <View className="absolute top-0 left-0 w-24 h-24 bg-black/40 rounded-full justify-center items-center z-10">
                      <Ionicons name="checkmark" size={32} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text className="mt-2 text-center font-medium text-gray-700">{item}</Text>
              </View>
              );
            })}
          </View>
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={handleSubmit}>
              <Text className="text-gray-600 font-sans underline">ข้าม</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} className="bg-orange-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-medium">เสร็จสิ้น</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 4 && (
        <View className="flex-1 justify-center items-center px-6 py-10 bg-cover bg-center">
          <Image
            source={require('@/assets/icons/logo.png')}
            resizeMode="contain"
            className="w-100 h-20 mb-6"
          />

          <View className="bg-white/70 p-6 rounded-2xl w-full max-w-sm items-center">
            <Text className="text-3xl font-semibold text-center mb-8 text-gray-900">สร้างบัญชีสำเร็จ!</Text>
            <Text className="text-xl font-semibold text-center mb-2 text-gray-900">คุณได้สร้างบัญชีเรียบร้อยแล้ว</Text>
            <Text className="text-gray-700 font-sans text-center mb-6">หลังจากนี้ คุณสามารถสร้างวางแผนได้โดยทันทีตามต้องการ</Text>

            <TouchableOpacity
              className="bg-orange-500 px-6 py-3 rounded-xl"
              onPress={() => router.replace('/(home)')}
            >
              <Text className="text-white font-semibold text-base">เริ่มวางแผนการเดินทาง!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}
