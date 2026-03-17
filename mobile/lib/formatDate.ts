export function formatThaiDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} - ${end}`;
  }

  const months = [
    "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
    "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."
  ];

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  const startMonth = months[startDate.getMonth()];
  const endMonth = months[endDate.getMonth()];

  const startYear = startDate.getFullYear() + 543;
  const endYear = endDate.getFullYear() + 543;

  if (startDate.getMonth() === endDate.getMonth() && startYear === endYear) {
    return `${startDay}-${endDay} ${startMonth} ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}


export function isCurrentPlan(endDate: string) {
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const end = new Date(endDate);

  if (Number.isNaN(end.getTime())) {
    return false;
  }

  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return endOnly >= todayOnly;
}


export function getImageSource(uri?: string) {
  const clean = (uri ?? "").trim();

  return clean
    ? { uri: clean }
    : require("@/assets/images/default.png");
}