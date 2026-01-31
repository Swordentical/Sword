import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Database, 
  Mail, 
  ShieldAlert, 
  Save, 
  Plane,
  CreditCard,
  Cloud
} from "lucide-react";

export default function PlatformSettings() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground">System-wide configuration and platform controls.</p>
        </div>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Trial Period (Days)</Label>
              <Input type="number" defaultValue={15} />
            </div>
            <div className="space-y-2">
              <Label>Base Price - Clinic Plan ($)</Label>
              <Input type="number" defaultValue={199} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-indigo-500" />
              Storage Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Organization Limit (GB)</Label>
              <Input type="number" defaultValue={10} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Over-limit Uploads</Label>
                <p className="text-xs text-muted-foreground">Bill organizations for extra storage</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-500" />
              System Communications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Broadcast Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Show notification to all users</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>System Sender Name</Label>
              <Input defaultValue="Glazer Platform" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Disable platform access for all tenants</p>
              </div>
              <Switch />
            </div>
            <Button variant="destructive" className="w-full">
              Force Flush Cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
