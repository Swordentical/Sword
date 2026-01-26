import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Moon, Sun, Sunrise, Sunset, Clock, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRAYER_SETTINGS_KEY = "prayer-times-settings";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerSettings {
  city: string;
  country: string;
  method: number;
  school: number;
}

const CALCULATION_METHODS = [
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America (ISNA)" },
  { value: 3, label: "Muslim World League" },
  { value: 4, label: "Umm Al-Qura University, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" },
  { value: 7, label: "Institute of Geophysics, University of Tehran" },
  { value: 8, label: "Gulf Region" },
  { value: 9, label: "Kuwait" },
  { value: 10, label: "Qatar" },
  { value: 11, label: "Majlis Ugama Islam Singapura" },
  { value: 12, label: "Union des Organisations Islamiques de France" },
  { value: 13, label: "Diyanet İşleri Başkanlığı, Turkey" },
  { value: 14, label: "Spiritual Administration of Muslims of Russia" },
  { value: 15, label: "Moonsighting Committee Worldwide" },
  { value: 16, label: "Dubai (unofficial)" },
];

const ASR_SCHOOLS = [
  { value: 0, label: "Shafi'i, Maliki, Hanbali" },
  { value: 1, label: "Hanafi" },
];

const DEFAULT_SETTINGS: PrayerSettings = {
  city: "Riyadh",
  country: "Saudi Arabia",
  method: 4,
  school: 0,
};

function getStoredSettings(): PrayerSettings {
  try {
    const saved = localStorage.getItem(PRAYER_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: PrayerSettings) {
  localStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(settings));
}

const PRAYER_INFO = [
  { key: "Fajr", label: "Fajr", icon: Sunrise, description: "Dawn" },
  { key: "Sunrise", label: "Sunrise", icon: Sun, description: "Sunrise" },
  { key: "Dhuhr", label: "Dhuhr", icon: Sun, description: "Noon" },
  { key: "Asr", label: "Asr", icon: Sun, description: "Afternoon" },
  { key: "Maghrib", label: "Maghrib", icon: Sunset, description: "Sunset" },
  { key: "Isha", label: "Isha", icon: Moon, description: "Night" },
] as const;

function formatTime(time24: string): string {
  if (!time24) return "--:--";
  const timePart = time24.split(" ")[0];
  const [hours, minutes] = timePart.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "--:--";
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function parseTimeToMinutes(time24: string): number {
  if (!time24) return -1;
  const timePart = time24.split(" ")[0];
  const [hours, minutes] = timePart.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

function getNextPrayer(times: PrayerTimes): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  
  for (const prayerKey of prayerOrder) {
    if (prayerKey === "Sunrise") continue;
    const timeStr = times[prayerKey as keyof PrayerTimes];
    const prayerMinutes = parseTimeToMinutes(timeStr);
    
    if (prayerMinutes > currentMinutes) {
      return prayerKey;
    }
  }
  return "Fajr";
}

function getTimeUntilNext(times: PrayerTimes, nextPrayer: string | null): string {
  if (!nextPrayer || !times) return "";
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timeStr = times[nextPrayer as keyof PrayerTimes];
  let prayerMinutes = parseTimeToMinutes(timeStr);
  
  if (prayerMinutes < 0) return "";
  
  if (prayerMinutes <= currentMinutes) {
    prayerMinutes += 24 * 60;
  }
  
  const diff = prayerMinutes - currentMinutes;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function PrayerTimesWidget() {
  const [settings, setSettings] = useState<PrayerSettings>(getStoredSettings);
  const [tempSettings, setTempSettings] = useState<PrayerSettings>(settings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      setTempSettings(settings);
    }
  }, [dialogOpen, settings]);

  const { data: prayerData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/prayer-times", settings.city, settings.country, settings.method, settings.school],
    queryFn: async () => {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
      
      const params = new URLSearchParams({
        city: settings.city,
        country: settings.country,
        method: settings.method.toString(),
        school: settings.school.toString(),
      });
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateStr}?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch prayer times");
      }
      
      const data = await response.json();
      if (data.code !== 200 || !data.data?.timings) {
        throw new Error("Invalid response from API");
      }
      
      return data.data.timings as PrayerTimes;
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    saveSettings(tempSettings);
    setDialogOpen(false);
    setTimeout(() => refetch(), 100);
  };

  const nextPrayer = prayerData ? getNextPrayer(prayerData) : null;
  const timeUntil = prayerData && nextPrayer ? getTimeUntilNext(prayerData, nextPrayer) : "";

  return (
    <Card className="backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Prayer Times
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" data-testid="button-prayer-settings">
              <Settings2 className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Prayer Times Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={tempSettings.city}
                    onChange={(e) => setTempSettings({ ...tempSettings, city: e.target.value })}
                    placeholder="Enter city"
                    data-testid="input-prayer-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={tempSettings.country}
                    onChange={(e) => setTempSettings({ ...tempSettings, country: e.target.value })}
                    placeholder="Enter country"
                    data-testid="input-prayer-country"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="method">Calculation Method</Label>
                <Select
                  value={tempSettings.method.toString()}
                  onValueChange={(v) => setTempSettings({ ...tempSettings, method: parseInt(v) })}
                >
                  <SelectTrigger id="method" data-testid="select-prayer-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value.toString()}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="school">Asr Juristic Method</Label>
                <Select
                  value={tempSettings.school.toString()}
                  onValueChange={(v) => setTempSettings({ ...tempSettings, school: parseInt(v) })}
                >
                  <SelectTrigger id="school" data-testid="select-prayer-school">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASR_SCHOOLS.map((school) => (
                      <SelectItem key={school.value} value={school.value.toString()}>
                        {school.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full" data-testid="button-save-prayer-settings">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-2">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{settings.city}, {settings.country}</span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground mb-2">Failed to load prayer times</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-prayer">
              Retry
            </Button>
          </div>
        ) : prayerData ? (
          <div className="space-y-1">
            {PRAYER_INFO.map(({ key, label, icon: Icon }) => {
              const time = prayerData[key as keyof PrayerTimes];
              const isNext = key === nextPrayer;
              
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${
                    isNext ? "bg-primary/10" : ""
                  }`}
                  data-testid={`prayer-time-${key.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${isNext ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${isNext ? "font-semibold" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm tabular-nums ${isNext ? "font-semibold" : ""}`}>
                      {formatTime(time)}
                    </span>
                    {isNext && timeUntil && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">
                        {timeUntil}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
