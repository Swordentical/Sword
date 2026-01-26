import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Moon, Sun, Sunrise, Sunset, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PRAYER_LOCATION_KEY = "prayer-times-location";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface LocationConfig {
  city: string;
  country: string;
}

const DEFAULT_LOCATION: LocationConfig = {
  city: "Riyadh",
  country: "Saudi Arabia",
};

function getStoredLocation(): LocationConfig {
  try {
    const saved = localStorage.getItem(PRAYER_LOCATION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_LOCATION;
}

function saveLocation(location: LocationConfig) {
  localStorage.setItem(PRAYER_LOCATION_KEY, JSON.stringify(location));
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
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getNextPrayer(times: PrayerTimes): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const prayer of PRAYER_INFO) {
    if (prayer.key === "Sunrise") continue;
    const timeStr = times[prayer.key as keyof PrayerTimes];
    if (!timeStr) continue;
    
    const [hours, minutes] = timeStr.split(":").map(Number);
    const prayerMinutes = hours * 60 + minutes;
    
    if (prayerMinutes > currentMinutes) {
      return prayer.key;
    }
  }
  return "Fajr";
}

export function PrayerTimesWidget() {
  const [location, setLocation] = useState<LocationConfig>(getStoredLocation);
  const [tempLocation, setTempLocation] = useState<LocationConfig>(location);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: prayerData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/prayer-times", location.city, location.country],
    queryFn: async () => {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=2`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch prayer times");
      }
      
      const data = await response.json();
      return data.data.timings as PrayerTimes;
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const handleSaveLocation = () => {
    setLocation(tempLocation);
    saveLocation(tempLocation);
    setDialogOpen(false);
    refetch();
  };

  const nextPrayer = prayerData ? getNextPrayer(prayerData) : null;

  return (
    <Card className="backdrop-blur-[var(--elements-blur,2px)] [background-color:hsl(var(--card)/var(--elements-transparency,0.5))]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Prayer Times
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" data-testid="button-prayer-location">
              <MapPin className="h-3 w-3 mr-1" />
              {location.city}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Prayer Times Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={tempLocation.city}
                  onChange={(e) => setTempLocation({ ...tempLocation, city: e.target.value })}
                  placeholder="Enter city name"
                  data-testid="input-prayer-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={tempLocation.country}
                  onChange={(e) => setTempLocation({ ...tempLocation, country: e.target.value })}
                  placeholder="Enter country name"
                  data-testid="input-prayer-country"
                />
              </div>
              <Button onClick={handleSaveLocation} className="w-full" data-testid="button-save-prayer-location">
                Save Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pb-3">
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
                    {isNext && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">
                        Next
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
