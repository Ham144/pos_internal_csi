import { cn } from "@/lib/utils";
import {
  Lock,
  User,
  LogIn,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, getUserInfo } from "@/api/authApi";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router";
import { useUserInfo } from "@/store";

export default function Login({ className, ...props }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const path = useLocation().pathname;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Zustand
  const { setUserInfo, clearUserInfo } = useUserInfo();

  // Verifikasi token saat komponen dimuat
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      setIsVerifying(true);

      try {
        const response = await getUserInfo(token);
        setUserInfo(response.userInfo);

        // Invalidate query untuk memperbarui data
        queryClient.invalidateQueries(["userInfo"]);

        // Hapus navigasi ke path yang sama karena tidak diperlukan
      } catch (error) {
        // Token tidak valid, hapus dari localStorage
        localStorage.removeItem("token");
        clearUserInfo();
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  const { mutateAsync: handleLogin, isPending } = useMutation({
    mutationFn: async (e) => {
      e.preventDefault();
      const res = await login({ username, password });
      return res.data;
    },
    retryDelay: 1000,
    mutationKey: ["userInfo"],
    onSuccess: async (res) => {
      localStorage.setItem("token", res?.token);
      setUserInfo(await res?.data);

      // Invalidate query untuk memperbarui data
      queryClient.invalidateQueries(["userInfo"]);

      if (path === "/login" || path === "/register") {
        navigate("/");
      } else {
        toast.loading("Memverifikasi sesi Anda...");
        setTimeout(() => {
          toast.dismiss();
          window.location.reload();
        }, 400);
      }
    },
    onError: (err) => {
      console.log(err);
      toast.error(
        err?.response?.data?.message ||
          "Login gagal. Periksa username dan password Anda.",
      );
    },
  });
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4",
        className,
      )}
      {...props}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80  rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md overflow-hidden relative bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        {/* Card Header with Decoration */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-700">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>

          {/* Logo Container */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2">
            {!(isPending || isVerifying) ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <img
                  src="/internal-pos.png"
                  alt="Internal POS CSI Logo"
                  width={120}
                  height={120}
                  className="relative rounded-2xl bg-white p-2 shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                />
                {/* Verified Badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <span className="loading loading-spinner w-12 h-12 text-blue-600"></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <CardContent className="pt-20 pb-8 px-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Welcome Text */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Selamat Datang Kembali
              </h1>
              <p className="text-sm text-gray-500">
                Silakan masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-blue-950" />
                  Username
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 " />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Masukkan username Anda"
                    required
                    disabled={isPending || isVerifying}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-blue-950" />
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-950 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending || isVerifying}
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200 "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isPending || isVerifying}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-950/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Memverifikasi...
                  </>
                ) : isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Masuk ke Dashboard
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-center text-gray-500">
            © 2024 Internal POS CSI. All rights reserved.
          </p>
        </div>
      </Card>
    </div>
  );
}
