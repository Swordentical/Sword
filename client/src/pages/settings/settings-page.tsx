import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Users,
  Palette,
  Building2,
  Upload,
  Loader2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  Stethoscope,
  GraduationCap,
  User as UserIcon,
  Download,
  Database,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAppearanceSettings, type AppearanceSettings as AppearanceSettingsType } from "@/hooks/use-appearance-settings";
import { Slider } from "@/components/ui/slider";
import type { WallpaperPreset } from "@/components/animated-background";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "staff", "student"]),
});

type UserFormValues = z.infer<typeof userSchema>;

const ROLE_CONFIG = {
  admin: { icon: Shield, label: "Admin", color: "text-purple-500" },
  doctor: { icon: Stethoscope, label: "Doctor", color: "text-emerald-500" },
  staff: { icon: UserIcon, label: "Staff", color: "text-blue-500" },
  student: { icon: GraduationCap, label: "Student", color: "text-amber-500" },
};

function AddUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "staff",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Create a new user account for the clinic system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ClinicSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  
  const isAdmin = user?.role === "admin";

  const { data: settings, isLoading } = useQuery<{
    id: string;
    clinicName: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    logoUrl?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  }>({
    queryKey: ["/api/clinic-settings"],
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<{ id: string; roomNumber: number; name: string; description?: string }[]>({
    queryKey: ["/api/clinic-rooms"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/clinic-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/clinic-rooms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-rooms"] });
      toast({ title: "Room created" });
      setShowAddRoom(false);
      setNewRoomName("");
      setNewRoomDescription("");
    },
    onError: () => {
      toast({ title: "Failed to create room", variant: "destructive" });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      const res = await apiRequest("PATCH", `/api/clinic-rooms/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-rooms"] });
      toast({ title: "Room updated" });
      setEditingRoom(null);
    },
    onError: () => {
      toast({ title: "Failed to update room", variant: "destructive" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/clinic-rooms/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-rooms"] });
      toast({ title: "Room deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete room", variant: "destructive" });
    },
  });

  const form = useForm({
    defaultValues: {
      clinicName: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      tiktok: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        clinicName: settings.clinicName || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        address: settings.address || "",
        facebook: settings.facebook || "",
        instagram: settings.instagram || "",
        twitter: settings.twitter || "",
        linkedin: settings.linkedin || "",
        youtube: settings.youtube || "",
        tiktok: settings.tiktok || "",
      });
    }
  }, [settings, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large (max 2MB)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateMutation.mutate({ logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clinic Information
          </CardTitle>
          <CardDescription>
            Manage your clinic's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    data-testid="input-logo-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isAdmin}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB, PNG/JPG</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clinicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic Name</FormLabel>
                      <FormControl><Input {...field} disabled={!isAdmin} data-testid="input-clinic-name" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input {...field} disabled={!isAdmin} data-testid="input-clinic-phone" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} disabled={!isAdmin} data-testid="input-clinic-email" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl><Input {...field} disabled={!isAdmin} data-testid="input-clinic-website" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input {...field} disabled={!isAdmin} data-testid="input-clinic-address" /></FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Social Media Accounts</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl><Input placeholder="facebook.com/..." {...field} disabled={!isAdmin} data-testid="input-facebook" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl><Input placeholder="instagram.com/..." {...field} disabled={!isAdmin} data-testid="input-instagram" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter / X</FormLabel>
                        <FormControl><Input placeholder="x.com/..." {...field} disabled={!isAdmin} data-testid="input-twitter" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl><Input placeholder="linkedin.com/..." {...field} disabled={!isAdmin} data-testid="input-linkedin" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube</FormLabel>
                        <FormControl><Input placeholder="youtube.com/..." {...field} disabled={!isAdmin} data-testid="input-youtube" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok</FormLabel>
                        <FormControl><Input placeholder="tiktok.com/@..." {...field} disabled={!isAdmin} data-testid="input-tiktok" /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {isAdmin && (
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
                  {updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Save Changes
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Rooms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinic Rooms
              </CardTitle>
              <CardDescription>
                Manage rooms available for appointments
              </CardDescription>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowAddRoom(true)} data-testid="button-add-room">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (rooms as any[]).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No rooms configured yet.</p>
          ) : (
            <div className="space-y-2">
              {(rooms as any[]).map((room: any) => (
                <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`room-item-${room.id}`}>
                  <div>
                    <p className="font-medium">{room.name}</p>
                    {room.description && (
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-room-menu-${room.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRoom(room)} data-testid={`button-edit-room-${room.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => deleteRoomMutation.mutate(room.id)}
                          data-testid={`button-delete-room-${room.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>Add a new room for scheduling appointments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name *</Label>
              <Input
                id="room-name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Room 1, Operatory A"
                data-testid="input-new-room-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-description">Description</Label>
              <Input
                id="room-description"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                placeholder="e.g. Main treatment room"
                data-testid="input-new-room-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoom(false)}>Cancel</Button>
            <Button 
              onClick={() => createRoomMutation.mutate({ name: newRoomName, description: newRoomDescription || undefined })}
              disabled={!newRoomName.trim() || createRoomMutation.isPending}
              data-testid="button-confirm-add-room"
            >
              {createRoomMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room-name">Room Name *</Label>
              <Input
                id="edit-room-name"
                value={editingRoom?.name || ""}
                onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                data-testid="input-edit-room-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room-description">Description</Label>
              <Input
                id="edit-room-description"
                value={editingRoom?.description || ""}
                onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                data-testid="input-edit-room-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>Cancel</Button>
            <Button 
              onClick={() => updateRoomMutation.mutate({ 
                id: editingRoom.id, 
                data: { name: editingRoom.name, description: editingRoom.description || undefined } 
              })}
              disabled={!editingRoom?.name?.trim() || updateRoomMutation.isPending}
              data-testid="button-confirm-edit-room"
            >
              {updateRoomMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const WALLPAPER_PRESETS: { id: WallpaperPreset; name: string; description: string }[] = [
  { id: "geometric", name: "Geometric", description: "Hexagonal patterns with floating particles" },
  { id: "waves", name: "Waves", description: "Animated ocean waves effect" },
  { id: "particles", name: "Particles", description: "Floating particles throughout" },
  { id: "gradient", name: "Gradient", description: "Smooth animated color gradients" },
  { id: "none", name: "None", description: "Solid background color only" },
];

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetToDefaults } = useAppearanceSettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme Mode</Label>
            <div className="grid grid-cols-4 gap-3">
              {(["light", "dusk", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    theme === t
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                  data-testid={`button-theme-${t}`}
                >
                  <span className="text-sm font-medium capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Background Wallpaper
          </CardTitle>
          <CardDescription>
            Choose an animated background pattern
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {WALLPAPER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => updateSettings({ wallpaperPreset: preset.id })}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  settings.wallpaperPreset === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
                data-testid={`button-wallpaper-${preset.id}`}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Transparency & Blur Effects
          </CardTitle>
          <CardDescription>
            Adjust the transparency and blur levels for various elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sidebar Transparency</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 20%
                </p>
              </div>
              <span className="text-sm font-medium w-12 text-right">{settings.sidebarTransparency}%</span>
            </div>
            <Slider
              value={[settings.sidebarTransparency]}
              onValueChange={(value) => updateSettings({ sidebarTransparency: value[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-sidebar-transparency"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sidebar Blur Effect</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 50%
                </p>
              </div>
              <span className="text-sm font-medium w-12 text-right">{settings.sidebarBlur}%</span>
            </div>
            <Slider
              value={[settings.sidebarBlur]}
              onValueChange={(value) => updateSettings({ sidebarBlur: value[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-sidebar-blur"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Elements Transparency</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 15%
                </p>
              </div>
              <span className="text-sm font-medium w-12 text-right">{settings.elementsTransparency}%</span>
            </div>
            <Slider
              value={[settings.elementsTransparency]}
              onValueChange={(value) => updateSettings({ elementsTransparency: value[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-elements-transparency"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Elements Blur Effect</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 30%
                </p>
              </div>
              <span className="text-sm font-medium w-12 text-right">{settings.elementsBlur}%</span>
            </div>
            <Slider
              value={[settings.elementsBlur]}
              onValueChange={(value) => updateSettings({ elementsBlur: value[0] })}
              min={0}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-elements-blur"
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              data-testid="button-reset-appearance"
            >
              Reset to Recommended Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use smaller spacing and text sizes
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable smooth animations and transitions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataBackup() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/backup");
      return res.json();
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dental-clinic-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Backup exported",
        description: "Your data backup has been downloaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const res = await apiRequest("POST", "/api/restore", backupData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup restored",
        description: `Successfully imported: ${data.counts.patients} patients, ${data.counts.treatments} services, ${data.counts.inventory} inventory items.`,
      });
      queryClient.invalidateQueries();
      setPendingFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setConfirmDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    
    try {
      const text = await pendingFile.text();
      const backupData = JSON.parse(text);
      importMutation.mutate(backupData);
    } catch (e) {
      toast({
        title: "Invalid file",
        description: "The selected file is not a valid JSON backup.",
        variant: "destructive",
      });
    }
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download a complete backup of all clinic data as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <p className="text-sm font-medium">Full Data Backup</p>
              <p className="text-xs text-muted-foreground">
                Includes patients, appointments, treatments, invoices, payments, and inventory
              </p>
            </div>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              data-testid="button-export-data"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Restore data from a previously exported JSON backup file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
            <div className="space-y-1">
              <p className="text-sm font-medium">Upload Backup File</p>
              <p className="text-xs text-muted-foreground">
                Select a .json backup file to import data into the system
              </p>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-import-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                data-testid="button-import-data"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select File
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-400">Important</p>
                <p className="text-amber-700 dark:text-amber-500">
                  Importing data will add new records to your database. Ensure you have a current backup before proceeding.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Data Import
            </DialogTitle>
            <DialogDescription>
              You are about to import data from: <strong>{pendingFile?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will add new records to your database. While it won't delete existing data, 
              it may create duplicate entries if the same records exist in both the backup and current database.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={importMutation.isPending}>
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}) {
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    role: z.enum(["admin", "doctor", "staff", "student"]),
  });

  type EditUserFormValues = z.infer<typeof editUserSchema>;

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "staff",
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: (user.role as "admin" | "doctor" | "staff" | "student") || "staff",
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user, open, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        avatarUrl: avatarPreview,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    updateUserMutation.mutate(data);
  };

  if (!user) return null;

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user account information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt="Profile" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="button-upload-avatar"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  data-testid="input-avatar-file"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-edit-firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} data-testid="input-edit-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-role">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-save-user">
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type SortField = "name" | "role" | "status";
type SortDirection = "asc" | "desc";

function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case "role":
        comparison = (a.role || "").localeCompare(b.role || "");
        break;
      case "status":
        comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, { isActive });
      return res.json();
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: isActive ? "User activated" : "User deactivated",
        description: `The user has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    toggleUserStatusMutation.mutate({ userId: user.id, isActive: !user.isActive });
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to permanently delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort("name")}
                        data-testid="sort-name"
                      >
                        User
                        {sortField === "name" ? (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort("role")}
                        data-testid="sort-role"
                      >
                        Role
                        {sortField === "role" ? (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort("status")}
                        data-testid="sort-status"
                      >
                        Status
                        {sortField === "status" ? (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.staff;
                    const RoleIcon = roleConfig.icon;
                    const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              {user.email && (
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">@{user.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                            <span>{roleConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id !== currentUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-user-menu-${user.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)} data-testid={`menu-edit-user-${user.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(user)} data-testid={`menu-toggle-user-${user.id}`}>
                                  {user.isActive ? (
                                    <>
                                      <UserIcon className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserIcon className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)} 
                                  className="text-destructive"
                                  data-testid={`menu-delete-user-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditUserDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        user={selectedUser} 
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your clinic settings and preferences
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinic" data-testid="tab-clinic">
            <Building2 className="h-4 w-4 mr-2" />
            Clinic
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic">
          <ClinicSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="data">
          <DataBackup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
