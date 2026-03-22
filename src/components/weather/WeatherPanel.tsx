import { useEffect } from "react";
import { useFieldWeather, assessJobWeatherImpact, type FieldWeather, type WeatherRisk } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";
import {
  Cloud, CloudRain, Sun, Wind, Thermometer, Droplets,
  AlertTriangle, RefreshCw, CloudSun, Snowflake, CloudFog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const WEATHER_ICONS: Record<string, typeof Sun> = {
  sun: Sun, cloud: Cloud, rain: CloudRain, storm: CloudRain,
  snow: Snowflake, fog: CloudFog, wind: Wind, "partly-cloudy": CloudSun,
};

const RISK_COLORS: Record<string, string> = {
  low: "text-success bg-success/8",
  moderate: "text-warning bg-warning/8",
  high: "text-destructive bg-destructive/8",
};

interface WeatherPanelProps {
  fieldId: string;
  lat?: number;
  lng?: number;
  compact?: boolean;
  operationType?: string;
}

export function WeatherPanel({ fieldId, lat, lng, compact, operationType }: WeatherPanelProps) {
  const { weather, loading, fetchWeather } = useFieldWeather(fieldId, lat, lng);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  if (loading && !weather) {
    return (
      <div className="rounded-xl bg-card shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const impact = operationType ? assessJobWeatherImpact(weather, operationType) : null;
  const Icon = WEATHER_ICONS[weather.current.icon] || Cloud;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-2.5">
        <Icon size={18} className="text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{weather.current.temp}°F</span>
          <span className="text-xs text-muted-foreground ml-2">{weather.current.description}</span>
        </div>
        <div className="flex gap-1.5">
          {weather.risks.filter(r => r.level !== "low").map(r => (
            <span key={r.type} className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", RISK_COLORS[r.level])}>
              {r.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Cloud size={15} /> Weather
        </h3>
        <button onClick={fetchWeather} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Current */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
            <Icon size={28} className="text-foreground/60" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular">{weather.current.temp}°F</p>
            <p className="text-sm text-muted-foreground">{weather.current.description}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Feels {weather.current.feelsLike}° · Humidity {weather.current.humidity}%
            </p>
          </div>
        </div>

        {/* Risks */}
        <div className="grid grid-cols-3 gap-2">
          {weather.risks.map(r => (
            <RiskIndicator key={r.type} risk={r} />
          ))}
        </div>

        {/* Job impact */}
        {impact && <JobWeatherImpactBanner impact={impact} />}

        {/* Alerts */}
        {weather.alerts.length > 0 && (
          <div className="space-y-2">
            {weather.alerts.map(a => (
              <div key={a.id} className={cn(
                "flex items-start gap-2 rounded-lg p-2.5 text-sm",
                a.severity === "high" || a.severity === "extreme" ? "bg-destructive/8" : "bg-warning/8"
              )}>
                <AlertTriangle size={14} className={cn(
                  "mt-0.5 shrink-0",
                  a.severity === "high" || a.severity === "extreme" ? "text-destructive" : "text-warning"
                )} />
                <div>
                  <p className="font-medium text-xs">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hourly mini forecast */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Next 12 Hours</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {weather.hourly.slice(0, 12).map((h, i) => {
              const HIcon = WEATHER_ICONS[h.icon] || Cloud;
              return (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[42px] rounded-lg py-1.5 px-1 bg-surface-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(h.time).toLocaleTimeString("en-US", { hour: "numeric" })}
                  </span>
                  <HIcon size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium tabular">{h.temp}°</span>
                  {h.rainProbability > 20 && (
                    <span className="text-[9px] text-info font-medium">{h.rainProbability}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskIndicator({ risk }: { risk: WeatherRisk }) {
  const iconMap: Record<string, typeof Wind> = { rain: Droplets, wind: Wind, temperature: Thermometer };
  const RIcon = iconMap[risk.type] || Cloud;
  return (
    <div className={cn("rounded-lg p-2 text-center", RISK_COLORS[risk.level])}>
      <RIcon size={14} className="mx-auto mb-1" />
      <p className="text-xs font-semibold tabular">{risk.value}</p>
      <p className="text-[10px] opacity-70">{risk.label}</p>
    </div>
  );
}

function JobWeatherImpactBanner({ impact }: { impact: ReturnType<typeof assessJobWeatherImpact> }) {
  const styles: Record<string, string> = {
    clear: "bg-success/8 border-success/20 text-success",
    caution: "bg-warning/8 border-warning/20 text-warning",
    delay_recommended: "bg-warning/8 border-warning/20 text-warning",
    unsafe: "bg-destructive/8 border-destructive/20 text-destructive",
  };
  const labels: Record<string, string> = {
    clear: "Good to go",
    caution: "Proceed with caution",
    delay_recommended: "Delay recommended",
    unsafe: "Unsafe conditions",
  };

  return (
    <div className={cn("rounded-lg border p-3", styles[impact.riskLevel])}>
      <div className="flex items-center gap-2 mb-1">
        {impact.riskLevel === "clear" ? (
          <Sun size={14} />
        ) : (
          <AlertTriangle size={14} />
        )}
        <span className="text-xs font-bold uppercase tracking-wider">{labels[impact.riskLevel]}</span>
      </div>
      <ul className="space-y-0.5">
        {impact.reasons.map((r, i) => (
          <li key={i} className="text-xs text-foreground/80">• {r}</li>
        ))}
      </ul>
      {impact.suggestedAction && (
        <p className="text-xs font-medium mt-2 pt-2 border-t border-current/10">{impact.suggestedAction}</p>
      )}
    </div>
  );
}

// Compact badge for schedule view
export function WeatherBadge({ fieldId, lat, lng }: { fieldId: string; lat?: number; lng?: number }) {
  const { weather, fetchWeather } = useFieldWeather(fieldId, lat, lng);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  if (!weather) return null;

  const Icon = WEATHER_ICONS[weather.current.icon] || Cloud;
  const hasRisk = weather.risks.some(r => r.level !== "low");

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
      hasRisk ? "bg-warning/10 text-warning" : "bg-surface-2 text-muted-foreground"
    )}>
      <Icon size={11} />
      {weather.current.temp}°F
      {weather.current.windSpeed > 10 && <span>· {weather.current.windSpeed}mph</span>}
    </span>
  );
}
