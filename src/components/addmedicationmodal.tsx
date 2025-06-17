// components/AddMedicationModal.tsx
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "../supabase"; // Adjust the import as needed
import { toast } from "sonner";

type MedicationFormData = {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  patient_email: string;
  caretaker_email: string;
};

interface AddMedicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: any; // the medication being edited
}

const AddMedicationModal = ({
  onClose,
  onSuccess,
  defaultValues,
}: AddMedicationModalProps) => {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name || "",
      dosage: defaultValues?.dosage || "",
      frequency: defaultValues?.frequency
        ? Array.isArray(defaultValues.frequency)
          ? defaultValues.frequency.join(",")
          : defaultValues.frequency
        : "",
      start_date: defaultValues?.start_date || "",
      end_date: defaultValues?.end_date || "",
      patient_email: defaultValues?.patient_email || "",
      caretaker_email: defaultValues?.caretaker_email || "",
    },
  });

  const onSubmit = async (formData: MedicationFormData) => {
    const formattedData = {
      ...formData,
      frequency: Array.isArray(formData.frequency)
        ? JSON.stringify(formData.frequency)
        : typeof formData.frequency === "string"
        ? JSON.stringify(formData.frequency.split(",").map((s) => s.trim()))
        : formData.frequency,
    };

    let result;

    if (defaultValues?.id) {
      // ✏️ Update existing medication
      result = await supabase
        .from("medications")
        .update(formattedData)
        .eq("id", defaultValues.id);
    } else {
      // ➕ Add new medication
      result = await supabase.from("medications").insert([formattedData]);
    }

    const { error } = result;

    if (error) {
      console.error("Supabase error:", error.message);
      toast.error(
        defaultValues?.id
          ? "Failed to update medication."
          : "Failed to add medication."
      );
    } else {
      toast.success(
        defaultValues?.id
          ? "Medication updated successfully!"
          : "Medication added!"
      );
      form.reset();
      onClose();
      onSuccess?.();
    }
  };

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-white p-6 rounded-xl shadow-xl w-[90vw] max-w-3xl border">
      <h3 className="text-xl font-semibold mb-4">Add Medication</h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medication Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Paracetamol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 500mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Frequency (JSON or CSV)</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g. ["morning", "evening"] or "morning,evening"'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="patient_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Email</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. patient@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caretaker_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caretaker Email</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. caretaker@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4 md:col-span-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            {defaultValues ? (
              <Button type="submit">Update</Button>
            ) : (
              <Button type="submit">Add</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddMedicationModal;
