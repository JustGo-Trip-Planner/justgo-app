import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  value: Date | null;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatTH = (d: Date) => {
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function VotingDeadlineModal({ visible, value, onClose, onConfirm }: Props) {
  const now = useMemo(() => new Date(), []);
  const initial = useMemo(() => {
    // default: ตอนนี้ + 1 ชั่วโมง
    const d = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d;
  }, [value]);

  const [temp, setTemp] = useState<Date>(initial);
  const [step, setStep] = useState<"date" | "time">("date"); // เลือกวันก่อน แล้วเลือกเวลา

  useEffect(() => {
    if (visible) {
      setTemp(initial);
      setStep("date");
    }
  }, [visible, initial]);

  const onChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    
    setTemp((prev) => {
      const d = new Date(prev);
      if (step === "date") {
        d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return d;
    });
  };

  const reset = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    setTemp(d);
    setStep("date");
  };

  const canConfirm = temp.getTime() > Date.now(); // ต้องเป็นอนาคต

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}>
        <Pressable
          onPress={() => {}}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 90,
            borderRadius: 22,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.96)",
          }}
        >
          {/* Header */}
          <View style={{ padding: 14, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", flex: 1 }}>
              เลือกวันเวลาหมดโหวต
            </Text>

            <Pressable onPress={reset} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: "#6B7280", fontWeight: "700" }}>RESET</Text>
            </Pressable>

            <Pressable onPress={onClose} style={{ marginLeft: 4 }}>
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={{ height: 1, backgroundColor: "rgba(17,24,39,0.08)" }} />

          {/* Tabs */}
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setStep("date")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: step === "date" ? "#F97316" : "rgba(15,23,42,0.06)",
                }}
              >
                <Text style={{ color: step === "date" ? "white" : "#111827", fontWeight: "800" }}>
                  วัน
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setStep("time")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: step === "time" ? "#F97316" : "rgba(15,23,42,0.06)",
                }}
              >
                <Text style={{ color: step === "time" ? "white" : "#111827", fontWeight: "800" }}>
                  เวลา
                </Text>
              </Pressable>
            </View>

            {/* Preview */}
            <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: "white" }}>
              <Text style={{ color: "#64748B" }}>วันและเวลา</Text>
              <Text style={{ marginTop: 4, fontSize: 16, fontWeight: "800", color: "#111827" }}>
                {formatTH(temp)}
              </Text>
              <Text style={{ marginTop: 6, color: canConfirm ? "#16A34A" : "#EF4444", fontWeight: "700" }}>
                {canConfirm ? "พร้อมใช้งาน" : "ต้องเป็นเวลาในอนาคต"}
              </Text>
            </View>

            {/* Picker */}
            <View style={{ marginTop: 12, borderRadius: 16, overflow: "hidden", backgroundColor: "white" }}>
              <DateTimePicker
                value={temp}
                mode={step}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChange}
                minimumDate={step === "date" ? now : undefined}
                minuteInterval={5}
              />
            </View>

            {/* Confirm */}
            <Pressable
              disabled={!canConfirm}
              onPress={() => onConfirm(temp)}
              style={{
                marginTop: 14,
                backgroundColor: canConfirm ? "#F97316" : "rgba(249,115,22,0.4)",
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>ยืนยัน</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}