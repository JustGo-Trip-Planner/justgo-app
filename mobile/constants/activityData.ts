export const activityGroups = [
  {
    id: "water",
    title: "กิจกรรมทางน้ำ",
    image: require("@/assets/activities/water.jpg"),
    items: [
      { id: "deep_diving", label: "ดำน้ำลึก" },
      { id: "snorkeling", label: "ดำน้ำตื้น" },
      { id: "kayaking", label: "พายคายัค" },
      { id: "jet_ski", label: "เจ็ตสกี" },
      { id: "rafting", label: "ล่องแพ" },
    ],
  },
  {
    id: "hiking",
    title: "กิจกรรมเดินป่า",
    image: require("@/assets/activities/trekking.jpg"),
    items: [
      { id: "trekking", label: "เดินป่า" },
      { id: "camping", label: "ตั้งแคมป์" },
      { id: "tent", label: "กางเต็นท์" },
      { id: "trail_explore", label: "สำรวจเส้นทาง" },
      { id: "wildlife", label: "ดูสัตว์ป่า" },
    ],
  },
  {
    id: "photo",
    title: "กิจกรรมถ่ายภาพ",
    image: require("@/assets/activities/photo.jpg"),
    items: [
      { id: "landscape_photo", label: "ถ่ายภาพวิว" },
      { id: "portrait_photo", label: "ถ่ายภาพบุคคล" },
      { id: "night_photo", label: "ถ่ายภาพกลางคืน" },
      { id: "day_photo", label: "ถ่ายภาพกลางวัน" },
      { id: "nature_photo", label: "ถ่ายภาพธรรมชาติ" },
    ],
  },
  {
    id: "extreme",
    title: "กิจกรรมผจญภัย",
    image: require("@/assets/activities/extreme.jpg"),
    items: [
      { id: "zipline", label: "โหนสลิง" },
      { id: "bungee", label: "บันจี้จัมพ์" },
      { id: "rock_climb", label: "ปีนหน้าผา" },
      { id: "skywalk", label: "เดิน skywalk" },
      { id: "rope_course", label: "rope course" },
    ],
  },
  {
    id: "shopping",
    title: "กิจกรรมช้อปปิ้ง",
    image: require("@/assets/activities/shop.jpg"),
    items: [
      { id: "market_walk", label: "เดินตลาด" },
      { id: "souvenir", label: "ซื้อของฝาก" },
      { id: "mall", label: "เดินห้างสรรพสินค้า" },
      { id: "night_market_walk", label: "เดินตลาดกลางคืน" },
      { id: "otop", label: "เลือกซื้อสินค้า OTOP" },
    ],
  },
  {
    id: "learning",
    title: "กิจกรรมเชิงการเรียนรู้",
    image: require("@/assets/activities/workshop.jpg"),
    items: [
      { id: "workshop", label: "เข้าร่วมเวิร์กชอป" },
      { id: "cooking_class", label: "เรียนทำอาหาร" },
      { id: "art_class", label: "เรียนศิลปะ" },
      { id: "culture_class", label: "เรียนวัฒนธรรม" },
      { id: "local_skill", label: "เรียนทักษะท้องถิ่น" },
    ],
  },
];