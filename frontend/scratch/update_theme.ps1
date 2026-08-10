$files = @(
  "d:\GitHub\BizPulse\frontend\src\pages\Products.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Insights.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Data.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\data\UploadStep.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\data\MappingStep.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\data\PreviewStep.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\data\SuccessStep.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\DataViewer.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Reports.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Profile.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Settings.jsx",
  "d:\GitHub\BizPulse\frontend\src\pages\Analytics.jsx",
  "d:\GitHub\BizPulse\frontend\src\components\analytics\Charts.jsx"
)

$replacements = @{
  'text-gray-900 dark:text-slate-100' = 'text-white'
  'text-gray-900 dark:text-white' = 'text-white'
  'text-gray-800 dark:text-slate-100' = 'text-white'
  'text-gray-800 dark:text-slate-200' = 'text-slate-200'
  'text-gray-700 dark:text-slate-300' = 'text-slate-300'
  'text-gray-700 dark:text-slate-200' = 'text-slate-200'
  'text-gray-600 dark:text-slate-300' = 'text-slate-300'
  'text-gray-600 dark:text-slate-400' = 'text-slate-400'
  'text-gray-500 dark:text-slate-400' = 'text-slate-400'
  'text-gray-500 dark:text-slate-500' = 'text-slate-500'
  'text-gray-400 dark:text-slate-500' = 'text-slate-500'
  'text-gray-400 dark:text-slate-400' = 'text-slate-400'
  'text-gray-300 dark:text-slate-700' = 'text-slate-600'
  'text-gray-900 dark:text-slate-200' = 'text-slate-200'
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800/80' = 'glass-card'
  'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80' = 'glass-card'
  'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800' = 'glass-card'
  'bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800' = 'bg-navy-900/80 border border-white/[0.08]'
  'focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' = 'focus-glow'
  'focus:bg-white dark:focus:bg-slate-950' = 'focus:bg-navy-800'
  'text-indigo-600 dark:text-indigo-400' = 'text-violet-400'
  'text-indigo-700 dark:text-indigo-400' = 'text-violet-400'
  'text-indigo-600 dark:text-indigo-300' = 'text-violet-400'
  'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700' = 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
  'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600' = 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
  'bg-indigo-50 dark:bg-indigo-900/30' = 'bg-violet-500/10'
  'bg-indigo-50/75 dark:bg-indigo-950/40' = 'bg-violet-500/10'
  'bg-indigo-500/5 dark:bg-indigo-500/10' = 'bg-violet-500/[0.07]'
  'hover:shadow-indigo-500/20' = 'hover:shadow-violet-500/20'
  'hover:shadow-indigo-500/10' = 'hover:shadow-violet-500/10'
  'ring-indigo-500' = 'ring-violet-500'
  'border-indigo-500/20 dark:border-indigo-900/40' = 'border-violet-500/20'
  'border-indigo-200/50 dark:border-indigo-900/40' = 'border-violet-500/20'
  'border-indigo-100 dark:border-indigo-900/30' = 'border-violet-500/15'
  'bg-indigo-50 dark:bg-indigo-950/40' = 'bg-violet-500/10'
  'text-indigo-500 dark:text-indigo-400' = 'text-violet-400'
  'hover:text-indigo-600 dark:hover:text-indigo-400' = 'hover:text-violet-400'
  'hover:bg-indigo-50 dark:hover:bg-indigo-950/20' = 'hover:bg-violet-500/10'
  'hover:bg-indigo-50/10 dark:hover:bg-slate-800/20' = 'hover:bg-white/[0.03]'
  'border-b border-gray-200 dark:border-slate-700' = 'border-b border-white/[0.06]'
  'border-b dark:border-slate-800/80' = 'border-b border-white/[0.06]'
  'border-t dark:border-slate-800/80' = 'border-t border-white/[0.06]'
  'divide-y divide-gray-100 dark:divide-slate-800/40' = 'divide-y divide-white/[0.04]'
  'bg-gray-50/50 dark:bg-slate-900/50' = 'bg-navy-900/40'
  'bg-gray-50/80 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-900' = 'bg-navy-900/40 border border-white/[0.06]'
  'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' = 'bg-navy-700/80 text-violet-400 shadow-sm'
  'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200' = 'text-slate-500 hover:text-slate-200'
  'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300' = 'bg-navy-700/60 hover:bg-navy-700 text-slate-300 border border-white/[0.06]'
  'bg-gray-50 dark:bg-slate-950/40 rounded-xl border border-gray-100 dark:border-slate-800/60' = 'bg-navy-900/60 rounded-xl border border-white/[0.06]'
  'bg-slate-900/60 backdrop-blur-sm' = 'bg-black/60 backdrop-blur-sm'
  'border border-gray-200 dark:border-slate-800 rounded-3xl' = 'glass-card rounded-2xl'
  'p-6 shadow-2xl' = 'p-6 shadow-glass-lg'
  'hover:bg-gray-100 dark:hover:bg-slate-800' = 'hover:bg-white/[0.05]'
  'hover:bg-gray-50 dark:hover:bg-slate-800' = 'hover:bg-white/[0.04]'
  'bg-indigo-600' = 'bg-violet-600'
  'hover:bg-indigo-700' = 'hover:bg-violet-500'
  'dark:bg-indigo-500' = 'bg-violet-600'
  'dark:hover:bg-indigo-600' = 'hover:bg-violet-500'
  'shadow-indigo-500/5' = 'shadow-violet-500/5'
  'bg-indigo-500/10' = 'bg-violet-500/10'
  'text-indigo-500' = 'text-violet-400'
  'text-indigo-400' = 'text-violet-400'
  'bg-indigo-950/40' = 'bg-violet-500/10'
  'border-indigo-500/10' = 'border-violet-500/10'
  'hover:bg-gray-50/50 dark:hover:bg-slate-850/30' = 'hover:bg-white/[0.03]'
  'dark:border-slate-800' = 'border-white/[0.06]'
  'dark:bg-slate-800' = 'bg-navy-700/60'
  'dark:hover:bg-slate-700' = 'hover:bg-navy-700'
  'dark:bg-slate-900' = 'bg-navy-800/60'
  'dark:bg-slate-950' = 'bg-navy-900'
  'dark:text-slate-100' = 'text-white'
  'dark:text-white' = 'text-white'
  'dark:text-slate-200' = 'text-slate-200'
  'dark:text-slate-300' = 'text-slate-300'
  'dark:text-slate-400' = 'text-slate-400'
  'dark:text-slate-500' = 'text-slate-500'
  'dark:border-slate-700' = 'border-white/[0.06]'
  'dark:bg-opacity-80' = 'bg-opacity-80'
  'dark:bg-red-900/30' = 'bg-red-500/10'
  'dark:text-red-400' = 'text-red-400'
  'dark:text-amber-400' = 'text-amber-400'
  'dark:text-emerald-400' = 'text-emerald-400'
  'dark:bg-emerald-950/40' = 'bg-emerald-500/10'
  'dark:bg-emerald-950/30' = 'bg-emerald-500/10'
  'dark:border-emerald-800/40' = 'border-emerald-500/20'
  'border-emerald-200/40' = 'border-emerald-500/20'
  'bg-emerald-100/70' = 'bg-emerald-500/10'
  'text-emerald-700' = 'text-emerald-400'
  'text-gray-900' = 'text-white'
  'text-gray-800' = 'text-slate-200'
  'text-gray-700' = 'text-slate-300'
  'text-gray-600' = 'text-slate-400'
  'text-gray-500' = 'text-slate-500'
  'text-gray-400' = 'text-slate-500'
  'bg-gray-900 bg-opacity-50' = 'bg-black/60'
  'bg-gray-50' = 'bg-navy-900/40'
  'bg-white' = 'bg-navy-800/60'
  'border-gray-300' = 'border-white/[0.08]'
  'border-gray-200' = 'border-white/[0.06]'
  'border-gray-100' = 'border-white/[0.04]'
  'hover:bg-gray-50' = 'hover:bg-white/[0.04]'
}

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = [System.IO.File]::ReadAllText($file)
    foreach ($key in $replacements.Keys) {
      $content = $content.Replace($key, $replacements[$key])
    }
    [System.IO.File]::WriteAllText($file, $content)
    Write-Output "Updated: $(Split-Path $file -Leaf)"
  }
}
