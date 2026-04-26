"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Download, MapPin, BarChart2 } from "lucide-react"
import type { HeatRisk, SegmentsGeoJSON, SegmentFeature } from "@/lib/segment-types"
import { RISK_COLORS, RISK_LABELS } from "@/lib/segment-types"
import type { BaseMapStyle } from "@/components/cesium/cesium-map"

interface ControlPanelProps {
  layers: { corridor: boolean; canyon: boolean; canopy: boolean }
  onToggleLayer: (layer: "corridor" | "canyon" | "canopy") => void
  baseMap: BaseMapStyle
  onBaseMapChange: (style: BaseMapStyle) => void
  filters: {
    widthRange: [number, number]
    svfRange: [number, number]
    shadeRange: [number, number]
    riskLevels: HeatRisk[]
  }
  onWidthChange: (val: [number, number]) => void
  onSvfChange: (val: [number, number]) => void
  onShadeChange: (val: [number, number]) => void
  onToggleRisk: (risk: HeatRisk) => void
  onResetView: () => void
  data: SegmentsGeoJSON
  selectedSegmentId: string | null
}

export function ControlPanel({
  layers,
  onToggleLayer,
  baseMap,
  onBaseMapChange,
  filters,
  onWidthChange,
  onSvfChange,
  onShadeChange,
  onToggleRisk,
  onResetView,
  data,
  selectedSegmentId,
}: ControlPanelProps) {
  // สร้าง State สำหรับเมนูที่เพิ่มเข้ามาใหม่
  const [viewMode, setViewMode] = useState<'route' | 'data'>('route')
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null)

  // จัดกลุ่มข้อมูล Route สำหรับแสดงผลในลิสต์ Walk Segments
  const routeGroups = useMemo(() => {
    const groups = new Map<number, SegmentFeature[]>()
    ;(data?.features ?? []).forEach((f) => {
      const rid = f.properties.route_id
      if (!groups.has(rid)) groups.set(rid, [])
      groups.get(rid)!.push(f)
    })
    return groups
  }, [data?.features])

  const exportSelectedJSON = () => {
    if (!selectedSegmentId) return
    const feature = data.features.find(
      (f) => f.properties.segment_id === selectedSegmentId
    )
    if (!feature) return
    const blob = new Blob([JSON.stringify(feature, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedSegmentId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportFilteredGeoJSON = () => {
    const filtered = data.features.filter((f) => {
      const p = f.properties
      return (
        p.walkway_width_m >= filters.widthRange[0] &&
        p.walkway_width_m <= filters.widthRange[1] &&
        p.sky_view_factor_est >= filters.svfRange[0] &&
        p.sky_view_factor_est <= filters.svfRange[1] &&
        p.shade_fraction_est >= filters.shadeRange[0] &&
        p.shade_fraction_est <= filters.shadeRange[1] &&
        filters.riskLevels.includes(p.heat_risk_proxy)
      )
    })
    const geojson = { type: "FeatureCollection", features: filtered }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "filtered-segments.geojson"
    a.click()
    URL.revokeObjectURL(url)
  }

  const risks: HeatRisk[] = ["low", "moderate", "high", "extreme"]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Base Map Style */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Base Map
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onBaseMapChange("minimal")}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] transition-colors ${
                baseMap === "minimal"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              Minimal
            </button>
            <button
              onClick={() => onBaseMapChange("satellite")}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] transition-colors ${
                baseMap === "satellite"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        <Separator />

        {/* ========================================== */}
        {/* VIEW MODE & WALK SEGMENTS (เพิ่มใหม่) */}
        {/* ========================================== */}
        
        {/* View Mode Toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            View Mode
          </span>
          <div className="flex gap-1 rounded-md border bg-card p-1">
            <button
              onClick={() => setViewMode('route')}
              className={`flex-1 flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'route' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <MapPin className="mr-1.5 size-3" /> ดู Route
            </button>
            <button
              onClick={() => setViewMode('data')}
              className={`flex-1 flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'data' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <BarChart2 className="mr-1.5 size-3" /> เช็ค Data
            </button>
          </div>
        </div>

        {/* Walk Segments List */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Walk Segments
          </span>
          <div className="space-y-1.5">
            {Array.from(routeGroups.entries()).map(([rid, features]) => {
              // พยายามดึงชื่อจากข้อมูล ถ้าไม่มีให้ใช้ "Route + เลข"
              const routeName = features[0]?.properties?.neighborhood || features[0]?.properties?.segment_name || `Route ${rid}`;
              const isSelected = selectedRouteId === rid;
              
              return (
                <button
                  key={rid}
                  onClick={() => setSelectedRouteId(isSelected ? null : rid)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                    isSelected 
                      ? 'border-teal-600 bg-teal-600/10 text-foreground' 
                      : 'border-border text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* จุดสีแสดงสถานะการเลือก */}
                    <div className={`size-2.5 rounded-full ${isSelected ? 'bg-teal-500' : 'bg-muted-foreground/30'}`} />
                    <span className="font-medium text-xs">{routeName}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-normal bg-background/50">
                    {features.length} segs
                  </Badge>
                </button>
              )
            })}
          </div>

          {/* Panel แสดงข้อมูล Data Analysis เมื่อกดปุ่ม เช็ค Data */}
          {viewMode === 'data' && (
            <div className="mt-2 rounded-md border bg-secondary/30 p-3 shadow-inner">
              {selectedRouteId !== null ? (
                (() => {
                  const feats = routeGroups.get(selectedRouteId) || [];
                  const widths = feats.map((f: any) => f.properties.walkway_width_m);
                  const shades = feats.map((f: any) => f.properties.shade_fraction_est);
                  const svfs = feats.map((f: any) => f.properties.sky_view_factor_est);
                  
                  // คำนวณค่าต่างๆ
                  const medianWidth = widths.sort((a:number, b:number) => a - b)[Math.floor(widths.length / 2)]?.toFixed(1) ?? '--';
                  const avgShade = shades.length ? (shades.reduce((a:number,b:number)=>a+b,0)/shades.length*100).toFixed(0)+'%' : '--';
                  const avgSVF = svfs.length ? (svfs.reduce((a:number,b:number)=>a+b,0)/svfs.length).toFixed(2) : '--';
                  
                  return (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="text-muted-foreground">Walkway Width</span>
                        <span className="font-medium text-foreground">{medianWidth} m</span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-1">
                        <span className="text-muted-foreground">Avg Shade</span>
                        <span className="font-medium text-foreground">{avgShade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sky View Factor</span>
                        <span className="font-medium text-foreground">{avgSVF}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-center text-[10px] text-muted-foreground">เลือก route เพื่อวิเคราะห์ข้อมูล</p>
              )}
            </div>
          )}
        </div>

        <Separator />
        {/* ========================================== */}

        {/* Layer Toggles */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layers
          </span>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Heat Walkability Corridor</label>
            <Switch
              checked={layers.corridor}
              onCheckedChange={() => onToggleLayer("corridor")}
              aria-label="Toggle corridor layer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Street Canyon Ribbon</label>
            <Switch
              checked={layers.canyon}
              onCheckedChange={() => onToggleLayer("canyon")}
              aria-label="Toggle canyon layer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Canopy/Shade Markers</label>
            <Switch
              checked={layers.canopy}
              onCheckedChange={() => onToggleLayer("canopy")}
              aria-label="Toggle canopy layer"
            />
          </div>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Filters
          </span>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Walkway Width (m)</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.widthRange[0].toFixed(1)} - {filters.widthRange[1].toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={6}
              step={0.1}
              value={filters.widthRange}
              onValueChange={(v) => onWidthChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sky View Factor</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.svfRange[0].toFixed(2)} - {filters.svfRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={filters.svfRange}
              onValueChange={(v) => onSvfChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Shade Fraction</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.shadeRange[0].toFixed(2)} - {filters.shadeRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={filters.shadeRange}
              onValueChange={(v) => onShadeChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Heat Risk Level</span>
            <div className="flex flex-wrap gap-1.5">
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() => onToggleRisk(risk)}
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors"
                  style={{
                    borderColor: filters.riskLevels.includes(risk)
                      ? RISK_COLORS[risk]
                      : undefined,
                    background: filters.riskLevels.includes(risk)
                      ? `${RISK_COLORS[risk]}15`
                      : undefined,
                  }}
                  aria-label={`Toggle ${risk} risk filter`}
                >
                  <div
                    className="size-2 rounded-full"
                    style={{ background: RISK_COLORS[risk] }}
                  />
                  <span className="capitalize">{RISK_LABELS[risk]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </span>
          <Button variant="outline" size="sm" onClick={onResetView}>
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelectedJSON}
            disabled={!selectedSegmentId}
          >
            <Download className="mr-1.5 size-3.5" />
            Export Selected JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportFilteredGeoJSON}>
            <Download className="mr-1.5 size-3.5" />
            Export Filtered GeoJSON
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}