import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LogOut, Plus, Clock, Trash2, Camera, Pencil, Check,
  X, ImagePlus, Loader2, Images, MapPin,
} from "lucide-react";
import MemoryCard from "../components/discover/MemoryCard";
import { motion, AnimatePresence } from "framer-motion";

function fileToPath(userId, prefix) {
  return `${userId}/${prefix}-${Date.now()}`;
}

function PhotoGridItem({ photo, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onDelete(photo)}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("memories");
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: memories = [], isLoading: loadingMemories, refetch: refetchMemories } = useQuery({
    queryKey: ["profile-memories", user?.email],
    queryFn: () => base44.entities.TimeMemory.filter({ created_by: user.email }, "-year"),
    enabled: !!user,
  });

  const { data: profileRow, refetch: refetchProfile } = useQuery({
    queryKey: ["userprofile", user?.email],
    queryFn: async () => {
      const rows = await base44.entities.Userprofile.filter({ created_by: user.email });
      return rows[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profileRow?.bio) setBioText(profileRow.bio);
  }, [profileRow]);

  const { data: photos = [], isLoading: loadingPhotos, refetch: refetchPhotos } = useQuery({
    queryKey: ["profile-photos", user?.email],
    queryFn: () => base44.entities.Profilephoto.filter({ created_by: user.email }, "-created_at"),
    enabled: !!user,
  });

  const saveBioMutation = useMutation({
    mutationFn: async (bio) => {
      if (profileRow?.id) return base44.entities.Userprofile.update(profileRow.id, { bio });
      return base44.entities.Userprofile.create({ bio, profile_photo_url: null });
    },
    onSuccess: () => { refetchProfile(); setEditingBio(false); },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const path = fileToPath(user.id || user.email, "avatar");
      const url = await base44.storage.upload("profile-photos", path, file);
      if (profileRow?.id) {
        await base44.entities.Userprofile.update(profileRow.id, { profile_photo_url: url });
      } else {
        await base44.entities.Userprofile.create({ profile_photo_url: url, bio: bioText });
      }
      refetchProfile();
    } finally { setUploadingAvatar(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const path = fileToPath(user.id || user.email, "gallery");
      const url = await base44.storage.upload("profile-photos", path, file);
      await base44.entities.Profilephoto.create({ photo_url: url, caption: "" });
      refetchPhotos();
    } finally { setUploadingPhoto(false); }
  };

  const deletePhoto = async (photo) => {
    await base44.entities.Profilephoto.delete(photo.id);
    refetchPhotos();
  };

  const handleDeleteMemory = async (id) => {
    await base44.entities.TimeMemory.delete(id);
    refetchMemories();
  };

  const avatarUrl = profileRow?.profile_photo_url;
  const displayName = user?.full_name || user?.nickname || user?.email?.split("@")[0] || "You";
  const uniqueCities = [...new Set(memories.map((m) => m.city))].length;
  const yearSpan = memories.length > 0
    ? `${Math.min(...memories.map((m) => m.year))}–${Math.max(...memories.map((m) => m.year))}`
    : "—";

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">

        {/* ── Profile header card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover gradient */}
          <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #1e1144 0%, #3730a3 50%, #4338ca 100%)" }}>
            {/* Logout top right */}
            <button
              onClick={() => base44.auth.logout()}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="px-5 pb-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-11 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
                  {uploadingAvatar ? (
                    <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-violet-600">
                      {displayName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center shadow-md"
                  style={{ background: "#1e1144" }}
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <Link to={createPageUrl("TimeMachine")}>
                <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-white text-xs font-semibold"
                  style={{ background: "#1e1144" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Memory
                </button>
              </Link>
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">{user?.email}</p>

            {/* Bio */}
            <div className="mb-5">
              {editingBio ? (
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    autoFocus
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Tell people who you are — your interests, what you do now, a fun fact…"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 leading-relaxed"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveBioMutation.mutate(bioText)}
                      disabled={saveBioMutation.isPending}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-white text-xs font-semibold bg-violet-600 hover:bg-violet-700"
                    >
                      {saveBioMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => { setBioText(profileRow?.bio || ""); setEditingBio(false); }}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-gray-600 text-xs font-semibold bg-gray-100 hover:bg-gray-200"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingBio(true)} className="w-full text-left group">
                  {profileRow?.bio ? (
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{profileRow.bio}</p>
                      <Pencil className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-400 mt-0.5 flex-shrink-0 transition-colors" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all">
                      <Pencil className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-400">Write something about yourself…</span>
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1 pt-4 border-t border-gray-100">
              {[
                { value: memories.length, label: "Memories" },
                { value: uniqueCities, label: "Cities" },
                { value: yearSpan, label: "Years" },
                { value: photos.length, label: "Photos" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center py-1">
                  <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
          {[
            { key: "memories", label: "Memories", Icon: Clock },
            { key: "photos",   label: "Photos",   Icon: Images },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key ? "text-white shadow-md" : "text-gray-500"
              }`}
              style={activeTab === key ? { background: "linear-gradient(135deg, #1e1144, #4338ca)" } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">

          {/* Memories */}
          {activeTab === "memories" && (
            <motion.div key="memories"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {loadingMemories ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />)}
                </div>
              ) : memories.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">No memories yet. Start your time travel!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory, i) => (
                    <div key={memory.id} className="relative">
                      <MemoryCard memory={memory} index={i} />
                      <button
                        onClick={() => handleDeleteMemory(memory.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/25 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/40 transition-all z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Photos */}
          {activeTab === "photos" && (
            <motion.div key="photos"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              className="space-y-3">
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 flex items-center justify-center gap-2 text-violet-500 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {uploadingPhoto ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</> : <><ImagePlus className="w-5 h-5" /> Add Photo</>}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

              {loadingPhotos ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map((i) => <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />)}
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                    <Images className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">No photos yet</p>
                  <p className="text-gray-400 text-xs max-w-xs">Share how your life looks today — your connections will see these</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <PhotoGridItem key={photo.id} photo={photo} onDelete={deletePhoto} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
