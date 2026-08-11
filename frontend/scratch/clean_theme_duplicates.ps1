$files = @(
  "d:\GitHub\BizPulse\frontend\src\pages\Analytics.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\analytics\Charts.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Products.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Insights.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Data.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\DataViewer.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Reports.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Profile.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Settings.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\Sidebar.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\DashboardLayout.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\CompanySwitcher.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\AddCompanyModal.jsx"
)

$normalizations = @{
  "bg-navy-800/60/40" = "bg-navy-800/60"
  "bg-navy-800/60/80" = "bg-navy-800/60"
  "bg-navy-900/60/80" = "bg-navy-900/60"
  "bg-navy-900/40/80" = "bg-navy-900/40"
  "bg-navy-800/60/80/80" = "bg-navy-800/60"
  "bg-navy-800/60/80/90" = "bg-navy-800/60"
  "border border-white/[0.06]/80" = "border border-white/[0.06]"
  "border border-white/[0.06]/60" = "border border-white/[0.06]"
  "border-white/[0.06]/80" = "border-white/[0.06]"
  "border-white/[0.08]/80" = "border-white/[0.08]"
  "border-white/[0.06] border-white/[0.06]" = "border-white/[0.06]"
}

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = [System.IO.File]::ReadAllText($file)
    foreach ($key in $normalizations.Keys) {
      $content = $content.Replace($key, $normalizations[$key])
    }
    [System.IO.File]::WriteAllText($file, $content)
    Write-Output "Cleaned duplicates in: $(Split-Path $file -Leaf)"
  }
}
