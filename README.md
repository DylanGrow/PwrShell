# ⚡ Dylan Grow's PowerShell Command Challenge

> An interactive, beautifully designed PowerShell command-line challenge platform modeled after [cmdchallenge.com](https://cmdchallenge.com/), personalized for **Dylan Grow** and powered by a custom client-side PowerShell AST engine.

---

## 🌟 Features

- **55 Real-World Progressive Challenges:**
  - **Basics & System:** `Write-Output`, `Get-Location`, `Get-Date` (custom formatting `'yyyy-MM-dd'`), `Get-Random` ranges, `$PSVersionTable.PSVersion`.
  - **Filesystem & Paths:** `Get-ChildItem -Force`, `Test-Path` (with wildcards), `Split-Path -Leaf`, `Join-Path`, `Copy-Item`, `Set-Content`, `Remove-Item` (`temp\*.tmp`).
  - **Pipelines & Math:** Range generation with arithmetic streaming (`1..100 | Measure-Object -Sum`), calculating total salary sums (`Import-Csv employees.csv | Measure-Object -Property Salary -Sum`).
  - **Text, Regex & Search:** `Get-Content` (`-TotalCount`, `-Tail`), `Select-String` with regex (`sls -Pattern '192\.168\.'`), `ForEach-Object` script blocks (`$_.ToUpper()`).
  - **Object Manipulation & JSON:** `Import-Csv`, `Export-Csv`, `Select-Object -ExpandProperty Department -Unique`, `Group-Object`, `Sort-Object`, `ConvertFrom-Json`, `ConvertTo-Json`.
  - **Processes, Services & Diffing:** `Get-Process` (filtering by CPU or WorkingSet64), `Get-Service`, `Compare-Object` (`diff`), `Tee-Object`, `Out-File`.
- **Dylan Grow Rank System:** Dynamic rank badges ranging from *PowerShell Explorer* to *Grandmaster of PowerShell*.
- **Virtual Filesystem (VFS):** In-memory filesystem rooted at `C:\Users\Dylan` with realistic datasets (`employees.csv`, `access.log`, `config.json`, `welcome.txt`).
- **Interactive UI:**
  - macOS-style terminal with traffic lights and glowing prompt `PS C:\Users\Dylan>`.
  - Numbered pill carousel with smooth scrolling and instant navigation.
  - Tab autocompletion for cmdlets, parameters, files, and variables.
  - Workspace File Explorer drawer (`📁 Files`) with 1-click previews.
  - Search & Jump Catalog modal (`🔍 Catalog`) across all 55 challenges.
  - Web Audio synthetic sound effects (toggleable).
  - Code-golf character counter.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd serene-faraday

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Run automated tests (55/55 challenges verified)
npx tsx test/powershell_catalog.test.ts
```

---

## 📄 License

MIT © Dylan Grow • Crafted with Antigravity Engine
