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
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import { supabase } from "@/supabase";
import jwtEncode from "jwt-encode";
import Cookies from "js-cookie";

type SignupFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

type SignupFormProps = {
  userType: "patient" | "caretaker" | null;
};

export const SignupForm: React.FC<SignupFormProps> = ({ userType }) => {
  const JWT_SECRET =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
  const form = useForm<SignupFormValues>({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const navigate = useNavigate();
  const onSubmit = async (data: SignupFormValues) => {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create a payload
    const payload = {
      email: data.email,
      role: userType,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiry
    };

    // Encode JWT (no .sign needed)
    const token = jwtEncode(payload, JWT_SECRET);

    // Insert new user into Supabase
    const { error } = await supabase.from("user").insert([
      {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: userType,
        token: token, // Optional: You can store token in DB, or skip this
      },
    ]);

    if (error) {
      alert("Signup failed: " + error.message);
      return;
    }

    // Store token in cookies
    Cookies.set("authToken", token, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
  Cookies.set("patient_email", data.email)

    // Navigate to the respective dashboard
    if (userType === "patient") {
      navigate("/dashboard/patient", { state: { role: userType } });
    } else if (userType === "caretaker") {
      navigate("/dashboard/patient", { state: { role: userType } });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input type="text" placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => {
            const [showPassword, setShowPassword] = useState(false);

            return (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => {
            const [confirmShowPassword, setConfirmShowPassword] =
              useState(false);

            return (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={confirmShowPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    onClick={() => setConfirmShowPassword((prev) => !prev)}
                  >
                    {confirmShowPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button type="submit">Sign Up</Button>
      </form>
    </Form>
  );
};
