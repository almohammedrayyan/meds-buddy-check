import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Camera, Clock } from "lucide-react";
import { supabase } from "../supabase";
import { toast } from "sonner";

interface Medication {
  taken(taken: any): unknown;
  id: number;
  name: string;
  description: string;
  time: string;
}

interface MedicationLog {
  medication_id: number;
  time_slot: string;
  taken: boolean;
  photo_url?: string;
}

interface MedicationTrackerProps {
  date: string;
  isToday: boolean;
  patientEmail: string;
  onLogUpdate?: () => void;
}

const MedicationTracker = ({
  date,
  isToday,
  patientEmail,
  onLogUpdate,
}: MedicationTrackerProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<Record<string, MedicationLog>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedications();
    fetchLogs();
  }, [date, patientEmail]);

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_email", patientEmail);

    if (error) {
      toast.error("Failed to load medications");
      console.error(error);
    } else {
      setMedications(data || []);
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("date", date)
      .eq("patient_email", patientEmail);

    if (error) {
      console.error(error);
    } else {
      const logMap: Record<string, MedicationLog> = {};
      data?.forEach((log) => {
        const key = `${log.medication_id}`;
        logMap[key] = log;
      });
      setLogs(logMap);
    }
  };

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    medId: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setSelectedMedId(medId); // Set selected medication for preview

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkTaken = async (med: Medication) => {
    const time_slot = med.time;
    const key = `${med.id}_${time_slot}`;

    setLoading(true);
    setSelectedMedId(med.id);

    let photoUrl = null;

    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (selectedImage) {
      if (selectedImage.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Image must be less than ${MAX_FILE_SIZE_MB}MB`);
        setLoading(false);
        return;
      }

      const fileName = `${patientEmail}_${selectedImage.name}`;
      console.log("Uploading file:", fileName);

      const { data: imageData, error: uploadError } = await supabase.storage
        .from("medication-photos")
        .upload(fileName, selectedImage, { upsert: true });

      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        toast.error("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("medication-photos")
        .getPublicUrl(fileName);

      console.log("Uploaded file URL:", publicUrl);
      photoUrl = publicUrl?.publicUrl;
    }

    const { error } = await supabase.from("medication_logs").insert({
      medication_id: med.id,
      patient_email: patientEmail,
      date,
      time_slot,
      taken: true,
      photo_url: photoUrl,
    });

    if (error) {
      toast.error("Failed to mark as taken");
      console.error(error);
    } else {
      toast.success("Medication marked as taken");
      fetchLogs();
      onLogUpdate?.();
    }

    setSelectedImage(null);
    setImagePreview(null);
    setSelectedMedId(null);
    setLoading(false);
  };
console.log(medications)
  return (
    <div className="space-y-6">
      {medications.map((med) => {
        const key = `${med.id}`;
        const log = logs[key];
        const taken = log?.taken;
console.log(taken)
        return (
          <Card key={med.id} className={taken ? "bg-green-50" : ""}>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{med.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {med.description}
                  </p>
                </div>
                <Badge className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {med.time}
                </Badge>
              </div>

              {taken ? (
                <div className="text-green-700 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Taken
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, med.id)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {selectedImage ? "Change Photo" : "Take Photo"}
                  </Button>

                  {imagePreview && selectedMedId === med.id && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-md border h-32 w-full object-cover"
                    />
                  )}

                  <Button
                    onClick={() => handleMarkTaken(med)}
                    disabled={!isToday || loading}
                    className="w-full"
                  >
                    {loading && selectedMedId === med.id
                      ? "Saving..."
                      : "Mark as Taken"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MedicationTracker;
