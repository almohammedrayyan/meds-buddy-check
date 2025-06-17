import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Users, Pencil, Trash2 } from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isBefore, isToday } from "date-fns";
import { supabase } from "../supabase";
import AddMedicationModal from "./addmedicationmodal";
import { useMedications } from "@/hooks/useMedications";
import { toast } from "sonner";
import Cookies from "js-cookie";

type Medication = {
  id: number;
  name: string;
  dosage: string;
  frequency: string[];
  start_date: string;
  end_date: string;
  patient_email: string;
  caretaker_email: string;
};

type MedicationLog = {
  medication_id: number;
  date: string;
  time_slot: string;
  taken: boolean;
  photo_url?: string;
};

const CaretakerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: meds, isLoading, isError, error, refetch } = useMedications();
  const [editingMed, setEditingMed] = useState(null);

  const patientEmail = meds?.[0]?.patient_email ?? ""; // assuming same patient
  const [logs, setLogs] = useState<MedicationLog[]>([]);

  const [metrics, setMetrics] = useState({
    adherenceRate: 0,
    currentStreak: 0,
    missedDoses: 0,
    takenThisWeek: 0,
  });


  // 👇 Fetch meds and logs when patientEmail changes
  useEffect(() => {
    if (!patientEmail) return;

    fetchLogs();
  }, [patientEmail, selectedDate]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("patient_email", patientEmail);

    if (error) return toast.error("Failed to fetch logs: " + error.message);
    setLogs(data ?? []);
  };

  // 👇 Recompute metrics whenever meds or logs update
  useEffect(() => {
    if (!meds || !logs) return;

    const today = startOfMonth(selectedDate);
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let totalScheduled = 0;
    let totalTaken = 0;
    let missed = 0;

    // Build a mapping: date -> logs for that date
    const logMap = logs.reduce<Record<string, MedicationLog[]>>((acc, log) => {
      (acc[log.date] ||= []).push(log);
      return acc;
    }, {});

    monthDays.forEach((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      if (isBefore(d, new Date(selectedDate))) {
        meds.forEach((m) => {
          // Check if this med is scheduled on that day
          const freqMatch = m.frequency.some((t) => t === "morning" && dateStr === dateStr);
          // you can adapt freqMatch logic based on actual time!
          if (freqMatch) {
            totalScheduled++;
            const dayLogs = logMap[dateStr] || [];
            const takenLogs = dayLogs.filter((l) => l.medication_id === m.id && l.taken);
            if (takenLogs.length > 0) totalTaken++;
            else missed++;
          }
        });
      }
    });

    const adherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

    // Current streak calculation
    let streak = 0;
    let dayCursor = new Date();
    while (true) {
      const ds = format(dayCursor, "yyyy-MM-dd");
      const dayLog = (logMap[ds] ?? []).filter(l => l.taken);
      if (dayLog.length > 0) {
        streak++;
        dayCursor.setDate(dayCursor.getDate() - 1);
      } else break;
    }

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekTaken = logs.filter(l => {
      const dt = new Date(l.date);
      return l.taken && dt >= weekStart;
    }).length;

    setMetrics({
      adherenceRate: adherence,
      currentStreak: streak,
      missedDoses: missed,
      takenThisWeek: weekTaken,
    });
  }, [meds, logs, selectedDate]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading medications: {error.message}</p>;

  // Actions
  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) toast.error("Failed to delete medication: " + error.message);
    else {
      await refetch();
      fetchLogs();
      toast.success("Deleted medication");
    }
  };
const handleEdit = (medication) => {
  setEditingMed(medication);
  setShowAddModal(true);
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <Users className="w-8 h-8" />
          <div>
            <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
            <p className="opacity-90">Monitoring {patientEmail}'s adherence</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="text-xl font-bold">{metrics.adherenceRate}%</div>
              <div>Adherence Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-xl font-bold">{metrics.currentStreak}</div>
              <div>Current Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-xl font-bold">{metrics.missedDoses}</div>
              <div>Missed This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-xl font-bold">{metrics.takenThisWeek}</div>
              <div>Taken This Week</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="medication">Medications</TabsTrigger>
          {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
        </TabsList>
        <TabsContent value="medication">
          <Button onClick={() => setShowAddModal(true)}>Add Medication</Button>
          {meds.map((m) => (
            <Card key={m.id} className="mt-4">
              <CardContent className="flex justify-between">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div>Dosage: {m.dosage}</div>
                  <div>Frequency: {m.frequency.join(", ")}</div>
                  <div>{m.start_date} – {m.end_date}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(m)}>
                    <Pencil />
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        {/* Add overview tab if needed */}
      </Tabs>

      {showAddModal && (
        <AddMedicationModal
    onClose={() => {
      setShowAddModal(false);
      setEditingMed(null);
    }}
    onSuccess={() => {
      setShowAddModal(false);
      setEditingMed(null);
      refetch();
    }}
    defaultValues={editingMed} // new prop
  />
      )}
    </div>
  );
};

export default CaretakerDashboard;
