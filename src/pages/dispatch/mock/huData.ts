// Chain of Custody — HU scan events per dispatch

export type ScanType = 'LOAD' | 'GATE_OUT' | 'CHECKPOINT' | 'GATE_IN' | 'UNLOAD' | 'DISCREPANCY' | 'RECOUNT'

export interface HUScan {
  scanId: string
  huCode: string
  scanType: ScanType
  location: string
  scannedAt: string
  scannedBy: string
  deviceId: string
  lat?: number
  lng?: number
  notes?: string
  discrepancy?: 'DAMAGED' | 'MISSING' | 'EXTRA' | 'WRONG_ITEM'
}

export interface HUManifest {
  huCode: string
  description: string
  weightKg: number
  dims: string
  invoiceRef: string
  skuCount: number
  status: 'ok' | 'damaged' | 'missing' | 'extra'
  currentLocation: string
  scans: HUScan[]
}

const now = Date.now()
const t   = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString()

// ── Build HU manifest for D-48291 (transit, 8 HUs shown, at-risk) ────────────

function buildD48291HUs(): HUManifest[] {
  const codes = [
    'HU-291-001', 'HU-291-002', 'HU-291-003', 'HU-291-004',
    'HU-291-005', 'HU-291-006', 'HU-291-007', 'HU-291-008',
  ]
  const descriptions = [
    'Electronics — Mobile Accessories',
    'Electronics — Laptop Components',
    'Apparel — Mixed SKUs',
    'FMCG — Personal Care',
    'Pharma — OTC Products',
    'Home Appliances — Small',
    'Electronics — Mobile Accessories',
    'Automotive — Spare Parts',
  ]
  return codes.map((code, i) => ({
    huCode: code,
    description: descriptions[i],
    weightKg: 180 + (i * 47) % 200,
    dims: '120×80×90cm',
    invoiceRef: i < 4 ? 'INV-2024-18291' : 'INV-2024-18292',
    skuCount: 3 + (i % 5),
    status: i === 3 ? 'damaged' : 'ok',
    currentLocation: 'In Transit — Near Surat',
    scans: [
      {
        scanId: `SC-${code}-1`,
        huCode: code,
        scanType: 'LOAD',
        location: 'Delhi (Gurgaon WH) — Dock 3',
        scannedAt: t(18.5),
        scannedBy: 'Ram Kishore',
        deviceId: 'SCANNER-DEL-03',
        lat: 28.4595, lng: 77.0266,
      },
      {
        scanId: `SC-${code}-2`,
        huCode: code,
        scanType: 'GATE_OUT',
        location: 'Delhi (Gurgaon WH) — Exit Gate',
        scannedAt: t(17.5),
        scannedBy: 'Security Guard — Rajesh',
        deviceId: 'SCANNER-DEL-GATE',
        lat: 28.4601, lng: 77.0271,
        notes: i === 3 ? 'Outer carton dented — noted in LR' : undefined,
        discrepancy: i === 3 ? 'DAMAGED' : undefined,
      },
      {
        scanId: `SC-${code}-3`,
        huCode: code,
        scanType: 'CHECKPOINT',
        location: 'Toll — NH48 Vadodara Bypass',
        scannedAt: t(9),
        scannedBy: 'GPS Auto-Ping',
        deviceId: 'GPS-MH12XY9901',
        lat: 22.3072, lng: 73.1812,
      },
    ],
  }))
}

// ── Build HU manifest for D-48218 (transit, SLA breached, 6 HUs shown) ──────

function buildD48218HUs(): HUManifest[] {
  const codes = [
    'HU-218-001', 'HU-218-002', 'HU-218-003',
    'HU-218-004', 'HU-218-005', 'HU-218-006',
  ]
  const descriptions = [
    'Industrial — Machine Parts',
    'Industrial — Machine Parts',
    'FMCG — Packaged Foods',
    'FMCG — Packaged Foods',
    'Textiles — Bulk Fabric',
    'Chemicals — Sealed Drums',
  ]
  return codes.map((code, i) => ({
    huCode: code,
    description: descriptions[i],
    weightKg: 240 + (i * 65) % 300,
    dims: '120×100×110cm',
    invoiceRef: 'INV-2024-17001',
    skuCount: 2 + (i % 4),
    status: i === 4 ? 'missing' : 'ok',
    currentLocation: i === 4 ? 'MISSING — Last seen Agra' : 'In Transit — Near Mathura',
    scans: [
      {
        scanId: `SC-${code}-1`,
        huCode: code,
        scanType: 'LOAD',
        location: 'Kolkata (Rajarhat Hub) — Dock 1',
        scannedAt: t(36),
        scannedBy: 'Debasis Bose',
        deviceId: 'SCANNER-KOL-01',
        lat: 22.5726, lng: 88.3639,
      },
      {
        scanId: `SC-${code}-2`,
        huCode: code,
        scanType: 'GATE_OUT',
        location: 'Kolkata (Rajarhat Hub) — Main Gate',
        scannedAt: t(35),
        scannedBy: 'Security — Prosenjit',
        deviceId: 'SCANNER-KOL-GATE',
        lat: 22.5741, lng: 88.3661,
      },
      {
        scanId: `SC-${code}-3`,
        huCode: code,
        scanType: 'CHECKPOINT',
        location: 'Varanasi — NH19 Checkpoint',
        scannedAt: t(22),
        scannedBy: 'Driver Scan — Manoj',
        deviceId: 'MOBILE-DRV-9901',
        lat: 25.3176, lng: 82.9739,
      },
      ...(i === 4 ? [] : [{
        scanId: `SC-${code}-4`,
        huCode: code,
        scanType: 'CHECKPOINT' as ScanType,
        location: 'Agra — Bypass Toll',
        scannedAt: t(14),
        scannedBy: 'GPS Auto-Ping',
        deviceId: 'GPS-DL01AB2233',
        lat: 27.1767, lng: 78.0081,
      }]),
    ],
  }))
}

// ── Build HU manifest for D-48241 (transit, at-risk, 5 HUs) ─────────────────

function buildD48241HUs(): HUManifest[] {
  const codes = ['HU-241-001', 'HU-241-002', 'HU-241-003', 'HU-241-004', 'HU-241-005']
  return codes.map((code, i) => ({
    huCode: code,
    description: i < 2 ? 'Consumer Electronics' : i < 4 ? 'Auto Components' : 'Cables & Accessories',
    weightKg: 160 + i * 40,
    dims: '100×80×85cm',
    invoiceRef: i < 3 ? 'INV-2024-17511' : 'INV-2024-17512',
    skuCount: 4 + i,
    status: 'ok',
    currentLocation: 'In Transit — Near Krishnagiri',
    scans: [
      {
        scanId: `SC-${code}-1`,
        huCode: code,
        scanType: 'LOAD',
        location: 'Bangalore (Electronic City) — Dock 2',
        scannedAt: t(8.5),
        scannedBy: 'Lokesh M',
        deviceId: 'SCANNER-BLR-02',
        lat: 12.8399, lng: 77.6770,
      },
      {
        scanId: `SC-${code}-2`,
        huCode: code,
        scanType: 'GATE_OUT',
        location: 'Bangalore EC — Exit Gate',
        scannedAt: t(7.5),
        scannedBy: 'Security — Raju',
        deviceId: 'SCANNER-BLR-GATE',
        lat: 12.8412, lng: 77.6789,
      },
    ],
  }))
}

// ── HU registry keyed by dispatch ID ─────────────────────────────────────────

export const HU_DATA: Record<string, HUManifest[]> = {
  'D-48291': buildD48291HUs(),
  'D-48218': buildD48218HUs(),
  'D-48241': buildD48241HUs(),
}

export function getHUsForDispatch(dispatchId: string): HUManifest[] {
  return HU_DATA[dispatchId] ?? []
}
