import * as React from "react"
import { LoginForm } from "./login"
import { SignupForm } from "./signup"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react";

type AuthPageProps = {
  userType: "patient" | "caretaker" | null;
};

export const AuthPage: React.FC<AuthPageProps> = ({ userType }) => {
  const [isLogin, setIsLogin] = React.useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-300 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
    <div className="block mt-6 text-center">
           <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <Heart className="w-10 h-10 text-white" />
                   </div>
                   <h1 className="text-4xl font-bold text-foreground mb-4">
                     Welcome to MediCare Companion
                   </h1>
        </div>
        <CardContent className="pt-6 pb-8 px-6 space-y-4">
          {isLogin ? <LoginForm userType={userType}/> : <SignupForm userType={userType}/>}
          <div className="text-center">
            <Button
              variant="link"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
             className={cn(
    "text-sm",
    isLogin ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"
  )}
            >
              {isLogin
                ? `Don't have an account? Sign Up`
                : "Already have an account? Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default AuthPage