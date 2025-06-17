// hooks/useMedications.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase"; // your Supabase instance

const fetchMedications = async () => {
  const { data, error } = await supabase.from("medications").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data.map((med) => ({
    ...med,
    frequency:
      typeof med.frequency === "string"
        ? JSON.parse(med.frequency)
        : med.frequency,
  }));
};

export const useMedications = () => {
  return useQuery({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });
};
