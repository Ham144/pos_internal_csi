import { BASE_URL } from "@/api/constant";
import { editKasir } from "@/api/kasirApi";
import { useUserInfo } from "@/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Mail,
  Phone,
  ShieldQuestion,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();
  const [showPassword, setShowPassword] = useState(false);

  // Initial form state based on userInfo
  const [formData, setFormData] = useState({
    username: userInfo?.username || "",
    password: "", // Leave blank for security; only fill to update
    email: userInfo?.email || "",
    telepon: userInfo?.telepon || "",
    outlet: userInfo?.outlet || "",
  });

  const queryClient = useQueryClient();
  // Mutation untuk mengedit kasir
  const { mutateAsync: handleEditKasir } = useMutation({
    mutationFn: async () => await editKasir(formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["kasir"]);
      toast.success("success");
    },
    onError: (err) => {
      toast(err?.response?.data?.message);
    },
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    async function fetchCurrentUserCompleteData() {
      const response = await axios.get(
        `${BASE_URL}/api/v1/auth/getUserInfoComplete`,
        {
          withCredentials: true,
        },
      );
      setFormData({
        _id: userInfo?._id,
        username: response?.data?.data?.username ?? "",
        password: "",
        email: response?.data?.data?.email ?? "",
        telepon: response?.data?.data?.telepon ?? "",
        outlet: response?.data?.data?.outlet ?? "",
      });
    }
    fetchCurrentUserCompleteData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header dengan Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Profile</h1>
              <p className="text-blue-100 mt-1">Kelola informasi profil Anda</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-blue-100 p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditKasir();
            }}
            className="space-y-6"
          >
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-950" />
                Username
                <div
                  className="tooltip tooltip-bottom"
                  data-tip="Tidak bisa diubah, sudah terlanjur penghubung (FK) antar Invoice"
                >
                  <ShieldQuestion className="w-4 h-4 text-gray-400 cursor-help" />
                </div>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200 bg-gray-50 text-gray-800"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Username tidak dapat diubah setelah dibuat
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-950" />
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200 bg-gray-50 text-gray-800"
                  placeholder="Biarkan kosong jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Kosongkan jika tidak ingin mengubah password
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-950" />
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200 bg-gray-50 text-gray-800"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            {/* Telephone Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-950" />
                Telephone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-950 transition-all duration-200 bg-gray-50 text-gray-800"
                  placeholder="08123456789"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-blue-950/25"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
