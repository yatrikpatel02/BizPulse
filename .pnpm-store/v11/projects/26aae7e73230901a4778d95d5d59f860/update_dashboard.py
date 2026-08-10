import sys

path = r'd:\PYTHON-2_PROJECT\BizPulse\frontend\src\components\DashboardLayout.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'import { useTheme }' not in content:
    content = content.replace(
        ""import { useAuth } from '../context/AuthContext';"",
        ""import { useAuth } from '../context/AuthContext';\nimport { useTheme } from '../context/ThemeContext';""
    )

# 2. Add hook
if 'const { isDarkMode' not in content:
    content = content.replace(
        ""  const { user } = useAuth();"",
        ""  const { user } = useAuth();\n  const { isDarkMode, toggleTheme } = useTheme();""
    )

# 3. Add button
if 'onClick={toggleTheme}' not in content:
    content = content.replace(
        '<div className=""flex items-center space-x-4"">\n            <div className=""flex items-center space-x-2"">',
        '<div className=""flex items-center space-x-4"">\n            <button\n              onClick={toggleTheme}\n              className=""p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none""\n              title={isDarkMode ? \'Switch to Light Mode\' : \'Switch to Dark Mode\'}\n            >\n              <span className=""text-xl"">{isDarkMode ? \'☀️\' : \'🌙\'}</span>\n            </button>\n            <div className=""flex items-center space-x-2"">'
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('DashboardLayout.jsx updated successfully.')
