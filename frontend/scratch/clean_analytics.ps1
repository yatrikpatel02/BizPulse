$files = @(
  "d:\GitHub\BizPulse\frontend\src\pages\Analytics.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\analytics\Charts.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Products.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Insights.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Data.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\DataViewer.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Reports.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Profile.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Settings.jsx"
)

$normalizations = @{
  "bg-navy-800/60/60" = "bg-navy-800/60"
  "bg-navy-800/60/70" = "bg-navy-800/60"
  "bg-navy-800/60/75" = "bg-navy-800/60"
  "bg-navy-800/60/85" = "bg-navy-800/60"
  "bg-navy-800/60 bg-navy-800/60" = "bg-navy-800/60"
  "bg-navy-900/60 bg-navy-900/60" = "bg-navy-900/60"
  "border-white/[0.06]/80" = "border-white/[0.06]"
  "border-white/[0.06]/60" = "border-white/[0.06]"
  "border-white/[0.06]/50" = "border-white/[0.06]"
  "border-white/[0.06] border-white/[0.06]" = "border-white/[0.06]"
  "border border-white/20 border-white/[0.06]" = "border border-white/[0.06]"
  "bg-navy-700/60/80" = "bg-navy-700/60"
  "bg-navy-700/60/50" = "bg-navy-700/60"
  "bg-navy-900/40 bg-navy-700/60" = "bg-navy-900/40"
  "bg-navy-900/40/50" = "bg-navy-900/40"
  "text-slate-500 text-slate-500" = "text-slate-500"
  "text-slate-500 text-slate-400" = "text-slate-400"
  "text-slate-400 text-slate-400" = "text-slate-400"
  "text-slate-400 text-slate-450" = "text-slate-400"
  "text-slate-350" = "text-slate-400"
  "text-slate-450" = "text-slate-400"
  "text-slate-550" = "text-slate-500"
  "text-slate-650" = "text-slate-600"
  "text-white text-white" = "text-white"
  "text-slate-200 text-white" = "text-white"
  "text-slate-200 text-slate-200" = "text-slate-200"
  "text-slate-300 text-slate-300" = "text-slate-300"
  "text-slate-300 text-slate-200" = "text-slate-200"
  "text-indigo-600 dark:text-violet-400" = "text-violet-400"
  "hover:border-indigo-500/40 dark:hover:border-indigo-500/40" = "hover:border-violet-500/20"
  "bg-gray-100 bg-navy-700/60" = "bg-navy-700/60"
  "bg-gray-100 bg-navy-700/60/50" = "bg-navy-700/60"
}

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = [System.IO.File]::ReadAllText($file)
    foreach ($key in $normalizations.Keys) {
      $content = $content.Replace($key, $normalizations[$key])
    }
    [System.IO.File]::WriteAllText($file, $content)
    Write-Output "Cleaned: $(Split-Path $file -Leaf)"
  }
}
