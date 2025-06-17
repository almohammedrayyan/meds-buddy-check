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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
 import { supabase } from "../supabase";
import bcrypt from "bcryptjs";
import jwtEncode from "jwt-encode";
import Cookies from "js-cookie";
type LoginFormValues = {
  email: string;
  password: string;
  
};
type LoginFormProps = {
  userType: "patient" | "caretaker" | null;
};

export const LoginForm: React.FC<LoginFormProps> = ({ userType }) => {
  const navigate = useNavigate();
 const JWT_SECRET = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"
  const form = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

 // if you are using hashed passwords

const onSubmit = async (data: LoginFormValues) => {
  const { email, password } = data;

  const { data: user, error } = await supabase
    .from("user")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    alert("User not found");
    return;
  }
 if (user.role !== userType) {
    alert(`You are not authorized to login as a ${userType}`);
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    alert("Incorrect password");
    return;
  }

const payload = {
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiry
  };

  const token = jwtEncode(payload, JWT_SECRET);

  // ✅ Store token in cookie

  Cookies.set("authToken", token, { expires: 7, secure: true, sameSite: "strict" });
  Cookies.set("patient_email", user.email)

  // Navigate based on role
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
          name="email"
          rules={{
            required: "Email is required",
            validate: (value) => value.includes("@") || "Email must include @",
          }}
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
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
};
