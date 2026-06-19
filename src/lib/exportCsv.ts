// Converts an array of flat objects to a CSV file and triggers download.
export function exportCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape  = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Maps a city name to North/South/East/West region for filter matching.
export function cityRegion(city: string): string {
  const c = city.toLowerCase()
  if (/delhi|lucknow|jaipur|chandigarh|amritsar|ludhiana/.test(c))  return 'north'
  if (/bangalore|bengaluru|chennai|hyderabad|kochi|coimbatore/.test(c)) return 'south'
  if (/kolkata|patna|bhubaneswar|guwahati/.test(c))                  return 'east'
  if (/mumbai|ahmedabad|pune|surat|nagpur|indore/.test(c))           return 'west'
  return ''
}

export function matchesRegion(text: string, region: string): boolean {
  if (!region) return true
  return cityRegion(text) === region.toLowerCase()
}

export function matchesDateRange(isoString: string | undefined, from: Date, to: Date): boolean {
  if (!isoString) return true
  const d = new Date(isoString)
  return d >= from && d <= to
}
