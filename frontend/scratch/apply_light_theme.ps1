$files = @(
  "d:\GitHub\BizPulse\frontend\src\pages\Analytics.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Products.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Insights.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Data.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\DataViewer.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Reports.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Profile.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Settings.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\analytics\Charts.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\Sidebar.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\DashboardLayout.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\CompanySwitcher.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\AddCompanyModal.jsx"
)

# Replacements to handle dual themes
$replacements = @{
  # Sidebar dark/light responsive
  "bg-navy-950 border-r border-white/[0.06]" = "bg-white dark:bg-navy-950 border-r border-slate-200 dark:border-white/[0.06]"
  "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200" = "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
  "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/20 nav-active-glow" = "bg-violet-500/10 text-violet-600 border border-violet-500/10 dark:bg-gradient-to-r dark:from-violet-600/20 dark:to-indigo-600/10 dark:text-white dark:border-violet-500/20 dark:nav-active-glow"
  
  # Dashboard Layout dark/light responsive
  "bg-navy-900/80 backdrop-blur-xl border-b border-white/[0.06]" = "bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]"
  "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" = "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.05]"
  "bg-navy-800/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-glass-lg" = "bg-white dark:bg-navy-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-md dark:shadow-glass-lg"
  "divide-white/[0.04]" = "divide-slate-150 dark:divide-white/[0.04]"
  "hover:bg-white/[0.03]" = "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
  
  # Text headings & titles
  "text-3xl font-extrabold text-white tracking-tight" = "text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
  "text-lg font-bold text-white font-display" = "text-lg font-bold text-slate-800 dark:text-white font-display"
  "text-base font-bold text-white font-display" = "text-base font-bold text-slate-800 dark:text-white font-display"
  "text-2xl sm:text-[24px] lg:text-lg xl:text-2xl font-bold text-white font-display" = "text-2xl sm:text-[24px] lg:text-lg xl:text-2xl font-bold text-slate-900 dark:text-white font-display"
  "text-2xl sm:text-3xl font-extrabold text-white font-display" = "text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display"
  "font-bold text-white text-white" = "font-bold text-slate-800 dark:text-white"
  "font-bold text-white" = "font-bold text-slate-800 dark:text-white"
  "font-semibold text-slate-200 text-slate-200" = "font-semibold text-slate-700 dark:text-slate-200"
  "text-slate-300 text-slate-300" = "text-slate-700 dark:text-slate-300"
  
  # General text
  "text-slate-400 font-medium" = "text-slate-500 dark:text-slate-400 font-medium"
  "text-slate-500 font-medium" = "text-slate-500 dark:text-slate-400 font-medium"
  "text-slate-500 text-slate-400" = "text-slate-500 dark:text-slate-400"
  "text-slate-400 dark:text-slate-400" = "text-slate-500 dark:text-slate-400"
  
  # Company Switcher and dropdowns
  "bg-navy-800/60 hover:bg-navy-700/60 px-3 py-2 rounded-xl border border-white/[0.06] text-sm font-medium text-slate-300" = "bg-slate-100 hover:bg-slate-200/80 dark:bg-navy-800/60 dark:hover:bg-navy-700/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.06] text-sm font-medium text-slate-700 dark:text-slate-300"
  "bg-navy-800/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-glass-lg" = "bg-white dark:bg-navy-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-md dark:shadow-glass-lg"
  "text-slate-300 hover:bg-white/[0.04]" = "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]"
  
  # Table headers and hover styles
  "border-b border-white/[0.06] text-slate-300 text-slate-200" = "border-b border-slate-200 dark:border-white/[0.06] text-slate-650 dark:text-slate-300"
  "border-b border-white/[0.06] text-slate-300" = "border-b border-slate-200 dark:border-white/[0.06] text-slate-650 dark:text-slate-300"
  "hover:bg-navy-900/40/50 dark:hover:bg-slate-800/30" = "hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
  "hover:bg-navy-900/40/50 dark:hover:bg-slate-800/20" = "hover:bg-slate-100/50 dark:hover:bg-white/[0.02]"
  
  # KPI change label fixes
  "text-emerald-450" = "text-emerald-600 dark:text-emerald-400"
  "text-emerald-400" = "text-emerald-600 dark:text-emerald-400"
  "text-rose-450" = "text-rose-600 dark:text-rose-400"
  "text-rose-400" = "text-rose-600 dark:text-rose-400"
  
  # Date inputs wrappers
  "bg-navy-900/80 px-3 py-1.5 rounded-lg border border-white/[0.08] focus-within:border-violet-500/50" = "bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:bg-navy-900/80 dark:border-white/[0.08] focus-within:border-violet-500/50"
  
  # Select dropdown
  "bg-navy-900/80 text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-lg border border-white/[0.08] focus-glow focus:outline-none cursor-pointer" = "bg-slate-100/80 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] focus-glow focus:outline-none cursor-pointer"
  
  # Predictions output page tab filter
  "bg-navy-900/40 bg-navy-900/40 rounded-xl border border-white/[0.06]" = "bg-slate-100/80 dark:bg-navy-900/40 rounded-xl border border-slate-200 dark:border-white/[0.06]"
  "text-slate-500 hover:text-slate-200 text-slate-400 dark:hover:text-slate-200" = "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
  "bg-navy-800/60 bg-navy-800/60 text-indigo-600 dark:text-violet-400 shadow-sm border border-white/[0.04]" = "bg-white dark:bg-navy-800/60 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-white/[0.04]"
}

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = [System.IO.File]::ReadAllText($file)
    foreach ($key in $replacements.Keys) {
      $content = $content.Replace($key, $replacements[$key])
    }
    [System.IO.File]::WriteAllText($file, $content)
    Write-Output "Applied responsive mode to: $(Split-Path $file -Leaf)"
  }
}
