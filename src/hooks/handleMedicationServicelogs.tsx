import { supabase } from "../supabase";

export const addMedicationLog = async ({
  medication_id,
  patient_email,
  date,
  time_slot,
  taken,
  photoFile,
}: {
  medication_id: number;
  patient_email: string;
  date: string;
  time_slot: string;
  taken: boolean;
  photoFile?: File;
}) => {
  let photo_url = null;

  if (photoFile) {
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${patient_email}-${date}-${time_slot}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medication-photos")
      .upload(`proofs/${fileName}`, photoFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw new Error("Image upload failed");
    photo_url = uploadData?.path;
  }

  const { data, error } = await supabase.from("medication_logs").insert([
    {
      medication_id,
      patient_email,
      date,
      time_slot,
      taken,
      photo_url,
    },
  ]);

  if (error) throw new Error("Failed to add log");
  return data;
};

export const getMedicationLogs = async (patient_email: string) => {
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("patient_email", patient_email);

  if (error) throw new Error("Failed to fetch logs");
  return data;
};
