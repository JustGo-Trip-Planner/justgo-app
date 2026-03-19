import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import Constants from "expo-constants";

type CloudinarySignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  public_id: string;
};

const API_URL = Constants.expoConfig?.extra?.API_URL;

export const pickAvatar = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled) return null;

  let uri = result.assets[0].uri;

  uri = await compressImage(uri);

  return uri;
};

export const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 500 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
};

export const getUploadSignature = async (
  userId: string
): Promise<CloudinarySignature> => {
  const res = await axios.get(
    `${API_URL}/api/uploads/signature?userId=${userId}`
  );
  return res.data;
};

export const uploadAvatar = async (
  imageUri: string,
  userId: string
) => {
  const { timestamp, signature, apiKey, cloudName, public_id } =
    await getUploadSignature(userId);

  const data = new FormData();

  const filename = imageUri.split("/").pop() || "avatar.jpg";

  data.append("file", {
    uri: imageUri,
    name: filename,
    type: "image/jpeg",
  } as any);

  data.append("api_key", apiKey);
  data.append("timestamp", String(timestamp));
  data.append("signature", signature);
  data.append("folder", "justgo/avatar");
  data.append("public_id", public_id);
  data.append("overwrite", "true");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: data,
    }
  );

  const json = await res.json();

  if (!json.secure_url) {
    console.error(json);
    throw new Error("Upload failed");
  }

  return json.secure_url;
};

export const processAvatar = async (
  avatar: string,
  userId: string
) => {
  if (!avatar) return "";
  if (avatar.startsWith("http")) return avatar;
  return await uploadAvatar(avatar, userId);
};