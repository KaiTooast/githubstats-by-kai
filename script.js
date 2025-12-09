const themes = {
  dark: { title: "58a6ff", bg: "0d1117", text: "c9d1d9", accent: "58a6ff" },
  light: { title: "0969da", bg: "ffffff", text: "24292f", accent: "0969da" },
  ocean: { title: "00d4ff", bg: "0a192f", text: "ccd6f6", accent: "64ffda" },
  sunset: { title: "ff6b9d", bg: "1a0b2e", text: "f0e7d8", accent: "ffa07a" },
  forest: { title: "7cb342", bg: "1b2b1b", text: "d0e0d0", accent: "4caf50" },
  neon: { title: "ff00ff", bg: "120458", text: "e0b3ff", accent: "00ffff" },
}

let currentBadgeType = "stats"
let userData = null
let generatedSVGs = {}

function switchBadgeType(type) {
  currentBadgeType = type
  document.querySelectorAll(".badge-type-btn").forEach((b) => b.classList.remove("active"))
  document.querySelector(`[data-type="${type}"]`).classList.add("active")
  if (userData) {
    updatePreview()
  }
}

function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"))
  document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"))
  document.getElementById(tab).classList.add("active")
  event.target.classList.add("active")
}

function applyTheme(themeName) {
  const theme = themes[themeName]
  document.getElementById("titleColor").value = theme.title
  document.getElementById("bgColor").value = theme.bg
  document.getElementById("textColor").value = theme.text
  document.getElementById("accentColor").value = theme.accent

  document.getElementById("titleColorPicker").value = "#" + theme.title
  document.getElementById("bgColorPicker").value = "#" + theme.bg
  document.getElementById("textColorPicker").value = "#" + theme.text
  document.getElementById("accentColorPicker").value = "#" + theme.accent

  document.querySelectorAll(".theme-btn").forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  if (userData) {
    generateAllBadges()
    updatePreview()
  }
}
;["title", "bg", "text", "accent"].forEach((type) => {
  const input = document.getElementById(type + "Color")
  const picker = document.getElementById(type + "ColorPicker")

  if (picker) {
    picker.addEventListener("input", (e) => {
      input.value = e.target.value.replace("#", "")
      if (userData) {
        generateAllBadges()
        updatePreview()
      }
    })
  }

  if (input) {
    input.addEventListener("input", (e) => {
      picker.value = "#" + e.target.value
      if (userData) {
        generateAllBadges()
        updatePreview()
      }
    })
  }
})

const usernameInput = document.getElementById("username")
if (usernameInput) {
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") generateBadge()
  })
}

async function generateBadge() {
  const username = document.getElementById("username").value.trim()
  if (!username) {
    alert("Bitte gib einen GitHub Username ein")
    return
  }

  const previewContainer = document.getElementById("previewContainer")
  previewContainer.innerHTML =
    '<div class="loading-spinner"></div><div class="empty-state" style="margin-top: 20px;">Lade GitHub Daten...</div>'

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
    ])

    if (!userRes.ok) throw new Error("Benutzer nicht gefunden")

    const user = await userRes.json()
    const repos = await reposRes.json()

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)

    userData = { user, repos, totalStars, totalForks }

    displayStats()
    generateAllBadges()
    updatePreview()
    document.getElementById("downloadSection").style.display = "block"
  } catch (error) {
    previewContainer.innerHTML = `<div class="empty-state" style="color: #f85149;">❌ Fehler: ${error.message}</div>`
  }
}

function displayStats() {
  const { user, totalStars, totalForks } = userData
  const statsGrid = document.getElementById("statsGrid")

  statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${user.public_repos}</div>
            <div class="stat-label">Repositories</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${user.followers}</div>
            <div class="stat-label">Followers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalStars}</div>
            <div class="stat-label">Total Stars</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalForks}</div>
            <div class="stat-label">Total Forks</div>
        </div>
    `

  document.getElementById("statsSection").style.display = "block"
}

function generateAllBadges() {
  const titleColor = document.getElementById("titleColor").value
  const bgColor = document.getElementById("bgColor").value
  const textColor = document.getElementById("textColor").value
  const accentColor = document.getElementById("accentColor").value

  generatedSVGs.stats = generateStatsSvg(
    userData.user,
    userData.totalStars,
    userData.totalForks,
    titleColor,
    bgColor,
    textColor,
    accentColor,
  )
  generatedSVGs.languages = generateLanguagesSvg(userData.repos, titleColor, bgColor, textColor, accentColor)
  generatedSVGs.streak = generateStreakSvg(userData.user, titleColor, bgColor, textColor, accentColor)

  document.getElementById("statsMarkdown").textContent =
    `![GitHub Stats](./badges/github-stats-${userData.user.login}.svg)`
  document.getElementById("languagesMarkdown").textContent =
    `![Most Used Languages](./badges/github-languages-${userData.user.login}.svg)`
  document.getElementById("streakMarkdown").textContent =
    `![GitHub Streak](./badges/github-streak-${userData.user.login}.svg)`
}

function updatePreview() {
  const svg = generatedSVGs[currentBadgeType]
  const svgBlob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(svgBlob)
  document.getElementById("previewContainer").innerHTML = `<img src="${url}" alt="Badge" class="preview-svg" />`
}

function downloadSVG(type) {
  const svg = generatedSVGs[type]
  const blob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `github-${type}-${userData.user.login}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function copyMarkdown(type, button) {
  const markdownEl = document.getElementById(type + "Markdown")
  markdownEl.style.display = "block"
  const text = markdownEl.textContent

  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent
    button.textContent = "✓ Kopiert!"
    button.classList.add("success")
    setTimeout(() => {
      button.textContent = originalText
      button.classList.remove("success")
    }, 2000)
  })
}

function generateStatsSvg(user, totalStars, totalForks, titleColor, bgColor, textColor, accentColor) {
  return `<svg width="500" height="220" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#${accentColor};stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:#${accentColor};stop-opacity:0" />
            </linearGradient>
        </defs>
        <rect width="500" height="220" fill="#${bgColor}" stroke="#${accentColor}" stroke-width="2" rx="10"/>
        <rect width="500" height="220" fill="url(#grad1)" rx="10"/>
        
        <text x="20" y="35" style="font: 700 20px system-ui; fill: #${titleColor};">GitHub Stats - ${user.login}</text>
        <line x1="20" y1="45" x2="480" y2="45" stroke="#${accentColor}" stroke-width="2" opacity="0.5"/>
        
        <text x="30" y="85" style="font: 600 14px system-ui; fill: #${textColor}; opacity: 0.8;">📦 Public Repos</text>
        <text x="420" y="85" style="font: 700 18px system-ui; fill: #${accentColor};" text-anchor="end">${user.public_repos}</text>
        
        <text x="30" y="120" style="font: 600 14px system-ui; fill: #${textColor}; opacity: 0.8;">⭐ Total Stars</text>
        <text x="420" y="120" style="font: 700 18px system-ui; fill: #${accentColor};" text-anchor="end">${totalStars}</text>
        
        <text x="30" y="155" style="font: 600 14px system-ui; fill: #${textColor}; opacity: 0.8;">👥 Followers</text>
        <text x="420" y="155" style="font: 700 18px system-ui; fill: #${accentColor};" text-anchor="end">${user.followers}</text>
        
        <text x="30" y="190" style="font: 600 14px system-ui; fill: #${textColor}; opacity: 0.8;">🍴 Total Forks</text>
        <text x="420" y="190" style="font: 700 18px system-ui; fill: #${accentColor};" text-anchor="end">${totalForks}</text>
    </svg>`
}

function generateLanguagesSvg(repos, titleColor, bgColor, textColor, accentColor) {
  const languages = {}
  repos.forEach((repo) => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1
    }
  })

  const sorted = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const total = sorted.reduce((sum, [, count]) => sum + count, 0)

  let svgContent = `<svg width="500" height="${80 + sorted.length * 40}" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="${80 + sorted.length * 40}" fill="#${bgColor}" stroke="#${accentColor}" stroke-width="2" rx="10"/>
        <text x="20" y="35" style="font: 700 20px system-ui; fill: #${titleColor};">Most Used Languages</text>
        <line x1="20" y1="45" x2="480" y2="45" stroke="#${accentColor}" stroke-width="2" opacity="0.5"/>`

  sorted.forEach(([lang, count], idx) => {
    const percentage = ((count / total) * 100).toFixed(1)
    const barWidth = (percentage / 100) * 400
    const y = 80 + idx * 40

    svgContent += `
            <text x="30" y="${y}" style="font: 600 14px system-ui; fill: #${textColor};">${lang}</text>
            <rect x="30" y="${y + 8}" width="${barWidth}" height="12" fill="#${accentColor}" rx="6" opacity="0.8"/>
            <text x="${40 + barWidth}" y="${y + 18}" style="font: 600 12px system-ui; fill: #${textColor};">${percentage}%</text>`
  })

  svgContent += `</svg>`
  return svgContent
}

function generateStreakSvg(user, titleColor, bgColor, textColor, accentColor) {
  const joinDate = new Date(user.created_at)
  const daysSince = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24))

  return `<svg width="500" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="180" fill="#${bgColor}" stroke="#${accentColor}" stroke-width="2" rx="10"/>
        <text x="20" y="35" style="font: 700 20px system-ui; fill: #${titleColor};">🔥 GitHub Streak</text>
        <line x1="20" y1="45" x2="480" y2="45" stroke="#${accentColor}" stroke-width="2" opacity="0.5"/>
        
        <text x="250" y="100" style="font: 700 48px system-ui; fill: #${accentColor};" text-anchor="middle">${daysSince}</text>
        <text x="250" y="130" style="font: 600 16px system-ui; fill: #${textColor}; opacity: 0.8;" text-anchor="middle">Tage auf GitHub</text>
        <text x="250" y="155" style="font: 500 12px system-ui; fill: #${textColor}; opacity: 0.6;" text-anchor="middle">Seit ${joinDate.toLocaleDateString("de-DE")}</text>
    </svg>`
}

function resetForm() {
  document.getElementById("username").value = ""
  applyTheme("dark")
  document.getElementById("previewContainer").innerHTML =
    '<span class="empty-state">👆 Gib einen GitHub Username ein und klicke auf Generieren</span>'
  document.getElementById("downloadSection").style.display = "none"
  document.getElementById("statsSection").style.display = "none"
  userData = null
  generatedSVGs = {}
}
